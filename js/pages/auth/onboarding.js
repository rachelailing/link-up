import { $, $$ } from "../../utils/dom.js";

const SKILLS = [
  { key:"design", name:"Graphic Design", desc:"Poster, slides, banners" },
  { key:"video", name:"Video Editing", desc:"Reels, short videos, TikTok" },
  { key:"photo", name:"Photography", desc:"Event, product photos" },
  { key:"writing", name:"Writing", desc:"Copywriting, reports" },
  { key:"tutor", name:"Tutoring", desc:"Math, English, subjects" },
  { key:"booth", name:"Booth Helper", desc:"Events, selling, setup" },
  { key:"social", name:"Social Media", desc:"Content & posting" },
  { key:"coding", name:"Web Dev", desc:"HTML/CSS/JS basics" },
  { key:"delivery", name:"Runner/Delivery", desc:"Campus errands" },
];

const INTERESTS = [
  { key:"events", name:"Event & Booth Jobs", desc:"Crowds, helpers" },
  { key:"creative", name:"Creative Work", desc:"Design, media" },
  { key:"academic", name:"Academic Help", desc:"Tutoring, notes" },
  { key:"tech", name:"Tech Tasks", desc:"Web, setup, troubleshooting" },
  { key:"food", name:"Food & Drinks", desc:"Baking, prep, selling" },
  { key:"admin", name:"Admin Support", desc:"Data entry, simple tasks" },
];

let step = 1;
const selectedSkills = new Set();
const selectedInterests = new Set();

function renderChips(list, mountEl, setRef){
  mountEl.innerHTML = list.map(item => `
    <div class="chip" data-chip="${item.key}">
      <b>${item.name}</b>
      <small>${item.desc}</small>
    </div>
  `).join("");

  mountEl.querySelectorAll("[data-chip]").forEach(chip => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.chip;
      if (setRef.has(key)) {
        setRef.delete(key);
        chip.classList.remove("active");
      } else {
        setRef.add(key);
        chip.classList.add("active");
      }
      updateProgress(); // optional feel-good update
    });
  });
}

function showStep(n){
  step = n;
  $$("[data-step]").forEach(p => p.classList.toggle("show", Number(p.dataset.step) === n));
  updateProgress();
}

function updateProgress(){
  const bar = $("#progressBar");
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  bar.style.width = pct + "%";
}

function validateStep(){
  $("#skillsError").textContent = "";
  $("#interestsError").textContent = "";

  if (step === 1) {
    if (selectedSkills.size < 2) {
      $("#skillsError").textContent = "Please select at least 2 skills.";
      return false;
    }
  }
  if (step === 2) {
    if (selectedInterests.size < 1) {
      $("#interestsError").textContent = "Please select at least 1 interest.";
      return false;
    }
  }
  return true;
}

function getStudentProfile(){
  const raw = localStorage.getItem("linkup_student_profile");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveOnboarding(){
  const student = getStudentProfile() || {};
  const updated = {
    ...student,
    onboardingDone: true,
    skills: [...selectedSkills],
    interests: [...selectedInterests],
    campus: $("#campus").value.trim(),
    availability: $("#availability").value,
    bio: $("#bio").value.trim(),
    portfolio: $("#portfolio").value.trim(),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem("linkup_student_profile", JSON.stringify(updated));
  localStorage.setItem("linkup_currentUser", JSON.stringify({ ...updated, role:"student" }));
}

function wireNavButtons(){
  $$("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!validateStep()) return;
      showStep(Math.min(3, step + 1));
    });
  });

  $$("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showStep(Math.max(1, step - 1)));
  });
}

function init(){
  // guard: if no registered user, go to register
  const student = getStudentProfile();
  if (!student) {
    window.location.href = "./student-register.html";
    return;
  }

  renderChips(SKILLS, $("#skillsGrid"), selectedSkills);
  renderChips(INTERESTS, $("#interestsGrid"), selectedInterests);

  wireNavButtons();
  showStep(1);

  $("#onboardingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    saveOnboarding();
    window.location.href = "../student/dashboard.html";
  });
}

document.addEventListener("DOMContentLoaded", init);