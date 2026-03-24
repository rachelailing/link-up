// js/services/marketplace.service.js
import { supabase } from "../config/supabase.js";

class MarketplaceService {
  /**
   * Fetch all items from Supabase marketplace_items table.
   */
  async getAllItems() {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[MarketplaceService] Error fetching items:", error);
      return [];
    }

    return data;
  }

  /**
   * Smart recommendation algorithm for marketplace items.
   * Filters out items owned by the current user.
   */
  async getRecommended(profile = {}, userId = null) {
    let items = await this.getAllItems();
    
    // Filter out user's own items
    if (userId) {
      items = items.filter(item => item.user_id !== userId);
    }
    
    const scoredItems = items.map(item => {
      let score = 0;
      const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
      const itemTags = (item.tags || []).map(t => t.toLowerCase());
      const itemTitle = item.title.toLowerCase();

      studentInterests.forEach(interest => {
        if (itemTags.includes(interest)) score += 10;
        if (itemTitle.includes(interest)) score += 5;
      });

      if (profile.campus && item.location && item.location.includes(profile.campus)) {
        score += 5;
      }

      if (item.rating >= 4.5) {
        score += 2;
      }

      return { ...item, matchScore: score };
    });

    const recommendations = scoredItems
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return (b.rating || 0) - (a.rating || 0);
      });

    return recommendations.slice(0, 4);
  }

  async getProducts(userId = null) {
    let items = await this.getAllItems();
    if (userId) {
      items = items.filter(i => i.user_id !== userId);
    }
    return items.filter(i => i.type === "Product");
  }

  async getServices(userId = null) {
    let items = await this.getAllItems();
    if (userId) {
      items = items.filter(i => i.user_id !== userId);
    }
    return items.filter(i => i.type === "Service");
  }

  async getItemById(id) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
        console.error("[MarketplaceService] Error fetching item by id:", error);
        return null;
    }
    return data;
  }

  /**
   * Fetch items posted by the current user.
   */
  async getMyListings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[MarketplaceService] Error fetching my listings:", error);
      return [];
    }

    return data;
  }

  /**
   * Create a new marketplace item in Supabase.
   */
  async createItem(itemData) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([itemData])
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Update an existing marketplace item.
   */
  async updateItem(id, itemData) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update(itemData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Delete an item.
   */
  async deleteItem(id) {
    const { error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Upload an image to Supabase storage.
   */
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `marketplace/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('marketplace_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('marketplace_images')
      .getPublicUrl(filePath);

    return publicUrl;
  }
}

export const marketplaceService = new MarketplaceService();
