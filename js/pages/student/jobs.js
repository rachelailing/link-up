import { $, $$ } from "../../utils/dom.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";

const JOBS = [
  {
    id: 1,
    title: "Booth Helper (Weekend Event)",
    employer: "Student Biz Society",
    category: "event",
    pay: 80,
    location: "UTP Main Hall",
    status: "Open"
  },
  {
    id: 2,
    title: "Poster Design for Club",
    employer: "Robotics Club",
    category: "creative",
    pay: 120,
    location: "Remote",
    status: "Open"
  },
  {
    id: 3,
    title: "Math Tutor (Foundation)",
    employer: "Academic Support Unit",
    category: "academic",
    pay: 150,
    location: "UTP Block C",
    status: "Open"
  },
  {
    id: 4,
    title: "Website Fix (HTML/CSS)",
    employer: "Campus Startup",
    category: "tech",
    pay: 200,
    location: "Remote",
    status: "Open"
  }
];

function renderJobs(list){
  const listEl = $("#jobsList");

  listEl.innerHTML = list.map(job => {
    const badgeClass = statusToBadgeClass(job.status);

    return `
      <div class="card job">
        <div class="job-left">
          <div style="display:flex; justify-content:space-between;">
            <div>
              <h3>${job.title}</h3>
              <p>${job.employer}</p>
            </div>
            <span class="badge ${badgeClass}">${job.status}</span>
          </div>

          <div class="job-meta">
            <span class="kv">📍 ${job.location}</span>
            <span class="kv">💰 RM ${job.pay}</span>
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

  let filtered = JOBS.filter(job =>
    job.title.toLowerCase().includes(search) ||
    job.employer.toLowerCase().includes(search)
  );

  if (category !== "all") {
    filtered = filtered.filter(job => job.category === category);
  }

  if (pay !== "all") {
    filtered = filtered.filter(job => job.pay >= Number(pay));
  }

  renderJobs(filtered);
}

async function init(){
  const user = await authService.requireAuth("student");
  if (!user) return;

  setActiveNav();
  wireLogout();
  renderJobs(JOBS);

  $("#searchInput").addEventListener("input", filterJobs);
  $("#categoryFilter").addEventListener("change", filterJobs);
  $("#payFilter").addEventListener("change", filterJobs);
}

document.addEventListener("DOMContentLoaded", init);
