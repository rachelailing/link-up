// js/pages/auth/employer-register.js
import { isEmail, minLength, digitsCount } from "../../utils/validators.js";

export function initEmployerRegister() {
  const form = document.getElementById("employerRegisterForm");
  if (!form) return;

  const alertBox = document.getElementById("formAlert");

  const fields = {
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

  // Toggle password buttons
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

  function setFieldError(name, message) {
    const input = fields[name];
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (input) input.closest(".form-field")?.classList.add("is-invalid");
    if (errorEl) errorEl.textContent = message || "";
  }

  function clearFieldError(name) {
    const input = fields[name];
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (input) input.closest(".form-field")?.classList.remove("is-invalid");
    if (errorEl) errorEl.textContent = "";
  }

  function showAlert(message) {
    if (!alertBox) return;
    alertBox.hidden = false;
    alertBox.textContent = message;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.hidden = true;
    alertBox.textContent = "";
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^\d+\-()\s]/g, "");
  }

  // Live cleanup
  Object.keys(fields).forEach((name) => {
    const el = fields[name];
    if (!el) return;

    const evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => {
      hideAlert();
      clearFieldError(name);

      if (name === "businessPhone") {
        el.value = normalizePhone(el.value);
      }

      // Password match live
      if (name === "password" || name === "confirmPassword") {
        if (fields.confirmPassword.value && fields.password.value !== fields.confirmPassword.value) {
          setFieldError("confirmPassword", "Passwords do not match.");
        } else {
          clearFieldError("confirmPassword");
        }
      }
    });
  });

  function validate() {
    hideAlert();
    let ok = true;

    // Required text fields
    const requiredText = ["businessName", "picName", "picRole"];
    requiredText.forEach((name) => {
      if (!fields[name].value.trim()) {
        setFieldError(name, "This field is required.");
        ok = false;
      }
    });

    // Business type
    if (!fields.businessType.value) {
      setFieldError("businessType", "Please select a business type.");
      ok = false;
    }

    // Email
    if (!fields.businessEmail.value.trim()) {
      setFieldError("businessEmail", "Business email is required.");
      ok = false;
    } else if (!isEmail(fields.businessEmail.value)) {
      setFieldError("businessEmail", "Please enter a valid email.");
      ok = false;
    }

    // Phone
    const phoneVal = fields.businessPhone.value.trim();
    if (!phoneVal) {
      setFieldError("businessPhone", "Business phone is required.");
      ok = false;
    } else if (digitsCount(phoneVal) < 9) {
      setFieldError("businessPhone", "Please enter a valid phone number.");
      ok = false;
    }

    // Password
    if (!minLength(fields.password.value, 8)) {
      setFieldError("password", "Password must be at least 8 characters.");
      ok = false;
    }

    // Confirm password
    if (!fields.confirmPassword.value) {
      setFieldError("confirmPassword", "Please confirm your password.");
      ok = false;
    } else if (fields.password.value !== fields.confirmPassword.value) {
      setFieldError("confirmPassword", "Passwords do not match.");
      ok = false;
    }

    // Terms
    if (!fields.terms.checked) {
      setFieldError("terms", "You must agree before creating an account.");
      ok = false;
    }

    if (!ok) showAlert("Please fix the highlighted fields and try again.");
    return ok;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Frontend demo: store in localStorage (temporary)
    const payload = {
      role: "employer",
      businessName: fields.businessName.value.trim(),
      businessType: fields.businessType.value,
      businessEmail: fields.businessEmail.value.trim(),
      businessPhone: fields.businessPhone.value.trim(),
      businessAddress: document.getElementById("businessAddress")?.value.trim() || "",
      picName: fields.picName.value.trim(),
      picRole: fields.picRole.value.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("linkup_employer_register", JSON.stringify(payload));

    // Redirect to employer login (nice flow)
    window.location.href = "./employer-login.html";
  });
}