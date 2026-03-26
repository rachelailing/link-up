import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";

const MOCK_RATINGS = [
  {
    id: 1,
    studentName: "Rachel Ng",
    jobTitle: "Event Crew: Tech Showcase",
    rating: 5,
    comment: "The employer was very professional and provided clear instructions. Payment was released immediately after the job was done. Highly recommended!",
    date: "2026-03-24"
  },
  {
    id: 2,
    studentName: "Wei Kang",
    jobTitle: "Campus Delivery Rider",
    rating: 5,
    comment: "Great experience working as a rider. The app made it easy to manage deliveries. Good support from the employer as well.",
    date: "2026-03-22"
  },
  {
    id: 3,
    studentName: "Sarah Lim",
    jobTitle: "Library Assistant",
    rating: 4,
    comment: "Nice environment to work in. Tasks were manageable, and the staff were friendly. Looking forward to more jobs from this employer.",
    date: "2026-03-15"
  },
  {
    id: 4,
    studentName: "Ahmad Danish",
    jobTitle: "Programming Tutor",
    rating: 5,
    comment: "The tutoring sessions were well-organized. The employer was very supportive and provided all necessary materials. Excellent communication!",
    date: "2026-03-10"
  },
  {
    id: 5,
    studentName: "Siti Aminah",
    jobTitle: "Social Media Content Creator",
    rating: 5,
    comment: "Fun and creative job! The employer gave me creative freedom while providing clear goals. Prompt payment as well.",
    date: "2026-03-05"
  }
];

function renderRatings() {
  const container = $("#ratingsList");
  
  if (MOCK_RATINGS.length === 0) {
    container.innerHTML = `
      <div class="card pad">
        <p>No ratings or reviews yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = MOCK_RATINGS.map(rating => {
    const stars = "⭐".repeat(rating.rating);
    return `
      <div class="card pad" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 1.1rem;">${rating.studentName}</h3>
            <p style="margin: 2px 0; font-size: 0.9rem; color: var(--muted);">${rating.jobTitle}</p>
          </div>
          <div style="text-align: right;">
            <div style="color: #f1c40f;">${stars}</div>
            <p style="margin: 5px 0 0; font-size: 0.8rem; color: var(--muted);">${new Date(rating.date).toLocaleDateString()}</p>
          </div>
        </div>
        <p style="margin: 10px 0 0; line-height: 1.5; color: var(--text-dark);">${rating.comment}</p>
      </div>
    `;
  }).join("");
}

async function init() {
  const user = await authService.requireAuth("employer");
  if (!user) return;

  setActiveNav();
  renderRatings();
}

document.addEventListener("DOMContentLoaded", init);
