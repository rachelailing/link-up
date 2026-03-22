// js/pages/student/job-section.js
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { $ } from "../../utils/dom.js";
import { jobsService } from "../../services/jobs.service.js";
import { renderJobCard, wireJobCardEvents } from "../../components/job-card.js";
import { authService } from "../../services/auth.service.js";
import { supabase } from "../../config/supabase.js";

/**
 * Dashboard Controller
 */
class StudentDashboard {
  constructor() {
    this.listEl = $("#recommendedJobs");
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return; 

    setActiveNav();
    wireLogout();
    
    await this.renderJobs();
    this.wireEvents();
    await this.loadStats(user.id);
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
      onView: (id) => {
        window.location.href = `job-details.html?id=${id}`;
      },
      onApply: (id) => {
        window.location.href = `apply-job.html?id=${id}`;
      },
    });
  }

  async loadStats(userId) {
    // Fetch pending applications count
    const { count: pendingCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'pending');

    // Fetch active jobs (confirmed/in progress) count
    const { count: activeCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .in('status', ['confirmed', 'accepted', 'in progress']);

    // Fetch total earnings
    const { data: earningsData } = await supabase
      .from('applications')
      .select('jobs(salary)')
      .eq('student_id', userId)
      .eq('status', 'completed');

    const totalEarnings = (earningsData || []).reduce((sum, item) => sum + Number(item.jobs?.salary || 0), 0);

    $("#statActive").textContent = activeCount || "0";
    $("#statPending").textContent = pendingCount || "0";
    $("#statEarnings").textContent = `RM ${totalEarnings}`;
    
    // Check if any commitment fee is currently held
    const { data: heldFees } = await supabase
      .from('commitment_fees')
      .select('amount')
      .eq('student_id', userId)
      .eq('status', 'Held');
    
    const heldTotal = (heldFees || []).reduce((sum, item) => sum + Number(item.amount), 0);
    $("#statDeposit").textContent = heldTotal > 0 ? `Held: RM ${heldTotal}` : "None";
  }
}

// Bootstrap the page
document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new StudentDashboard();
  dashboard.init();
});
