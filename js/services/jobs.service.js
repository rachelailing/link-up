// js/services/jobs.service.js
import { supabase } from "../config/supabase.js";

export class JobService {
  /**
   * Fetches all available jobs from Supabase.
   */
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[JobService] Error fetching jobs:", error);
      return [];
    }

    return data;
  }

  /**
   * Fetches recommended jobs for a student using a scoring algorithm.
   * @param {Object} profile - Student profile metadata { skills, interests, campus, etc. }
   * @returns {Promise<Array>}
   */
  async getRecommendedJobs(profile = {}) {
    const jobs = await this.getJobs();
    
    // Algorithm: Score each job based on profile matches
    const scoredJobs = jobs.map(job => {
      let score = 0;
      
      const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
      const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
      const jobTags = (job.tags || []).map(t => t.toLowerCase());
      const jobTitle = job.title.toLowerCase();
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
      if (profile.campus && job.location && job.location.includes(profile.campus)) {
        score += 5;
      }

      // 4. Remote Preference (Small bonus if no campus set)
      if (!profile.campus && job.location && job.location.toLowerCase().includes("remote")) {
        score += 2;
      }

      return { ...job, matchScore: score };
    });

    // Sort by score (descending) and return top matches
    const recommendations = scoredJobs
      .filter(j => j.status === "Open")
      .sort((a, b) => b.matchScore - a.matchScore);

    return recommendations.slice(0, 3);
  }

  /**
   * Gets a job by its unique ID.
   */
  async getJobById(id) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("[JobService] Error fetching job by id:", error);
      return null;
    }

    return data;
  }

  /**
   * Creates a new job posting in Supabase.
   * @param {Object} jobData 
   */
  async createJob(jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Fetches jobs posted by the current employer.
   */
  async getMyJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[JobService] Error fetching my jobs:", error);
      return [];
    }

    return data;
  }

  /**
   * Mock implementation of applying for a job.
   */
  async applyForJob(jobId) {
    const job = await this.getJobById(jobId);
    if (job) {
      console.log(`[JobService] Applying for job ${jobId}`);
      return true;
    }
    return false;
  }
}

// Singleton instance for global use
export const jobsService = new JobService();
