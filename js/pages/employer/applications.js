import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { jobsService } from "../../services/jobs.service.js";

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

function getLocalJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveLocalJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function seedApplicationsIfMissing(job){
  if (!job.applications || job.applications.length === 0){
    // Different mock data based on job ID to make it look varied
    if (String(job.id).includes("ongoing")) {
      job.applications = [
        { 
          id: 201, 
          studentName: "Wei Kang", 
          rating: 4.7, 
          status: "Accepted", 
          university: "UTP", 
          major: "Civil Engineering",
          message: "I am available for this rider job as I have my own motorcycle.",
          cvLink: "",
          availability: "Flexible"
        }
      ];
    } else {
      job.applications = [
        { 
          id: 101, 
          studentName: "Rachel Ng", 
          rating: 4.8, 
          status: "Pending", 
          university: "UTP", 
          major: "Information Technology",
          message: "I have experience in event management and technical support. I'm very interested in this position!",
          cvLink: "https://rachelng-portfolio.vercel.app",
          availability: "Flexible"
        },
        { 
          id: 102, 
          studentName: "Ahmad Danish", 
          rating: 4.5, 
          status: "Pending", 
          university: "UTP", 
          major: "Mechanical Engineering",
          message: "Looking for part-time work to gain some experience. I'm hardworking and can work in teams.",
          cvLink: "https://ahmad-danish-resume.pdf",
          availability: "Weekends"
        },
        { 
          id: 103, 
          studentName: "Sarah Lim", 
          rating: 4.9, 
          status: "Pending", 
          university: "UTP", 
          major: "Business Management",
          message: "I am a quick learner and I have worked as event crew before. I hope to be selected!",
          cvLink: "https://sarahlim.me",
          availability: "Evenings"
        }
      ];
    }
  }
}

function renderAllApplications(jobs){
  const container = $("#applicationsList");
  let allHtml = "";

  jobs.forEach(job => {
    seedApplicationsIfMissing(job);
    
    if (job.applications && job.applications.length > 0) {
      allHtml += `
        <div class="job-group" style="margin-bottom: 30px;">
          <h3 style="background: #eee; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
            Job: ${job.title} 
            <span style="font-weight: normal; font-size: 0.8em; color: #666;">(${job.applications.length} applicants)</span>
          </h3>
          <div class="list">
            ${job.applications.map(app => renderSingleAppHtml(app, job.id)).join("")}
          </div>
        </div>
      `;
    }
  });

  if (!allHtml) {
    container.innerHTML = `<div class="card pad"><p>No applications found.</p></div>`;
  } else {
    container.innerHTML = allHtml;
    attachActionsForAll(jobs);
  }
}

function renderSingleAppHtml(app, jobId) {
  const badgeClass = statusToBadgeClass(app.status);
  return `
    <div class="card application-card" style="flex-direction: column; align-items: stretch; gap: 15px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div class="app-left">
          <div style="display:flex; gap:10px; align-items:center;">
            <h3 style="margin:0;">${app.studentName}</h3>
            <span class="badge ${badgeClass}">${app.status}</span>
          </div>

          <div class="app-meta">
            <span class="kv">🏫 ${app.university || "UTP"}</span>
            <span class="kv">🎓 ${app.major || "Student"}</span>
            <span class="kv">⭐ Rating ${app.rating}</span>
            <span class="kv">📅 ${app.availability || "Flexible"}</span>
          </div>
        </div>

        <div class="app-actions">
          ${app.status === "Pending" ? `
            <button class="btn btn-primary" data-accept="${app.id}" data-job-id="${jobId}">Accept</button>
            <button class="btn btn-outline" data-reject="${app.id}" data-job-id="${jobId}">Reject</button>
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

      <div class="app-details" style="background: #f9f9f9; padding: 12px; border-radius: 6px; font-size: 14px;">
        <div style="margin-bottom: 8px;">
          <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">Message from student:</strong>
          <p style="margin: 0; color: var(--muted); line-height: 1.4;">${app.message || "No message provided."}</p>
        </div>
        ${app.cvLink ? `
          <div>
            <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">CV / Portfolio:</strong>
            <a href="${app.cvLink}" target="_blank" style="color: var(--blue); text-decoration: underline;">${app.cvLink}</a>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function attachActionsForAll(jobs){
  // Accept
  $$("[data-accept]").forEach(btn => {
    btn.addEventListener("click", () => {
      const appId = Number(btn.dataset.accept);
      const jobId = btn.dataset.jobId;
      const job = jobs.find(j => String(j.id) === String(jobId));
      const app = job.applications.find(a => a.id === appId);

      app.status = "Awaiting Commitment Fee";
      job.status = "Awaiting Commitment Fee";

      // If it's a local storage job, persist it
      const localJobs = getLocalJobs();
      const localIdx = localJobs.findIndex(j => String(j.id) === String(job.id));
      if (localIdx > -1) {
        localJobs[localIdx] = job;
        saveLocalJobs(localJobs);
      }

      renderAllApplications(jobs);
    });
  });

  // Reject
  $$("[data-reject]").forEach(btn => {
    btn.addEventListener("click", () => {
      const appId = Number(btn.dataset.reject);
      const jobId = btn.dataset.jobId;
      const job = jobs.find(j => String(j.id) === String(jobId));
      const app = job.applications.find(a => a.id === appId);

      app.status = "Rejected";
      
      const localJobs = getLocalJobs();
      const localIdx = localJobs.findIndex(j => String(j.id) === String(job.id));
      if (localIdx > -1) {
        localJobs[localIdx] = job;
        saveLocalJobs(localJobs);
      }

      renderAllApplications(jobs);
    });
  });
}

async function init(){
  setActiveNav();

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("job");

  // Fetch all potential jobs
  const localJobs = getLocalJobs();
  const serviceJobs = await jobsService.getMyJobs();
  
  // Combine unique jobs
  const remoteIds = new Set(serviceJobs.map(j => String(j.id)));
  const uniqueLocal = localJobs.filter(j => !remoteIds.has(String(j.id)));
  const allJobs = [...serviceJobs, ...uniqueLocal];

  if (jobId) {
    const job = allJobs.find(j => String(j.id) === String(jobId));
    if (job) {
      $("#jobTitleDisplay").textContent = job.title + " — Applications";
      renderAllApplications([job]);
    } else {
      $("#applicationsList").innerHTML = `<div class="card pad"><p>Job not found.</p></div>`;
    }
  } else {
    $("#jobTitleDisplay").textContent = "All Applications";
    renderAllApplications(allJobs);
  }
}

document.addEventListener("DOMContentLoaded", init);