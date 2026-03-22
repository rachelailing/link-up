import { $, $$ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { statusToBadgeClass } from '../../components/status-badge.js';
import { authService } from '../../services/auth.service.js';
import { supabase } from '../../config/supabase.js';

function normalizeStatus(s) {
  return (s || '').toLowerCase().replace(/\s+/g, '');
}

function computeCountdown(deadlineStr) {
  if (!deadlineStr) return null;
  const now = new Date();
  const d = new Date(deadlineStr + 'T23:59:59');
  const diff = d - now;
  if (isNaN(diff)) return null;
  if (diff <= 0) return 'Deadline passed';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

async function renderJobs() {
  const user = await authService.getCurrentUser();
  if (!user) return;

  // Fetch applications with job details
  const { data: apps, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      jobs (*)
    `
    )
    .eq('student_id', user.id);

  if (error) {
    console.error('Error fetching my jobs:', error);
    return;
  }

  const searchQuery = $('#searchInput').value.toLowerCase().trim();
  const statusFilter = $('#statusFilter').value;
  const dateSort = $('#dateFilter').value;

  const filtered = apps.filter((app) => {
    const job = app.jobs;
    if (!job) return false;

    const jobTitle = job.title.toLowerCase();

    // Search filter
    if (searchQuery && !jobTitle.includes(searchQuery)) return false;

    // Status filter
    if (statusFilter !== 'all') {
      const appStatus = normalizeStatus(app.status);

      if (statusFilter === 'applied') {
        if (!['pending', 'accepted'].includes(appStatus)) return false;
      } else if (statusFilter === 'current') {
        if (!['confirmed', 'inprogress', 'submitted'].includes(appStatus)) return false;
      } else if (statusFilter === 'done') {
        if (appStatus !== 'completed') return false;
      } else if (statusFilter === 'cancelled') {
        if (!['rejected', 'cancelled'].includes(appStatus)) return false;
      }
    }
    return true;
  });

  // Date Sort
  filtered.sort((a, b) => {
    const da = new Date(a.created_at);
    const db = new Date(b.created_at);
    return dateSort === 'newest' ? db - da : da - db;
  });

  const el = $('#activeJobsList');
  if (!filtered.length) {
    el.innerHTML = `
      <div class="card pad">
        <p>No jobs found in this category.</p>
        <a class="btn btn-primary" href="./jobs.html">Find Jobs</a>
      </div>
    `;
    return;
  }

  el.innerHTML = filtered
    .map((app) => {
      const job = app.jobs;
      const badge = statusToBadgeClass(app.status);
      const countdown = computeCountdown(job.deadline);

      return `
      <div class="card active-row">
        <div class="active-image">
           <img src="../../assets/images/link_up_icon.jpeg" alt="job icon" />
        </div>

        <div class="active-content">
          <div class="active-main-info">
            <div class="active-title-row">
              <h3 style="margin:0;">${job.title}</h3>
              <span class="badge ${badge}">${app.status}</span>
            </div>
            
            <div class="active-details-row">
              <div class="active-col">
                <span class="label">Location</span>
                <span class="value">📍 ${job.location}</span>
              </div>
              <div class="active-col">
                <span class="label">Payment</span>
                <span class="value">💰 RM ${job.salary}</span>
              </div>
              <div class="active-col">
                <span class="label">Deadline</span>
                <span class="value">📅 ${job.deadline || '-'}</span>
              </div>
              ${
                countdown
                  ? `
              <div class="active-col">
                <span class="label">Time Left</span>
                <span class="countdown">⏳ ${countdown}</span>
              </div>`
                  : ''
              }
            </div>
          </div>

          <p class="active-desc">
            ${job.description || 'No description provided.'}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" onclick="window.location.href='job-details.html?id=${job.id}'">View</button>

          ${
            app.status === 'confirmed' || app.status === 'inprogress'
              ? `
            <button class="btn btn-primary" data-submit="${app.id}">Mark Submitted</button>
          `
              : ''
          }

          ${
            app.status === 'accepted'
              ? `
            <button class="btn btn-blue" onclick="window.location.href='trans-details.html?job=${job.id}'">Pay Fee</button>
          `
              : ''
          }

          ${
            app.status === 'submitted'
              ? `
            <span class="badge pending" style="padding: 10px;">Waiting approval</span>
          `
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');

  wireActions();
}

function wireActions() {
  $$('[data-submit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.dataset.submit;

      const { error } = await supabase
        .from('applications')
        .update({ status: 'submitted' })
        .eq('id', appId);

      if (error) {
        alert('Error updating status: ' + error.message);
      } else {
        alert('Marked as Submitted ✅ Waiting for employer approval.');
        renderJobs();
      }
    });
  });
}

async function init() {
  setActiveNav();
  wireLogout();

  const user = await authService.requireAuth('student');
  if (!user) return;

  // Event Listeners for filters
  $('#searchInput').addEventListener('input', renderJobs);
  $('#statusFilter').addEventListener('change', renderJobs);
  $('#dateFilter').addEventListener('change', renderJobs);

  await renderJobs();
}

document.addEventListener('DOMContentLoaded', init);
