// POST /api/checkout — turn a chosen amount into a Stripe Checkout Session.
//
// The browser sends what the person picked. This decides whether it is
// acceptable, builds the session with the secret key, and hands back only a
// URL. The secret key never leaves this process and no price is ever taken on
// trust from the request body: a tampered request asking for 0.01 EUR is
// refused here, which is the only place refusing it means anything.
//
// Hosted Checkout rather than an embedded card form, on purpose:
//   - card details never touch the site, which is what the promise page says
//   - Apple Pay, Google Pay, iDEAL, Bancontact and SEPA appear on their own
//     through the payment methods enabled in the dashboard, with no extra code
//   - Stripe hosts the 3-D Secure flow, so no SCA handling lives here
//
// GET /api/checkout?health=1 reports whether the wiring is complete without
// revealing anything.

import {
  stripeCall, validateGift, CURRENCIES, allowedCurrencies,
  humanError, logStripeFailure, isZeroDecimal,
} from '../lib/stripe.js';

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);

// Best-effort per-instance throttle. Not a security control on its own, but it
// stops a single browser from opening hundreds of sessions.
const hits = new Map();
function limited(ip) {
  const now = Date.now(); const win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > 12;
}

function siteUrl(req) {
  const configured = process.env.SITE_URL && process.env.SITE_URL.replace(/\/$/, '');
  if (configured) return configured;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return host ? `${proto}://${host}` : 'https://anhsonmovement.org';
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query && req.query.health) {
    return res.status(200).json({
      endpoint: 'checkout',
      ready: !!process.env.STRIPE_SECRET_KEY,
      mode: /^sk_live/.test(process.env.STRIPE_SECRET_KEY || '') ? 'live' : 'test',
      webhook_secret_present: !!process.env.STRIPE_WEBHOOK_SECRET,
      currencies: allowedCurrencies(),
      limits: allowedCurrencies().reduce((o, c) => {
        o[c] = { min: CURRENCIES[c].min, max: CURRENCIES[c].max }; return o;
      }, {}),
      hint: process.env.STRIPE_SECRET_KEY
        ? 'Stripe key present. POST an amount to open a checkout session.'
        : 'Set STRIPE_SECRET_KEY in Vercel, then redeploy.',
    });
  }

  // ---- currency probe -------------------------------------------------------
  // GET /api/checkout?probe=vnd
  // Asks the account whether it can present a currency, by trying the smallest
  // allowed amount and throwing the session away again. Nothing is charged and
  // no URL is returned, so this is safe to call and useless to abuse. It skips
  // the allowlist on purpose: the currency worth testing is the one that is
  // still switched off.
  if (req.method === 'GET' && req.query && req.query.probe) {
    const want = String(req.query.probe).toLowerCase().slice(0, 3);
    const rules = CURRENCIES[want];
    if (!rules) return res.status(400).json({ error: 'Unknown currency' });
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    const probeIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'probe';
    if (limited('probe:' + probeIp)) {
      return res.status(429).json({ error: 'Too many probes. Try again in a few minutes.' });
    }

    const amountMinor = isZeroDecimal(want) ? rules.min : Math.round(rules.min * 100);
    let session = null;
    try {
      session = await stripeCall('/checkout/sessions', {
        body: {
          mode: 'payment',
          submit_type: 'donate',
          success_url: 'https://www.anhsonmovement.org/?give=probe',
          cancel_url: 'https://www.anhsonmovement.org/?give=probe',
          line_items: [{
            quantity: 1,
            price_data: {
              currency: want,
              unit_amount: amountMinor,
              product_data: { name: 'Currency probe. Not a real gift.' },
            },
          }],
          metadata: { probe: '1' },
        },
      });
    } catch (err) {
      logStripeFailure('currency probe ' + want, err);
      return res.status(200).json({
        currency: want,
        accepted: false,
        zeroDecimal: isZeroDecimal(want),
        minorUnitsTried: amountMinor,
        // this one IS safe to surface: it is our own diagnostic, not a giver
        reason: String((err && err.message) || 'refused').slice(0, 240),
        code: (err && err.stripeCode) || null,
      });
    }

    // do not leave a stray open session behind
    let cleaned = false;
    try {
      if (session && session.id) {
        await stripeCall(`/checkout/sessions/${encodeURIComponent(session.id)}/expire`, {});
        cleaned = true;
      }
    } catch (e) { /* it expires on its own within 24 hours anyway */ }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      currency: want,
      accepted: true,
      zeroDecimal: isZeroDecimal(want),
      minorUnitsTried: amountMinor,
      readsBackAs: session && session.amount_total,
      sessionCurrency: session && session.currency,
      paymentMethods: (session && session.payment_method_types) || null,
      liveMode: !!(session && session.livemode),
      probeSessionExpired: cleaned,
      enabledForVisitors: allowedCurrencies().indexOf(want) > -1,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('checkout called with no STRIPE_SECRET_KEY');
    return res.status(503).json(humanError('not_configured'));
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    return res.status(429).json({
      code: 'rate',
      en: 'That is a lot of attempts in a short time. Please wait a minute and try again.',
      vn: 'Bạn đã thử khá nhiều lần trong thời gian ngắn. Vui lòng đợi một phút rồi thử lại.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  const check = validateGift({
    amount: body.amount, currency: body.currency, frequency: body.frequency,
  });
  if (!check.ok) {
    // Deliberately generic: the interface already showed the allowed range, so
    // a precise refusal here would only help someone probing the endpoint.
    return res.status(400).json(humanError(check.why === 'currency' ? 'currency' : 'range'));
  }
  const { currency, amountMinor, major } = check;
  const monthly = body.frequency === 'monthly';

  const email = clean(body.email, 140);
  // Empty is the same as anonymous. A blank field is not consent, and treating
  // it as a name would put an empty row in front of Sơn.
  const anonymous = body.anonymous === true || !clean(body.name, 60);
  const giverName = anonymous ? '' : clean(body.name, 60);
  const lang = clean(body.lang, 4) === 'vn' ? 'vn' : 'en';
  const site = siteUrl(req);

  // Shown to the giver on the Stripe page and on their receipt.
  const NAME = {
    en: monthly ? 'Monthly gift to the Anh Sơn Movement' : 'Gift to the Anh Sơn Movement',
    vn: monthly ? 'Món quà hằng tháng cho phong trào Anh Sơn' : 'Món quà cho phong trào Anh Sơn',
  };
  const DESC = {
    en: 'Spent on meals, warm clothes, blankets, school things and materials, handed over in Vietnam. Anh Sơn Movement is not a registered charity, so this gift is not tax-deductible.',
    vn: 'Được dùng cho bữa ăn, áo ấm, chăn, đồ dùng học tập và vật liệu, trao tận tay tại Việt Nam. Anh Sơn Movement không phải tổ chức từ thiện đã đăng ký, nên món quà này không được khấu trừ thuế.',
  };

  const price = {
    currency,
    unit_amount: amountMinor,
    product_data: { name: NAME[lang], description: DESC[lang] },
  };
  if (monthly) price.recurring = { interval: 'month' };

  const session = {
    mode: monthly ? 'subscription' : 'payment',
    // The submit button reads "Donate" rather than "Pay".
    submit_type: monthly ? undefined : 'donate',
    line_items: [{ quantity: 1, price_data: price }],
    success_url: `${site}/?give=thanks&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/?give=cancelled#support`,
    locale: lang === 'vn' ? 'vi' : 'auto',
    // Metadata is for us, in the dashboard and in the webhook. Nothing
    // payment-sensitive goes in here, and nothing that identifies a person
    // beyond what they typed themselves.
    metadata: {
      source: clean(body.source, 40) || 'site',
      language: lang,
      frequency: monthly ? 'monthly' : 'once',
      display_amount: `${major} ${currency.toUpperCase()}`,
      // Only ever read back by us, on the private thanks page. It is the one
      // thing here a person typed about themselves, so it is also the one thing
      // that must never end up anywhere public.
      giver: anonymous ? 'anonymous' : 'named',
      giver_name: giverName,
    },
  };
  if (email && isEmail(email)) session.customer_email = email;

  // A subscription needs a Customer; a one-off does not, and not creating one
  // means we hold less about people who give once.
  if (monthly) {
    session.subscription_data = {
      metadata: { source: clean(body.source, 40) || 'site', language: lang },
    };
  } else {
    session.customer_creation = 'if_required';
    session.payment_intent_data = {
      // What the giver sees on their bank statement. The promise page tells
      // them to expect exactly this string, so the two must stay in step.
      statement_descriptor_suffix: 'ANH SON',
      metadata: { frequency: 'once', language: lang },
    };
  }

  try {
    const out = await stripeCall('/checkout/sessions', { body: session });
    if (!out || !out.url) throw new Error('Stripe returned a session with no URL');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      url: out.url,
      id: out.id,
      // Echoed back so the interface can show what it is about to charge,
      // computed by the server rather than trusted from the browser.
      amount: major,
      currency,
      zeroDecimal: isZeroDecimal(currency),
      frequency: monthly ? 'monthly' : 'once',
    });
  } catch (err) {
    logStripeFailure('create checkout session', err);
    // A raw Stripe message can name a price, an account or a disabled payment
    // method. The giver gets a sentence they can act on instead.
    const human = humanError(err);
    return res.status(502).json(human);
  }
}
