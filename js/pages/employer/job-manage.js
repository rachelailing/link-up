import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { jobsService } from "../../services/jobs.service.js";
import { authService } from "../../services/auth.service.js";

async function renderJobs(){
  const user = await authService.getCurrentUser();
  if (!user) return;

  const jobs = await jobsService.getJobsByEmployer(user.id);
  const container = $("#jobManageList");

  if (!jobs.length){
    container.innerHTML = `
      <div class="card pad">
        <p>No jobs created yet.</p>
        <a class="btn btn-primary" href="create-job.html">Create your first job</a>
      </div>
    `;
    return;
  }

  container.innerHTML = jobs.map(job => {
    const badgeClass = statusToBadgeClass(job.status);

    return `
      <div class="card manage-card">
        <div class="manage-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="manage-meta">
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${job.salary}</span>
            <span class="kv">💳 Deposit RM ${job.deposit}</span>
            <span class="kv">📅 ${job.deadline || "No deadline"}</span>
          </div>
        </div>

        <div class="manage-actions">
          ${job.status === "Open" ? `
            <button class="btn btn-outline" data-apps="${job.id}">View Applications</button>
            <button class="btn btn-outline" data-close="${job.id}">Close</button>
          ` : ""}

          ${job.status === "In Progress" ? `
            <button class="btn btn-outline" data-apps="${job.id}">Track Job</button>
          ` : ""}

          ${job.status === "Completed" ? `
            <button class="btn btn-outline">View Summary</button>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");

  attachActions();
}

function attachActions(){
  // View Applications
  $$("[data-apps]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `applications.html?job=${btn.dataset.apps}`;
    });
  });

  // Placeholder for close logic (can be implemented in jobsService later)
  $$("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("Close logic will be implemented with Supabase soon.");
    });
  });
}

async function init(){
  setActiveNav();
  await authService.requireAuth("employer");
  await renderJobs();
}

document.addEventListener("DOMContentLoaded", init);