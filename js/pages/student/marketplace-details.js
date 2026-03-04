// js/pages/student/marketplace-details.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

/**
 * Combined mock data from recommended and my listings
 * In a real app, this would come from an API/Service.
 */
const ALL_MOCK_ITEMS = [
  { id: 1, title: "Pro Video Editing Service", price: 50, location: "Online / UTP", date: "3 Mar 2026", rating: 5.0, reviews: 20, type: "Service", description: "Professional video editing for your assignments, vlogs, or club events. Quick turnaround and high-quality results.", tags: ["creative", "video"] },
  { id: 2, title: "Organic Nasi Lemak", price: 5, location: "V4, Block B", date: "4 Mar 2026", rating: 4.9, reviews: 45, type: "Product", description: "Delicious home-cooked Nasi Lemak with organic ingredients. Served hot with spicy sambal and crispy anchovies.", tags: ["food"] },
  { id: 3, title: "Python Tutoring (Basic)", price: 20, location: "Main Library", date: "2 Mar 2026", rating: 4.9, reviews: 32, type: "Service", description: "Struggling with Python? I can help you understand the basics of programming, loops, and data structures.", tags: ["academic", "tech"] },
  { id: 4, title: "Laundry Service (Wash & Fold)", price: 8, location: "V5, Ground Floor", date: "1 Mar 2026", rating: 4.6, reviews: 54, type: "Service", description: "Fast and clean laundry service. Wash and fold included. RM 8 per 5kg load.", tags: ["laundry"] },
  { id: 201, title: "Used Calculus Textbook", price: 30, location: "V2, Block A", date: "2 Mar 2026", rating: 4.8, reviews: 12, type: "Product", description: "Thomas' Calculus (14th Edition). Condition: 9/10. No highlights, very clean.", tags: ["textbooks", "academic"] },
  { id: 203, title: "Custom Crochet Keychain", price: 12, location: "All Villages", date: "1 Mar 2026", rating: 4.7, reviews: 8, type: "Product", description: "Handmade crochet keychains. Customizable colors and designs. Perfect for gifts!", tags: ["creative", "others"] }
];

class MarketplaceDetails {
  constructor() {
    this.selectedBank = null;
    this.currentItem = null;
  }

  init() {
    setActiveNav();
    this.loadItem();
    this.wireEvents();
  }

  loadItem() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));

    // Combine mock data with localStorage listings
    const myListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    const allItems = [...ALL_MOCK_ITEMS, ...myListings];

    const item = allItems.find(i => i.id === id);

    if (!item) {
      $("#loadingState").innerHTML = "<h2>Item not found.</h2><a href='marketplace.html'>Back to Marketplace</a>";
      return;
    }

    this.currentItem = item;
    this.renderDetails(item);
  }

  renderDetails(item) {
    const placeholderImg = `https://via.placeholder.com/600x400/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    
    $("#itemImage").src = item.image || placeholderImg;
    $("#itemTitle").textContent = item.title;
    $("#itemPrice").textContent = typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    $("#itemRating").textContent = `⭐ ${item.rating || 'N/A'}`;
    $("#itemReviews").textContent = item.reviews ? `(${item.reviews} reviews)` : '(No reviews yet)';
    $("#itemType").textContent = item.type || "Product";
    $("#itemLocation").textContent = `📍 ${item.location}`;
    $("#itemDate").textContent = `📅 Posted: ${item.date}`;
    $("#itemDescription").textContent = item.description || "No description provided.";

    // Render Tags
    if (item.tags && item.tags.length > 0) {
      $("#itemTags").innerHTML = item.tags.map(t => `<span class="badge outline">${t}</span>`).join("");
    } else {
      $("#itemTags").innerHTML = "<span class='muted'>No tags</span>";
    }

    // Update Payment Summary
    const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price.replace("RM ", "")) || 0;
    const fee = priceNum * 0.02;
    const total = priceNum + fee;

    $("#subtotal").textContent = `RM ${priceNum.toFixed(2)}`;
    $("#serviceFee").textContent = `RM ${fee.toFixed(2)}`;
    $("#totalAmount").textContent = `RM ${total.toFixed(2)}`;

    $("#loadingState").style.display = "none";
    $("#detailsContent").style.display = "grid";
  }

  wireEvents() {
    // Bank selection
    const banks = $$(".bank-option");
    banks.forEach(bank => {
      bank.addEventListener("click", () => {
        banks.forEach(b => b.classList.remove("selected"));
        bank.classList.add("selected");
        this.selectedBank = bank.dataset.bank;
      });
    });

    // Pay button
    $("#payButton").addEventListener("click", () => {
      if (!this.selectedBank) {
        alert("Please select a bank for FPX payment.");
        return;
      }
      this.handlePayment();
    });
  }

  handlePayment() {
    const btn = $("#payButton");
    btn.disabled = true;
    btn.textContent = "Processing...";

    // Simulate payment process
    setTimeout(() => {
      alert(`Payment Successful via ${this.selectedBank.toUpperCase()}! Your purchase of "${this.currentItem.title}" is confirmed.`);
      
      // Save to purchase history (simplified)
      const purchase = {
        id: Date.now(),
        itemTitle: this.currentItem.title,
        amount: $("#totalAmount").textContent,
        date: new Date().toLocaleDateString(),
        status: "Completed"
      };
      const history = JSON.parse(localStorage.getItem("linkup_purchases") || "[]");
      history.unshift(purchase);
      localStorage.setItem("linkup_purchases", JSON.stringify(history));

      window.location.href = "purchase.html";
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const details = new MarketplaceDetails();
  details.init();
});
