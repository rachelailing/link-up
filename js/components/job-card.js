// js/components/job-card.js
import { statusToBadgeClass } from "./status-badge.js";

/**
 * Renders a job card HTML.
 * @param {Object} job - The job object
 * @param {Object} options - Rendering options/actions
 * @returns {string}
 */
export function renderJobCard(job, { onView, onApply }) {
  const badgeClass = statusToBadgeClass(job.status);
  
  // Using a template literal but we could use DOM nodes for better event binding if needed.
  // For simplicity and speed in this Vanilla JS context, we return a string and wire events later.
  return `
    <div class="card job" data-job-id="${job.id}">
      <div class="job-left">
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <div>
            <h3 style="margin:0;">${job.title}</h3>
            <p style="margin:6px 0 0;">${job.employer}</p>
          </div>
          <span class="badge ${badgeClass}">${job.status}</span>
        </div>

        <div class="job-meta">
          <span class="kv">📍 ${job.location}</span>
          <span class="kv">💰 RM ${job.pay}</span>
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
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const card = btn.closest(".card.job");
    const jobId = Number(card.dataset.jobId);

    if (action === "view" && onView) onView(jobId);
    if (action === "apply" && onApply) onApply(jobId);
  });
}
