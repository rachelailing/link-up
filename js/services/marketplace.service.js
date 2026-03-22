// js/services/marketplace.service.js
import { supabase } from "../config/supabase.js";

const MOCK_DATA = [
  { id: 1, title: "Pro Video Editing Service", price: 50, location: "Online / UTP", date: "3 Mar 2026", rating: 5.0, reviews: 20, type: "Service", status: "Ongoing", description: "Professional video editing for your assignments, vlogs, or club events. Quick turnaround and high-quality results.", tags: ["creative", "video", "media"] },
  { id: 2, title: "Organic Nasi Lemak", price: 5, location: "V4, Block B", date: "4 Mar 2026", rating: 4.9, reviews: 45, type: "Product", status: "Preorder", description: "Delicious home-cooked Nasi Lemak with organic ingredients. Served hot with spicy sambal and crispy anchovies.", tags: ["food", "homemade"] },
  { id: 3, title: "Python Tutoring (Basic)", price: 20, location: "Main Library", date: "2 Mar 2026", rating: 4.9, reviews: 32, type: "Service", status: "Ongoing", description: "Struggling with Python? I can help you understand the basics of programming, loops, and data structures.", tags: ["academic", "tech", "coding", "python"] },
  { id: 4, title: "Laundry Service (Wash & Fold)", price: 8, location: "V5, Ground Floor", date: "1 Mar 2026", rating: 4.6, reviews: 54, type: "Service", status: "Ongoing", description: "Fast and clean laundry service. Wash and fold included. RM 8 per 5kg load.", tags: ["laundry", "service"] },
  { id: 101, title: "Used Calculus Textbook", price: 30, location: "V2, Block A", date: "2 Mar 2026", rating: 4.8, reviews: 12, type: "Product", status: "Ongoing", description: "Thomas' Calculus (14th Edition). Condition: 9/10. No highlights, very clean.", tags: ["textbooks", "academic", "study"] },
  { id: 102, title: "Custom Crochet Keychain", price: 12, location: "All Villages", date: "1 Mar 2026", rating: 4.7, reviews: 8, type: "Product", status: "Preorder", description: "Handmade crochet keychains. Customizable colors and designs. Perfect for gifts!", tags: ["creative", "others", "art"] },
  { id: 103, title: "Second-hand Scientific Calculator", price: 45, location: "V3, Block B", date: "25 Feb 2026", rating: 4.4, reviews: 5, type: "Product", status: "Ongoing", description: "Casio scientific calculator. Good for engineering students.", tags: ["academic", "tech", "gadgets"] },
  { id: 104, title: "Portable Desk Lamp", price: 15, location: "V5, Block C", date: "28 Feb 2026", rating: 4.5, reviews: 15, type: "Product", status: "Ongoing", description: "LED desk lamp with adjustable brightness.", tags: ["others", "study", "lifestyle"] },
  { id: 105, title: "Graphic Design - Poster", price: 15, location: "Remote", date: "28 Feb 2026", rating: 4.8, reviews: 18, type: "Service", status: "Ongoing", description: "Professional poster design for events.", tags: ["creative", "design", "graphic"] }
];

class MarketplaceService {
  /**
   * Fetch all items from Supabase marketplace_items table.
   * Merges with MOCK_DATA for fallback if the table is empty.
   */
  async getAllItems() {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[MarketplaceService] Error fetching items:", error);
      return MOCK_DATA;
    }

    // Merge mock data with real data for demo richness
    return [...data, ...MOCK_DATA];
  }

  /**
   * Smart recommendation algorithm for marketplace items.
   */
  async getRecommended(profile = {}) {
    const items = await this.getAllItems();
    
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

  async getProducts() {
    const items = await this.getAllItems();
    return items.filter(i => i.type === "Product");
  }

  async getServices() {
    const items = await this.getAllItems();
    return items.filter(i => i.type === "Service");
  }

  async getItemById(id) {
    // Check Supabase first
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .single();

    if (data) return data;

    // Fallback to MOCK_DATA
    const numericId = parseInt(id);
    return MOCK_DATA.find(i => i.id === numericId);
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
