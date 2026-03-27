// js/pages/student/marketplace-details.js
import { $ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';
import { marketplaceService } from '../../services/marketplace.service.js';

class MarketplaceDetails {
  constructor() {
    this.currentItem = null;
    this.quantity = 1;
  }

  async init() {
    const user = await authService.requireAuth('student');
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.loadItem();
    this.wireEvents();
    this.checkPaymentStatus();
  }

  /**
   * Check if we just returned from a payment
   */
  checkPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancel') {
      alert('Payment was cancelled. Your item is still in the cart.');
    }
  }

  async loadItem() {
    const url = new URL(window.location.href);
    let id = url.searchParams.get('id');

    if (!id) {
      const manualParams = new URLSearchParams(window.location.search);
      id = manualParams.get('id');
    }

    if (!id) {
      $('#loadingState').innerHTML = `
        <div class="card pad" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <h2 style="color: var(--error);">Item ID not found</h2>
          <p>Please return to the marketplace and select an item.</p>
          <a href="/pages/student/marketplace.html" class="btn btn-primary" style="margin-top: 20px;">Back to Marketplace</a>
        </div>
      `;
      return;
    }

    const item = await marketplaceService.getItemById(id);

    if (!item) {
      $('#loadingState').innerHTML = `<h2>Item not found (ID: ${id}).</h2>`;
      return;
    }

    this.currentItem = item;
    this.renderDetails(item);
  }

  renderDetails(item) {
    const placeholderImg = `https://via.placeholder.com/600x400/f0f0f0/999?text=${encodeURIComponent(item.title)}`;

    $('#itemImage').src = item.image_url || placeholderImg;
    $('#itemTitle').textContent = item.title;

    const displayPrice =
      typeof item.price === 'number' ? `RM ${item.price.toFixed(2)}` : item.price;
    $('#itemPrice').textContent = displayPrice;

    $('#itemRating').textContent = `⭐ ${item.rating || 'N/A'}`;
    $('#itemReviews').textContent = item.reviews_count
      ? `(${item.reviews_count} reviews)`
      : '(No reviews yet)';
    $('#itemType').textContent = item.type || 'Product';
    $('#itemLocation').textContent = `📍 ${item.location}`;
    $('#itemDate').textContent = `📅 Posted: ${new Date(item.created_at).toLocaleDateString()}`;
    $('#itemDescription').textContent = item.description || 'No description provided.';

    const statusEl = $('#itemStatus');
    const status = item.status || 'Ongoing';
    statusEl.textContent = status;

    this.updatePaymentSummary();

    $('#loadingState').style.display = 'none';
    $('#detailsContent').style.display = 'grid';
  }

  updatePaymentSummary() {
    if (!this.currentItem) return;

    const priceNum = Number(this.currentItem.price) || 0;
    const subtotal = priceNum * this.quantity;
    const fee = subtotal * 0.02; // 2% service fee
    const total = subtotal + fee;

    $('#subtotal').textContent = `RM ${subtotal.toFixed(2)}`;
    $('#serviceFee').textContent = `RM ${fee.toFixed(2)}`;
    $('#totalAmount').textContent = `RM ${total.toFixed(2)}`;
  }

  wireEvents() {
    // Quantity events
    $('#increaseQty').addEventListener('click', () => {
      this.quantity++;
      $('#itemQuantity').textContent = this.quantity;
      this.updatePaymentSummary();
    });

    $('#decreaseQty').addEventListener('click', () => {
      if (this.quantity > 1) {
        this.quantity--;
        $('#itemQuantity').textContent = this.quantity;
        this.updatePaymentSummary();
      }
    });

    // Pay button - Now redirects to Stripe
    $('#payButton').addEventListener('click', () => this.handleStripeCheckout());
  }

  async handleStripeCheckout() {
    const user = await authService.getCurrentUser();
    if (!user) {
      alert('Please log in to continue.');
      return;
    }

    const btn = $('#payButton');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Redirecting to Stripe...';

    try {
      console.log(`[Stripe] Initiating checkout for: ${this.currentItem.title}`);

      // Calculate final amount from UI to be safe
      const totalAmountStr = $('#totalAmount').textContent.replace('RM ', '');
      const totalAmount = parseFloat(totalAmountStr);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: this.currentItem.id,
          itemTitle: this.currentItem.title,
          amount: totalAmount,
          quantity: this.quantity,
          buyerId: user.id,
          sellerId: this.currentItem.owner_id,
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Redirect to Stripe Hosted Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('[Stripe] Checkout error:', err);
      alert('Payment Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const details = new MarketplaceDetails();
  details.init();
});
