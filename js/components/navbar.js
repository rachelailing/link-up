import { $$, $ } from "../utils/dom.js";
import { authService } from "../services/auth.service.js";

export function setActiveNav(){
  const path = window.location.pathname;
  $$("[data-nav]").forEach(a => {
    const href = a.getAttribute("href");
    a.classList.toggle("active", path.endsWith(href));
  });
}

export function wireLogout() {
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to log out?")) {
        await authService.logout();
      }
    });
  }
}