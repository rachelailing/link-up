import { $, $$ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { statusToBadgeClass } from '../../components/status-badge.js';
import { authService } from '../../services/auth.service.js';

const JOBS = [
  {
    id: 101,
    title: 'Booth Helper (Career Fair)',
    status: 'Open',
    pay: 80,
    applicants: 6,
    location: 'UTP Main Hall',
  },
  {
    id: 102,
    title: 'Poster Design (Club Event)',
    status: 'In Progress',
    pay: 120,
    applicants: 9,
    location: 'Remote',
  },
  {
    id: 103,
    title: 'Math Tutor (Foundation)',
    status: 'Completed',
    pay: 150,
    applicants: 4,
    location: 'Block C',
  },
];

const APPLICATIONS = [
  {
    id: 201,
    student: 'Aiman Z.',
    jobTitle: 'Booth Helper (Career Fair)',
    rating: 4.6,
    status: 'Pending',
  },
  {
    id: 202,
    student: 'Siti N.',
    jobTitle: 'Poster Design (Club Event)',
    rating: 4.9,
    status: 'Pending',
  },
  {
    id: 203,
    student: 'Ken L.',
    jobTitle: 'Booth Helper (Career Fair)',
    rating: 4.2,
    status: 'Accepted',
  },
];

function renderRecentJobs() {
  const el = $('#recentJobs');
  el.innerHTML = JOBS.map((job) => {
    const badge = statusToBadgeClass(job.status);
    return `
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${job.title}</h3>
            <span class="badge ${badge}">${job.status}</span>
          </div>

          <div class="item-meta">
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${job.pay}</span>
            <span class="kv">👥 ${job.applicants} applicants</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn btn-outline" data-job-view="${job.id}">Manage</button>
        </div>
      </div>
    `;
  }).join('');

  $$('[data-job-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Later you can redirect to job-manage page with query id
      window.location.href = `job-manage.html?id=${btn.dataset.jobView}`;
    });
  });
}

function renderRecentApplications() {
  const el = $('#recentApplications');
  el.innerHTML = APPLICATIONS.map((app) => {
    const badge = statusToBadgeClass(app.status);
    return `
      <div class="card item-row" style="border:1px solid var(--border); box-shadow:none;">
        <div class="item-left">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0;">${app.student}</h3>
            <span class="badge ${badge}">${app.status}</span>
          </div>
          <div class="item-meta">
            <span class="kv">🧰 ${app.jobTitle}</span>
            <span class="kv">⭐ ${app.rating}</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn btn-outline" data-app-view="${app.id}">Review</button>
          <button class="btn btn-primary" data-app-accept="${app.id}">Accept</button>
        </div>
      </div>
    `;
  }).join('');

  $$('[data-app-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = `applications.html?id=${btn.dataset.appView}`;
    });
  });

  $$('[data-app-accept]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alert("MVP: Accepting will move application to 'Awaiting Commitment Fee'.");
    });
  });
}

function setStats() {
  const openJobs = JOBS.filter((j) => j.status.toLowerCase() === 'open').length;
  const pendingApps = APPLICATIONS.filter((a) => a.status.toLowerCase() === 'pending').length;
  const completed = JOBS.filter((j) => j.status.toLowerCase() === 'completed').length;

  // Example pending payment total: sum jobs in progress (demo)
  const pendingPay = JOBS.filter((j) => j.status.toLowerCase() === 'in progress').reduce(
    (sum, j) => sum + j.pay,
    0
  );

  $('#statOpenJobs').textContent = String(openJobs);
  $('#statPendingApps').textContent = String(pendingApps);
  $('#statCompleted').textContent = String(completed);
  $('#statPendingPay').textContent = `RM ${pendingPay}`;
}

async function init() {
  const user = await authService.requireAuth('employer');
  if (!user) return;

  setActiveNav();
  wireLogout();
  setStats();
  renderRecentJobs();
  renderRecentApplications();
}

document.addEventListener('DOMContentLoaded', init);
