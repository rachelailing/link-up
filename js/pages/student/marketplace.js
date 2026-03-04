// js/pages/student/marketplace.js
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

/**
 * Mock data for Recommended Section
 */
const RECOMMENDED_ITEMS = [
  {
    id: 1,
    title: "Pro Video Editing Service",
    price: "RM 50/video",
    location: "Online / UTP",
    date: "3 Mar 2026"
  },
  {
    id: 2,
    title: "Organic Nasi Lemak",
    price: "RM 5",
    location: "V4, Block B",
    date: "4 Mar 2026"
  },
  {
    id: 3,
    title: "Python Tutoring (Basic)",
    price: "RM 20/hour",
    location: "Main Library",
    date: "2 Mar 2026"
  },
  {
    id: 4,
    title: "Laundry Service (Wash & Fold)",
    price: "RM 8/load",
    location: "V5, Ground Floor",
    date: "1 Mar 2026"
  }
];

/**
 * Marketplace Controller
 */
class Marketplace {
  constructor() {
    this.recommendedEl = $("#recommendedPreview");
    this.myListingsEl = $("#myListingsPreview");
  }

  init() {
    setActiveNav();
    this.renderRecommended();
    this.renderMyListings();
    this.wireEvents();
  }

  /**
   * Render card HTML template
   */
  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x150/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    return `
      <div class="market-card" onclick="window.location.href='marketplace-details.html?id=${item.id}'">
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="price">${item.price}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render Recommended section
   */
  renderRecommended() {
    if (!this.recommendedEl) return;
    this.recommendedEl.innerHTML = RECOMMENDED_ITEMS.map(item => this.createCard(item)).join("");
  }

  /**
   * Render My Listings section
   */
  renderMyListings() {
    if (!this.myListingsEl) return;

    let myListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");

    // For demo: if empty, show these samples
    if (myListings.length === 0) {
      myListings = [
        { id: 101, title: "Used Calculus Textbook", price: "RM 30", location: "V2, Block A", date: "2 Mar 2026" },
        { id: 102, title: "Custom Crochet Keychain", price: "RM 12", location: "All Villages", date: "1 Mar 2026" }
      ];
    }

    const preview = myListings.slice(0, 4);
    this.myListingsEl.innerHTML = preview.map(item => this.createCard(item)).join("");
  }

  wireEvents() {
    const seeMoreRec = $("#seeMoreRecommended");
    const seeMoreMine = $("#seeMoreMyListings");

    if (seeMoreRec) {
      seeMoreRec.addEventListener("click", () => {
        window.location.href = "marketplace-recommended.html";
      });
    }

    if (seeMoreMine) {
      seeMoreMine.addEventListener("click", () => {
        window.location.href = "marketplace-listings.html";
      });
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const market = new Marketplace();
  market.init();
});
