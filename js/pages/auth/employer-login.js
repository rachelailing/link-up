// js/pages/auth/employer-login.js
import { isEmail, minLength } from "../../utils/validators.js";

const STORAGE = {
  // where we saved employer registration mock
  EMPLOYER_REGISTER: "linkup_employer_register",
  // logged in session
  SESSION: "linkup_session",
  REMEMBER_EMAIL: "linkup_employer_remember_email",
};

export function initEmployerLogin() {
  const form = document.getElementById("employerLoginForm");
  if (!form) return;

  const banner = document.getElementById("errorBanner");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const remember = document.getElementById("remember");

  // --- Password toggle (Show/Hide) ---
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selector = btn.getAttribute("data-toggle-password");
      const input = document.querySelector(selector);
      if (!input) return;

      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      btn.textContent = hidden ? "Hide" : "Show";
    });
  });

  // --- Remember email (optional) ---
  const savedEmail = localStorage.getItem(STORAGE.REMEMBER_EMAIL);
  if (savedEmail) {
    email.value = savedEmail;
    remember.checked = true;
  }

  // Helpers
  function showBanner(msg) {
    if (!banner) return;
    banner.textContent = msg;
    banner.classList.add("show");
  }

  function hideBanner() {
    if (!banner) return;
    banner.textContent = "";
    banner.classList.remove("show");
  }

  function setFieldError(name, msg) {
    const field = form.querySelector(`#${name}`)?.closest(".field");
    const err = form.querySelector(`[data-error-for="${name}"]`);
    if (field) field.classList.add("is-invalid");
    if (err) err.textContent = msg || "";
  }

  function clearFieldError(name) {
    const field = form.querySelector(`#${name}`)?.closest(".field");
    const err = form.querySelector(`[data-error-for="${name}"]`);
    if (field) field.classList.remove("is-invalid");
    if (err) err.textContent = "";
  }

  // Live validation cleanup
  email.addEventListener("input", () => { hideBanner(); clearFieldError("email"); });
  password.addEventListener("input", () => { hideBanner(); clearFieldError("password"); });

  function validate() {
    hideBanner();
    let ok = true;

    if (!email.value.trim()) {
      setFieldError("email", "Email is required.");
      ok = false;
    } else if (!isEmail(email.value)) {
      setFieldError("email", "Please enter a valid email.");
      ok = false;
    }

    if (!password.value) {
      setFieldError("password", "Password is required.");
      ok = false;
    } else if (!minLength(password.value, 8)) {
      // you can remove this if you don't want length check on login
      setFieldError("password", "Password must be at least 8 characters.");
      ok = false;
    }

    if (!ok) showBanner("Please fix the highlighted fields and try again.");
    return ok;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    // --- Mock authentication ---
    // For now, compare with the stored registration record.
    const regRaw = localStorage.getItem(STORAGE.EMPLOYER_REGISTER);
    if (!regRaw) {
      showBanner("No employer account found. Please register first.");
      return;
    }

    const reg = JSON.parse(regRaw);

    // NOTE: In a real app, password is never stored in localStorage.
    // For now, we just simulate:
    const storedEmail = (reg.businessEmail || "").toLowerCase();
    const inputEmail = email.value.trim().toLowerCase();

    // If you didn't store password at register, we can accept any password for demo.
    // If you DID store it later, you can enable password check:
    const storedPassword = reg.password; // may be undefined
    const passwordMatches = storedPassword ? (password.value === storedPassword) : true;

    if (inputEmail !== storedEmail || !passwordMatches) {
      showBanner("Invalid email or password.");
      setFieldError("email", "");
      setFieldError("password", "");
      return;
    }

    // Remember email if checked
    if (remember.checked) {
      localStorage.setItem(STORAGE.REMEMBER_EMAIL, email.value.trim());
    } else {
      localStorage.removeItem(STORAGE.REMEMBER_EMAIL);
    }

    // Create a session object
    const session = {
      role: "employer",
      businessName: reg.businessName || "",
      businessEmail: reg.businessEmail || "",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));

    // Redirect to employer dashboard
    window.location.href = "../employer/dashboard.html";
  });
}