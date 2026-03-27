// js/pages/student/job-section.js
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { openModal, closeModal, wireModalClose } from '../../components/modal.js';
import { $ } from '../../utils/dom.js';
import { jobsService } from '../../services/jobs.service.js';
import { renderJobCard, wireJobCardEvents } from '../../components/job-card.js';
import { authService } from '../../services/auth.service.js';

/**
 * Dashboard Controller
 */
class StudentDashboard {
  constructor() {
    this.listEl = $('#recommendedJobs');
  }

  async init() {
    const user = await authService.requireAuth('student');
    if (!user) return;

    setActiveNav();
    wireLogout();
    wireModalClose();

    await this.renderJobs();
    this.wireEvents();
    await this.loadStats(user.id);
  }

  async renderJobs() {
    const user = await authService.getCurrentUser();
    const profile = user?.user_metadata || {};
    const jobs = await jobsService.getRecommendedJobs(profile);

    if (jobs.length === 0) {
      this.listEl.innerHTML = '<p class="muted">No recommended jobs found at the moment.</p>';
      return;
    }

    this.listEl.innerHTML = jobs.map((job) => renderJobCard(job, {})).join('');
  }

  wireEvents() {
    wireJobCardEvents(this.listEl, {
      onView: (id) => {
        this.handleViewJob(id);
      },
      onApply: (id) => {
        window.location.href = `apply-job.html?id=${id}`;
      },
    });

    // Wire the Apply button inside the Job Details modal
    const modalApplyBtn = $('#modalApplyBtn');
    if (modalApplyBtn) {
      modalApplyBtn.addEventListener('click', () => {
        const jobId = $('#jobDetailsModal').dataset.activeJobId;
        closeModal('jobDetailsModal');
        window.location.href = `apply-job.html?id=${jobId}`;
      });
    }
  }

  async handleViewJob(jobId) {
    const job = await jobsService.getJobById(jobId);
    if (job) {
      $('#modalJobTitle').textContent = job.title;
      $('#modalEmployer').textContent = job.employer_name || job.employer || 'Employer';
      $('#modalLocation').textContent = job.location;
      $('#modalSalary').textContent = job.salary || job.pay || '0';
      $('#modalCategory').textContent = job.category || 'N/A';
      $('#modalDescription').textContent = job.description || 'No description provided.';

      $('#jobDetailsModal').dataset.activeJobId = jobId;
      openModal('jobDetailsModal');
    }
  }

  async loadStats(userId) {
    try {
      const stats = await jobsService.getStudentStats(userId);

      $('#statActive').textContent = stats.active_count || '0';
      $('#statPending').textContent = stats.pending_count || '0';
      $('#statEarnings').textContent = `RM ${stats.total_earnings || 0}`;
      $('#statDeposit').textContent = stats.held_fees > 0 ? `Held: RM ${stats.held_fees}` : 'None';
    } catch (err) {
      console.error('[Dashboard] Error loading stats:', err);
    }
  }
}

// Bootstrap the page
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new StudentDashboard();
  dashboard.init();
});
