// js/pages/student/marketplace-recommended.js
import { $ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';
import { marketplaceService } from '../../services/marketplace.service.js';

class RecommendedMarketplace {
  constructor() {
    this.productsGrid = $('#productsGrid');
    this.servicesGrid = $('#servicesGrid');
  }

  async init() {
    const user = await authService.requireAuth('student');
    if (!user) return;

    setActiveNav();
    wireLogout();

    const products = await marketplaceService.getProducts();
    const services = await marketplaceService.getServices();

    this.renderItems(products, this.productsGrid);
    this.renderItems(services, this.servicesGrid);
  }

  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x160/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    const displayPrice =
      typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    const detailsUrl = `marketplace-details?id=${item.id}`;

    return `
      <a href="${detailsUrl}" class="market-card" style="text-decoration: none; color: inherit;">
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="rating">⭐ ${item.rating} <span class="meta">(${item.reviews} reviews)</span></div>
          <div class="price">${displayPrice}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date}</div>
        </div>
      </a>
    `;
  }

  renderItems(items, container) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<p class="muted">No items found.</p>';
      return;
    }
    container.innerHTML = items.map((item) => this.createCard(item)).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new RecommendedMarketplace();
  page.init();
});
