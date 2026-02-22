// js/main.js
import { initEmployerRegister } from "./pages/auth/employer-register.js";
import { initEmployerLogin } from "./pages/auth/employer-login.js";

const page = document.documentElement.dataset.page;

const routes = {
  "auth/employer-register": initEmployerRegister,
  "auth/employer-login": initEmployerLogin,
};

if (routes[page]) routes[page]();