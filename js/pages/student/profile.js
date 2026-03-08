import { storage } from "../../utils/storage.js";
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

const STORAGE_KEY = "linkup_student_profile";

function loadProfile() {
  const profile = storage.get(STORAGE_KEY);
  if (!profile) return;

  // Header display
  $("#displayName").textContent = profile.fullName || "Student Name";
  $("#displayEmail").textContent = profile.email || "student@email.com";
  
  // Basic Info
  $("#fullName").value = profile.fullName || "";
  $("#campus").value = profile.campus || "";
  $("#email").value = profile.email || "";
  $("#phone").value = profile.phone || "";

  // Professional Profile
  $("#bio").value = profile.bio || "";
  $("#portfolio").value = profile.portfolio || "";
  $("#availability").value = profile.availability || "flexible";

  // Stats (Mock for now)
  const jobs = storage.get("linkup_student_jobs") || [];
  const completedCount = jobs.filter(j => j.status === "Completed").length;
  $("#statsCompleted").textContent = completedCount;

  // Skills & Interests
  renderTags(profile.skills || [], $("#skillsList"));
  renderTags(profile.interests || [], $("#interestsList"));
}

function renderTags(tags, container) {
  if (!tags.length) {
    container.innerHTML = '<span class="muted small">None selected</span>';
    return;
  }
  container.innerHTML = tags.map(tag => `
    <span class="chip-item">${capitalize(tag)}</span>
  `).join("");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function saveProfile() {
  const currentProfile = storage.get(STORAGE_KEY) || {};
  
  const updatedProfile = {
    ...currentProfile,
    fullName: $("#fullName").value.trim(),
    campus: $("#campus").value.trim(),
    phone: $("#phone").value.trim(),
    bio: $("#bio").value.trim(),
    portfolio: $("#portfolio").value.trim(),
    availability: $("#availability").value,
    updatedAt: new Date().toISOString()
  };

  storage.set(STORAGE_KEY, updatedProfile);
  
  // Also update session/current user
  const currentUser = storage.get("linkup_currentUser");
  if (currentUser) {
    storage.set("linkup_currentUser", {
      ...currentUser,
      ...updatedProfile
    });
  }

  // Update header display
  $("#displayName").textContent = updatedProfile.fullName;

  alert("Profile updated successfully! ✅");
}

function init() {
  setActiveNav();
  loadProfile();

  $("#saveProfileBtn").addEventListener("click", (e) => {
    e.preventDefault();
    saveProfile();
  });
}

document.addEventListener("DOMContentLoaded", init);