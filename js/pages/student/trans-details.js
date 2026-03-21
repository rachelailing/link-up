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
      <a class="btn btn-outline" href="./job-section.html">Back to Home</a>
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
    paidAt: new Date().toISOString(),
    type: "Commitment" // Default type for this app flow
  });

  // Update statuses
  app.status = "Confirmed";
  job.status = "In Progress";

  saveFees(fees);
  saveJobs(jobs);

  alert("Commitment fee paid ✅ Job is now In Progress.");
  window.location.href = "./job-details.html";
}

function renderList(){
  const fees = getFees();
  const el = $("#feeList");
  
  const searchQuery = normalize($("#searchInput").value);
  const statusFilter = $("#statusFilter").value;
  const typeFilter = $("#typeFilter").value;
  const dateSort = $("#dateSort").value;

  let filtered = fees.filter(f => {
    // Search
    if (searchQuery && !normalize(f.jobTitle).includes(searchQuery)) return false;

    // Status
    if (statusFilter !== "all") {
      if (normalize(f.status) !== statusFilter) return false;
    }

    // Type
    if (typeFilter !== "all") {
      const t = normalize(f.type || "Commitment");
      if (typeFilter === "both") {
         if (t !== "salary + commitment" && t !== "both") return false;
      } else {
         if (t !== typeFilter) return false;
      }
    }

    return true;
  });
// Sort
filtered.sort((a, b) => {
  const da = new Date(a.paidAt);
  const db = new Date(b.paidAt);
  return dateSort === "newest" ? db - da : da - db;
});

const badgeEl = $("#feeCountBadge");
if (badgeEl) {
  badgeEl.textContent = `${filtered.length} record(s)`;
  badgeEl.className = "badge " + (filtered.length ? "pending" : "accepted");
}

if (!filtered.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No transaction records found matching your filters.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = filtered.map(r => {
    const badge = statusToBadgeClass(r.status);
    const typeLabel = r.type || "Commitment Fee";
    return `
      <div class="card fee-row">
        <div class="fee-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${r.jobTitle}</h3>
            <span class="badge ${badge}">${r.status}</span>
            <span class="badge outline" style="font-size:10px;">${typeLabel}</span>
          </div>

          <div class="fee-meta">
            <span class="kv">💰 RM ${r.amount}</span>
            <span class="kv">👤 ${r.studentName}</span>
            <span class="kv">📅 ${new Date(r.paidAt).toLocaleDateString()}</span>
            <span class="kv">🕒 ${new Date(r.paidAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        <div class="fee-actions">
          <a class="btn btn-outline" href="./trans-details.html?job=${r.jobId}">Details</a>
        </div>
      </div>
    `;
  }).join("");
}

function init(){
  setActiveNav();

  const user = getCurrentUser();
  /*
  if (!user){
    window.location.href = "../auth/student-login.html";
    return;
  }
  */

  // Wire up filters
  $("#searchInput").addEventListener("input", renderList);
  $("#statusFilter").addEventListener("change", renderList);
  $("#typeFilter").addEventListener("change", renderList);
  $("#dateSort").addEventListener("change", renderList);

  renderList();

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

  const studentName = (user ? user.fullName : "Student") || "Student";
  const app = findMyApplication(job, studentName);

  if (!app){
    $("#feeDetail").style.display = "block";
    $("#feeDetail").innerHTML = `
      <h3>Job: ${job.title}</h3>
      <p>No application found for your account.</p>
      <a class="btn btn-outline" href="./job-section.html">Back</a>
    `;
    return;
  }

  const fees = getFees();
  const feeStatus = computeFeeStatus(job, app, fees);
  renderDetail(job, app, feeStatus);
}

document.addEventListener("DOMContentLoaded", init);