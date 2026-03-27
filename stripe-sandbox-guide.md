# Stripe Sandbox Integration Guide

A complete guide to setting up and testing your Stripe integration using Stripe's sandbox/test mode environment.

---

## 1. What is Stripe Sandbox / Test Mode?

Stripe provides two testing environments:

- **Test Mode** — the classic testing environment, available to all users by default
- **Sandboxes** — the newer, recommended isolated testing environment (default for new accounts as of 2025)

Both environments let you simulate payments without moving real money or charging real cards. Your API keys determine which mode your code runs in — not the Dashboard toggle.

> ⚠️ The Stripe Services Agreement prohibits using real card details in test mode. Always use Stripe's designated test card numbers.

---

## 2. Setting Up Your Sandbox

### Step 1 — Access Your Sandbox

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Click the **account picker** (top left)
3. Click **Switch to sandbox** → **Create sandbox**
4. Give it a name (e.g. `Development`, `Staging`)
5. Choose either:
   - **Copy your account** — mirrors your live settings
   - **Create from scratch** — blank slate

> Your account can have up to **5 sandboxes**.

### Step 2 — Get Your Test API Keys

1. Inside the sandbox, go to **Developers → API Keys**
2. Copy your:
   - **Publishable key** → starts with `pk_test_...`
   - **Secret key** → starts with `sk_test_...`

### Step 3 — Add Keys to Your Project

**.env file (local development):**

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Vercel Environment Variables (production):**
| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

---

## 3. Backend Setup (Express / Node.js)

```js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { itemTitle, amount, quantity, itemId } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: { name: itemTitle },
          unit_amount: Math.round(amount * 100), // convert to cents
        },
        quantity: quantity,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_APP_URL}/cancel?id=${itemId}`,
  });

  res.json({ url: session.url });
});
```

---

## 4. Frontend Setup

```js
// Trigger checkout
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemTitle: 'Pro Video Editing Service',
    amount: 51.0,
    quantity: 1,
    itemId: 5,
  }),
});

const { url } = await response.json();
window.location.href = url; // redirect to Stripe hosted checkout
```

---

## 5. Test Card Numbers

For all test cards, use:

- **Expiry:** any future date (e.g. `12/34`)
- **CVC:** any 3 digits (e.g. `123`)
- **ZIP:** any 5 digits (e.g. `12345`)

### ✅ Successful Payments

| Card Brand            | Number                | Notes            |
| --------------------- | --------------------- | ---------------- |
| Visa                  | `4242 4242 4242 4242` | Standard success |
| Mastercard            | `5555 5555 5555 4444` | Standard success |
| Mastercard (2-series) | `2223 0031 2200 3222` | Standard success |
| American Express      | `3782 8224 6310 005`  | 4-digit CVC      |
| Discover              | `6011 1111 1111 1117` | Standard success |
| UnionPay              | `6200 0000 0000 0005` | Standard success |

### ❌ Declined Payments

| Scenario              | Number                |
| --------------------- | --------------------- |
| Generic decline       | `4000 0000 0000 0002` |
| Insufficient funds    | `4000 0000 0000 9995` |
| Lost card             | `4000 0000 0000 9987` |
| Stolen card           | `4000 0000 0000 0019` |
| Expired card          | `4000 0000 0000 0069` |
| Incorrect CVC         | `4000 0000 0000 0127` |
| Card declined (fraud) | `4100 0000 0000 0019` |

### 🔐 3D Secure Authentication

| Scenario                     | Number                |
| ---------------------------- | --------------------- |
| 3DS required — succeeds      | `4000 0000 0000 3220` |
| 3DS required — fails         | `4000 0000 0000 3063` |
| 3DS supported — not enrolled | `4242 4242 4242 4242` |

### 🌏 International / Country-Specific

| Country                  | Number                           |
| ------------------------ | -------------------------------- |
| Malaysia (FPX)           | Use `fpx` as payment method type |
| UK (Visa)                | `4000 0082 6000 0000`            |
| EU (3DS required by SCA) | `4000 0025 0000 3155`            |

---

## 6. Testing Webhooks Locally

Install the Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows / Linux
# Download from https://stripe.com/docs/stripe-cli
```

Login and forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

Trigger a test event:

```bash
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

---

## 7. Verifying a Checkout Session (Backend)

```js
app.get('/api/verify-session', async (req, res) => {
  const { session_id } = req.query;

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status === 'paid') {
    // Record order in database
    res.json({ success: true, metadata: session.metadata });
  } else {
    res.status(400).json({ success: false, error: 'Payment not completed' });
  }
});
```

---

## 8. Common Mistakes to Avoid

| Mistake                                                    | Fix                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Using real card numbers in test mode                       | Always use Stripe's test card numbers                            |
| Forgetting to swap `sk_test_` for `sk_live_` before launch | Add API key verification to your deployment checklist            |
| Not testing declined scenarios                             | Test both success and failure flows                              |
| Not testing webhooks                                       | Use Stripe CLI to forward and simulate events locally            |
| Double charges on retry                                    | Use idempotency keys in your API calls                           |
| Environment variables missing on Vercel                    | Add all Stripe keys to Vercel Environment Variables and redeploy |

---

## 9. Going Live Checklist

- [ ] All test scenarios pass (success, decline, 3DS)
- [ ] Webhooks tested and working
- [ ] Swap `sk_test_` / `pk_test_` keys for `sk_live_` / `pk_live_` in all environments
- [ ] Vercel environment variables updated with live keys
- [ ] Stripe account activated (business details submitted)
- [ ] RLS enabled on Supabase tables
- [ ] Error handling tested for all failure scenarios

---

## 10. Useful Links

- [Stripe Testing Docs](https://docs.stripe.com/testing)
- [Stripe Sandbox Docs](https://docs.stripe.com/sandboxes)
- [Stripe CLI Docs](https://docs.stripe.com/stripe-cli)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Test Cards (official)](https://docs.stripe.com/testing#cards)
