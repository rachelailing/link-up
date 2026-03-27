import { $ } from '../../utils/dom.js';
import { setActiveNav } from '../../components/navbar.js';
import { statusToBadgeClass } from '../../components/status-badge.js';
import { supabase } from '../../config/supabase.js';
import { authService } from '../../services/auth.service.js';
import { jobsService } from '../../services/jobs.service.js';
import { paymentsService } from '../../services/payments.service.js';

async function fetchMyApplication(jobId, studentId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .eq('student_id', studentId)
    .single();

  if (error) return null;
  return data;
}

function renderDetail(job, _app, feeRecord) {
  const detail = $('#feeDetail');
  detail.style.display = 'block';

  const status = feeRecord ? feeRecord.status : _app.status === 'accepted' ? 'Unpaid' : 'Pending';
  const badge = statusToBadgeClass(status);

  const statusText =
    status === 'Unpaid'
      ? 'Payment required to confirm this job.'
      : status === 'Held'
        ? 'Fee is held. It will be refunded after completion.'
        : status === 'Refunded'
          ? 'Fee was refunded after completion.'
          : status === 'Forfeited'
            ? 'Fee was forfeited (job not completed).'
            : 'Waiting for employer to accept your application.';

  const showPayBtn = status === 'Unpaid';

  detail.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <div>
        <h2 style="margin:0;">${job.title}</h2>
        <p style="margin:6px 0 0;">${job.location} • Deadline: ${job.deadline || '-'}</p>
      </div>
      <span class="badge ${badge}">${status}</span>
    </div>

    <div style="height:14px;"></div>

    <div class="fee-box">
      <div>
        <div class="muted">Commitment fee amount</div>
        <div class="amount">RM ${Number(job.deposit || 0)}</div>
      </div>

      <div style="text-align:right;">
        <div class="muted">Application status</div>
        <div style="font-weight:800;">${_app.status}</div>
      </div>
    </div>

    <p class="small-note">${statusText}</p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      ${showPayBtn ? '<button class="btn btn-primary" id="payNowBtn">Pay Now (PayPal Simulation)</button>' : ''}
      <a class="btn btn-outline" href="./job-section.html">Back to Home</a>
    </div>
  `;

  if (showPayBtn) {
    $('#payNowBtn').addEventListener('click', () => payFee(job, _app));
  }
}

async function payFee(job, _app) {
  const user = await authService.getCurrentUser();

  const payBtn = $('#payNowBtn');
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';

  try {
    // Simulate PayPal / External Gateway
    console.log('[Payment] Simulating PayPal redirect...');
    await new Promise((res) => setTimeout(res, 1500));

    await paymentsService.payFee({
      jobId: job.id,
      studentId: user.id,
      amount: job.deposit,
    });

    alert('Payment Successful! ✅ Your job is now confirmed.');
    window.location.reload();
  } catch (err) {
    alert('Payment failed: ' + err.message);
    payBtn.disabled = false;
    payBtn.textContent = 'Pay Now';
  }
}

async function renderList(userId) {
  const fees = await paymentsService.getFeeHistory(userId);
  const el = $('#feeList');

  if (!fees || !fees.length) {
    el.innerHTML = `
      <div class="card pad">
        <p>No transaction records found.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = fees
    .map((r) => {
      const badge = statusToBadgeClass(r.status);
      return `
      <div class="card fee-row">
        <div class="fee-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${r.jobTitle}</h3>
            <span class="badge ${badge}">${r.status}</span>
          </div>

          <div class="fee-meta">
            <span class="kv">💰 RM ${r.amount}</span>
            <span class="kv">📅 ${new Date(r.paid_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="fee-actions">
          <a class="btn btn-outline" href="./trans-details.html?job=${r.job_id}">Details</a>
        </div>
      </div>
    `;
    })
    .join('');
}

async function init() {
  setActiveNav();
  const user = await authService.requireAuth('student');
  if (!user) return;

  await renderList(user.id);

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('job');
  if (!jobId) return;

  const job = await jobsService.getJobById(jobId);
  const app = await fetchMyApplication(jobId, user.id);

  if (!job || !app) {
    $('#feeDetail').style.display = 'block';
    $('#feeDetail').innerHTML = '<p>Record not found.</p>';
    return;
  }

  // Check if a fee record already exists
  const { data: existingFee } = await supabase
    .from('commitment_fees')
    .select('*')
    .eq('job_id', jobId)
    .eq('student_id', user.id)
    .maybeSingle();

  renderDetail(job, app, existingFee);
}

document.addEventListener('DOMContentLoaded', init);
