import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { authService } from "../../services/auth.service.js";
import { jobsService } from "../../services/jobs.service.js";

// Mock Data for Pitch
const MOCK_JOBS = [
  {
    id: "mock-1",
    title: "Event Crew: Tech Showcase",
    status: "Open",
    location: "Block 1, UTP",
    salary: 150,
    applications: [{}, {}, {}] // 3 applicants
  },
  {
    id: "mock-2",
    title: "Lab Assistant - Physics",
    status: "In Progress",
    location: "Block P",
    salary: 200,
    applications: [{}]
  },
  {
    id: "mock-3",
    title: "Library Data Entry",
    status: "Completed",
    location: "IRC",
    salary: 100,
    applications: [{}]
  }
];

const MOCK_APPS = [
  {
    id: "app-1",
    studentName: "Rachel Ng",
    status: "Pending",
    jobTitle: "Event Crew: Tech Showcase",
    jobId: "mock-1",
    rating: 4.8
  },
  {
    id: "app-2",
    studentName: "Ahmad Danish",
    status: "Accepted",
    jobTitle: "Lab Assistant - Physics",
    jobId: "mock-2",
    rating: 4.5
  },
  {
    id: "app-3",
    studentName: "Sarah Lim",
    status: "Pending",
    jobTitle: "Event Crew: Tech Showcase",
    jobId: "mock-1",
    rating: 4.9
  }
];

function getLocalJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

async function renderRecentJobs(){
  const el = $("#recentJobs");
  
  // Try fetching from service first
  let dbJobs = await jobsService.getMyJobs();
  let jobs = [...MOCK_JOBS, ...dbJobs];

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
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none; margin-bottom: 10px; padding: 16px;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0; font-size: 1rem;">${job.title}</h3>
            <span class="badge ${badge}">${job.status}</span>
          </div>

          <div class="item-meta" style="margin-top: 8px; display: flex; gap: 12px; font-size: 0.85rem; color: var(--muted);">
            <span>📍 ${location}</span>
            <span>💰 RM ${pay}</span>
            <span>👥 ${applicants} applicants</span>
          </div>
        </div>

        <div class="item-actions" style="margin-top: 12px;">
          <button class="btn btn-outline btn-sm" data-job-view="${job.id}">Manage</button>
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
  
  if (MOCK_APPS.length === 0) {
    el.innerHTML = `
      <div class="card pad" style="text-align:center; color:var(--text-light);">
        <p>No recent applications.</p>
      </div>
    `;
    return;
  }

  // Show only 3 recent applications
  const recentApps = MOCK_APPS.slice(0, 3);

  el.innerHTML = recentApps.map(app => {
    const badge = statusToBadgeClass(app.status);
    return `
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none; margin-bottom: 10px; padding: 16px;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0; font-size: 1rem;">${app.studentName}</h3>
            <span class="badge ${badge}">${app.status}</span>
          </div>
          <div class="item-meta" style="margin-top: 8px; display: flex; gap: 12px; font-size: 0.85rem; color: var(--muted);">
            <span>🧰 ${app.jobTitle}</span>
            <span>⭐ ${app.rating}</span>
          </div>
        </div>

        <div class="item-actions" style="margin-top: 12px;">
          <button class="btn btn-outline btn-sm" data-job-id="${app.jobId}">Review</button>
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
  let dbJobs = await jobsService.getMyJobs();
  let jobs = [...MOCK_JOBS, ...dbJobs];

  const openJobs = jobs.filter(j => j.status.toLowerCase() === "open").length;
  const pendingApps = MOCK_APPS.filter(a => a.status.toLowerCase() === "pending").length;
  const completed = jobs.filter(j => j.status.toLowerCase() === "completed" || j.status.toLowerCase() === "done").length;

  // Mock pending payments logic
  const pendingPay = 350; 

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

