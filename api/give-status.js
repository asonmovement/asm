// GET /api/give-status?session_id=cs_... — did that gift actually go through.
//
// Stripe sends the giver back to /?give=thanks&session_id=... when Checkout
// finishes. That redirect proves nothing: anyone can type that URL, and some
// payment methods (iDEAL, SEPA, bank transfers) are still pending at the
// moment of redirect. So the thank-you screen asks this endpoint, which reads
// the session back from Stripe with the secret key and answers from what
// Stripe says, not from what the URL claims.
//
// What comes back is deliberately thin: a state, an amount and a currency.
// No customer id, no payment-method details, no email echo, nothing that
// would turn a guessed session id into a way of reading someone's data.

import { stripeCall, toMajorUnits, logStripeFailure, humanError } from '../lib/stripe.js';

const OK = new Set(['paid', 'no_payment_required']);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const id = String((req.query && req.query.session_id) || '').trim();
  // Session ids are cs_test_… / cs_live_… . Refusing anything else keeps
  // arbitrary paths out of the URL we are about to build.
  if (!/^cs_[A-Za-z0-9_]{10,80}$/.test(id)) {
    return res.status(400).json({ state: 'unknown', ...humanError('default') });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ state: 'unknown', ...humanError('not_configured') });
  }

  try {
    const s = await stripeCall(`/checkout/sessions/${encodeURIComponent(id)}`, { method: 'GET' });

    let state = 'pending';
    if (s.status === 'expired') state = 'expired';
    else if (OK.has(s.payment_status)) state = 'paid';
    else if (s.status === 'complete') state = 'processing';

    return res.status(200).json({
      state,
      amount: toMajorUnits(s.amount_total, s.currency),
      currency: s.currency || null,
      frequency: (s.metadata && s.metadata.frequency) || (s.mode === 'subscription' ? 'monthly' : 'once'),
      language: (s.metadata && s.metadata.language) || 'en',
    });
  } catch (err) {
    // A wrong or foreign session id lands here as a 404 from Stripe. Say
    // nothing about which it was.
    logStripeFailure('read checkout session', err);
    return res.status(200).json({ state: 'unknown', ...humanError('default') });
  }
}
