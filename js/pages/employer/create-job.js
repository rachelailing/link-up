import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { jobsService } from "../../services/jobs.service.js";
import { authService } from "../../services/auth.service.js";

async function getFormData(){
  const user = await authService.getCurrentUser();

  return {
    employer_id: user.id,
    title: $("#jobTitle").value.trim(),
    category: $("#jobCategory").value,
    location: $("#jobLocation").value.trim(),
    description: $("#jobDescription").value.trim(),
    salary: Number($("#jobSalary").value),
    deposit: Number($("#jobDeposit").value),
    deadline: $("#jobDeadline").value,
    status: "Open", // Default status for Supabase
    tags: [] // Can be expanded later
  };
}

function setStatusBadge(status){
  const badge = $("#jobStatusBadge");
  if (!badge) return;
  badge.textContent = status;
  badge.className = "badge " + (status === "Open" ? "accepted" : "pending");
}

async function init(){
  setActiveNav();

  // Guard: Ensure user is logged in as employer
  const user = await authService.requireAuth("employer");
  if (!user) return;

  const form = $("#createJobForm");

  // Save as Draft (Still Open in our simplified Supabase schema for now)
  $("#saveDraftBtn").addEventListener("click", async () => {
    try {
      const jobData = await getFormData();
      jobData.status = "Draft";
      await jobsService.createJob(jobData);
      setStatusBadge("Draft");
      alert("Job saved as Draft in Supabase.");
    } catch (err) {
      alert("Error saving draft: " + err.message);
    }
  });

  // Publish
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing...";

    try {
      const jobData = await getFormData();
      jobData.status = "Open";

      if (!jobData.title || !jobData.category || !jobData.salary){
        alert("Please complete required fields.");
        return;
      }

      await jobsService.createJob(jobData);
      setStatusBadge("Open");

      alert("Job published successfully to Supabase!");
      window.location.href = "./job-manage.html";
    } catch (err) {
      alert("Error publishing job: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish Job";
    }
  });
}

document.addEventListener("DOMContentLoaded", init);