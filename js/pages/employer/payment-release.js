import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

/**
 * Jobs source: localStorage "linkup_employer_jobs"
 * Payment history: localStorage "linkup_payments"
 *
 * We’ll treat these job statuses as "needs employer approval":
 * - "Submitted"
 * - "Awaiting Approval"
 * - "Awaiting Payment"
 * (Your system naming can vary; we’ll handle common names.)
 */

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}
function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function getPayments(){
  return JSON.parse(localStorage.getItem("linkup_payments") || "[]");
}
function savePayments(payments){
  localStorage.setItem("linkup_payments", JSON.stringify(payments));
}

function normalizeStatus(s){
  return (s || "").toLowerCase().replace(/\s+/g, "_");
}

function jobIsPendingApproval(job){
  const s = normalizeStatus(job.status);
  return ["submitted", "awaiting_approval", "awaiting_payment", "in_progress"].includes(s);
}

function renderPendingList(list){
  const el = $("#paymentList");

  if (!list.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No pending payment approvals right now.</p>
        <p class="small-note">When students submit work, it will appear here for approval.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = list.map(job => {
    const badgeClass = statusToBadgeClass(job.status);

    // Pick a “student” to display if you accepted someone
    const accepted = (job.applications || []).find(a =>
      ["awaiting commitment fee","accepted","confirmed","in progress","submitted","completed"]
      .includes((a.status || "").toLowerCase())
    );

    const studentName = accepted?.studentName || "—";
    const deposit = Number(job.deposit || 0);
    const salary = Number(job.salary || 0);

    return `
      <div class="card pay-row">
        <div class="pay-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="pay-meta">
            <span class="kv">👤 Student: ${studentName}</span>
            <span class="kv">💰 Salary: RM ${salary}</span>
            <span class="kv">💳 Refund Fee: RM ${deposit}</span>
            <span class="kv">📅 Deadline: ${job.deadline || "-"}</span>
          </div>

          <div class="small-note">
            Approve completion to release salary (and refund commitment fee if applicable).
          </div>
        </div>

        <div class="pay-actions">
          <button class="btn btn-outline" data-view="${job.id}">View</button>
          <button class="btn btn-primary" data-approve="${job.id}">
            Approve & Release
          </button>
          <button class="btn btn-outline" data-dispute="${job.id}">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  // Wire actions
  $$("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      // Optional: you can redirect to job-manage detail later
      alert("MVP: view details page coming soon.");
    });
  });

  $$("[data-dispute]").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("MVP: dispute flow coming soon (opens support ticket).");
    });
  });

  $$("[data-approve]").forEach(btn => {
    btn.addEventListener("click", () => approveAndRelease(Number(btn.dataset.approve)));
  });
}

function approveAndRelease(jobId){
  const jobs = getJobs();
  const payments = getPayments();

  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  // Update job status
  job.status = "Completed";

  // Update accepted applicant status (if exists)
  if (job.applications && job.applications.length){
    const chosen = job.applications.find(a =>
      ["awaiting commitment fee", "accepted", "confirmed", "in progress", "submitted"]
      .includes((a.status || "").toLowerCase())
    );
    if (chosen) chosen.status = "Completed";
  }

  // Create payment record
  payments.unshift({
    id: Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    salary: Number(job.salary || 0),
    depositRefunded: Number(job.deposit || 0),
    releasedAt: new Date().toISOString(),
    status: "Released"
  });

  saveJobs(jobs);
  savePayments(payments);

  // re-render
  loadAndRender();
  alert("Payment released ✅ Job marked as Completed.");
}

function renderPaymentHistory(payments){
  const el = $("#paymentHistory");

  if (!payments.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No payments yet.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = payments.slice(0, 8).map(p => `
    <div class="card pad" style="display:flex; justify-content:space-between; gap:14px;">
      <div>
        <h3 style="margin:0;">${p.jobTitle}</h3>
        <p style="margin:6px 0 0;">Released: ${new Date(p.releasedAt).toLocaleString()}</p>
      </div>
      <div style="text-align:right;">
        <div class="kv">💰 RM ${p.salary}</div>
        <div class="kv">💳 Refund RM ${p.depositRefunded}</div>
        <span class="badge accepted">${p.status}</span>
      </div>
    </div>
  `).join("");
}

function loadAndRender(){
  const jobs = getJobs();
  const payments = getPayments();

  // pending jobs list
  let pending = jobs.filter(jobIsPendingApproval);

  // Apply filters
  const statusFilter = $("#payStatusFilter")?.value || "all";
  const search = ($("#paySearch")?.value || "").toLowerCase();

  if (search){
    pending = pending.filter(j => (j.title || "").toLowerCase().includes(search));
  }

  if (statusFilter !== "all"){
    pending = pending.filter(j => {
      const s = normalizeStatus(j.status);
      if (statusFilter === "awaiting_approval") return ["submitted","awaiting_approval","awaiting_payment"].includes(s);
      if (statusFilter === "in_progress") return s === "in_progress";
      if (statusFilter === "completed") return s === "completed";
      return true;
    });
  }

  // pending count badge
  const pendingCount = jobs.filter(jobIsPendingApproval).length;
  $("#pendingCountBadge").textContent = `${pendingCount} Pending`;
  $("#pendingCountBadge").className = "badge " + (pendingCount ? "pending" : "accepted");

  renderPendingList(pending);
  renderPaymentHistory(payments);
}

function init(){
  setActiveNav();
  loadAndRender();

  $("#payStatusFilter").addEventListener("change", loadAndRender);
  $("#paySearch").addEventListener("input", loadAndRender);
}

document.addEventListener("DOMContentLoaded", init);