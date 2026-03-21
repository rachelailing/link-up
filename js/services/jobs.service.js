// js/services/jobs.service.js

export class JobService {
  constructor() {
    // Initial mock data with more metadata for recommendation
    this._jobs = [
      { 
        id: 1, 
        title: "Freelance Video Editor", 
        employer: "Campus Media Club", 
        location: "UTP, Block A", 
        pay: 150, 
        status: "Open",
        category: "Creative",
        tags: ["video", "editing", "media", "creative"],
        description: "Looking for someone to edit 3-5 minute event videos. Familiarity with Premiere Pro or Final Cut is a plus."
      },
      { 
        id: 2, 
        title: "Booth Helper (Weekend)", 
        employer: "Student Biz Society", 
        location: "UTP, Main Hall", 
        pay: 80, 
        status: "Open",
        category: "Event",
        tags: ["event", "helper", "booth", "customer service"],
        description: "Assist with setup and managing the registration booth for the upcoming Entrepreneurship Day."
      },
      { 
        id: 3, 
        title: "Poster Design", 
        employer: "Event Committee", 
        location: "Remote", 
        pay: 60, 
        status: "Open", // Changed to Open for demo
        category: "Design",
        tags: ["design", "poster", "graphics", "creative"],
        description: "Need a minimalist poster for a tech talk event. Deadline: 3 days."
      },
      { 
        id: 4, 
        title: "Python Tutor", 
        employer: "IT Department", 
        location: "Online", 
        pay: 40, 
        status: "Open",
        category: "Education",
        tags: ["python", "coding", "tutoring", "tech"],
        description: "Help first-year students with basic Python syntax and logic."
      },
      { 
        id: 5, 
        title: "Social Media Manager", 
        employer: "Startup Hub", 
        location: "Remote", 
        pay: 200, 
        status: "Open",
        category: "Marketing",
        tags: ["social media", "marketing", "content creation", "writing"],
        description: "Manage Instagram and LinkedIn accounts for our student-led startup hub."
      }
    ];
  }

  /**
   * Fetches all available jobs. 
   * (In the future, this will use fetch() to an API)
   * @returns {Promise<Array>}
   */
  async getJobs() {
    return [...this._jobs];
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
      if (profile.campus && job.location.includes(profile.campus)) {
        score += 5;
      }

      // 4. Remote Preference (Small bonus if no campus set)
      if (!profile.campus && job.location.toLowerCase().includes("remote")) {
        score += 2;
      }

      return { ...job, matchScore: score };
    });

    // Sort by score (descending) and return top matches
    // Only return jobs with a score > 0 if there are any, otherwise return default top 3
    const recommendations = scoredJobs
      .filter(j => j.status === "Open")
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log("[JobService] Recommended Jobs Scores:", recommendations.map(j => ({ title: j.title, score: j.matchScore })));
    
    return recommendations.slice(0, 3);
  }

  /**
   * Gets a job by its unique ID.
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  async getJobById(id) {
    return this._jobs.find(j => j.id === id) || null;
  }

  /**
   * Mock implementation of applying for a job.
   * @param {number} jobId 
   * @returns {Promise<boolean>}
   */
  async applyForJob(jobId) {
    const job = await this.getJobById(jobId);
    if (job) {
      job.status = "Pending";
      return true;
    }
    return false;
  }
}

// Singleton instance for global use
export const jobsService = new JobService();
