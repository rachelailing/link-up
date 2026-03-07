import { storage } from "../../utils/storage.js";
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

const STORAGE_KEYS = {
  EMPLOYER_PROFILE: "linkup_employer_register",
  SESSION: "linkup_session"
};

function loadProfile() {
  const profile = storage.get(STORAGE_KEYS.EMPLOYER_PROFILE);
  const session = storage.get(STORAGE_KEYS.SESSION);

  if (!profile) return;

  // Fill form
  $("#businessName").value = profile.businessName || "";
  $("#businessType").value = profile.businessType || "SME";
  $("#businessEmail").value = profile.businessEmail || "";
  $("#businessPhone").value = profile.businessPhone || "";
  $("#businessAddress").value = profile.businessAddress || "";
  $("#picName").value = profile.picName || "";
  $("#picRole").value = profile.picRole || "";
}

function saveProfile() {
  const profile = storage.get(STORAGE_KEYS.EMPLOYER_PROFILE) || {};
  
  const updatedProfile = {
    ...profile,
    businessName: $("#businessName").value,
    businessType: $("#businessType").value,
    businessPhone: $("#businessPhone").value,
    businessAddress: $("#businessAddress").value,
    picName: $("#picName").value,
    picRole: $("#picRole").value,
    updatedAt: new Date().toISOString()
  };

  storage.set(STORAGE_KEYS.EMPLOYER_PROFILE, updatedProfile);

  // Also update session if relevant
  const session = storage.get(STORAGE_KEYS.SESSION);
  if (session) {
    storage.set(STORAGE_KEYS.SESSION, {
      ...session,
      businessName: updatedProfile.businessName
    });
  }

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