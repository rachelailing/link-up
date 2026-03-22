// js/services/marketplace.service.js
import { supabase } from '../config/supabase.js';

/**
 * Marketplace Service
 * Responsibility: Handle fetching, searching, and creating marketplace listings via Supabase.
 */
class MarketplaceService {
  /**
   * Fetches items from the 'marketplace_items' table with pagination.
   * @param {Object} pagination
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
   * @param {Object} profile - Student profile metadata
   * @returns {Promise<Array>}
   */
  async getRecommended(profile = {}) {
    const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());

    let query = supabase.from('marketplace_items').select('*');

    if (studentInterests.length > 0) {
      query = query.overlaps('tags', studentInterests);
    }

    const { data: items, error } = await query.limit(20);

    if (error || !items) return [];

    // Scoring Algorithm
    const scoredItems = items.map((item) => {
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
      return Number(b.rating) - Number(a.rating);
    });

    return recommendations.slice(0, 4);
  }

  /**
   * Filters items by type: 'Product'.
   */
  async getProducts() {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('type', 'Product');

    if (error) return [];
    return data;
  }

  /**
   * Filters items by type: 'Service'.
   */
  async getServices() {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('type', 'Service');

    if (error) return [];
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
   * @param {string} userId
   */
  async getMyListings(userId) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('owner_id', userId)
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
}

export const marketplaceService = new MarketplaceService();
