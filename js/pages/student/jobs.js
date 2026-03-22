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
    status: "Current",
    deadline: "2026-03-25",
    timeLeft: "3d left",
    description: "Assist in setting up the booth and managing student registrations for the entrepreneurship weekend."
  },
  {
    id: 2,
    title: "Poster Design for Club",
    employer: "Robotics Club",
    category: "creative",
    pay: 120,
    location: "Remote",
    status: "Current",
    deadline: "2026-03-28",
    timeLeft: "6d left",
    description: "Create eye-catching posters and social media graphics for the upcoming UTP Robotics Competition."
  },
  {
    id: 3,
    title: "Math Tutor (Foundation)",
    employer: "Academic Support Unit",
    category: "academic",
    pay: 150,
    location: "UTP Block C",
    status: "Done",
    deadline: "2026-03-15",
    timeLeft: "Completed",
    description: "Provide weekly tutoring sessions for Foundation students struggling with Calculus and Algebra."
  },
  {
    id: 4,
    title: "Website Fix (HTML/CSS)",
    employer: "Campus Startup",
    category: "tech",
    pay: 200,
    location: "Remote",
    status: "Cancelled",
    deadline: "2026-03-20",
    timeLeft: "Cancelled",
    description: "Debug layout issues and optimize the mobile responsiveness of the club's new landing page."
  }
];

function renderJobs(list){
  const listEl = $("#jobsList");
  
  // Clear any previously rendered dynamic items, but keep the hardcoded one if we want.
  // Actually, to fix the spacing issue properly, we should probably just render everything from data
  // or ensure the hardcoded one is part of the list.
  
  // Let's clear and re-render everything including a "Senior Graphic Designer" as data if needed,
  // OR just append to the existing list.
  
  // If we want to keep the hardcoded one in HTML, we should only clear dynamic ones.
  // A better way:
  const dynamicItems = list.map(job => {
    let badgeClass = "inprogress";
    if (job.status === "Done") badgeClass = "completed";
    if (job.status === "Cancelled") badgeClass = "cancelled";
    if (job.status === "Applied") badgeClass = "pending";

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
                <span class="value">💰 RM ${job.pay}</span>
              </div>
              <div class="active-col">
                <span class="label">Deadline</span>
                <span class="value">📅 ${job.deadline}</span>
              </div>
              <div class="active-col">
                <span class="label">Time Left</span>
                <span class="countdown">⏳ ${job.timeLeft}</span>
              </div>
            </div>
          </div>

          <p class="active-desc">
            ${job.description}
          </p>
        </div>

        <div class="active-actions">
          <button class="btn btn-outline" data-view="${job.id}">View Details</button>
          <button class="btn btn-primary" data-apply="${job.id}">Mark Submitted</button>
          <button class="btn btn-outline">Report Issue</button>
        </div>
      </div>
    `;
  }).join("");

  // To keep the hardcoded one, we can do:
  const hardcoded = listEl.querySelector(".active-row:not([data-view])");
  listEl.innerHTML = "";
  if (hardcoded) listEl.appendChild(hardcoded);
  listEl.insertAdjacentHTML('beforeend', dynamicItems);

  // View button
  $$("[data-view]").forEach(btn => {
    btn.removeEventListener("click", handleView); // Prevent double listeners if init called multiple times
    btn.addEventListener("click", handleView);
  });

  // Apply button
  $$("[data-apply]").forEach(btn => {
    btn.removeEventListener("click", handleApply);
    btn.addEventListener("click", handleApply);
  });
}

function handleView(e) {
  const id = e.currentTarget.dataset.view;
  window.location.href = `job-details.html?id=${id}`;
}

function handleApply(e) {
  const id = e.currentTarget.dataset.apply;
  alert("Submission marked! (Demo only)");
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
