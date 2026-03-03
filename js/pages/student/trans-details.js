import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}
function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function getFees(){
  return JSON.parse(localStorage.getItem("linkup_commitment_fees") || "[]");
}
function saveFees(fees){
  localStorage.setItem("linkup_commitment_fees", JSON.stringify(fees));
}

function normalize(s){
  return (s || "").toLowerCase().trim();
}

function getCurrentUser(){
  const raw = localStorage.getItem("linkup_currentUser");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function findMyApplication(job, studentName){
  if (!job.applications) return null;
  return job.applications.find(a =>
    normalize(a.studentName) === normalize(studentName)
  ) || null;
}

function computeFeeStatus(job, app, fees){
  // Priority: look at recorded fee transaction
  const tx = fees.find(f => f.jobId === job.id && f.studentName === app.studentName);
  if (tx) return tx.status; // "Held" | "Refunded" | "Forfeited"

  // If accepted but not paid yet
  const s = normalize(app.status);
  if (s === "awaiting commitment fee") return "Unpaid";
  if (s === "pending") return "Unpaid"; // not accepted yet
  if (["confirmed","in progress","submitted","completed"].includes(s)) return "Held";
  return "Unpaid";
}

function renderDetail(job, app, feeStatus){
  const detail = $("#feeDetail");
  detail.style.display = "block";

  const badge = statusToBadgeClass(feeStatus);

  const statusText =
    feeStatus === "Unpaid" ? "Payment required to confirm this job."
    : feeStatus === "Held" ? "Fee is held. It will be refunded after completion."
    : feeStatus === "Refunded" ? "Fee was refunded after completion."
    : "Fee was forfeited (job not completed).";

  const showPayBtn = feeStatus === "Unpaid" && normalize(app.status) === "awaiting commitment fee";

  detail.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <div>
        <h2 style="margin:0;">${job.title}</h2>
        <p style="margin:6px 0 0;">${job.location} • Deadline: ${job.deadline || "-"}</p>
      </div>
      <span class="badge ${badge}">${feeStatus}</span>
    </div>

    <div style="height:14px;"></div>

    <div class="fee-box">
      <div>
        <div class="muted">Commitment fee amount</div>
        <div class="amount">RM ${Number(job.deposit || 0)}</div>
      </div>

      <div style="text-align:right;">
        <div class="muted">Application status</div>
        <div style="font-weight:800;">${app.status}</div>
      </div>
    </div>

    <p class="small-note">${statusText}</p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      ${showPayBtn ? `<button class="btn btn-primary" id="payNowBtn">Pay Now</button>` : ""}
      <a class="btn btn-outline" href="./applications.html">Back to My Applications</a>
      <a class="btn btn-outline" href="./job-details.html">Job Details</a>
    </div>
  `;

  if (showPayBtn){
    $("#payNowBtn").addEventListener("click", () => payFee(job.id));
  }
}

function payFee(jobId){
  const user = getCurrentUser();
  const studentName = user?.fullName || "Student";

  const jobs = getJobs();
  const fees = getFees();

  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const app = findMyApplication(job, studentName);
  if (!app){
    alert("Application not found for this job.");
    return;
  }

  // Only allow payment if employer accepted
  if (normalize(app.status) !== "awaiting commitment fee"){
    alert("This job does not require payment right now.");
    return;
  }

  // Create fee record (Held)
  fees.unshift({
    id: Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    studentName,
    amount: Number(job.deposit || 0),
    status: "Held",
    paidAt: new Date().toISOString()
  });

  // Update statuses
  app.status = "Confirmed";
  job.status = "In Progress";

  saveFees(fees);
  saveJobs(jobs);

  alert("Commitment fee paid ✅ Job is now In Progress.");
  window.location.href = "./job-details.html";
}

function renderList(records){
  const el = $("#feeList");

  $("#feeCountBadge").textContent = `${records.length} record(s)`;
  $("#feeCountBadge").className = "badge " + (records.length ? "pending" : "accepted");

  if (!records.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No commitment fee records yet.</p>
        <p class="small-note">Once you pay a commitment fee, it will appear here.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = records.map(r => {
    const badge = statusToBadgeClass(r.status);
    return `
      <div class="card fee-row">
        <div class="fee-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${r.jobTitle}</h3>
            <span class="badge ${badge}">${r.status}</span>
          </div>

          <div class="fee-meta">
            <span class="kv">💳 RM ${r.amount}</span>
            <span class="kv">👤 ${r.studentName}</span>
            <span class="kv">🕒 ${new Date(r.paidAt).toLocaleString()}</span>
          </div>
        </div>

        <div class="fee-actions">
          <a class="btn btn-outline" href="./trans-details.html?job=${r.jobId}">View</a>
        </div>
      </div>
    `;
  }).join("");
}

function init(){
  setActiveNav();

  const user = getCurrentUser();
  if (!user){
    window.location.href = "../auth/student-login.html";
    return;
  }

  const fees = getFees();
  renderList(fees);

  // If open from "Pay Commitment Fee" button, show detail
  const params = new URLSearchParams(window.location.search);
  const jobId = Number(params.get("job"));
  if (!jobId) return;

  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job){
    $("#feeDetail").style.display = "block";
    $("#feeDetail").innerHTML = `<p>Job not found.</p>`;
    return;
  }

  const studentName = user.fullName || "Student";
  const app = findMyApplication(job, studentName);

  if (!app){
    $("#feeDetail").style.display = "block";
    $("#feeDetail").innerHTML = `
      <h3>Job: ${job.title}</h3>
      <p>No application found for your account.</p>
      <a class="btn btn-outline" href="./applications.html">Back</a>
    `;
    return;
  }

  const feeStatus = computeFeeStatus(job, app, fees);
  renderDetail(job, app, feeStatus);
}

document.addEventListener("DOMContentLoaded", init);