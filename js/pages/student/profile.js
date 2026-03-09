// js/pages/student/profile.js
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";

/**
 * Student Profile Controller
 */
class StudentProfile {
  constructor() {
    this.form = $("#studentProfileForm");
    this.saveBtn = $("#saveProfileBtn");
    this.currentUser = null;
  }

  async init() {
    setActiveNav();
    
    // Load user from Supabase
    this.currentUser = await authService.getCurrentUser();
    
    if (!this.currentUser) {
      window.location.href = "../auth/student-login.html";
      return;
    }

    this.fillForm();
    this.wireEvents();
  }

  fillForm() {
    const meta = this.currentUser.user_metadata || {};

    // Header Display
    $("#displayName").textContent = meta.fullName || "Student Name";
    $("#displayEmail").textContent = this.currentUser.email || "student@email.com";

    // Personal Info
    $("#fullName").value = meta.fullName || "";
    $("#campus").value = meta.campus || meta.university || ""; // Handle university from registration too
    $("#email").value = this.currentUser.email || "";
    $("#phone").value = meta.phone || "";

    // Professional Profile
    $("#bio").value = meta.bio || "";
    $("#portfolio").value = meta.portfolio || "";
    $("#availability").value = meta.availability || "flexible";

    // Stats (Mock for now, eventually from a jobs table)
    $("#statsCompleted").textContent = meta.completedJobsCount || "0";

    // Skills & Interests
    this.renderTags(meta.skills || [], $("#skillsList"));
    this.renderTags(meta.interests || [], $("#interestsList"));
  }

  renderTags(tags, container) {
    if (!container) return;
    if (!tags || tags.length === 0) {
      container.innerHTML = '<span class="muted small">None selected</span>';
      return;
    }
    container.innerHTML = tags.map(tag => `
      <span class="chip-item">${this.capitalize(tag)}</span>
    `).join("");
  }

  capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async saveProfile() {
    this.saveBtn.disabled = true;
    this.saveBtn.textContent = "Saving...";

    const updatedMetadata = {
      fullName: $("#fullName").value.trim(),
      campus: $("#campus").value.trim(),
      phone: $("#phone").value.trim(),
      bio: $("#bio").value.trim(),
      portfolio: $("#portfolio").value.trim(),
      availability: $("#availability").value,
      updatedAt: new Date().toISOString()
    };

    try {
      await authService.updateUserMetadata(updatedMetadata);
      
      // Update header display
      $("#displayName").textContent = updatedMetadata.fullName;
      
      alert("Profile updated successfully! ✅");
    } catch (err) {
      alert("Error updating profile: " + err.message);
    } finally {
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = "Save Changes";
    }
  }

  wireEvents() {
    this.saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.saveProfile();
    });
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const page = new StudentProfile();
  page.init();
});
