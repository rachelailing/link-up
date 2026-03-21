// js/pages/student/marketplace.js
import { $ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";
import { marketplaceService } from "../../services/marketplace.service.js";

/**
 * Marketplace Controller
 */
class Marketplace {
  constructor() {
    this.recommendedEl = $("#recommendedPreview");
    this.myListingsEl = $("#myListingsPreview");
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.renderRecommended();
    await this.renderMyListings();
    this.wireEvents();
  }

  /**
   * Render card HTML template
   */
  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x150/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    const displayPrice = typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    
    return `
      <a href="marketplace-details?id=${item.id}" class="market-card" style="text-decoration: none; color: inherit;">
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="price">${displayPrice}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date}</div>
        </div>
      </a>
    `;
  }

  /**
   * Render Recommended section
   */
  async renderRecommended() {
    if (!this.recommendedEl) return;
    const items = await marketplaceService.getRecommended();
    this.recommendedEl.innerHTML = items.map(item => this.createCard(item)).join("");
  }

  /**
   * Render My Listings section
   */
  async renderMyListings() {
    if (!this.myListingsEl) return;
    const items = await marketplaceService.getMyListings();
    const preview = items.slice(0, 4);
    this.myListingsEl.innerHTML = preview.map(item => this.createCard(item)).join("");
  }

  wireEvents() {
    const seeMoreRec = $("#seeMoreRecommended");
    const seeMoreMine = $("#seeMoreMyListings");

    if (seeMoreRec) {
      seeMoreRec.addEventListener("click", () => {
        window.location.href = "/pages/student/marketplace-recommended.html";
      });
    }

    if (seeMoreMine) {
      seeMoreMine.addEventListener("click", () => {
        window.location.href = "/pages/student/marketplace-listings.html";
      });
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const market = new Marketplace();
  market.init();
});
