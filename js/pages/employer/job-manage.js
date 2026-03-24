import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { jobsService } from "../../services/jobs.service.js";
import { authService } from "../../services/auth.service.js";
import { openModal, closeModal, wireModalClose } from "../../components/modal.js";

let currentManageJobId = null;

function getLocalJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveLocalJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

async function renderJobs(){
  const container = $("#jobManageList");
  
  // Fetch from Supabase
  let jobs = await jobsService.getMyJobs();
  
  // Fallback to local (for MVP/migration)
  const localJobs = getLocalJobs();
  if (localJobs.length > 0) {
    const remoteIds = new Set(jobs.map(j => j.id));
    const uniqueLocal = localJobs.filter(j => !remoteIds.has(j.id));
    jobs = [...jobs, ...uniqueLocal];
  }

  if (!jobs.length){
    container.innerHTML = `
      <div class="card pad">
        <p>No jobs created yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = jobs.map(job => {
    const badgeClass = statusToBadgeClass(job.status);
    const salary = job.salary || job.pay || 0;

    return `
      <div class="card manage-card">
        <div class="manage-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="manage-meta">
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${salary}</span>
            <span class="kv">💳 Deposit RM ${job.deposit || 0}</span>
            <span class="kv">👥 ${job.slots || 0} slot(s)</span>
            <span class="kv">📅 ${job.deadline || "N/A"}</span>
          </div>
        </div>

        <div class="manage-actions" style="display:flex; gap:10px; align-items:center;">
          ${job.status === "Open" || job.status === "In Progress" ? `
            <button class="btn btn-outline" data-apps="${job.id}">View Applications</button>
          ` : ""}
          <button class="btn btn-primary" data-manage-btn="${job.id}" data-title="${job.title}" data-status="${job.status}">Manage</button>
        </div>
      </div>
    `;
  }).join("");

  attachActions(jobs);
}

function attachActions(jobs){
  // Open Manage Modal
  $$("[data-manage-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentManageJobId = btn.dataset.manageBtn;
      $("#modalJobTitle").textContent = btn.dataset.title;
      $("#modalStatusSelect").value = btn.dataset.status;
      openModal("manageJobModal");
    });
  });

  // View Applications
  $$("[data-apps]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `applications.html?job=${btn.dataset.apps}`;
    });
  });
}

function setupModalLogic(){
  // Update Status
  $("#modalUpdateStatusBtn").addEventListener("click", async () => {
    if (!currentManageJobId) return;
    const newStatus = $("#modalStatusSelect").value;

    try {
      const localJobs = getLocalJobs();
      const localIdx = localJobs.findIndex(j => String(j.id) === String(currentManageJobId));
      
      if (localIdx > -1) {
        localJobs[localIdx].status = newStatus;
        saveLocalJobs(localJobs);
        alert("Job status updated!");
      } else {
        alert("Note: Supabase update requested for " + newStatus + ". (Service method pending)");
      }
      
      closeModal("manageJobModal");
      renderJobs();
    } catch (e) {
      console.error(e);
    }
  });

  // Delete Job
  $("#modalDeleteBtn").addEventListener("click", () => {
    if (!currentManageJobId) return;
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

    const localJobs = getLocalJobs();
    const updated = localJobs.filter(j => String(j.id) !== String(currentManageJobId));
    
    if (updated.length < localJobs.length) {
      saveLocalJobs(updated);
      alert("Job deleted successfully!");
    } else {
      alert("Note: Supabase delete requested. (Service method pending)");
    }

    closeModal("manageJobModal");
    renderJobs();
  });
}

async function init(){
  const user = await authService.requireAuth("employer");
  if (!user) return;

  setActiveNav();
  wireModalClose();
  setupModalLogic();
  renderJobs();
}

document.addEventListener("DOMContentLoaded", init);