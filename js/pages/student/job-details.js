import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

/**
 * MVP source of jobs:
 * - Employer jobs: linkup_employer_jobs
 * We will show "active" jobs as:
 * - In Progress
 * - Submitted
 * (optionally Accepted/Confirmed if you want)
 *
 * Later, when you connect backend, this will be real.
 */

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}

function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function normalizeStatus(s){
  return (s || "").toLowerCase().replace(/\s+/g, "_");
}

function getAcceptedStudent(job){
  if (!job.applications) return null;
  // pick whoever is not rejected/pending (MVP)
  return job.applications.find(a =>
    ["awaiting commitment fee","accepted","confirmed","in progress","submitted","completed"]
    .includes((a.status || "").toLowerCase())
  ) || null;
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
  return ["in_progress","submitted","awaiting_approval","awaiting_payment"].includes(s);
}

function renderActiveJobs(){
  const jobs = getJobs();
  const active = jobs.filter(isActive);

  $("#activeCountBadge").textContent = `${active.length} Active`;
  $("#activeCountBadge").className = "badge " + (active.length ? "inprogress" : "accepted");

  const el = $("#activeJobsList");

  if (!active.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No active jobs right now.</p>
        <a class="btn btn-primary" href="./jobs.html">Find Jobs</a>
      </div>
    `;
    return;
  }

  el.innerHTML = active.map(job => {
    const badge = statusToBadgeClass(job.status);
    const student = getAcceptedStudent(job);
    const who = student?.studentName ? `You: ${student.studentName}` : "You";
    const countdown = computeCountdown(job.deadline);

    return `
      <div class="card active-row">
        <div class="active-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badge}">${job.status}</span>
            ${countdown ? `<span class="countdown">⏳ ${countdown}</span>` : ""}
          </div>

          <div class="active-meta">
            <span class="kv">👤 ${who}</span>
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${job.salary}</span>
            <span class="kv">💳 Fee RM ${job.deposit}</span>
            <span class="kv">📅 ${job.deadline || "-"}</span>
          </div>

          <p style="margin:0; color:var(--muted);">
            ${job.description ? job.description.slice(0, 110) + (job.description.length > 110 ? "..." : "") : ""}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" data-view="${job.id}">View</button>

          ${normalizeStatus(job.status) === "in_progress" ? `
            <button class="btn btn-primary" data-submit="${job.id}">Mark Submitted</button>
          ` : ""}

          ${normalizeStatus(job.status) === "submitted" ? `
            <span class="badge pending">Waiting employer approval</span>
          ` : ""}

          <button class="btn btn-outline" data-fail="${job.id}">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  wireActions();
}

function wireActions(){
  const jobs = getJobs();

  $$("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.view;
      // optional: link to student job details page (if you built it)
      window.location.href = `job-details.html?id=${id}`;
    });
  });

  $$("[data-submit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.submit);
      const job = jobs.find(j => j.id === id);
      if (!job) return;

      job.status = "Submitted";

      // Update student application status too (if exists)
      const student = getAcceptedStudent(job);
      if (student) student.status = "Submitted";

      saveJobs(jobs);
      renderActiveJobs();
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

  // For MVP testing: if no job is in progress, we can gently seed one.
  // Comment this out if you don't want auto seeding.
  const jobs = getJobs();
  const hasActive = jobs.some(isActive);
  if (!hasActive && jobs.length){
    // move first Open job to In Progress (demo only)
    const first = jobs.find(j => normalizeStatus(j.status) === "open");
    if (first) {
      first.status = "In Progress";
      saveJobs(jobs);
    }
  }

  renderActiveJobs();
}

document.addEventListener("DOMContentLoaded", init);