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
    this.productsEl = $("#productsPreview");
    this.servicesEl = $("#servicesPreview");
    this.myListingsEl = $("#myListingsPreview");
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.renderProducts(user);
    await this.renderServices(user);
    await this.renderMyListings();
    this.wireEvents();
  }

  /**
   * Render card HTML template
   */
  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x150/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    const displayPrice = typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    
    // High Match logic
    const isHighMatch = item.matchScore && item.matchScore >= 12;
    const matchBadge = isHighMatch 
      ? `<div style="position: absolute; top: 10px; left: 10px; background: rgba(0, 123, 255, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 1;">✨ Top Match</div>`
      : "";

    return `
      <a href="marketplace-details.html?id=${item.id}" class="market-card" style="text-decoration: none; color: inherit; position: relative;">
        ${matchBadge}
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="price">${displayPrice}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date || 'Recently'}</div>
        </div>
      </a>
    `;
  }

  /**
   * Render Products section
   */
  async renderProducts(user) {
    if (!this.productsEl) return;
    const profile = user.user_metadata || {};
    const items = await marketplaceService.getRecommended(profile, user.id, "Product");
    if (items.length === 0) {
      this.productsEl.innerHTML = '<div class="empty-state">No products found.</div>';
      return;
    }
    this.productsEl.innerHTML = items.map(item => this.createCard(item)).join("");
  }

  /**
   * Render Services section
   */
  async renderServices(user) {
    if (!this.servicesEl) return;
    const profile = user.user_metadata || {};
    const items = await marketplaceService.getRecommended(profile, user.id, "Service");
    if (items.length === 0) {
      this.servicesEl.innerHTML = '<div class="empty-state">No services found.</div>';
      return;
    }
    this.servicesEl.innerHTML = items.map(item => this.createCard(item)).join("");
  }

  /**
   * Render My Listings section
   */
  async renderMyListings() {
    if (!this.myListingsEl) return;
    const items = await marketplaceService.getMyListings();
    if (items.length === 0) {
      this.myListingsEl.innerHTML = '<div class="empty-state">You haven\'t listed anything yet.</div>';
      return;
    }
    const preview = items.slice(0, 4);
    this.myListingsEl.innerHTML = preview.map(item => this.createCard(item)).join("");
  }

  wireEvents() {
    const seeMoreProducts = $("#seeMoreProducts");
    const seeMoreServices = $("#seeMoreServices");
    const seeMoreMine = $("#seeMoreMyListings");

    if (seeMoreProducts) {
      seeMoreProducts.addEventListener("click", () => {
        window.location.href = "/pages/student/marketplace-recommended.html?type=Product";
      });
    }

    if (seeMoreServices) {
      seeMoreServices.addEventListener("click", () => {
        window.location.href = "/pages/student/marketplace-recommended.html?type=Service";
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
