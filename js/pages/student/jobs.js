import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";
import { jobsService } from "../../services/jobs.service.js";

async function renderJobs(list){
  const listEl = $("#jobsList");
  
  if (list.length === 0) {
    listEl.innerHTML = `<p class="muted">No jobs found matching your criteria.</p>`;
    return;
  }

  listEl.innerHTML = list.map(job => {
    let badgeClass = "inprogress";
    if (job.status === "Done") badgeClass = "completed";
    if (job.status === "Cancelled") badgeClass = "cancelled";
    if (job.status === "Applied") badgeClass = "pending";
    if (job.status === "Open") badgeClass = "accepted";

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
                <span class="value">📅 ${job.deadline}</span>
              </div>
              <div class="active-col">
                <span class="label">Slots</span>
                <span class="value">👥 ${job.slots || 1} available</span>
              </div>
            </div>
          </div>

          <p class="active-desc">
            ${job.description}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" data-view="${job.id}">View Details</button>
          <button class="btn btn-primary" data-apply="${job.id}">Apply Now</button>
        </div>
      </div>
    `;
  }).join("");

  // View button
  $$("[data-view]").forEach(btn => {
    btn.addEventListener("click", handleView);
  });

  // Apply button
  $$("[data-apply]").forEach(btn => {
    btn.addEventListener("click", handleApply);
  });
}

function handleView(e) {
  const id = e.currentTarget.dataset.view;
  window.location.href = `job-details.html?id=${id}`;
}

function handleApply(e) {
  const id = e.currentTarget.dataset.apply;
  window.location.href = `apply-job.html?id=${id}`;
}

async function filterJobs(){
  const search = $("#searchInput").value.toLowerCase();
  const status = $("#statusFilter").value;

  const allJobs = await jobsService.getJobs();
  
  let filtered = allJobs.filter(job =>
    job.title.toLowerCase().includes(search) ||
    job.employer_name?.toLowerCase().includes(search)
  );

  if (status !== "all") {
    // Note: status mapping depends on your business logic
    filtered = filtered.filter(job => job.status.toLowerCase() === status.toLowerCase());
  }

  renderJobs(filtered);
}

async function init(){
  const user = await authService.requireAuth("student");
  if (!user) return;

  setActiveNav();
  wireLogout();
  
  const allJobs = await jobsService.getJobs();
  renderJobs(allJobs);

  $("#searchInput").addEventListener("input", filterJobs);
  $("#statusFilter")?.addEventListener("change", filterJobs);
  $("#dateFilter")?.addEventListener("change", filterJobs);
}

document.addEventListener("DOMContentLoaded", init);
