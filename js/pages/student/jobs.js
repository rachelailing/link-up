import { $, $$ } from '../../utils/dom.js';
import { statusToBadgeClass } from '../../components/status-badge.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';
import { jobsService } from '../../services/jobs.service.js';

let currentPage = 0;
const PAGE_SIZE = 5;
let hasMore = true;

function renderJobs(list, append = false) {
  const listEl = $('#jobsList');

  if (!append && (!list || list.length === 0)) {
    listEl.innerHTML = '<p class="muted">No jobs found matching your criteria.</p>';
    return;
  }

  const html = list
    .map((job) => {
      const badgeClass = statusToBadgeClass(job.status);

      return `
      <div class="card job">
        <div class="job-left">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0;">${job.title}</h3>
              <p class="muted" style="margin:4px 0 0;">${job.employer_name || 'Employer'}</p>
            </div>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="job-meta">
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${job.salary}</span>
            <span class="kv">🏷 ${job.category}</span>
          </div>
        </div>

        <div class="job-actions">
          <button class="btn btn-outline" data-view="${job.id}">View</button>
          <button class="btn btn-primary" data-apply="${job.id}">Apply</button>
        </div>
      </div>
    `;
    })
    .join('');

  if (append) {
    listEl.insertAdjacentHTML('beforeend', html);
  } else {
    listEl.innerHTML = html;
  }

  // Re-wire events for new buttons
  $$('[data-view]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.view;
      window.location.href = `job-details.html?id=${id}`;
    };
  });

  $$('[data-apply]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.apply;
      window.location.href = `apply-job.html?id=${id}`;
    };
  });
}

async function fetchAndRender(append = false) {
  const search = $('#searchInput').value;
  const category = $('#categoryFilter').value;
  const pay = $('#payFilter').value;

  const jobs = await jobsService.getJobs({
    search,
    category,
    minSalary: pay,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  if (jobs.length < PAGE_SIZE) {
    hasMore = false;
    if ($('#loadMoreBtn')) $('#loadMoreBtn').style.display = 'none';
  } else {
    hasMore = true;
    if ($('#loadMoreBtn')) $('#loadMoreBtn').style.display = 'block';
  }

  renderJobs(jobs, append);
}

async function filterJobs() {
  currentPage = 0;
  await fetchAndRender(false);
}

async function init() {
  const user = await authService.requireAuth('student');
  if (!user) return;

  setActiveNav();
  wireLogout();

  // Add Load More button to the UI if not exists
  if (!$('#loadMoreBtn')) {
    const btn = document.createElement('button');
    btn.id = 'loadMoreBtn';
    btn.className = 'btn btn-outline';
    btn.style.margin = '20px auto';
    btn.style.display = 'block';
    btn.textContent = 'Load More';
    btn.onclick = async () => {
      currentPage++;
      await fetchAndRender(true);
    };
    $('#jobsList').after(btn);
  }

  await fetchAndRender();

  $('#searchInput').addEventListener('input', filterJobs);
  $('#categoryFilter').addEventListener('change', filterJobs);
  $('#payFilter').addEventListener('change', filterJobs);
}

document.addEventListener('DOMContentLoaded', init);
