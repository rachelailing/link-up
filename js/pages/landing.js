// js/pages/landing.js
const burgerBtn = document.getElementById('burgerBtn');
const landingMenu = document.getElementById('landingMenu');

if (burgerBtn && landingMenu) {
  burgerBtn.addEventListener('click', () => {
    landingMenu.classList.toggle('show');
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    landingMenu?.classList.remove('show');
  });
});
