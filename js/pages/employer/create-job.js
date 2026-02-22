import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

function getFormData(){
  return {
    id: Date.now(),
    title: $("#jobTitle").value.trim(),
    category: $("#jobCategory").value,
    location: $("#jobLocation").value.trim(),
    description: $("#jobDescription").value.trim(),
    salary: Number($("#jobSalary").value),
    deposit: Number($("#jobDeposit").value),
    deadline: $("#jobDeadline").value,
    slots: Number($("#jobSlots").value),
    status: "Draft",
    createdAt: new Date().toISOString()
  };
}

function saveJob(job){
  const existing = JSON.parse(localStorage.getItem("linkup_employer_jobs") || "[]");
  existing.push(job);
  localStorage.setItem("linkup_employer_jobs", JSON.stringify(existing));
}

function setStatusBadge(status){
  const badge = $("#jobStatusBadge");
  badge.textContent = status;
  badge.className = "badge " + (status === "Open" ? "accepted" : "pending");
}

function init(){
  setActiveNav();

  const form = $("#createJobForm");

  // Save as Draft
  $("#saveDraftBtn").addEventListener("click", () => {
    const job = getFormData();
    job.status = "Draft";

    saveJob(job);
    setStatusBadge("Draft");

    alert("Job saved as Draft.");
  });

  // Publish
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const job = getFormData();
    job.status = "Open";

    if (!job.title || !job.category || !job.salary || !job.deposit){
      alert("Please complete required fields.");
      return;
    }

    saveJob(job);
    setStatusBadge("Open");

    alert("Job published successfully!");

    // redirect to job-manage page later
    window.location.href = "./job-manage.html";
  });
}

document.addEventListener("DOMContentLoaded", init);