// js/pages/auth/employer-register.js
import { isEmail, minLength, digitsCount } from "../../utils/validators.js";
import { authService } from "../../services/auth.service.js";

/**
 * Employer Registration Controller
 */
class EmployerRegister {
  constructor() {
    this.form = document.getElementById("employerRegisterForm");
    if (!this.form) return;

    this.alertBox = document.getElementById("formAlert");
    this.fields = {
      businessName: document.getElementById("businessName"),
      businessType: document.getElementById("businessType"),
      businessEmail: document.getElementById("businessEmail"),
      businessPhone: document.getElementById("businessPhone"),
      picName: document.getElementById("picName"),
      picRole: document.getElementById("picRole"),
      password: document.getElementById("password"),
      confirmPassword: document.getElementById("confirmPassword"),
      terms: document.getElementById("terms"),
    };
  }

  init() {
    if (!this.form) return;

    this.wirePasswordToggles();
    this.wireLiveCleanup();
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  wirePasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selector = btn.getAttribute("data-toggle-password");
        const input = document.querySelector(selector);
        if (!input) return;

        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        btn.textContent = isHidden ? "Hide" : "Show";
      });
    });
  }

  wireLiveCleanup() {
    Object.keys(this.fields).forEach((name) => {
      const el = this.fields[name];
      if (!el) return;

      const evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => {
        this.hideAlert();
        this.clearFieldError(name);

        if (name === "businessPhone") {
          el.value = el.value.replace(/[^\d+\-()\s]/g, "");
        }

        if (name === "password" || name === "confirmPassword") {
          if (this.fields.confirmPassword.value && this.fields.password.value !== this.fields.confirmPassword.value) {
            this.setFieldError("confirmPassword", "Passwords do not match.");
          } else {
            this.clearFieldError("confirmPassword");
          }
        }
      });
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    alert("Form submit triggered!");
    console.log("[EmployerRegister] Form submitted");

    if (!this.validate()) {
      console.warn("[EmployerRegister] Validation failed");
      return;
    }

    const submitBtn = this.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const payload = {
        email: this.fields.businessEmail.value.trim(),
        password: this.fields.password.value,
        businessName: this.fields.businessName.value.trim(),
        businessType: this.fields.businessType.value,
        businessPhone: this.fields.businessPhone.value.trim(),
        businessAddress: document.getElementById("businessAddress")?.value.trim() || "",
        picName: this.fields.picName.value.trim(),
        picRole: this.fields.picRole.value.trim(),
      };

      console.log("[EmployerRegister] Calling authService.register with payload:", payload);
      const user = await authService.register(payload, "employer");
      
      console.log("[EmployerRegister] Success! Redirecting to verify-email.html. User:", user);
      window.location.href = "./verify-email.html";

    } catch (err) {
      console.error("[EmployerRegister] Catch block error:", err);
      this.showAlert("Registration failed: " + (err.message || "Please try again."));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  }

  validate() {
    this.hideAlert();
    let ok = true;

    const requiredText = ["businessName", "picName", "picRole"];
    requiredText.forEach((name) => {
      if (!this.fields[name].value.trim()) {
        this.setFieldError(name, "This field is required.");
        ok = false;
      }
    });

    if (!this.fields.businessType.value) {
      this.setFieldError("businessType", "Please select a business type.");
      ok = false;
    }

    if (!isEmail(this.fields.businessEmail.value)) {
      this.setFieldError("businessEmail", "Please enter a valid email.");
      ok = false;
    }

    if (digitsCount(this.fields.businessPhone.value) < 9) {
      this.setFieldError("businessPhone", "Please enter a valid phone number.");
      ok = false;
    }

    if (!minLength(this.fields.password.value, 8)) {
      this.setFieldError("password", "Password must be at least 8 characters.");
      ok = false;
    }

    if (this.fields.password.value !== this.fields.confirmPassword.value) {
      this.setFieldError("confirmPassword", "Passwords do not match.");
      ok = false;
    }

    if (!this.fields.terms.checked) {
      this.setFieldError("terms", "You must agree before creating an account.");
      ok = false;
    }

    if (!ok) this.showAlert("Please fix the highlighted fields and try again.");
    return ok;
  }

  setFieldError(name, message) {
    const errorEl = this.form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = message || "";
  }

  clearFieldError(name) {
    const errorEl = this.form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = "";
  }

  showAlert(message) {
    if (!this.alertBox) return;
    this.alertBox.textContent = message;
    this.alertBox.classList.add("show");
  }

  hideAlert() {
    if (!this.alertBox) return;
    this.alertBox.textContent = "";
    this.alertBox.classList.remove("show");
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const page = new EmployerRegister();
  page.init();
});
