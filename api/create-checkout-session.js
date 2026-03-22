import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!stripe) {
      throw new Error(
        'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.'
      );
    }

    const { itemId, itemTitle, amount, quantity, buyerId, sellerId } = req.body;

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const baseUrl = process.env.VITE_APP_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'fpx'],
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: { name: itemTitle },
            unit_amount: Math.round(amount * 100),
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

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[API] Checkout Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
