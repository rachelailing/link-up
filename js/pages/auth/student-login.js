// js/pages/auth/student-login.js
import { $, $$ } from "../../utils/dom.js";
import { isEmail, minLength } from "../../utils/validators.js";
import { authService } from "../../services/auth.service.js";

/**
 * Student Login Controller
 */
class StudentLogin {
  constructor() {
    this.form = $("#studentLoginForm");
    this.emailInput = $("#studentEmail");
    this.passwordInput = $("#password");
    this.rememberMe = $("#rememberMe");
    this.banner = $("#loginError");
  }

  init() {
    this.prefillEmail();
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  prefillEmail() {
    const remembered = authService.getRememberedEmail();
    if (remembered) this.emailInput.value = remembered;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    const email = this.emailInput.value.trim();
    const pass = this.passwordInput.value;

    if (!this.validate(email, pass)) return;

    console.log("[StudentLogin] Form submitted, calling AuthService...");

    try {
      const user = await authService.login(email, pass);
      
      // Verify role
      if (user.user_metadata?.role !== "student") {
        console.warn("[StudentLogin] Role mismatch: user is not a student.", user.user_metadata);
        await authService.logout();
        throw new Error("This account is not registered as a student.");
      }

      console.log("[StudentLogin] Login successful, checking onboarding status...");
      authService.setRememberMe(email, this.rememberMe.checked);

      // Redirect based on onboarding
      const onboardingDone = !!user.user_metadata?.onboardingDone;
      const target = onboardingDone ? "../student/job-section.html" : "./onboarding.html";
      
      console.log(`[StudentLogin] Redirecting to: ${target}`);
      window.location.href = target;

    } catch (err) {
      console.error("[StudentLogin] Login error:", err);
      this.showBanner(err.message);
    }
  }

  validate(email, pass) {
    let isValid = true;
    
    if (!isEmail(email)) {
      this.setError("studentEmail", "Please enter a valid email.");
      isValid = false;
    }
    
    if (!minLength(pass, 8)) {
      this.setError("password", "Please enter your password (min 8 chars).");
      isValid = false;
    }

    return isValid;
  }

  setError(id, message) {
    const el = $(`[data-error-for="${id}"]`);
    if (el) el.textContent = message || "";
  }

  clearErrors() {
    $$("[data-error-for]").forEach(e => e.textContent = "");
    this.banner.classList.remove("show");
    this.banner.textContent = "";
  }

  showBanner(msg) {
    this.banner.textContent = msg;
    this.banner.classList.add("show");
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const page = new StudentLogin();
  page.init();
});
