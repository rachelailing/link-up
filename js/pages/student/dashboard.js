import { setActiveNav } from "../../components/navbar.js";
import { statusToBadgeClass } from "../../components/status-badge.js";
import { openModal, wireModalClose } from "../../components/modal.js";
import { $ } from "../../utils/dom.js";

const jobs = [
  { title:"Freelance Video Editor", employer:"Campus Media Club", location:"UTP, Block A", pay:150, status:"Open" },
  { title:"Booth Helper (Weekend)", employer:"Student Biz Society", location:"UTP, Main Hall", pay:80, status:"Open" },
  { title:"Poster Design", employer:"Event Committee", location:"Remote", pay:60, status:"Pending" },
];

function renderJobs(){
  const listEl = $("#recommendedJobs");
  listEl.innerHTML = jobs.map((job, idx) => {
    const badgeClass = statusToBadgeClass(job.status);
    return `
      <div class="card job">
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
          <button class="btn btn-outline" data-view="${idx}">View</button>
          <button class="btn btn-primary" data-apply="${idx}">Apply</button>
        </div>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll("[data-apply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const job = jobs[Number(btn.dataset.apply)];
      $("#applyJobTitle").textContent = job.title;
      openModal("applyModal");
    });
  });

  listEl.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const job = jobs[Number(btn.dataset.view)];
      alert(`Job Details:\n${job.title}\n${job.employer}\n${job.location}\nRM ${job.pay}`);
    });
  });
}

function init(){
  setActiveNav();
  wireModalClose();
  renderJobs();

  // sample stats
  $("#statActive").textContent = "1";
  $("#statPending").textContent = "2";
  $("#statEarnings").textContent = "RM 320";
  $("#statDeposit").textContent = "Held: RM 50";
}

document.addEventListener("DOMContentLoaded", init);