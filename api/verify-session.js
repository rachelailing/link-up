import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { session_id } = req.query;

  try {
    if (!stripe) throw new Error('Stripe not configured.');
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const { itemId, buyerId, sellerId, quantity } = session.metadata;

      const { data: existingOrder } = await supabase
        .from('marketplace_orders')
        .select('id')
        .eq('item_id', parseInt(itemId))
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('status', 'Completed')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
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
      res.status(200).json({ success: true, order: session.metadata });
    } else {
      res.status(400).json({ success: false, error: 'Payment not completed' });
    }
  } catch (err) {
    console.error('[Verify] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
