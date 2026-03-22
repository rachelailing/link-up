// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Initialize Stripe only if the key is provided to prevent startup crashes
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY is missing from .env. Stripe features will be unavailable.');
}
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase URL or Service Key missing. Backend features may fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors());

// JSON parser for all routes (since we've removed the raw webhook route)
app.use(express.json());

/**
 * Create Checkout Session
 * Called by frontend when a user clicks "Pay Now"
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.');
    }

    const { itemId, itemTitle, amount, quantity, buyerId, sellerId } = req.body;

    console.log(`[API] Creating Checkout Session for: ${itemTitle} (RM ${amount})`);

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const baseUrl = process.env.VITE_APP_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'fpx'],
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: itemTitle,
            },
            unit_amount: Math.round(amount * 100), // convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/pages/student/purchase.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pages/student/marketplace-details.html?id=${itemId}&payment=cancel`,
      metadata: {
        itemId: itemId.toString(),
        buyerId,
        sellerId,
        quantity: quantity.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[API] Checkout Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verify Stripe Session
 * Called by frontend (purchase.html) after a successful redirect
 */
app.get('/api/verify-session', async (req, res) => {
  const { session_id } = req.query;

  try {
    if (!stripe) throw new Error('Stripe not configured.');

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const { itemId, buyerId, sellerId, quantity } = session.metadata;

      // Check if order already exists in Supabase to avoid duplicates
      const { data: existingOrder } = await supabase
        .from('marketplace_orders')
        .select('id')
        .eq('item_id', parseInt(itemId))
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('status', 'Completed')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Within last hour
        .single();

      if (!existingOrder) {
        console.log(`[Verify] Recording order for item ${itemId}`);
        const { error } = await supabase.from('marketplace_orders').insert([
          {
            item_id: parseInt(itemId),
            buyer_id: buyerId,
            seller_id: sellerId,
            quantity: parseInt(quantity),
            total_amount: session.amount_total / 100,
            bank_name: 'Stripe',
            status: 'Completed',
          },
        ]);

        if (error) throw error;
      }

      res.json({ success: true, order: session.metadata });
    } else {
      res.status(400).json({ success: false, error: 'Payment not completed' });
    }
  } catch (err) {
    console.error('[Verify] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ... (rest of the file remains the same until the end)

const PORT = process.env.PORT || 3000;

// Export for Vercel
export default app;

// Only start the server if this file is run directly (local development)
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 Stripe Backend Server running on http://127.0.0.1:${PORT}`);
    console.log('--------------------------------------------------');
  });

  server.on('error', (err) => {
    console.error('❌ SERVER ERROR:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    }
  });
}

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});
