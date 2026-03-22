# Stripe Sandbox Integration Guide
> For Student Developers | Dashboard Subscription App

---

## 📋 Prerequisites

Before you start, make sure you have the following:

### Accounts
- [ ] [Stripe Account](https://stripe.cancom) — free to sign up, no credit card needed
- [ ] A working backend (Node.js / Python / PHP etc.)
- [ ] A working frontend (React / Vue / Next.js etc.)

### Tools & Software
- [ ] **Node.js** v16+ installed → `node -v`
- [ ] **npm** or **yarn** installed → `npm -v`
- [ ] **Git** installed → `git --version`
- [ ] A code editor (VS Code recommended)
- [ ] **Postman** or **Thunder Client** (for testing API calls)

### Knowledge Required
- Basic JavaScript / your chosen language
- Basic understanding of REST APIs
- Basic understanding of frontend frameworks (React/Vue/etc.)

---

## 🗂️ Project Structure Assumption

This guide assumes your app has:
```
your-app/
├── frontend/        # React / Vue / Next.js
├── backend/         # Node.js / Express or equivalent
└── .env             # Environment variables
```

---

## 🚀 Step 1 — Set Up Stripe Account

1. Go to [stripe.com](https://stripe.com) and create a free account
2. Verify your email
3. In the Stripe Dashboard, make sure you are in **Test Mode** (toggle top left)
4. Go to **Developers → API Keys**
5. Copy your keys:

```
Publishable key:  pk_test_xxxxxxxxxxxxxxxxxxxx
Secret key:       sk_test_xxxxxxxxxxxxxxxxxxxx
```

> ⚠️ Never expose your Secret Key on the frontend. It goes in your backend only.

---

## 🔧 Step 2 — Install Stripe Libraries

### Backend (Node.js)
```bash
npm install stripe
```

### Frontend (React/Vue)
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🌍 Step 3 — Environment Variables

Create a `.env` file in your project root:

```env
# Backend
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

> 💡 If using React (Create React App), use `REACT_APP_` prefix instead of `VITE_`

---

## 🏗️ Step 4 — Create Subscription Plans in Stripe

1. Go to Stripe Dashboard → **Products**
2. Click **Add Product**
3. Create the following plans:

| Plan | Price | Billing |
|------|-------|---------|
| Free | RM 0 / month | Monthly |
| Basic | RM X / month | Monthly |
| Pro | RM X / month | Monthly |
| Enterprise | RM X / month | Monthly |

4. After creating each plan, copy the **Price ID** (starts with `price_`)

```
Free:         price_free_xxxxxxxxxxxx
Basic:        price_basic_xxxxxxxxxxxx
Pro:          price_pro_xxxxxxxxxxxx
Enterprise:   price_enterprise_xxxxxxxxxxxx
```

---

## 🔌 Step 5 — Backend Integration

### Initialize Stripe
```javascript
// backend/stripe.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

### Create a Customer
```javascript
// When a user registers, create a Stripe customer
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: { userId: user.id }
});

// Save customer.id to your database
await db.users.update({ stripeCustomerId: customer.id }, { where: { id: user.id } });
```

### Create Checkout Session (Upgrade Flow)
```javascript
// backend/routes/payment.js
app.post('/api/create-checkout-session', async (req, res) => {
  const { planPriceId, userId } = req.body;

  const user = await db.users.findOne({ where: { id: userId } });

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    payment_method_types: ['card', 'fpx'], // FPX for Malaysian users
    line_items: [{ price: planPriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId }
  });

  res.json({ url: session.url });
});
```

### Get Current User Plan
```javascript
// backend/routes/user.js
app.get('/api/user/plan', async (req, res) => {
  const user = await db.users.findOne({ where: { id: req.user.id } });

  res.json({ plan: user.subscriptionPlan }); // 'free', 'basic', 'pro', 'enterprise'
});
```

---

## 🪝 Step 6 — Webhook Setup (Real-Time Plan Detection)

Webhooks are how Stripe tells your backend when a payment succeeds or a plan changes.

### Install Stripe CLI (for local testing)
```bash
# Download from https://stripe.com/docs/stripe-cli
# Then login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the **webhook signing secret** it gives you and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

### Webhook Handler
```javascript
// backend/routes/webhook.js
const express = require('express');
const stripe = require('../stripe');
const router = express.Router();

// CRITICAL: Use raw body for Stripe signature verification
router.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;

      // Fetch the subscription to get the plan
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;

      // Map price ID to plan name
      const planMap = {
        'price_basic_xxxx': 'basic',
        'price_pro_xxxx': 'pro',
        'price_enterprise_xxxx': 'enterprise',
      };

      const newPlan = planMap[priceId] || 'free';

      // Update user plan in your database
      await db.users.update(
        { subscriptionPlan: newPlan, stripeSubscriptionId: subscriptionId },
        { where: { id: userId } }
      );

      console.log(`✅ User ${userId} upgraded to ${newPlan}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await db.users.findOne({ where: { stripeSubscriptionId: subscription.id } });

      if (user) {
        await db.users.update({ subscriptionPlan: 'free' }, { where: { id: user.id } });
        console.log(`⬇️ User ${user.id} downgraded to free`);
      }
      break;
    }
  }

  res.json({ received: true });
});
```

---

## 🖥️ Step 7 — Frontend Integration

### Redirect to Stripe Checkout
```javascript
// frontend/src/components/UpgradeButton.jsx
import { useState } from 'react';

export default function UpgradeButton({ planPriceId }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planPriceId, userId: currentUser.id })
    });

    const { url } = await res.json();
    window.location.href = url; // Redirect to Stripe hosted checkout
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Redirecting...' : 'Upgrade Plan'}
    </button>
  );
}
```

### Fetch and Store Plan in Global State
```javascript
// frontend/src/context/PlanContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const PlanContext = createContext();

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free');

  const fetchPlan = async () => {
    const res = await fetch('/api/user/plan');
    const data = await res.json();
    setPlan(data.plan);
  };

  useEffect(() => {
    fetchPlan(); // Fetch on load

    // Poll every 30 seconds to catch upgrades
    const interval = setInterval(fetchPlan, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, setPlan, fetchPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
```

### Feature Gate on Overview Page
```javascript
// frontend/src/pages/Overview.jsx
import { usePlan } from '../context/PlanContext';

const FEATURES = {
  free:       ['overview', 'log_consumption'],
  basic:      ['overview', 'log_consumption'],
  pro:        ['overview', 'log_consumption', 'demand_response', 'tariff_zone', 'live_load'],
  enterprise: ['overview', 'log_consumption', 'demand_response', 'tariff_zone', 'live_load', 'tou_schedule', 'ai_forecasting'],
};

export default function Overview() {
  const { plan } = usePlan();
  const allowed = FEATURES[plan] || FEATURES['free'];

  const show = (feature) => allowed.includes(feature);

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button>Overview</button>
        {show('log_consumption')  && <button>Log Consumption</button>}
        {show('demand_response')  && <button>Demand Response</button>}
        {show('tou_schedule')     && <button>ToU Schedule</button>}
        {show('ai_forecasting')   && <button>AI Forecasting</button>}
      </div>

      {/* Widgets */}
      {show('tariff_zone') && <TariffZoneWidget />}
      {show('live_load')   && <LiveLoadWidget />}
    </div>
  );
}
```

---

## 🧪 Step 8 — Testing in Sandbox

Use these Stripe test cards — no real money involved:

| Scenario | Card Number | Result |
|----------|-------------|--------|
| Successful payment | `4242 4242 4242 4242` | ✅ Success |
| Payment declined | `4000 0000 0000 0002` | ❌ Declined |
| Requires authentication | `4000 0025 0000 3155` | 🔐 3D Secure |

**For all test cards:**
- Expiry: Any future date (e.g. `12/34`)
- CVC: Any 3 digits (e.g. `123`)
- ZIP: Any 5 digits (e.g. `12345`)

### Test FPX (Malaysian Banks)
Stripe provides test FPX bank options in sandbox mode automatically. Just select FPX at checkout and choose any test bank shown.

---

## 🔄 Full Flow Summary

```
User signs up
      ↓
Backend creates Stripe Customer → saves stripeCustomerId to DB
      ↓
User clicks Upgrade → frontend calls /api/create-checkout-session
      ↓
User redirected to Stripe hosted checkout → pays with test card
      ↓
Stripe fires checkout.session.completed webhook
      ↓
Backend receives webhook → updates user plan in DB
      ↓
Frontend polls /api/user/plan every 30s → detects new plan
      ↓
PlanContext updates global state
      ↓
Overview page reactively re-renders → new features appear ✅
```

---

## ❗ Common Mistakes to Avoid

- Never put `STRIPE_SECRET_KEY` in frontend code
- Always use `express.raw()` for webhook routes — not `express.json()`
- Always verify webhook signature using `stripe.webhooks.constructEvent()`
- Test in **Test Mode** only — never use real cards during development
- Make sure your webhook URL is publicly accessible (use [ngrok](https://ngrok.com) for local testing)

---

## 📦 Summary of Dependencies

| Package | Where | Purpose |
|---------|-------|---------|
| `stripe` | Backend | Stripe SDK |
| `@stripe/stripe-js` | Frontend | Load Stripe.js |
| `@stripe/react-stripe-js` | Frontend | React components |
| `dotenv` | Backend | Load env variables |

---

## 🔗 Useful Links

- [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe FPX Docs](https://stripe.com/docs/payments/fpx)
- [Stripe CLI Download](https://stripe.com/docs/stripe-cli)
- [ngrok (local webhook testing)](https://ngrok.com)
