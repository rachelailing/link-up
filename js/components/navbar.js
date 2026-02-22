import { $$ } from "../utils/dom.js";

export function setActiveNav(){
  const path = window.location.pathname;
  $$("[data-nav]").forEach(a => {
    const href = a.getAttribute("href");
    a.classList.toggle("active", path.endsWith(href));
  });
}