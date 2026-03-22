import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { supabase } from "../../config/supabase.js";
import { authService } from "../../services/auth.service.js";

function normalizeStatus(s){
  return (s || "").toLowerCase().replace(/\s+/g, "_");
}

function jobIsPendingApproval(job){
  const s = normalizeStatus(job.status);
  return ["submitted", "awaiting_approval", "awaiting_payment", "in_progress"].includes(s);
}

async function renderPendingList(list){
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

  // Fetch student info for each job (from confirmed application)
  const jobsWithStudent = await Promise.all(list.map(async (job) => {
    const { data: app } = await supabase
      .from('applications')
      .select('*, profiles(full_name)')
      .eq('job_id', job.id)
      .in('status', ['confirmed', 'submitted', 'completed'])
      .maybeSingle();
    
    return { ...job, student_name: app?.profiles?.full_name || "—", app_id: app?.id };
  }));

  el.innerHTML = jobsWithStudent.map(job => {
    const badgeClass = statusToBadgeClass(job.status);
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
            <span class="kv">👤 Student: ${job.student_name}</span>
            <span class="kv">💰 Salary: RM ${salary}</span>
            <span class="kv">💳 Refund Fee: RM ${deposit}</span>
            <span class="kv">📅 Deadline: ${job.deadline || "-"}</span>
          </div>

          <div class="small-note">
            Approve completion to release salary (and refund commitment fee if applicable).
          </div>
        </div>

        <div class="pay-actions">
          <button class="btn btn-outline" onclick="window.location.href='job-manage.html'">View</button>
          <button class="btn btn-primary" data-approve-job="${job.id}" data-app-id="${job.app_id}">
            Approve & Release
          </button>
          <button class="btn btn-outline">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  // Wire actions
  $$("[data-approve-job]").forEach(btn => {
    btn.addEventListener("click", () => {
      const jobId = btn.dataset.approveJob;
      const appId = btn.dataset.appId;
      approveAndRelease(jobId, appId);
    });
  });
}

async function approveAndRelease(jobId, appId){
  if (!confirm("Are you sure you want to approve this work and release payment?")) return;

  try {
    // 1. Update job status
    const { error: jobErr } = await supabase
      .from('jobs')
      .update({ status: 'Completed' })
      .eq('id', jobId);
    
    if (jobErr) throw jobErr;

    // 2. Update application status
    if (appId) {
      const { error: appErr } = await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('id', appId);
      if (appErr) throw appErr;
    }

    // 3. Update commitment fee status (Refunded)
    await supabase
      .from('commitment_fees')
      .update({ status: 'Refunded', refunded_at: new Date().toISOString() })
      .eq('job_id', jobId);

    alert("Payment released ✅ Job marked as Completed.");
    await loadAndRender();
  } catch (err) {
    alert("Error releasing payment: " + err.message);
  }
}

async function renderPaymentHistory(){
  const user = await authService.getCurrentUser();
  if (!user) return;

  // Fetch completed jobs for history
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', user.id)
    .eq('status', 'Completed')
    .order('created_at', { ascending: false });

  const el = $("#paymentHistory");

  if (error || !jobs || !jobs.length){
    el.innerHTML = `
      <div class="card pad">
        <p>No completed payments yet.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = jobs.map(p => `
    <div class="card pad" style="display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap;">
      <div>
        <h3 style="margin:0;">${p.title}</h3>
        <p class="muted" style="margin:6px 0 0;">Location: ${p.location}</p>
      </div>
      <div style="text-align:right;">
        <div class="kv">💰 RM ${p.salary}</div>
        <div class="kv">💳 Fee Refund RM ${p.deposit}</div>
        <span class="badge accepted">Completed</span>
      </div>
    </div>
  `).join("");
}

async function loadAndRender(){
  const user = await authService.getCurrentUser();
  if (!user) return;

  // fetch my jobs that are not completed yet
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', user.id)
    .neq('status', 'Completed');

  if (error) {
    console.error("Error loading pending approvals:", error);
    return;
  }

  // pending jobs list
  let pending = jobs.filter(jobIsPendingApproval);

  // Apply filters (UI side for simplicity)
  const search = ($("#paySearch")?.value || "").toLowerCase();
  if (search){
    pending = pending.filter(j => (j.title || "").toLowerCase().includes(search));
  }

  // pending count badge
  const pendingCount = pending.filter(j => normalizeStatus(j.status) === 'submitted').length;
  $("#pendingCountBadge").textContent = `${pendingCount} New Submission(s)`;
  $("#pendingCountBadge").className = "badge " + (pendingCount ? "pending" : "accepted");

  await renderPendingList(pending);
  await renderPaymentHistory();
}

async function init(){
  setActiveNav();
  await authService.requireAuth("employer");
  await loadAndRender();

  $("#payStatusFilter")?.addEventListener("change", loadAndRender);
  $("#paySearch")?.addEventListener("input", loadAndRender);
}

document.addEventListener("DOMContentLoaded", init);