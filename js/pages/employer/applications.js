import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

/*
MVP Data Structure:

linkup_employer_jobs
[
  {
    id,
    title,
    status,
    ...
    applications: [
        {
          id,
          studentName,
          rating,
          status: "Pending" | "Accepted" | "Rejected" | "Awaiting Commitment Fee"
        }
    ]
  }
]
*/

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function seedApplicationsIfMissing(job){
  if (!job.applications){
    job.applications = [
      { id: Date.now()+1, studentName:"Aiman Z.", rating:4.6, status:"Pending" },
      { id: Date.now()+2, studentName:"Siti N.", rating:4.9, status:"Pending" },
      { id: Date.now()+3, studentName:"Ken L.", rating:4.2, status:"Pending" }
    ];
  }
}

function renderApplications(job){
  const container = $("#applicationsList");

  if (!job.applications || job.applications.length === 0){
    container.innerHTML = `
      <div class="card pad">
        <p>No applications yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = job.applications.map(app => {
    const badgeClass = statusToBadgeClass(app.status);

    return `
      <div class="card application-card">
        <div class="app-left">
          <div style="display:flex; gap:10px; align-items:center;">
            <h3 style="margin:0;">${app.studentName}</h3>
            <span class="badge ${badgeClass}">${app.status}</span>
          </div>

          <div class="app-meta">
            <span class="kv">⭐ Rating ${app.rating}</span>
            <span class="kv">📅 Applied recently</span>
          </div>
        </div>

        <div class="app-actions">
          ${app.status === "Pending" ? `
            <button class="btn btn-primary" data-accept="${app.id}">Accept</button>
            <button class="btn btn-outline" data-reject="${app.id}">Reject</button>
          ` : ""}

          ${app.status === "Awaiting Commitment Fee" ? `
            <span class="badge pending">Waiting for student payment</span>
          ` : ""}

          ${app.status === "Accepted" ? `
            <span class="badge accepted">Confirmed</span>
          ` : ""}

          ${app.status === "Rejected" ? `
            <span class="badge rejected">Rejected</span>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");

  attachActions(job);
}

function attachActions(job){
  const jobs = getJobs();

  // Accept
  $$("[data-accept]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.accept);
      const app = job.applications.find(a => a.id === id);

      app.status = "Awaiting Commitment Fee";
      job.status = "Awaiting Commitment Fee";

      saveJobs(jobs);
      renderApplications(job);
      updateHeader(job);
    });
  });

  // Reject
  $$("[data-reject]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.reject);
      const app = job.applications.find(a => a.id === id);

      app.status = "Rejected";
      saveJobs(jobs);
      renderApplications(job);
    });
  });
}

function updateHeader(job){
  $("#jobTitleDisplay").textContent = job.title + " — Applications";

  const badge = $("#jobStatusBadge");
  badge.textContent = job.status;
  badge.className = "badge " + statusToBadgeClass(job.status);
}

function init(){
  setActiveNav();

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = Number(urlParams.get("job"));

  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);

  if (!job){
    $("#applicationsList").innerHTML = `
      <div class="card pad">
        <p>Job not found.</p>
      </div>
    `;
    return;
  }

  seedApplicationsIfMissing(job);
  saveJobs(jobs);

  updateHeader(job);
  renderApplications(job);
}

document.addEventListener("DOMContentLoaded", init);