// js/services/jobs.service.js
import { supabase } from "../config/supabase.js";

export class JobService {
  /**
   * Fetches all jobs from Supabase.
   * Includes hardcoded examples for pitch/demo purposes.
   */
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[JobsService] Error fetching jobs:", error);
    }

    const dbJobs = data || [];

    // Pitch/Demo Examples
    const demoJobs = [
      {
        id: "demo-1",
        title: "Library Assistant",
        employer_name: "UTP Main Library",
        location: "UTP IRC",
        salary: 450,
        status: "Done",
        deadline: "2026-03-20",
        created_at: "2026-03-01T10:00:00Z",
        description: "Assisted in cataloging new arrivals and managing the circulation desk during the mid-semester peak. Received 5-star rating for reliability.",
        category: "Administration",
        tags: ["Library", "Admin", "Customer Service"],
        rating: 5,
        employer_comment: "Excellent work! Nafiesa was very punctual and handled the cataloging with great attention to detail. Highly recommended for any administrative tasks."
      },
      {
        id: "demo-2",
        title: "Event Crew: Career Fair 2026",
        employer_name: "Career Services",
        location: "Chancellor Hall",
        salary: 120,
        status: "Current",
        deadline: "2026-04-05",
        created_at: "2026-03-15T09:30:00Z",
        description: "Setting up booth layouts, managing visitor registration, and providing technical support for visiting company representatives.",
        category: "Event",
        tags: ["Event", "Crew", "Management"]
      },
      {
        id: "demo-3",
        title: "Social Media Content Creator",
        employer_name: "Link Up Marketing Team",
        location: "Remote",
        salary: 300,
        status: "Applied",
        deadline: "2026-04-15",
        created_at: "2026-03-20T14:00:00Z",
        description: "Develop weekly TikTok and Instagram reels to promote platform features to new students on campus.",
        category: "Creative",
        tags: ["Social Media", "Video", "Editing"]
      },
      {
        id: "demo-4",
        title: "Graphic Designer for Tech Conf",
        employer_name: "Computer Science Society",
        location: "Block 1",
        salary: 200,
        status: "Cancelled",
        deadline: "2026-02-10",
        created_at: "2026-01-10T11:00:00Z",
        description: "Project was cancelled due to conference rescheduling. No commitment fee was charged.",
        category: "Design",
        tags: ["Design", "Poster", "UI"]
      }
    ];

    // Combine real DB jobs with demo jobs
    return [...demoJobs, ...dbJobs];
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
