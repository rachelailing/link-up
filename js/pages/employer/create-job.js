import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { jobsService } from "../../services/jobs.service.js";
import { authService } from "../../services/auth.service.js";

async function getFormData(){
  const user = await authService.getCurrentUser();
  const employerName = user?.user_metadata?.fullName || user?.user_metadata?.businessName || "Employer";

  const selectedTags = [];
  $$("#tagsSelection input[type='checkbox']:checked").forEach(cb => {
    if (cb.value !== "others") {
      selectedTags.push(cb.value);
    }
  });

  // Add manual tags if 'Others' is checked
  const othersCheckbox = $("#tagOthersCheckbox");
  if (othersCheckbox.checked) {
    const manualTagsRaw = $("#jobTagsOthers").value.trim();
    if (manualTagsRaw) {
      const manualTags = manualTagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(t => t !== "");
      selectedTags.push(...manualTags);
    }
  }

  return {
    employer_id: user.id,
    employer_name: employerName,
    title: $("#jobTitle").value.trim(),
    category: $("#jobCategory").value,
    location: $("#jobLocation").value.trim(),
    description: $("#jobDescription").value.trim(),
    tags: [...new Set(selectedTags)], // Unique tags
    salary: Number($("#jobSalary").value),
    deposit: Number($("#jobDeposit").value),
    deadline: $("#jobDeadline").value,
    slots: Number($("#jobSlots").value),
    status: "Draft", // Default to Draft
  };
}

function setStatusBadge(status){
  const badge = $("#jobStatusBadge");
  badge.textContent = status;
  badge.className = "badge " + (status === "Open" ? "accepted" : "pending");
}

async function handleJobSubmission(status) {
  try {
    const jobData = await getFormData();
    jobData.status = status;

    if (status === "Open") {
      if (!jobData.title || !jobData.category || !jobData.salary || !jobData.deposit){
        alert("Please complete required fields.");
        return;
      }
    }

    console.log(`[CreateJob] Submitting job with status: ${status}`, jobData);
    
    await jobsService.createJob(jobData);
    
    setStatusBadge(status);
    alert(status === "Open" ? "Job published successfully!" : "Job saved as Draft.");

    if (status === "Open") {
      window.location.href = "./job-manage.html";
    }
  } catch (error) {
    console.error("[CreateJob] Error submitting job:", error);
    alert("Failed to save job. Please try again.");
  }
}

async function init(){
  const user = await authService.requireAuth("employer");
  if (!user) return;

  setActiveNav();

  const form = $("#createJobForm");
  const othersCheckbox = $("#tagOthersCheckbox");
  const othersContainer = $("#othersTagsContainer");

  // Toggle 'Others' input field
  othersCheckbox.addEventListener("change", () => {
    othersContainer.style.display = othersCheckbox.checked ? "block" : "none";
  });

  // Save as Draft
  $("#saveDraftBtn").addEventListener("click", async () => {
    await handleJobSubmission("Draft");
  });

  // Publish
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleJobSubmission("Open");
  });
}

document.addEventListener("DOMContentLoaded", init);
