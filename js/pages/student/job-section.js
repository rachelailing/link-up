// js/pages/student/dashboard.js
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { openModal, closeModal, wireModalClose } from "../../components/modal.js";
import { $ } from "../../utils/dom.js";
import { jobsService } from "../../services/jobs.service.js";
import { renderJobCard, wireJobCardEvents } from "../../components/job-card.js";
import { authService } from "../../services/auth.service.js";

/**
 * Dashboard Controller
 */
class StudentDashboard {
  constructor() {
    this.listEl = $("#recommendedJobs");
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return; // Stop if not authorized

    setActiveNav();
    wireLogout();
    wireModalClose();
    
    await this.renderJobs();
    this.wireEvents();
    this.loadStats();
  }

  async renderJobs() {
    const user = await authService.getCurrentUser();
    const profile = user?.user_metadata || {};
    const jobs = await jobsService.getRecommendedJobs(profile);
    
    if (jobs.length === 0) {
      this.listEl.innerHTML = `<p class="muted">No recommended jobs found at the moment.</p>`;
      return;
    }

    this.listEl.innerHTML = jobs
      .map(job => renderJobCard(job, {}))
      .join("");
  }

  wireEvents() {
    wireJobCardEvents(this.listEl, {
      onView: (id) => this.handleViewJob(id),
      onApply: (id) => this.handleApplyJob(id),
    });

    // Wire the Apply button inside the Job Details modal
    const modalApplyBtn = $("#modalApplyBtn");
    if (modalApplyBtn) {
      modalApplyBtn.addEventListener("click", () => {
        const jobId = $("#jobDetailsModal").dataset.activeJobId;
        closeModal("jobDetailsModal");
        this.handleApplyJob(jobId);
      });
    }
  }

  async handleViewJob(jobId) {
    const job = await jobsService.getJobById(jobId);
    if (job) {
      $("#modalJobTitle").textContent = job.title;
      $("#modalEmployer").textContent = job.employer_name || job.employer || 'Employer';
      $("#modalLocation").textContent = job.location;
      $("#modalSalary").textContent = job.salary || job.pay || '0';
      $("#modalCategory").textContent = job.category || 'N/A';
      $("#modalDescription").textContent = job.description || "No description provided.";
      
      $("#jobDetailsModal").dataset.activeJobId = jobId;
      openModal("jobDetailsModal");
    }
  }

  async handleApplyJob(jobId) {
    const job = await jobsService.getJobById(jobId);
    if (job) {
      $("#applyJobTitle").textContent = job.title;
      // We could pass the ID to the modal for the final submission
      $("#applyModal").dataset.activeJobId = jobId; 
      openModal("applyModal");
    }
  }

  loadStats() {
    // In a real app, this would also come from a service (e.g., studentProfileService)
    $("#statActive").textContent = "1";
    $("#statPending").textContent = "2";
    $("#statEarnings").textContent = "RM 320";
    $("#statDeposit").textContent = "Held: RM 50";
  }
}

// Bootstrap the page
document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new StudentDashboard();
  dashboard.init();
});
