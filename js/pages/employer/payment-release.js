import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { jobsService } from "../../services/jobs.service.js";
import { authService } from "../../services/auth.service.js";

/**
 * Mock Data for Pitch
 */
const MOCK_PENDING = [
  {
    id: "mock-pay-1",
    title: "Event Crew: Tech Showcase",
    status: "Submitted",
    salary: 150,
    deposit: 15,
    deadline: "2026-03-25",
    applications: [
      { studentName: "Rachel Ng", status: "Submitted" }
    ]
  },
  {
    id: "mock-pay-2",
    title: "Campus Delivery Rider",
    status: "Ongoing",
    salary: 150,
    deposit: 15,
    deadline: "2026-04-10",
    applications: [
      { studentName: "Wei Kang", status: "Accepted" }
    ]
  }
];

const MOCK_HISTORY = [
  {
    id: 501,
    jobTitle: "Library Assistant",
    salary: 450,
    depositRefunded: 45,
    releasedAt: "2026-03-20T14:30:00Z",
    status: "Released"
  },
  {
    id: 502,
    jobTitle: "Programming Tutor",
    salary: 400,
    depositRefunded: 40,
    releasedAt: "2026-03-15T10:00:00Z",
    status: "Released"
  }
];

function getLocalJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}
function saveLocalJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function getLocalPayments(){
  return JSON.parse(localStorage.getItem("linkup_payments") || "[]");
}
function saveLocalPayments(payments){
  localStorage.setItem("linkup_payments", JSON.stringify(payments));
}

function normalizeStatus(s){
  return (s || "").toLowerCase().replace(/\s+/g, "");
}

function jobIsPendingApproval(job){
  const s = normalizeStatus(job.status);
  return ["submitted", "awaitingapproval", "awaitingpayment", "inprogress", "ongoing"].includes(s);
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
      ["awaitingcommitmentfee","accepted","confirmed","inprogress","ongoing","submitted","completed"]
      .includes(normalizeStatus(a.status))
    );

    const studentName = accepted?.studentName || "—";
    const deposit = Number(job.deposit || 0);
    const salary = Number(job.salary || 0);

    return `
      <div class="card pay-row" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 15px;">
        <div class="pay-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="pay-meta" style="margin-top: 10px; display: flex; gap: 15px; font-size: 14px; color: var(--muted);">
            <span>👤 Student: <strong>${studentName}</strong></span>
            <span>💰 Salary: <strong>RM ${salary}</strong></span>
            <span>💳 Refund Fee: <strong>RM ${deposit}</strong></span>
          </div>

          <div class="small-note" style="margin-top: 8px; font-size: 12px; color: #888;">
            Approve completion to release salary and refund the commitment fee.
          </div>
        </div>

        <div class="pay-actions" style="display: flex; gap: 10px;">
          <button class="btn btn-primary" data-approve="${job.id}">
            Approve & Release
          </button>
          <button class="btn btn-outline" data-dispute="${job.id}">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  // Wire actions
  $$("[data-dispute]").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("MVP: dispute flow coming soon (opens support ticket).");
    });
  });

  $$("[data-approve]").forEach(btn => {
    btn.addEventListener("click", () => approveAndRelease(btn.dataset.approve));
  });
}

async function approveAndRelease(jobId){
  const localJobs = getLocalJobs();
  const localPayments = getLocalPayments();

  // Try to find in local storage first
  let job = localJobs.find(j => String(j.id) === String(jobId));
  
  // If not in local, it might be a mock job (demo only)
  if (!job) {
    job = MOCK_PENDING.find(j => String(j.id) === String(jobId));
    if (!job) return;
    alert("Demo: Approval for mock job processed.");
  } else {
    // Update real job status
    job.status = "Completed";
    if (job.applications && job.applications.length){
      const chosen = job.applications.find(a =>
        ["awaitingcommitmentfee", "accepted", "confirmed", "inprogress", "ongoing", "submitted"]
        .includes(normalizeStatus(a.status))
      );
      if (chosen) chosen.status = "Completed";
    }
    saveLocalJobs(localJobs);
  }

  // Create payment record (persist to local storage)
  const newPayment = {
    id: Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    salary: Number(job.salary || 0),
    depositRefunded: Number(job.deposit || 0),
    releasedAt: new Date().toISOString(),
    status: "Released"
  };
  
  localPayments.unshift(newPayment);
  saveLocalPayments(localPayments);

  // re-render
  await loadAndRender();
  alert("Payment released ✅ Salary transferred to student.");
}

function renderPaymentHistory(payments){
  const el = $("#paymentHistory");

  if (!payments.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No payouts released yet.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = payments.slice(0, 10).map(p => `
    <div class="card pad" style="display:flex; justify-content:space-between; align-items: center; gap:14px; margin-bottom: 10px;">
      <div>
        <h3 style="margin:0; font-size: 1rem;">${p.jobTitle}</h3>
        <p style="margin:6px 0 0; font-size: 13px; color: var(--muted);">Released: ${new Date(p.releasedAt).toLocaleString()}</p>
      </div>
      <div style="text-align:right;">
        <div style="font-weight: 700; color: var(--green);">RM ${p.salary}</div>
        <div style="font-size: 12px; color: var(--muted);">+ RM ${p.depositRefunded} Refund</div>
        <span class="badge accepted" style="margin-top: 5px;">${p.status}</span>
      </div>
    </div>
  `).join("");
}

async function loadAndRender(){
  const localJobs = getLocalJobs();
  const dbJobs = await jobsService.getMyJobs();
  
  // Combine all jobs
  const remoteIds = new Set(dbJobs.map(j => String(j.id)));
  const uniqueLocal = localJobs.filter(j => !remoteIds.has(String(j.id)));
  const allJobs = [...dbJobs, ...uniqueLocal, ...MOCK_PENDING];

  // Combine payments (local + mock history)
  const localPayments = getLocalPayments();
  const allPayments = [...localPayments, ...MOCK_HISTORY];

  // pending jobs list
  let pending = allJobs.filter(jobIsPendingApproval);

  // Apply filters
  const statusFilter = $("#payStatusFilter")?.value || "all";
  const search = ($("#paySearch")?.value || "").toLowerCase();

  if (search){
    pending = pending.filter(j => (j.title || "").toLowerCase().includes(search));
  }

  if (statusFilter !== "all"){
    pending = pending.filter(j => {
      const s = normalizeStatus(j.status);
      if (statusFilter === "awaiting_approval") return ["submitted","awaitingapproval","awaitingpayment"].includes(s);
      if (statusFilter === "in_progress") return s === "inprogress" || s === "ongoing";
      return true;
    });
  }

  // pending count badge
  const pendingCount = pending.length;
  $("#pendingCountBadge").textContent = `${pendingCount} Pending`;
  $("#pendingCountBadge").className = "badge " + (pendingCount ? "pending" : "accepted");

  renderPendingList(pending);
  renderPaymentHistory(allPayments);
}

async function init(){
  const user = await authService.requireAuth("employer");
  if (!user) return;

  setActiveNav();
  
  $("#payStatusFilter").addEventListener("change", loadAndRender);
  $("#paySearch").addEventListener("input", loadAndRender);

  await loadAndRender();
}

document.addEventListener("DOMContentLoaded", init);