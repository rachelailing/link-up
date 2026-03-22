// js/services/jobs.service.js
import { supabase } from "../config/supabase.js";

/**
 * Job Service
 * Responsibility: Handle fetching, searching, and applying for jobs via Supabase.
 */
export class JobService {
  /**
   * Fetches all available jobs from the 'jobs' table.
   * Joins with profiles to get the employer's business name.
   * @returns {Promise<Array>}
   */
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:employer_id (
          full_name,
          business_name
        )
      `)
      .eq('status', 'Open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[JobService] Error fetching jobs:", error.message);
      return [];
    }

    // Flatten employer info
    return data.map(job => ({
      ...job,
      employer_name: job.employer?.business_name || job.employer?.full_name || "Employer"
    }));
  }

  /**
   * Fetches recommended jobs for a student using a scoring algorithm.
   * Fetches open jobs from DB and then scores them in JS.
   * @param {Object} profile - Student profile metadata { skills, interests, campus, etc. }
   * @returns {Promise<Array>}
   */
  async getRecommendedJobs(profile = {}) {
    const jobs = await this.getJobs();
    
    // Scoring Algorithm (Matches profile skills/interests against job tags/titles)
    const scoredJobs = jobs.map(job => {
      let score = 0;
      
      const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
      const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
      const jobTags = (job.tags || []).map(t => t.toLowerCase());
      const jobTitle = (job.title || "").toLowerCase();
      const jobDesc = (job.description || "").toLowerCase();

      // 1. Skill Match (High weight)
      studentSkills.forEach(skill => {
        if (jobTags.includes(skill)) score += 10;
        if (jobTitle.includes(skill)) score += 5;
        if (jobDesc.includes(skill)) score += 2;
      });

      // 2. Interest Match (Medium weight)
      studentInterests.forEach(interest => {
        if (jobTags.includes(interest)) score += 5;
        if (jobTitle.includes(interest)) score += 3;
        if (jobDesc.includes(interest)) score += 1;
      });

      // 3. Location/Campus Match (Bonus)
      if (profile.campus && job.location?.includes(profile.campus)) {
        score += 5;
      }

      return { ...job, matchScore: score };
    });

    // Sort by score (descending) and return top 3
    const recommendations = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log("[JobService] Recommended Jobs Scores:", recommendations.map(j => ({ title: j.title, score: j.matchScore })));
    
    return recommendations.slice(0, 3);
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
      .select(`
        *,
        employer:employer_id (
          full_name,
          business_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("[JobService] Error fetching job by ID:", error.message);
      return null;
    }

    return {
      ...data,
      employer_name: data.employer?.business_name || data.employer?.full_name || "Employer"
    };
  }

  /**
   * Inserts a new application for a job.
   * @param {number} jobId 
   * @param {string} studentId 
   * @param {string} message 
   * @returns {Promise<Object>} The application result
   */
  async applyForJob(jobId, studentId, message = "") {
    const { data, error } = await supabase
      .from('applications')
      .insert([
        { 
          job_id: jobId, 
          student_id: studentId,
          message: message,
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      console.error("[JobService] Application error:", error.message);
      throw error;
    }

    console.log("[JobService] Application submitted successfully!");
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
      console.error("[JobService] Error fetching employer jobs:", error.message);
      return [];
    }
    return data;
  }

  /**
   * Creates a new job listing.
   * @param {Object} jobData 
   */
  async createJob(jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select();

    if (error) {
      console.error("[JobService] Error creating job:", error.message);
      throw error;
    }
    return data[0];
  }
}

export const jobsService = new JobService();
