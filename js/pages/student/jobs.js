import { $, $$ } from "../../utils/dom.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";
import { jobsService } from "../../services/jobs.service.js";

let allJobs = [];

function renderJobs(list){
  const listEl = $("#jobsList");

  if (!list || list.length === 0) {
    listEl.innerHTML = `<p class="muted">No jobs found matching your criteria.</p>`;
    return;
  }

  listEl.innerHTML = list.map(job => {
    const badgeClass = statusToBadgeClass(job.status);

    return `
      <div class="card job">
        <div class="job-left">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0;">${job.title}</h3>
              <p class="muted" style="margin:4px 0 0;">${job.employer_name || "Employer"}</p>
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
  }).join("");

  // View button
  $$("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.view;
      window.location.href = `job-details.html?id=${id}`;
    });
  });

  // Apply button
  $$("[data-apply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.apply;
      window.location.href = `apply-job.html?id=${id}`;
    });
  });
}

function filterJobs(){
  const search = $("#searchInput").value.toLowerCase();
  const category = $("#categoryFilter").value;
  const pay = $("#payFilter").value;

  let filtered = allJobs.filter(job =>
    job.title.toLowerCase().includes(search) ||
    (job.employer_name && job.employer_name.toLowerCase().includes(search))
  );

  if (category !== "all") {
    filtered = filtered.filter(job => job.category === category);
  }

  if (pay !== "all") {
    filtered = filtered.filter(job => Number(job.salary) >= Number(pay));
  }

  renderJobs(filtered);
}

async function init(){
  const user = await authService.requireAuth("student");
  if (!user) return;

  setActiveNav();
  wireLogout();

  // Load jobs from Supabase
  allJobs = await jobsService.getJobs();
  renderJobs(allJobs);

  $("#searchInput").addEventListener("input", filterJobs);
  $("#categoryFilter").addEventListener("change", filterJobs);
  $("#payFilter").addEventListener("change", filterJobs);
}

document.addEventListener("DOMContentLoaded", init);
