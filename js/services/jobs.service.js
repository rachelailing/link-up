// js/services/jobs.service.js
import { supabase } from '../config/supabase.js';

/**
 * Job Service
 * Responsibility: Handle fetching, searching, and applying for jobs via Supabase.
 */
export class JobService {
  /**
   * Fetches jobs from the 'jobs' table with server-side filtering and pagination.
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Array>}
   */
  async getJobs({ search, category, minSalary, page = 0, pageSize = 10 } = {}) {
    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        employer:employer_id (
          full_name,
          business_name
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'Open');

    // Filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (minSalary && minSalary !== 'all') {
      query = query.gte('salary', Number(minSalary));
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) {
      console.error('[JobService] Error fetching jobs:', error.message);
      return [];
    }

    return data.map((job) => ({
      ...job,
      employer_name: job.employer?.business_name || job.employer?.full_name || 'Employer',
    }));
  }

  /**
   * Fetches recommended jobs for a student.
   * Optimizes performance by fetching a subset first based on tags/campus.
   * @param {Object} profile - Student profile metadata
   * @returns {Promise<Array>}
   */
  async getRecommendedJobs(profile = {}) {
    const studentSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());
    const allRelevantTerms = [...new Set([...studentSkills, ...studentInterests])];

    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        employer:employer_id (
          full_name,
          business_name
        )
      `
      )
      .eq('status', 'Open');

    // Performance Optimization: Fetch jobs that match at least one tag or campus first
    if (allRelevantTerms.length > 0) {
      query = query.overlaps('tags', allRelevantTerms);
    }

    const { data: jobs, error } = await query.limit(20);

    if (error || !jobs) return [];

    // Scoring Algorithm (Same as before, but on a smaller set)
    const scoredJobs = jobs.map((job) => {
      let score = 0;
      const jobTags = (job.tags || []).map((t) => t.toLowerCase());
      const jobTitle = (job.title || '').toLowerCase();
      const jobDesc = (job.description || '').toLowerCase();

      allRelevantTerms.forEach((term) => {
        if (jobTags.includes(term)) score += 10;
        if (jobTitle.includes(term)) score += 5;
        if (jobDesc.includes(term)) score += 2;
      });

      if (profile.campus && job.location?.includes(profile.campus)) {
        score += 5;
      }

      return {
        ...job,
        matchScore: score,
        employer_name: job.employer?.business_name || job.employer?.full_name || 'Employer',
      };
    });

    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  /**
   * Consolidates student dashboard statistics into a single RPC call.
   * @param {string} userId
   */
  async getStudentStats(userId) {
    const { data, error } = await supabase.rpc('get_student_stats', {
      p_student_id: userId,
    });

    if (error) {
      console.error('[JobService] Error fetching stats via RPC:', error.message);
      throw error;
    }
    return data;
  }

  /**
   * Gets a single job by its ID.
   * Joins with profiles to get employer name.
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getJobById(id) {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        employer:employer_id (
          full_name,
          business_name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('[JobService] Error fetching job by ID:', error.message);
      return null;
    }

    return {
      ...data,
      employer_name: data.employer?.business_name || data.employer?.full_name || 'Employer',
    };
  }

  /**
   * Inserts a new application for a job.
   * @param {number} jobId
   * @param {string} studentId
   * @param {string} message
   * @returns {Promise<Object>} The application result
   */
  async applyForJob(jobId, studentId, message = '') {
    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          student_id: studentId,
          message: message,
          status: 'pending',
        },
      ])
      .select();

    if (error) {
      console.error('[JobService] Application error:', error.message);
      throw error;
    }

    console.log('[JobService] Application submitted successfully!');
    return data[0];
  }

  /**
   * Fetches all jobs created by a specific employer.
   * @param {string} employerId
   */
  async getJobsByEmployer(employerId) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[JobService] Error fetching employer jobs:', error.message);
      return [];
    }
    return data;
  }

  /**
   * Creates a new job listing.
   * @param {Object} jobData
   */
  async createJob(jobData) {
    const { data, error } = await supabase.from('jobs').insert([jobData]).select();

    if (error) {
      console.error('[JobService] Error creating job:', error.message);
      throw error;
    }
    return data[0];
  }
}

export const jobsService = new JobService();
