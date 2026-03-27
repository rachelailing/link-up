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

    const profile = user.user_metadata || {};
    const products = await marketplaceService.getProducts(user.id);
    const services = await marketplaceService.getServices(user.id);

    this.renderItems(this.scoreItems(products, profile), this.productsGrid);
    this.renderItems(this.scoreItems(services, profile), this.servicesGrid);
  }

  scoreItems(items, profile) {
    const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());

    return items
      .map((item) => {
        let score = 0;
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        const itemTitle = item.title.toLowerCase();

        studentInterests.forEach((interest) => {
          if (itemTags.includes(interest)) score += 10;
          if (itemTitle.includes(interest)) score += 5;
        });

        if (profile.campus && item.location && item.location.includes(profile.campus)) {
          score += 5;
        }

        if (item.rating >= 4.5) score += 2;

        return { ...item, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x160/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    const displayPrice =
      typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    const detailsUrl = `marketplace-details?id=${item.id}`;

    // High Match logic (Badge threshold: 12)
    const isHighMatch = item.matchScore && item.matchScore >= 12;
    const matchBadge = isHighMatch
      ? '<div style="position: absolute; top: 10px; left: 10px; background: rgba(0, 123, 255, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 1;">✨ Top Match</div>'
      : '';

    return `
      <a href="${detailsUrl}" class="market-card" style="text-decoration: none; color: inherit; position: relative;">
        ${matchBadge}
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="rating">⭐ ${item.rating || 0} <span class="meta">(${item.reviews || 0} reviews)</span></div>
          <div class="price">${displayPrice}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date || 'N/A'}</div>
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
