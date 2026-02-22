import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

function getJobs(){
  return JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
}
function saveJobs(jobs){
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(jobs));
}

function getCurrentUser(){
  const raw = localStorage.getItem("linkup_currentUser");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function setError(id, msg){
  const el = document.querySelector(`[data-error-for="${id}"]`);
  if (el) el.textContent = msg || "";
}

function clearErrors(){
  $$("[data-error-for]").forEach(e => e.textContent = "");
}

function init(){
  setActiveNav();

  const params = new URLSearchParams(window.location.search);
  const jobId = Number(params.get("id"));

  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);

  if (!job){
    document.querySelector(".container").innerHTML = `
      <div class="card pad">
        <p>Job not found.</p>
        <a class="btn btn-outline" href="./jobs.html">Back to Jobs</a>
      </div>
    `;
    return;
  }

  // Fill job preview
  $("#jobTitle").textContent = job.title;
  $("#jobEmployer").textContent = job.employer || "Employer";
  $("#jobLocation").textContent = `📍 ${job.location}`;
  $("#jobSalary").textContent = `💰 RM ${job.salary}`;
  $("#jobDeposit").textContent = `💳 Fee RM ${job.deposit}`;
  $("#jobDeadline").textContent = `📅 ${job.deadline || "-"}`;
  $("#jobDescription").textContent = job.description || "";

  const user = getCurrentUser();
  const studentName = user?.fullName || "Student";

  $("#applyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    const message = $("#message").value.trim();
    const cvLink = $("#cvLink").value.trim();
    const availability = $("#availability").value;

    let ok = true;
    if (message.length < 10){
      setError("message", "Please write at least 10 characters.");
      ok = false;
    }
    if (!availability){
      setError("availability", "Please select availability.");
      ok = false;
    }
    if (!ok) return;

    // Ensure applications array exists
    job.applications = job.applications || [];

    // Prevent duplicate application (same student)
    const already = job.applications.some(a =>
      (a.studentName || "").toLowerCase() === studentName.toLowerCase()
    );
    if (already){
      alert("You already applied for this job.");
      window.location.href = "./applications.html";
      return;
    }

    // Add application
    job.applications.push({
      id: Date.now(),
      studentName,
      rating: 4.5,              // MVP placeholder
      status: "Pending",
      message,
      cvLink,
      availability,
      appliedAt: new Date().toISOString()
    });

    saveJobs(jobs);

    alert("Application submitted ✅ Status: Pending");
    window.location.href = "./applications.html";
  });
}

document.addEventListener("DOMContentLoaded", init);