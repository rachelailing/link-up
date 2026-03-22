import { $, $$ } from '../../utils/dom.js';
import { setActiveNav } from '../../components/navbar.js';
import { statusToBadgeClass } from '../../components/status-badge.js';
import { supabase } from '../../config/supabase.js';
import { authService } from '../../services/auth.service.js';
import { jobsService } from '../../services/jobs.service.js';

async function fetchApplications(jobId) {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      student:student_id (
        full_name
      )
    `
    )
    .eq('job_id', jobId);

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
  return data;
}

async function renderApplications(jobId) {
  const container = $('#applicationsList');
  const apps = await fetchApplications(jobId);

  if (!apps || apps.length === 0) {
    container.innerHTML = `
      <div class="card pad">
        <p>No applications yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = apps
    .map((app) => {
      const badgeClass = statusToBadgeClass(app.status);
      const studentName = app.student?.full_name || 'Unknown Student';

      return `
      <div class="card application-card">
        <div class="app-left">
          <div style="display:flex; gap:10px; align-items:center;">
            <h3 style="margin:0;">${studentName}</h3>
            <span class="badge ${badgeClass}">${app.status}</span>
          </div>

          <div class="app-meta">
            <span class="kv">📅 Applied ${new Date(app.created_at).toLocaleDateString()}</span>
            <p class="muted" style="margin-top:8px;">${app.message || 'No message provided.'}</p>
          </div>
        </div>

        <div class="app-actions">
          ${
            app.status === 'pending'
              ? `
            <button class="btn btn-primary" data-accept="${app.id}">Accept</button>
            <button class="btn btn-outline" data-reject="${app.id}">Reject</button>
          `
              : ''
          }

          ${
            app.status === 'accepted'
              ? `
            <span class="badge pending">Waiting for student payment</span>
          `
              : ''
          }

          ${
            app.status === 'confirmed'
              ? `
            <span class="badge accepted">Confirmed</span>
          `
              : ''
          }

          ${
            app.status === 'rejected'
              ? `
            <span class="badge rejected">Rejected</span>
          `
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');

  attachActions(jobId);
}

function attachActions(jobId) {
  // Accept
  $$('[data-accept]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.dataset.accept;

      const { error } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', appId);

      if (error) {
        alert('Error accepting application: ' + error.message);
      } else {
        renderApplications(jobId);
      }
    });
  });

  // Reject
  $$('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.dataset.reject;

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', appId);

      if (error) {
        alert('Error rejecting application: ' + error.message);
      } else {
        renderApplications(jobId);
      }
    });
  });
}

async function updateHeader(jobId) {
  const job = await jobsService.getJobById(jobId);
  if (!job) return;

  $('#jobTitleDisplay').textContent = job.title + ' — Applications';

  const badge = $('#jobStatusBadge');
  badge.textContent = job.status;
  badge.className = 'badge ' + statusToBadgeClass(job.status);
}

async function init() {
  setActiveNav();
  await authService.requireAuth('employer');

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');

  if (!jobId) {
    window.location.href = './job-manage.html';
    return;
  }

  await updateHeader(jobId);
  await renderApplications(jobId);
}

document.addEventListener('DOMContentLoaded', init);
