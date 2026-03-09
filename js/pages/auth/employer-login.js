// js/pages/auth/employer-login.js
import { isEmail, minLength } from "../../utils/validators.js";
import { authService } from "../../services/auth.service.js";

/**
 * Employer Login Controller
 */
class EmployerLogin {
  constructor() {
    this.form = document.getElementById("employerLoginForm");
    if (!this.form) return;

    this.banner = document.getElementById("errorBanner");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.remember = document.getElementById("remember");
  }

  init() {
    if (!this.form) return;

    this.prefillEmail();
    this.wirePasswordToggles();
    this.wireLiveCleanup();
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  prefillEmail() {
    const savedEmail = authService.getRememberedEmail();
    if (savedEmail) {
      this.emailInput.value = savedEmail;
      this.remember.checked = true;
    }
  }

  wirePasswordToggles() {
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
  }

  wireLiveCleanup() {
    this.emailInput.addEventListener("input", () => { this.hideBanner(); this.clearFieldError("email"); });
    this.passwordInput.addEventListener("input", () => { this.hideBanner(); this.clearFieldError("password"); });
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validate()) return;

    const submitBtn = this.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const email = this.emailInput.value.trim();
      const password = this.passwordInput.value;
      
      const user = await authService.login(email, password);

      // Verify role
      if (user.user_metadata?.role !== "employer") {
        await authService.logout();
        throw new Error("This account is not registered as an employer.");
      }

      // Remember email if checked
      authService.setRememberMe(email, this.remember.checked);

      // Redirect to employer homepage
      window.location.href = "../employer/employer_homepage.html";

    } catch (err) {
      this.showBanner(err.message || "Invalid email or password.");
      this.setFieldError("email", "");
      this.setFieldError("password", "");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  }

  validate() {
    this.hideBanner();
    let ok = true;

    if (!this.emailInput.value.trim()) {
      this.setFieldError("email", "Email is required.");
      ok = false;
    } else if (!isEmail(this.emailInput.value)) {
      this.setFieldError("email", "Please enter a valid email.");
      ok = false;
    }

    if (!this.passwordInput.value) {
      this.setFieldError("password", "Password is required.");
      ok = false;
    } else if (!minLength(this.passwordInput.value, 8)) {
      this.setFieldError("password", "Password must be at least 8 characters.");
      ok = false;
    }

    if (!ok) this.showBanner("Please fix the highlighted fields and try again.");
    return ok;
  }

  showBanner(msg) {
    if (!this.banner) return;
    this.banner.textContent = msg;
    this.banner.classList.add("show");
  }

  hideBanner() {
    if (!this.banner) return;
    this.banner.textContent = "";
    this.banner.classList.remove("show");
  }

  setFieldError(name, msg) {
    const errorEl = this.form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = msg || "";
  }

  clearFieldError(name) {
    const errorEl = this.form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = "";
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const page = new EmployerLogin();
  page.init();
});
