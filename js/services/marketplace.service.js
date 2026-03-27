// js/services/marketplace.service.js
import { supabase } from '../config/supabase.js';

/**
 * Marketplace Service
 * Responsibility: Handle fetching, searching, and creating marketplace listings via Supabase.
 */
class MarketplaceService {
  /**
   * Fetches all items from the 'marketplace_items' table.
   * @param {Object} pagination - optional page/pageSize
   * @returns {Promise<Array>}
   */
  async getAllItems({ page = 0, pageSize = 12 } = {}) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[MarketplaceService] Error fetching items:', error.message);
      return [];
    }
    return data;
  }

  /**
   * Smart recommendation algorithm for marketplace items.
   * Optimizes performance by fetching a subset first based on tags.
   * Filters out items owned by the current user.
   * @param {Object} profile - Student profile metadata
   * @param {string|null} userId - current user id to exclude own items
   * @returns {Promise<Array>}
   */
  async getRecommended(profile = {}, userId = null) {
    const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());

    let query = supabase.from('marketplace_items').select('*');

    if (studentInterests.length > 0) {
      query = query.overlaps('tags', studentInterests);
    }

    const { data: items, error } = await query.limit(20);

    if (error || !items) return [];

    // Filter out user's own items
    let filtered = items;
    if (userId) {
      filtered = items.filter((item) => item.user_id !== userId);
    }

    // Scoring Algorithm
    const scoredItems = filtered.map((item) => {
      let score = 0;

      const itemTags = (item.tags || []).map((t) => t.toLowerCase());
      const itemTitle = (item.title || '').toLowerCase();

      // 1. Interest Match (High weight)
      studentInterests.forEach((interest) => {
        if (itemTags.includes(interest)) score += 10;
        if (itemTitle.includes(interest)) score += 5;
      });

      // 2. Location Match
      if (profile.campus && item.location?.includes(profile.campus)) {
        score += 5;
      }

      // 3. Quality Bonus (Rating)
      if (Number(item.rating) >= 4.5) {
        score += 2;
      }

      return { ...item, matchScore: score };
    });

    // Sort by score and rating
    const recommendations = scoredItems.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });

    return recommendations.slice(0, 4);
  }

  /**
   * Filters items by type: 'Product'.
   * @param {string|null} userId - optional: exclude own items
   */
  async getProducts(userId = null) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('type', 'Product');

    if (error) return [];
    if (userId) return data.filter((i) => i.user_id !== userId);
    return data;
  }

  /**
   * Filters items by type: 'Service'.
   * @param {string|null} userId - optional: exclude own items
   */
  async getServices(userId = null) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('type', 'Service');

    if (error) return [];
    if (userId) return data.filter((i) => i.user_id !== userId);
    return data;
  }

  /**
   * Gets a specific item by its ID.
   * @param {string|number} id
   */
  async getItemById(id) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[MarketplaceService] Error fetching item by ID:', error.message);
      return null;
    }
    return data;
  }

  /**
   * Fetches listings created by the current user.
   */
  async getMyListings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MarketplaceService] Error fetching my listings:', error.message);
      return [];
    }
    return data;
  }

  /**
   * Creates a new marketplace listing.
   * @param {Object} itemData
   */
  async createItem(itemData) {
    const { data, error } = await supabase.from('marketplace_items').insert([itemData]).select();

    if (error) {
      console.error('[MarketplaceService] Error creating item:', error.message);
      throw error;
    }
    return data[0];
  }

  /**
   * Update an existing marketplace item.
   * @param {string|number} id
   * @param {Object} itemData
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
   * @param {string|number} id
   */
  async deleteItem(id) {
    const { error } = await supabase.from('marketplace_items').delete().eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Upload an image to Supabase storage.
   * @param {File} file
   */
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `marketplace/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('marketplace_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('marketplace_images').getPublicUrl(filePath);

    return publicUrl;
  }
}

export const marketplaceService = new MarketplaceService();
