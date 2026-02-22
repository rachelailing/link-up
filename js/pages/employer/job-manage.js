import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function renderJobs(){
  const jobs = getJobs();
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
            <span class="kv">👥 ${job.slots} slot(s)</span>
            <span class="kv">📅 ${job.deadline}</span>
          </div>
        </div>

        <div class="manage-actions">
          ${job.status === "Draft" ? `
            <button class="btn btn-outline" data-edit="${job.id}">Edit</button>
            <button class="btn btn-primary" data-publish="${job.id}">Publish</button>
            <button class="btn btn-outline" data-delete="${job.id}">Delete</button>
          ` : ""}

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
  const jobs = getJobs();

  // Publish Draft
  $$("[data-publish]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.publish);
      const job = jobs.find(j => j.id === id);
      job.status = "Open";
      saveJobs(jobs);
      renderJobs();
    });
  });

  // Delete Draft
  $$("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.delete);
      const updated = jobs.filter(j => j.id !== id);
      saveJobs(updated);
      renderJobs();
    });
  });

  // Close Open
  $$("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.close);
      const job = jobs.find(j => j.id === id);
      job.status = "Completed";
      saveJobs(jobs);
      renderJobs();
    });
  });

  // View Applications
  $$("[data-apps]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `applications.html?job=${btn.dataset.apps}`;
    });
  });
}

function init(){
  setActiveNav();
  renderJobs();
}

document.addEventListener("DOMContentLoaded", init);