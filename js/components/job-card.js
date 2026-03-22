// js/components/job-card.js
import { statusToBadgeClass } from './status-badge.js';

/**
 * Renders a job card HTML.
 * @param {Object} job - The job object
 * @param {Object} options - Rendering options/actions
 * @returns {string}
 */
export function renderJobCard(job) {
  const badgeClass = statusToBadgeClass(job.status);

  // High Match Badge logic
  const isHighMatch = job.matchScore && job.matchScore >= 15;
  const matchBadge = isHighMatch
    ? '<span class="badge" style="background: #e1f5fe; color: #0288d1; border: 1px solid #b3e5fc; margin-right: 8px;">✨ Best Match</span>'
    : '';

  return `
    <div class="card job" data-job-id="${job.id}">
      <div class="job-left">
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <div>
            <div style="display:flex; align-items:center;">
              ${matchBadge}
              <h3 style="margin:0;">${job.title}</h3>
            </div>
            <p style="margin:6px 0 0;">${job.employer}</p>
          </div>
          <span class="badge ${badgeClass}">${job.status}</span>
        </div>

        <div class="job-meta">
          <span class="kv">📍 ${job.location}</span>
          <span class="kv">💰 RM ${job.pay}</span>
          ${job.category ? `<span class="kv">🏷️ ${job.category}</span>` : ''}
        </div>
      </div>

      <div class="job-actions">
        <button class="btn btn-outline" data-action="view">View</button>
        <button class="btn btn-primary" data-action="apply">Apply</button>
      </div>
    </div>
  `;
}

/**
 * Wires events for a container of job cards.
 * @param {HTMLElement} container
 * @param {Object} actions - callback actions { onView, onApply }
 */
export function wireJobCardEvents(container, { onView, onApply }) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const card = btn.closest('.card.job');
    const jobId = Number(card.dataset.jobId);

    if (action === 'view' && onView) onView(jobId);
    if (action === 'apply' && onApply) onApply(jobId);
  });
}
