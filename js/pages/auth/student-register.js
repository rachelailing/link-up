import { $, $$ } from "../../utils/dom.js";

function setError(id, message){
  const el = document.querySelector(`[data-error-for="${id}"]`);
  if (el) el.textContent = message || "";
}

function clearErrors(){
  $$("[data-error-for]").forEach(e => e.textContent = "");
}

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(){
  clearErrors();

  const fullName = $("#fullName").value.trim();
  const email = $("#studentEmail").value.trim();
  const uni = $("#university").value;
  const phone = $("#phone").value.trim();
  const pass = $("#password").value;
  const confirm = $("#confirmPassword").value;
  const agree = $("#agree").checked;

  let ok = true;

  if (fullName.length < 2) { setError("fullName", "Please enter your name."); ok = false; }
  if (!validateEmail(email)) { setError("studentEmail", "Please enter a valid email."); ok = false; }
  if (!uni) { setError("university", "Please select your university."); ok = false; }
  if (phone.length < 8) { setError("phone", "Please enter a valid phone number."); ok = false; }
  if (pass.length < 8) { setError("password", "Password must be at least 8 characters."); ok = false; }
  if (confirm !== pass) { setError("confirmPassword", "Passwords do not match."); ok = false; }
  if (!agree) { setError("agree", "You must agree before continuing."); ok = false; }

  return ok;
}

function saveStudent(){
  const student = {
    role: "student",
    fullName: $("#fullName").value.trim(),
    email: $("#studentEmail").value.trim(),
    university: $("#university").value,
    phone: $("#phone").value.trim(),
    createdAt: new Date().toISOString(),
  };

  // MVP storage (temporary)
  localStorage.setItem("linkup_currentUser", JSON.stringify(student));
  localStorage.setItem("linkup_student_profile", JSON.stringify(student));
}

function init(){
  const form = $("#studentRegisterForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    saveStudent();

    // Next step in your flow: onboarding
    window.location.href = "./onboarding.html";
  });
}

document.addEventListener("DOMContentLoaded", init);