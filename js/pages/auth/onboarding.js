// js/pages/auth/onboarding.js
import { $, $$ } from '../../utils/dom.js';
import { authService } from '../../services/auth.service.js';
import { supabase } from '../../config/supabase.js';

const SKILLS = [
  { key: 'design', name: 'Graphic Design', desc: 'Poster, slides, banners' },
  { key: 'video', name: 'Video Editing', desc: 'Reels, short videos, TikTok' },
  { key: 'photo', name: 'Photography', desc: 'Event, product photos' },
  { key: 'writing', name: 'Writing', desc: 'Copywriting, reports, content' },
  { key: 'tutoring', name: 'Tutoring', desc: 'Math, English, subjects' },
  { key: 'booth', name: 'Booth Management', desc: 'Events, selling, setup' },
  { key: 'event', name: 'Event Support', desc: 'Ushering, logistics, helper' },
  { key: 'social', name: 'Social Media', desc: 'Content, posting, marketing' },
  { key: 'coding', name: 'Coding / Web Dev', desc: 'Python, HTML/CSS/JS' },
  { key: 'delivery', name: 'Runner/Delivery', desc: 'Campus errands' },
  { key: 'customer_service', name: 'Customer Service', desc: 'Greeting, handling guests' },
  { key: 'tech', name: 'Technical Support', desc: 'Troubleshooting, IT' },
];

const INTERESTS = [
  { key: 'events', name: 'Event & Booth Jobs', desc: 'Crowds, helpers' },
  { key: 'creative', name: 'Creative Work', desc: 'Design, media' },
  { key: 'academic', name: 'Academic Help', desc: 'Tutoring, notes' },
  { key: 'tech', name: 'Tech Tasks', desc: 'Web, setup, troubleshooting' },
  { key: 'food', name: 'Food & Drinks', desc: 'Baking, prep, selling' },
  { key: 'admin', name: 'Admin Support', desc: 'Data entry, simple tasks' },
];

let step = 1;
const selectedSkills = new Set();
const selectedInterests = new Set();
let currentUser = null;

function renderChips(list, mountEl, setRef) {
  mountEl.innerHTML = list
    .map(
      (item) => `
    <div class="chip" data-chip="${item.key}">
      <b>${item.name}</b>
      <small>${item.desc}</small>
    </div>
  `
    )
    .join('');

  mountEl.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.chip;
      if (setRef.has(key)) {
        setRef.delete(key);
        chip.classList.remove('active');
      } else {
        setRef.add(key);
        chip.classList.add('active');
      }
    });
  });
}

function showStep(n) {
  step = n;
  $$('[data-step]').forEach((p) => p.classList.toggle('show', Number(p.dataset.step) === n));
  updateProgress();
}

function updateProgress() {
  const bar = $('#progressBar');
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  if (bar) bar.style.width = pct + '%';
}

function validateStep() {
  const skillsError = $('#skillsError');
  const interestsError = $('#interestsError');
  if (skillsError) skillsError.textContent = '';
  if (interestsError) interestsError.textContent = '';

  if (step === 1) {
    if (selectedSkills.size < 2) {
      if (skillsError) skillsError.textContent = 'Please select at least 2 skills.';
      return false;
    }
  }
  if (step === 2) {
    if (selectedInterests.size < 1) {
      if (interestsError) interestsError.textContent = 'Please select at least 1 interest.';
      return false;
    }
  }
  return true;
}

async function saveOnboarding() {
  if (!currentUser) return;

  const metadata = {
    onboardingDone: true,
    skills: [...selectedSkills],
    interests: [...selectedInterests],
    campus: $('#campus').value.trim(),
    availability: $('#availability').value,
    bio: $('#bio').value.trim(),
    portfolio: $('#portfolio').value.trim(),
    updatedAt: new Date().toISOString(),
  };

  // Update Supabase Auth metadata
  const { error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    alert('Failed to save onboarding: ' + error.message);
    return;
  }

  // Success
  window.location.href = '../student/job-section.html';
}

function wireNavButtons() {
  $$('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validateStep()) return;
      showStep(Math.min(3, step + 1));
    });
  });

  $$('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => showStep(Math.max(1, step - 1)));
  });
}

async function init() {
  currentUser = await authService.getCurrentUser();

  if (!currentUser) {
    window.location.href = './student-register.html';
    return;
  }

  // Pre-fill if some metadata exists
  if (currentUser.user_metadata?.onboardingDone) {
    window.location.href = '../student/job-section.html';
    return;
  }

  renderChips(SKILLS, $('#skillsGrid'), selectedSkills);
  renderChips(INTERESTS, $('#interestsGrid'), selectedInterests);

  wireNavButtons();
  showStep(1);

  const form = $('#onboardingForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep()) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      await saveOnboarding();

      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Onboarding';
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
