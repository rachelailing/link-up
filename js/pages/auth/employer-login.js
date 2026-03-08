// js/pages/auth/employer-login.js
import { isEmail, minLength } from "../../utils/validators.js";
import { authService } from "../../services/auth.service.js";

export function initEmployerLogin() {
  const form = document.getElementById("employerLoginForm");
  if (!form) return;

  const banner = document.getElementById("errorBanner");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
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

  // --- Remember email ---
  const savedEmail = authService.getRememberedEmail();
  if (savedEmail) {
    emailInput.value = savedEmail;
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
  emailInput.addEventListener("input", () => { hideBanner(); clearFieldError("email"); });
  passwordInput.addEventListener("input", () => { hideBanner(); clearFieldError("password"); });

  function validate() {
    hideBanner();
    let ok = true;

    if (!emailInput.value.trim()) {
      setFieldError("email", "Email is required.");
      ok = false;
    } else if (!isEmail(emailInput.value)) {
      setFieldError("email", "Please enter a valid email.");
      ok = false;
    }

    if (!passwordInput.value) {
      setFieldError("password", "Password is required.");
      ok = false;
    } else if (!minLength(passwordInput.value, 8)) {
      setFieldError("password", "Password must be at least 8 characters.");
      ok = false;
    }

    if (!ok) showBanner("Please fix the highlighted fields and try again.");
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      const user = await authService.login(email, password);

      // Verify role
      if (user.user_metadata?.role !== "employer") {
        await authService.logout();
        throw new Error("This account is not registered as an employer.");
      }

      // Remember email if checked
      authService.setRememberMe(email, remember.checked);

      // Redirect to employer homepage
      window.location.href = "../employer/employer_homepage.html";

    } catch (err) {
      showBanner(err.message || "Invalid email or password.");
      setFieldError("email", "");
      setFieldError("password", "");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  });
}
