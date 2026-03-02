// js/services/jobs.service.js

export class JobService {
  constructor() {
    // Initial mock data
    this._jobs = [
      { id: 1, title: "Freelance Video Editor", employer: "Campus Media Club", location: "UTP, Block A", pay: 150, status: "Open" },
      { id: 2, title: "Booth Helper (Weekend)", employer: "Student Biz Society", location: "UTP, Main Hall", pay: 80, status: "Open" },
      { id: 3, title: "Poster Design", employer: "Event Committee", location: "Remote", pay: 60, status: "Pending" },
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
   * Fetches recommended jobs for a student.
   * @param {Object} profile - Student profile data
   * @returns {Promise<Array>}
   */
  async getRecommendedJobs(profile = {}) {
    // Basic logic for MVP - return all jobs
    return this.getJobs();
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
