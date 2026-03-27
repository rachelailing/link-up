// js/services/jobs.service.js
import { supabase } from '../config/supabase.js';

/**
 * Job Service
 * Responsibility: Handle fetching, searching, and applying for jobs via Supabase.
 */
export class JobService {
  /**
   * Fetches jobs from Supabase with optional server-side filtering and pagination.
   * Also includes hardcoded demo examples.
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
      .order('created_at', { ascending: false });

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

    const { data, error } = await query.range(from, to);

    if (error) {
      console.error('[JobService] Error fetching jobs:', error.message);
    }

    const dbJobs = (data || []).map((job) => ({
      ...job,
      employer_name: job.employer?.business_name || job.employer?.full_name || 'Employer',
    }));

    // Demo Examples for pitch/display
    const demoJobs = [
      {
        id: 'demo-1',
        title: 'Library Assistant',
        employer_name: 'UTP Main Library',
        location: 'UTP IRC',
        salary: 450,
        status: 'Done',
        deadline: '2026-03-20',
        created_at: '2026-03-01T10:00:00Z',
        description:
          'Assisted in cataloging new arrivals and managing the circulation desk during the mid-semester peak. Received 5-star rating for reliability.',
        category: 'Administration',
        tags: ['Library', 'Admin', 'Customer Service'],
        rating: 5,
        employer_comment:
          'Excellent work! Nafiesa was very punctual and handled the cataloging with great attention to detail. Highly recommended for any administrative tasks.',
      },
      {
        id: 'demo-2',
        title: 'Event Crew: Career Fair 2026',
        employer_name: 'Career Services',
        location: 'Chancellor Hall',
        salary: 120,
        status: 'Current',
        deadline: '2026-04-05',
        created_at: '2026-03-15T09:30:00Z',
        description:
          'Setting up booth layouts, managing visitor registration, and providing technical support for visiting company representatives.',
        category: 'Event',
        tags: ['Event', 'Crew', 'Management'],
      },
      {
        id: 'demo-3',
        title: 'Social Media Content Creator',
        employer_name: 'Link Up Marketing Team',
        location: 'Remote',
        salary: 300,
        status: 'Applied',
        deadline: '2026-04-15',
        created_at: '2026-03-20T14:00:00Z',
        description:
          'Develop weekly TikTok and Instagram reels to promote platform features to new students on campus.',
        category: 'Creative',
        tags: ['Social Media', 'Video', 'Editing'],
      },
      {
        id: 'demo-4',
        title: 'Graphic Designer for Tech Conf',
        employer_name: 'Computer Science Society',
        location: 'Block 1',
        salary: 200,
        status: 'Cancelled',
        deadline: '2026-02-10',
        created_at: '2026-01-10T11:00:00Z',
        description:
          'Project was cancelled due to conference rescheduling. No commitment fee was charged.',
        category: 'Design',
        tags: ['Design', 'Poster', 'UI'],
      },
    ];

    return [...demoJobs, ...dbJobs];
  }

  /**
   * Fetches recommended jobs for a student.
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

    // Fetch jobs that match at least one tag or campus first
    if (allRelevantTerms.length > 0) {
      query = query.overlaps('tags', allRelevantTerms);
    }

    const { data: jobs, error } = await query.limit(20);

    if (error || !jobs) return [];

    // Scoring Algorithm
    const scoredJobs = jobs.map((job) => {
      let score = 0;
      const jobTags = (job.tags || []).map((t) => t.toLowerCase());
      const jobTitle = (job.title || '').toLowerCase();
      const jobDesc = (job.description || '').toLowerCase();

      // 1. Skills Match (High weight)
      studentSkills.forEach((term) => {
        if (jobTags.includes(term)) score += 10;
        if (jobTitle.includes(term)) score += 5;
        if (jobDesc.includes(term)) score += 2;
      });

      // 2. Interest Match (Medium weight)
      studentInterests.forEach((interest) => {
        if (jobTags.includes(interest)) score += 5;
        if (jobTitle.includes(interest)) score += 3;
        if (jobDesc.includes(interest)) score += 1;
      });

      // 3. Location/Campus Match (Bonus)
      if (profile.campus && job.location && job.location.includes(profile.campus)) {
        score += 5;
      }

      // 4. Remote Preference (Small bonus if no campus set)
      if (!profile.campus && job.location && job.location.toLowerCase().includes('remote')) {
        score += 2;
      }

      return {
        ...job,
        matchScore: score,
        employer_name: job.employer?.business_name || job.employer?.full_name || 'Employer',
      };
    });

    return scoredJobs
      .filter((j) => j.status === 'Open')
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
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
   * @param {string|number} jobId
   * @param {string} studentId
   * @param {string} message
   * @returns {Promise<Object>} The application result
   */
  async applyForJob(jobId, studentId, message = '') {
    // If called without studentId, treat as mock apply
    if (!studentId) {
      const job = await this.getJobById(jobId);
      if (job) {
        console.log(`[JobService] Applying for job ${jobId}`);
        return true;
      }
      return false;
    }

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
   * Fetches jobs posted by the current employer (uses auth session).
   */
  async getMyJobs() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let dbJobs = [];
    if (user) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[JobService] Error fetching my jobs:', error);
      } else {
        dbJobs = data || [];
      }
    }

    // Mock jobs for Demo/Testing filters
    const mockJobs = [
      {
        id: 'mock-ongoing',
        title: 'Campus Delivery Rider',
        location: 'UTP Campus',
        salary: 150,
        deposit: 15,
        slots: 2,
        deadline: '2026-04-10',
        status: 'Ongoing',
        created_at: '2026-03-24T10:00:00Z',
      },
      {
        id: 'mock-done',
        title: 'Programming Tutor',
        location: 'Block 1, UTP',
        salary: 400,
        deposit: 40,
        slots: 1,
        deadline: '2026-03-15',
        status: 'Done',
        created_at: '2026-03-01T08:30:00Z',
      },
      {
        id: 'mock-cancelled',
        title: 'Booth Assistant (Cancelled)',
        location: 'Pocket C',
        salary: 100,
        deposit: 10,
        slots: 3,
        deadline: '2026-03-20',
        status: 'Cancelled',
        created_at: '2026-02-15T14:00:00Z',
      },
      {
        id: 'mock-onhold',
        title: 'Library Digitization Asst',
        location: 'UTP Library',
        salary: 300,
        deposit: 30,
        slots: 2,
        deadline: '2026-05-01',
        status: 'On hold',
        created_at: '2026-03-22T09:15:00Z',
      },
    ];

    return [...dbJobs, ...mockJobs];
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
