// POST /api/stripe-webhook — Stripe telling us what actually happened.
//
// This is the only source of truth about money. The browser's success screen
// is a courtesy; this is the record. Everything here runs after the fact and
// must therefore be safe to receive twice, out of order, or months late.
//
// Set up in the Stripe dashboard: Developers -> Webhooks -> add endpoint
//   https://anhsonmovement.org/api/stripe-webhook
// listening for:
//   checkout.session.completed          a gift, or a monthly gift starting
//   invoice.paid                        a monthly gift renewing
//   invoice.payment_failed              a monthly gift failing to renew
//   charge.refunded                     a gift given back
//   customer.subscription.deleted       a monthly gift stopped
// then copy the signing secret into STRIPE_WEBHOOK_SECRET.
//
// The signature check is not optional. Without it this URL is a public
// endpoint that anyone can post "a gift arrived" to.

import {
  verifySignature, readRawBody, toMajorUnits, isZeroDecimal,
} from '../lib/stripe.js';

// No bodyParser switch here on purpose. `config.api.bodyParser` is a Next.js
// setting and does nothing for a plain /api function, so leaving it in would
// imply a protection that is not there. What actually matters is that
// readRawBody drains the stream before anything touches req.body, because on
// Vercel that property is a getter which parses and discards the raw bytes.

// Stripe retries, and a retry is not a second gift. This remembers what has
// already been handled for as long as the instance lives. It is a best-effort
// guard against duplicate NOTIFICATIONS, not an accounting ledger; Stripe's own
// dashboard remains the record of what came in.
const seen = new Map();
const SEEN_TTL = 24 * 60 * 60 * 1000;
function alreadyHandled(id) {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > SEEN_TTL) seen.delete(k);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}

const money = (minor, cur) => {
  const n = toMajorUnits(minor, cur);
  const s = isZeroDecimal(cur) ? String(n) : n.toFixed(2);
  return `${s} ${String(cur || '').toUpperCase()}`;
};

/* ── letting the team know ─────────────────────────────────────────────────
   Web3Forms cannot be called from a Vercel function: it sits behind Cloudflare
   and answers a serverless request with a challenge page. That is documented
   at the top of api/nominate.js and it applies here too, so the notice goes
   through Resend when it is configured. With nothing configured the event is
   still logged and still verified; only the email is skipped. Nothing about
   the payment depends on this succeeding. */
async function notify(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.TEAM_EMAIL;
  if (!key || !to) { console.log('[gift]', subject, lines.join(' | ')); return; }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Anh Son Movement <onboarding@resend.dev>',
        to: [to],
        subject,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.7;color:#0D1F3D">
          <p style="font:700 18px/1.3 system-ui;margin:0 0 12px">${subject}</p>
          ${lines.map((l) => `<div style="padding:4px 0">${l}</div>`).join('')}
          <p style="color:#635E55;font-size:12px;margin-top:18px">
            Stripe is the record. This note is only so somebody knows without opening the dashboard.</p>
        </div>`,
      }),
    });
  } catch (e) {
    // A failed notification must never turn into a failed webhook, because a
    // non-200 makes Stripe retry a payment event that was handled correctly.
    console.error('[stripe] notify failed', e && e.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query && req.query.health) {
    return res.status(200).json({
      endpoint: 'stripe-webhook',
      ready: !!process.env.STRIPE_WEBHOOK_SECRET,
      notifications: !!(process.env.RESEND_API_KEY && process.env.TEAM_EMAIL),
      hint: process.env.STRIPE_WEBHOOK_SECRET
        ? 'Signing secret present. Point a Stripe endpoint at this URL.'
        : 'Set STRIPE_WEBHOOK_SECRET in Vercel, then redeploy.',
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Refuse rather than accept unverified events. An unsigned endpoint that
    // returns 200 is worse than one that is switched off.
    console.error('stripe-webhook called with no STRIPE_WEBHOOK_SECRET');
    return res.status(503).json({ error: 'Not configured' });
  }

  let raw;
  try { raw = await readRawBody(req); }
  catch { return res.status(400).json({ error: 'Could not read body' }); }

  const check = verifySignature(raw, req.headers['stripe-signature'], secret);
  if (!check.ok) {
    console.error('[stripe] rejected a webhook:', check.why);
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).json({ error: 'Malformed event' }); }

  if (alreadyHandled(event.id)) return res.status(200).json({ received: true, duplicate: true });

  const o = (event.data && event.data.object) || {};
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Fires when Checkout finishes. For a delayed method the money may
        // still be in flight, so say which it is rather than assuming.
        const settled = o.payment_status === 'paid' || o.payment_status === 'no_payment_required';
        const kind = o.mode === 'subscription' ? 'Monthly gift started' : 'Gift received';
        await notify(`${kind}: ${money(o.amount_total, o.currency)}`, [
          `<strong>${money(o.amount_total, o.currency)}</strong>`,
          `Status: ${settled ? 'settled' : 'still processing'}`,
          `Language: ${(o.metadata && o.metadata.language) === 'vn' ? 'Vietnamese' : 'English'}`,
          `From: ${(o.metadata && o.metadata.source) || 'site'}`,
          o.customer_details && o.customer_details.email
            ? `Email: ${o.customer_details.email}` : 'No email given',
        ]);
        break;
      }
      case 'invoice.paid': {
        // The first invoice of a subscription arrives alongside
        // checkout.session.completed; only report the renewals.
        const reason = o.billing_reason;
        if (reason === 'subscription_cycle') {
          await notify(`Monthly gift renewed: ${money(o.amount_paid, o.currency)}`, [
            `<strong>${money(o.amount_paid, o.currency)}</strong>`,
            'A monthly gift renewed as scheduled.',
          ]);
        }
        break;
      }
      case 'invoice.payment_failed': {
        await notify('A monthly gift failed to renew', [
          `${money(o.amount_due, o.currency)} could not be collected.`,
          'Stripe retries on its own. If it keeps failing the subscription ends and the giver is told by Stripe.',
        ]);
        break;
      }
      case 'charge.refunded': {
        await notify(`Gift refunded: ${money(o.amount_refunded, o.currency)}`, [
          `<strong>${money(o.amount_refunded, o.currency)}</strong> went back.`,
          'Make sure the quarterly figures are corrected for this.',
        ]);
        break;
      }
      case 'customer.subscription.deleted': {
        await notify('A monthly gift stopped', [
          'Somebody ended their monthly gift, or it ended after repeated failed payments.',
          'No action needed unless they asked us to stop it and are still being charged.',
        ]);
        break;
      }
      default:
        // Everything else is acknowledged and ignored on purpose.
        break;
    }
  } catch (err) {
    // Our own bookkeeping failing must not make Stripe retry a verified event.
    console.error('[stripe] handling', event.type, 'failed:', err && err.message);
  }

  return res.status(200).json({ received: true });
}
