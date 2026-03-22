// js/services/ratings.service.js
import { supabase } from '../config/supabase.js';

/**
 * Ratings Service
 * Responsibility: Handle fetching and submitting ratings for users.
 */
class RatingsService {
  /**
   * Fetches all ratings for a specific target user.
   * @param {string} targetId
   */
  async getRatingsForUser(targetId) {
    const { data, error } = await supabase
      .from('ratings')
      .select(
        `
        *,
        reviewer:reviewer_id (
          full_name
        )
      `
      )
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RatingsService] Error fetching ratings:', error.message);
      return [];
    }
    return data;
  }

  /**
   * Submits a new rating for a user.
   * @param {Object} ratingData - { reviewerId, targetId, jobId, rating, comment }
   */
  async submitRating(ratingData) {
    const { data, error } = await supabase
      .from('ratings')
      .insert([
        {
          reviewer_id: ratingData.reviewerId,
          target_id: ratingData.targetId,
          job_id: ratingData.jobId,
          rating: ratingData.rating,
          comment: ratingData.comment,
        },
      ])
      .select();

    if (error) {
      console.error('[RatingsService] Error submitting rating:', error.message);
      throw error;
    }
    return data[0];
  }

  /**
   * Calculates the average rating for a user.
   * @param {string} userId
   */
  async getAverageRating(userId) {
    const { data, error } = await supabase.from('ratings').select('rating').eq('target_id', userId);

    if (error || !data.length) return 0;

    const sum = data.reduce((acc, r) => acc + Number(r.rating), 0);
    return (sum / data.length).toFixed(1);
  }
}

export const ratingsService = new RatingsService();
