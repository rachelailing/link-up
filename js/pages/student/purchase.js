// js/pages/student/purchase.js
import { $, $$ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';
import { supabase } from '../../config/supabase.js';

class PurchaseHistory {
  constructor() {
    this.listEl = $('#purchaseList');
  }

  async init() {
    const user = await authService.requireAuth('student');
    if (!user) return;

    setActiveNav();
    wireLogout();

    await this.handlePaymentVerification();
    await this.renderPurchases(user.id);
  }

  /**
   * Checks if we just arrived from a successful Stripe checkout.
   * If so, tells the backend to verify the session and record the order.
   */
  async handlePaymentVerification() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success' && sessionId) {
      console.log('[Purchase] New successful payment detected. Verifying session...');

      // Clear URL params so we don't re-verify on refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      try {
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          alert('Payment Verified! Your order has been recorded.');
        } else {
          console.error('Verification failed:', data.error);
        }
      } catch (err) {
        console.error('Error calling verification API:', err);
      }
    }
  }

  async renderPurchases(userId) {
    const { data: orders, error } = await supabase
      .from('marketplace_orders')
      .select(
        `
        *,
        marketplace_items (
          title,
          image_url
        )
      `
      )
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      this.listEl.innerHTML = `
        <div class="card pad">
          <p class="muted">You haven't made any purchases yet.</p>
          <a href="marketplace.html" class="btn btn-primary" style="margin-top:10px;">Browse Marketplace</a>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = orders
      .map((order) => {
        const item = order.marketplace_items;
        return `
        <div class="card pad" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${item?.image_url || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div>
              <h3 style="margin:0;">${item?.title || 'Unknown Item'}</h3>
              <p class="muted" style="margin:4px 0 0 0;">Purchased on: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: var(--blue);">RM ${Number(order.total_amount).toFixed(2)}</div>
            <span class="badge inprogress">${order.status}</span>
          </div>
        </div>
      `;
      })
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new PurchaseHistory();
  page.init();
});
