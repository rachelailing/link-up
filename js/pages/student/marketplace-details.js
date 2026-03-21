// js/pages/student/marketplace-details.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { authService } from "../../services/auth.service.js";
import { marketplaceService } from "../../services/marketplace.service.js";

class MarketplaceDetails {
  constructor() {
    this.selectedBank = null;
    this.currentItem = null;
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.loadItem();
    this.wireEvents();
  }

  async loadItem() {
    // Robust ID extraction
    const url = new URL(window.location.href);
    let id = url.searchParams.get("id");

    // Fallback 1: manual search params check
    if (!id) {
      const manualParams = new URLSearchParams(window.location.search);
      id = manualParams.get("id");
    }

    // Fallback 2: check if id is in the hash
    if (!id && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      id = hashParams.get("id");
    }

    // Fallback 3: check if it's in the path (e.g. /marketplace-details/1)
    if (!id) {
      const parts = window.location.pathname.split("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart && !isNaN(lastPart) && lastPart !== "marketplace-details") {
        id = lastPart;
      }
    }

    console.log("[MarketplaceDetails] Debug Info:", {
      href: window.location.href,
      search: window.location.search,
      pathname: window.location.pathname,
      id: id
    });

    if (!id || id === "undefined" || id === "null") {
      $("#loadingState").innerHTML = `
        <div class="card pad" style="border: 2px solid var(--error); max-width: 500px; margin: 0 auto;">
          <h2 style="color: var(--error);">No item ID provided.</h2>
          <p class="muted">We couldn't find the item ID in the URL. This can happen if the browser strips parameters.</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px;">
            <label style="display:block; margin-bottom: 8px; font-weight: bold;">Manually Enter ID (Emergency Fallback):</label>
            <div style="display:flex; gap: 10px;">
              <input type="text" id="manualIdInput" placeholder="e.g. 1, 2, 101" style="flex:1; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
              <button id="manualIdBtn" class="btn btn-blue">Load</button>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 15px 0; text-align: left; font-family: monospace; font-size: 0.8rem; overflow-x: auto;">
            <strong>Debug Path:</strong> ${window.location.pathname}<br>
            <strong>Debug Query:</strong> ${window.location.search || "(empty)"}<br>
          </div>
          <div style="margin-top: 20px;">
            <a href="/pages/student/marketplace.html" class="btn btn-primary">Back to Marketplace</a>
          </div>
        </div>
      `;

      $("#manualIdBtn").addEventListener("click", () => {
        const manualId = $("#manualIdInput").value.trim();
        if (manualId) {
          window.location.href = `marketplace-details?id=${manualId}`;
        }
      });
      return;
    }

    const item = await marketplaceService.getItemById(id);

    if (!item) {
      $("#loadingState").innerHTML = `
        <h2>Item not found (ID: ${id}).</h2>
        <div style="margin-top: 20px;">
          <a href="/pages/student/marketplace.html" class="btn btn-primary">Back to Marketplace</a>
        </div>
      `;
      return;
    }

    this.currentItem = item;
    this.renderDetails(item);
  }

  renderDetails(item) {
    const placeholderImg = `https://via.placeholder.com/600x400/f0f0f0/999?text=${encodeURIComponent(item.title)}`;
    
    $("#itemImage").src = item.image || placeholderImg;
    $("#itemTitle").textContent = item.title;
    
    const displayPrice = typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    $("#itemPrice").textContent = displayPrice;
    
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
