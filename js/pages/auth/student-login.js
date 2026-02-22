import { $, $$ } from "../../utils/dom.js";

function setError(id, message){
  const el = document.querySelector(`[data-error-for="${id}"]`);
  if (el) el.textContent = message || "";
}

function clearErrors(){
  $$("[data-error-for]").forEach(e => e.textContent = "");
  $("#loginError").classList.remove("show");
  $("#loginError").textContent = "";
}

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showBanner(msg){
  const b = $("#loginError");
  b.textContent = msg;
  b.classList.add("show");
}

function getStoredStudent(){
  // from register.js
  const raw = localStorage.getItem("linkup_student_profile");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function init(){
  // optional: prefill remembered email
  const remembered = localStorage.getItem("linkup_remember_email");
  if (remembered) $("#studentEmail").value = remembered;

  $("#studentLoginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    const email = $("#studentEmail").value.trim();
    const pass = $("#password").value;

    let ok = true;
    if (!validateEmail(email)) { setError("studentEmail", "Please enter a valid email."); ok = false; }
    if (!pass || pass.length < 8) { setError("password", "Please enter your password (min 8 chars)."); ok = false; }
    if (!ok) return;

    const student = getStoredStudent();

    // MVP: check if registered email matches (no real password storage yet)
    if (!student || student.email.toLowerCase() !== email.toLowerCase()){
      showBanner("No account found for this email. Please register first.");
      return;
    }

    // Remember email if checked
    if ($("#rememberMe").checked) {
      localStorage.setItem("linkup_remember_email", email);
    } else {
      localStorage.removeItem("linkup_remember_email");
    }

    // Set current user session (MVP)
    localStorage.setItem("linkup_currentUser", JSON.stringify({
      ...student,
      role: "student",
      loggedInAt: new Date().toISOString()
    }));

    // Redirect based on onboarding
    const onboardingDone = !!student.onboardingDone;
    window.location.href = onboardingDone
      ? "../student/dashboard.html"
      : "./onboarding.html";
  });
}

document.addEventListener("DOMContentLoaded", init);