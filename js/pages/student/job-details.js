import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function getCurrentUser(){
  const raw = localStorage.getItem("linkup_currentUser");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getMyApplication(job, studentName){
  if (!job.applications) return null;
  return job.applications.find(a => 
    (a.studentName || "").toLowerCase() === studentName.toLowerCase()
  );
}

function normalizeStatus(s){
  return (s || "").toLowerCase().replace(/\s+/g, "");
}

function computeCountdown(deadlineStr){
  if (!deadlineStr) return null;
  const now = new Date();
  const d = new Date(deadlineStr + "T23:59:59");
  const diff = d - now;
  if (isNaN(diff)) return null;
  if (diff <= 0) return "Deadline passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

function isActive(job){
  const s = normalizeStatus(job.status);
  return ["inprogress","submitted","awaitingapproval","awaitingpayment","confirmed"].includes(s);
}

function renderJobs(){
  const user = getCurrentUser();
  if (!user) return;
  const studentName = user.fullName || "Student";

  const allJobs = getJobs();
  const myJobsWithApp = allJobs.filter(job => getMyApplication(job, studentName));

  const searchQuery = $("#searchInput").value.toLowerCase().trim();
  const statusFilter = $("#statusFilter").value;
  const dateSort = $("#dateFilter").value;

  let filtered = myJobsWithApp.filter(job => {
    const app = getMyApplication(job, studentName);
    const jobTitle = job.title.toLowerCase();
    
    // Search filter
    if (searchQuery && !jobTitle.includes(searchQuery)) return false;

    // Status filter
    if (statusFilter !== "all") {
      const appStatus = normalizeStatus(app.status);
      const jobStatus = normalizeStatus(job.status);

      if (statusFilter === "applied") {
        if (!["pending", "awaitingcommitmentfee"].includes(appStatus)) return false;
      } else if (statusFilter === "current") {
        if (!["inprogress", "submitted", "confirmed", "awaitingpayment"].includes(jobStatus)) return false;
      } else if (statusFilter === "done") {
        if (jobStatus !== "completed") return false;
      } else if (statusFilter === "cancelled") {
        if (!["rejected", "cancelled"].includes(appStatus) && jobStatus !== "cancelled") return false;
      }
    }
    return true;
  });

  // Date Sort
  filtered.sort((a, b) => {
    const da = new Date(a.createdAt || 0);
    const db = new Date(b.createdAt || 0);
    return dateSort === "newest" ? db - da : da - db;
  });

  // Update counter
  const activeCount = filtered.filter(isActive).length;
  const badgeEl = $("#activeCountBadge");
  if (badgeEl) badgeEl.textContent = `${activeCount} Active`;

  const el = $("#activeJobsList");
  const listContainer = el.closest(".list");
  const hasHardcoded = listContainer && listContainer.querySelector(".active-row:not(#activeJobsList .active-row)");

  if (!filtered.length) {
    // If no dynamic jobs, only show empty state if there are NO other jobs (like hardcoded ones)
    if (!hasHardcoded) {
      el.innerHTML = `
        <div class="card pad">
          <p>No jobs found right now.</p>
          <a class="btn btn-primary" href="./jobs.html">Find Jobs</a>
        </div>
      `;
    } else {
      el.innerHTML = "";
    }
    return;
  }

  el.innerHTML = filtered.map(job => {
    const app = getMyApplication(job, studentName);
    // Prefer job status if it's beyond "Open", otherwise use app status
    const displayStatus = (normalizeStatus(job.status) === "open" || normalizeStatus(job.status) === "draft") 
      ? app.status : job.status;
      
    const badge = statusToBadgeClass(displayStatus);
    const countdown = computeCountdown(job.deadline);

    return `
      <div class="card active-row">
        <div class="active-image">
           <img src="../../assets/images/link_up_icon.jpeg" alt="job icon" />
        </div>

        <div class="active-content">
          <div class="active-main-info">
            <div class="active-title-row">
              <h3 style="margin:0;">${job.title}</h3>
              <span class="badge ${badge}">${displayStatus}</span>
            </div>
            
            <div class="active-details-row">
              <div class="active-col">
                <span class="label">Location</span>
                <span class="value">📍 ${job.location}</span>
              </div>
              <div class="active-col">
                <span class="label">Payment</span>
                <span class="value">💰 RM ${job.salary}</span>
              </div>
              <div class="active-col">
                <span class="label">Deadline</span>
                <span class="value">📅 ${job.deadline || "-"}</span>
              </div>
              ${countdown ? `
              <div class="active-col">
                <span class="label">Time Left</span>
                <span class="countdown">⏳ ${countdown}</span>
              </div>` : ""}
            </div>
          </div>

          <p class="active-desc">
            ${job.description ? job.description.slice(0, 110) + (job.description.length > 110 ? "..." : "") : ""}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" data-view="${job.id}">View</button>

          ${normalizeStatus(job.status) === "inprogress" ? `
            <button class="btn btn-primary" data-submit="${job.id}">Mark Submitted</button>
          ` : ""}

          ${normalizeStatus(job.status) === "submitted" ? `
            <span class="badge pending" style="padding: 10px;">Waiting approval</span>
          ` : ""}

          <button class="btn btn-outline" data-fail="${job.id}">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  wireActions();
}

function wireActions(){
  const allJobs = getJobs();
  const user = getCurrentUser();
  const studentName = user?.fullName || "Student";

  $$("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.view;
      alert("MVP: Full details page coming soon. ID: " + id);
    });
  });

  $$("[data-submit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.submit);
      const job = allJobs.find(j => j.id === id);
      if (!job) return;

      job.status = "Submitted";
      
      const app = getMyApplication(job, studentName);
      if (app) app.status = "Submitted";

      saveJobs(allJobs);
      renderJobs();
      alert("Marked as Submitted ✅ Waiting for employer approval.");
    });
  });

  $$("[data-fail]").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("MVP: Issue reporting flow coming soon.");
    });
  });
}

function init(){
  setActiveNav();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../auth/student-login.html";
    return;
  }

  // Event Listeners for filters
  $("#searchInput").addEventListener("input", renderJobs);
  $("#statusFilter").addEventListener("change", renderJobs);
  $("#dateFilter").addEventListener("change", renderJobs);

  renderJobs();
}

document.addEventListener("DOMContentLoaded", init);
