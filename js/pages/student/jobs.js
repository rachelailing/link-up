import { $, $$ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { openModal, wireModalClose } from '../../components/modal.js';
import { authService } from '../../services/auth.service.js';
import { jobsService } from '../../services/jobs.service.js';
import { statusToBadgeClass } from '../../components/status-badge.js';

async function renderJobs(list) {
  const listEl = $('#jobsList');

  if (!list || list.length === 0) {
    listEl.innerHTML = '<p class="muted">No jobs found matching your criteria.</p>';
    return;
  }

  listEl.innerHTML = list
    .map((job) => {
      const badgeClass = statusToBadgeClass(job.status);

      return `
      <div class="card active-row">
        <div class="active-image">
          <img src="../../assets/images/link_up_icon.jpeg" alt="job icon" />
        </div>

        <div class="active-content">
          <div class="active-main-info">
            <div class="active-title-row">
              <h3 style="margin:0;">${job.title}</h3>
              <span class="badge ${badgeClass}">${job.status}</span>
            </div>

            <div class="active-details-row">
              <div class="active-col">
                <span class="label">Location</span>
                <span class="value">📍 ${job.location}</span>
              </div>
              <div class="active-col">
                <span class="label">Payment</span>
                <span class="value">💰 RM ${job.salary || job.pay}</span>
              </div>
              <div class="active-col">
                <span class="label">Deadline</span>
                <span class="value">📅 ${job.deadline || 'N/A'}</span>
              </div>
              <div class="active-col">
                <span class="label">Slots</span>
                <span class="value">👥 ${job.slots || 1} available</span>
              </div>
            </div>
          </div>

          <p class="active-desc">
            ${job.description || ''}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" data-view="${job.id}">View Details</button>
        </div>
      </div>
    `;
    })
    .join('');

  // View button
  $$('[data-view]').forEach((btn) => {
    btn.addEventListener('click', handleView);
  });
}

async function handleView(e) {
  const id = e.currentTarget.dataset.view;
  const job = await jobsService.getJobById(id);

  // Also check all jobs if not found in DB
  const allJobs = await jobsService.getJobs();
  const foundJob = job || allJobs.find((j) => String(j.id) === String(id));

  if (foundJob) {
    $('#modalJobTitle').textContent = foundJob.title;
    $('#modalEmployer').textContent = foundJob.employer_name || foundJob.employer || 'Employer';
    $('#modalLocation').textContent = foundJob.location;
    $('#modalSalary').textContent = foundJob.salary || foundJob.pay || '0';
    $('#modalCategory').textContent = foundJob.category || 'N/A';
    $('#modalDescription').textContent = foundJob.description || 'No description provided.';

    const badgeEl = $('#modalStatusBadge');
    if (badgeEl) {
      badgeEl.textContent = foundJob.status;
      badgeEl.className = 'badge ' + statusToBadgeClass(foundJob.status);
    }

    // Feedback logic
    const feedbackSection = $('#modalFeedbackSection');
    if (feedbackSection) {
      if (foundJob.status.toLowerCase() === 'done' && foundJob.rating) {
        feedbackSection.style.display = 'block';
        $('#modalRating').textContent = '⭐'.repeat(foundJob.rating);
        $('#modalComment').textContent = foundJob.employer_comment
          ? `"${foundJob.employer_comment}"`
          : 'No comment provided.';
      } else {
        feedbackSection.style.display = 'none';
      }
    }

    openModal('jobDetailsModal');
  }
}

async function filterJobs() {
  const search = ($('#searchInput')?.value || '').toLowerCase();
  const status = $('#statusFilter')?.value || 'all';
  const dateSort = $('#dateFilter')?.value || 'newest';

  const allJobs = await jobsService.getJobs();

  // Base filter: Only show Applied, Current, Done, Cancelled
  const myJobs = allJobs.filter((job) =>
    [
      'applied',
      'current',
      'done',
      'cancelled',
      'completed',
      'inprogress',
      'pending',
      'rejected',
    ].includes(job.status.toLowerCase())
  );

  let filtered = myJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search) || job.employer_name?.toLowerCase().includes(search)
  );

  if (status !== 'all') {
    filtered = filtered.filter((job) => job.status.toLowerCase() === status.toLowerCase());
  }

  // Date Sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  renderJobs(filtered);
}

async function init() {
  const user = await authService.requireAuth('student');
  if (!user) return;

  setActiveNav();
  wireLogout();
  wireModalClose();

  await filterJobs(); // Use the filter function to load initial state

  $('#searchInput').addEventListener('input', filterJobs);
  $('#statusFilter')?.addEventListener('change', filterJobs);
  $('#dateFilter')?.addEventListener('change', filterJobs);
}

document.addEventListener('DOMContentLoaded', init);
