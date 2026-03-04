// js/pages/student/marketplace-listings.js
import { $ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

const MY_PRODUCTS = [
  {
    id: 101,
    title: "Used Calculus Textbook",
    price: "RM 30",
    location: "V2, Block A",
    date: "2 Mar 2026"
  },
  {
    id: 102,
    title: "Custom Crochet Keychain",
    price: "RM 12",
    location: "All Villages",
    date: "1 Mar 2026"
  },
  {
    id: 103,
    title: "Second-hand Scientific Calculator",
    price: "RM 45",
    location: "V3, Block B",
    date: "25 Feb 2026"
  }
];

const MY_SERVICES = [
  {
    id: 301,
    title: "Pro Video Editing Service",
    price: "RM 50/video",
    location: "Online / UTP",
    date: "3 Mar 2026"
  },
  {
    id: 302,
    title: "Python Tutoring (Basic)",
    price: "RM 20/hour",
    location: "Main Library",
    date: "2 Mar 2026"
  }
];

class MyMarketplaceListings {
  constructor() {
    this.productsGrid = $("#myProductsGrid");
    this.servicesGrid = $("#myServicesGrid");
  }

  init() {
    setActiveNav();
    this.renderItems(MY_PRODUCTS, this.productsGrid);
    this.renderItems(MY_SERVICES, this.servicesGrid);
  }

  createCard(item) {
    const placeholderImg = `https://via.placeholder.com/300x160/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
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

  renderItems(items, container) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = "<p class='muted'>No listings found.</p>";
      return;
    }
    container.innerHTML = items.map(item => this.createCard(item)).join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new MyMarketplaceListings();
  page.init();
});
