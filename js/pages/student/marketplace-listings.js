// js/pages/student/marketplace-listings.js
import { $ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';
import { marketplaceService } from '../../services/marketplace.service.js';

class MyMarketplaceListings {
  constructor() {
    this.productsGrid = $('#myProductsGrid');
    this.servicesGrid = $('#myServicesGrid');
  }

  async init() {
    const user = await authService.requireAuth('student');
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.renderAll();
  }

  async renderAll() {
    const items = await marketplaceService.getMyListings();

    const products = items.filter((i) => i.type === 'Product');
    const services = items.filter((i) => i.type === 'Service');

    this.renderItems(products, this.productsGrid);
    this.renderItems(services, this.servicesGrid);
  }

  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x160/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    const managePage = item.type === 'Service' ? 'service-manage' : 'product-manage';
    const displayPrice =
      typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;

    return `
      <a href="${managePage}?id=${item.id}" class="market-card" style="text-decoration: none; color: inherit;">
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

  renderItems(items, container) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = "<p class='muted'>No listings found.</p>";
      return;
    }
    container.innerHTML = items.map((item) => this.createCard(item)).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new MyMarketplaceListings();
  page.init();
});
