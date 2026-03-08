// js/pages/auth/student-register.js
import { $, $$ } from "../../utils/dom.js";
import { authService } from "../../services/auth.service.js";

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

async function registerStudent(){
  const userData = {
    email: $("#studentEmail").value.trim(),
    password: $("#password").value,
    fullName: $("#fullName").value.trim(),
    university: $("#university").value,
    phone: $("#phone").value.trim(),
  };

  try {
    await authService.register(userData, "student");
    // Next step: tell user to verify email
    window.location.href = "./verify-email.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

function init(){
  const form = $("#studentRegisterForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";

    await registerStudent();

    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  });
}

document.addEventListener("DOMContentLoaded", init);
