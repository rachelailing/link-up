// js/pages/student/marketplace-recommended.js
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

const RECOMMENDED_PRODUCTS = [
  {
    id: 201,
    title: "Used Calculus Textbook",
    price: "RM 30",
    location: "V2, Block A",
    date: "2 Mar 2026",
    rating: 4.8,
    reviews: 12
  },
  {
    id: 202,
    title: "Organic Nasi Lemak",
    price: "RM 5",
    location: "V4, Block B",
    date: "4 Mar 2026",
    rating: 4.9,
    reviews: 45
  },
  {
    id: 203,
    title: "Custom Crochet Keychain",
    price: "RM 12",
    location: "All Villages",
    date: "1 Mar 2026",
    rating: 4.7,
    reviews: 8
  },
  {
    id: 204,
    title: "Portable Desk Lamp",
    price: "RM 15",
    location: "V5, Block C",
    date: "28 Feb 2026",
    rating: 4.5,
    reviews: 15
  }
];

const RECOMMENDED_SERVICES = [
  {
    id: 301,
    title: "Pro Video Editing Service",
    price: "RM 50/video",
    location: "Online / UTP",
    date: "3 Mar 2026",
    rating: 5.0,
    reviews: 20
  },
  {
    id: 302,
    title: "Python Tutoring (Basic)",
    price: "RM 20/hour",
    location: "Main Library",
    date: "2 Mar 2026",
    rating: 4.9,
    reviews: 32
  },
  {
    id: 303,
    title: "Laundry Service (Wash & Fold)",
    price: "RM 8/load",
    location: "V5, Ground Floor",
    date: "1 Mar 2026",
    rating: 4.6,
    reviews: 54
  },
  {
    id: 304,
    title: "Graphic Design - Poster",
    price: "RM 15",
    location: "Remote",
    date: "28 Feb 2026",
    rating: 4.8,
    reviews: 18
  }
];

class RecommendedMarketplace {
  constructor() {
    this.productsGrid = $("#productsGrid");
    this.servicesGrid = $("#servicesGrid");
  }

  init() {
    setActiveNav();
    this.renderItems(RECOMMENDED_PRODUCTS, this.productsGrid);
    this.renderItems(RECOMMENDED_SERVICES, this.servicesGrid);
  }

  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x160/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    return `
      <div class="market-card" onclick="window.location.href='marketplace-details.html?id=${item.id}'">
        <img src="${item.image || placeholderImg}" alt="${item.title}" class="market-card-image">
        <div class="market-card-content">
          <h3>${item.title}</h3>
          <div class="rating">⭐ ${item.rating} <span class="meta">(${item.reviews} reviews)</span></div>
          <div class="price">${item.price}</div>
          <div class="meta">📍 ${item.location}</div>
          <div class="meta">📅 Posted: ${item.date}</div>
        </div>
      </div>
    `;
  }

  renderItems(items, container) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = "<p class='muted'>No items found.</p>";
      return;
    }
    container.innerHTML = items.map(item => this.createCard(item)).join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new RecommendedMarketplace();
  page.init();
});
