import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { authService } from "../../services/auth.service.js";
import { jobsService } from "../../services/jobs.service.js";

function getLocalJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

async function renderRecentJobs(){
  const el = $("#recentJobs");
  
  // Try fetching from service first
  let jobs = await jobsService.getMyJobs();
  
  // If no jobs in Supabase, check localStorage (for backward compatibility during migration)
  if (jobs.length === 0) {
    jobs = getLocalJobs();
  }

  if (jobs.length === 0) {
    el.innerHTML = `
      <div class="card pad" style="text-align:center; color:var(--text-light);">
        <p>No recent jobs found.</p>
        <a href="create-job.html" class="btn btn-outline" style="margin-top:10px;">Create your first job</a>
      </div>
    `;
    return;
  }

  // Show only 3 recent jobs
  const recentJobs = jobs.slice(0, 3);

  el.innerHTML = recentJobs.map(job => {
    const badge = statusToBadgeClass(job.status);
    const pay = job.salary || job.pay || 0;
    const location = job.location || "N/A";
    const applicants = job.applications ? job.applications.length : 0;

    return `
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badge}">${job.status}</span>
          </div>

          <div class="item-meta">
            <span class="kv">📍 ${location}</span>
            <span class="kv">💰 RM ${pay}</span>
            <span class="kv">👥 ${applicants} applicants</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn btn-outline" data-job-view="${job.id}">Manage</button>
        </div>
      </div>
    `;
  }).join("");

  $$("[data-job-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `job-manage.html?id=${btn.dataset.jobView}`;
    });
  });
}

function renderRecentApplications(){
  const el = $("#recentApplications");
  
  // For now, applications are nested in localJobs
  const jobs = getLocalJobs();
  const allApps = [];
  
  jobs.forEach(job => {
    if (job.applications) {
      job.applications.forEach(app => {
        allApps.push({ ...app, jobId: job.id, jobTitle: job.title });
      });
    }
  });

  if (allApps.length === 0) {
    el.innerHTML = `
      <div class="card pad" style="text-align:center; color:var(--text-light);">
        <p>No recent applications.</p>
      </div>
    `;
    return;
  }

  // Show only 3 recent applications
  const recentApps = allApps.slice(0, 3);

  el.innerHTML = recentApps.map(app => {
    const badge = statusToBadgeClass(app.status);
    return `
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${app.studentName || app.student}</h3>
            <span class="badge ${badge}">${app.status}</span>
          </div>
          <div class="item-meta">
            <span class="kv">🧰 ${app.jobTitle}</span>
            <span class="kv">⭐ ${app.rating || "N/A"}</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn btn-outline" data-job-id="${app.jobId}">Review</button>
        </div>
      </div>
    `;
  }).join("");

  $$("[data-job-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `applications.html?job=${btn.dataset.jobId}`;
    });
  });
}

async function setStats(){
  let jobs = await jobsService.getMyJobs();
  if (jobs.length === 0) jobs = getLocalJobs();

  const allApps = [];
  jobs.forEach(j => {
    if (j.applications) allApps.push(...j.applications);
  });

  const openJobs = jobs.filter(j => j.status.toLowerCase() === "open").length;
  const pendingApps = allApps.filter(a => a.status.toLowerCase() === "pending").length;
  const completed = jobs.filter(j => j.status.toLowerCase() === "completed").length;

  const pendingPay = jobs
    .filter(j => j.status.toLowerCase() === "in progress")
    .reduce((sum, j) => sum + (j.salary || j.pay || 0), 0);

  $("#statOpenJobs").textContent = String(openJobs);
  $("#statPendingApps").textContent = String(pendingApps);
  $("#statCompleted").textContent = String(completed);
  $("#statPendingPay").textContent = `RM ${pendingPay}`;
}

async function init(){
  const user = await authService.requireAuth("employer");
  if (!user) return;

  setActiveNav();
  wireLogout();
  
  await setStats();
  await renderRecentJobs();
  renderRecentApplications();
}

document.addEventListener("DOMContentLoaded", init);

