// Shared Stripe plumbing. Deliberately dependency-free.
//
// Why no `stripe` npm package: this project has zero dependencies and no build
// step, and every function here is a form-encoded POST to a documented REST
// endpoint. The one thing the SDK really buys you is webhook signature
// verification, and that scheme is fully specified, so it is implemented below
// and proved by build/stripetest.py, which feeds it a tampered payload and a
// replayed timestamp and requires both to be rejected. If you ever want the
// SDK instead, add "stripe" to package.json and swap verifySignature for
// stripe.webhooks.constructEvent. Nothing else has to change.
//
// Env vars, all server-side only. None of these may ever reach the browser:
//   STRIPE_SECRET_KEY      sk_test_... or sk_live_...   required
//   STRIPE_WEBHOOK_SECRET  whsec_...                    required for the webhook
//   SITE_URL               https://anhsonmovement.org   used for return links
//   TEAM_EMAIL + RESEND_API_KEY   optional, for the "a gift arrived" notice

import crypto from 'node:crypto';

export const API = 'https://api.stripe.com/v1';

// Pinned so a Stripe-side default change cannot alter behaviour without a
// deliberate edit here. Bump it on purpose, never by accident.
//
// This value is read off the account's own dashboard (the API version shown
// when creating an event destination), not from memory: an invented version
// string is rejected on every single call, which is the kind of failure that
// only shows up once real money is involved. Keep it equal to the version the
// webhook endpoint is set to, so calls and events speak the same dialect.
export const STRIPE_VERSION = '2026-07-29.dahlia';

/* ── currency ──────────────────────────────────────────────────────────────
   Stripe takes amounts in the currency's minor unit. For a two-decimal
   currency that is cents; for a zero-decimal currency the number IS the
   amount. Passing 100000 VND as if it were minor units would charge 100,000
   times too little, and passing €10 as 10 would charge ten cents. This table
   is the only place that distinction lives. */
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg',
  'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

export const isZeroDecimal = (cur) => ZERO_DECIMAL.has(String(cur || '').toLowerCase());

/** Major units (10.50) -> the minor units Stripe expects (1050). */
export function toMinorUnits(major, currency) {
  const n = Number(major);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return isZeroDecimal(currency) ? Math.round(n) : Math.round(n * 100);
}

/** Minor units back to something a person can read. */
export function toMajorUnits(minor, currency) {
  const n = Number(minor) || 0;
  return isZeroDecimal(currency) ? n : n / 100;
}

/* ── what the server is willing to charge ───────────────────────────────────
   The browser proposes; this decides. A request asking for 0.01 EUR or
   9,999,999 EUR is refused here, not in the interface, because the interface
   is the part an attacker controls. */
export const CURRENCIES = {
  eur: { min: 2,     max: 5000,     symbol: '€' },
  usd: { min: 2,     max: 5000,     symbol: '$' },
  // Vietnamese đồng. Zero-decimal. Whether a Netherlands Stripe account can
  // actually present VND depends on the account, so this stays unreachable
  // until STRIPE_ALLOW_VND is set and a real test charge has gone through.
  // 8 digits is Stripe's ceiling for non-card methods, and a zero-decimal
  // currency spends those digits on whole đồng. 99,000,000 stays under it
  // on every payment method; larger gifts go by email, which the page says.
  vnd: { min: 50000, max: 99000000, symbol: '₫' },
};

export function allowedCurrencies() {
  const on = ['eur', 'usd'];
  if (String(process.env.STRIPE_ALLOW_VND || '').toLowerCase() === 'true') on.push('vnd');
  return on;
}

/** Returns { ok, currency, amountMinor } or { ok:false, why }. */
export function validateGift({ amount, currency, frequency }) {
  const cur = String(currency || 'eur').toLowerCase();
  if (!allowedCurrencies().includes(cur)) return { ok: false, why: 'currency' };
  if (frequency !== 'once' && frequency !== 'monthly') return { ok: false, why: 'frequency' };

  const rules = CURRENCIES[cur];
  const major = Number(amount);
  if (!Number.isFinite(major)) return { ok: false, why: 'amount' };
  // Reject fractions of a zero-decimal currency rather than silently rounding.
  if (isZeroDecimal(cur) && !Number.isInteger(major)) return { ok: false, why: 'amount' };
  if (major < rules.min || major > rules.max) return { ok: false, why: 'range' };

  const amountMinor = toMinorUnits(major, cur);
  if (amountMinor <= 0) return { ok: false, why: 'amount' };
  return { ok: true, currency: cur, amountMinor, major };
}

/* ── form encoding ─────────────────────────────────────────────────────────
   Stripe's API is application/x-www-form-urlencoded with bracket notation for
   nested objects: line_items[0][price_data][currency]=eur. */
export function encodeForm(obj, prefix = '', out = []) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value === undefined || value === null || value === '') return;
    const path = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === 'object') encodeForm(item, `${path}[${i}]`, out);
        else out.push(`${encodeURIComponent(`${path}[${i}]`)}=${encodeURIComponent(item)}`);
      });
    } else if (typeof value === 'object') {
      encodeForm(value, path, out);
    } else {
      out.push(`${encodeURIComponent(path)}=${encodeURIComponent(value)}`);
    }
  });
  return out.join('&');
}

export async function stripeCall(path, { method = 'POST', body, key } = {}) {
  const secret = key || process.env.STRIPE_SECRET_KEY;
  if (!secret) throw Object.assign(new Error('STRIPE_SECRET_KEY is not set'), { code: 'no_key' });

  const init = {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Stripe-Version': STRIPE_VERSION,
      Accept: 'application/json',
    },
  };
  if (body) {
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = encodeForm(body);
  }
  const r = await fetch(`${API}${path}`, init);
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.error) {
    const err = new Error((json.error && json.error.message) || `Stripe returned ${r.status}`);
    err.stripeCode = (json.error && json.error.code) || null;
    err.stripeType = (json.error && json.error.type) || null;
    err.status = r.status;
    throw err;
  }
  return json;
}

/* ── webhook signature ─────────────────────────────────────────────────────
   Stripe sends: Stripe-Signature: t=1690000000,v1=<hex>,v1=<hex>
   The signed payload is `${t}.${rawBody}` and the MAC is HMAC-SHA256 keyed on
   the endpoint secret. Multiple v1 values appear while a secret is rotating,
   so any one of them matching is a pass.

   Two things this must get right, and both are tested:
     - the comparison is constant-time, so the signature cannot be guessed a
       byte at a time by timing the response
     - old events are refused, so a captured request cannot be replayed later */
export function verifySignature(rawBody, header, secret, toleranceSeconds = 300) {
  if (!rawBody || !header || !secret) return { ok: false, why: 'missing' };

  let timestamp = null;
  const signatures = [];
  String(header).split(',').forEach((part) => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === 't') timestamp = v;
    else if (k === 'v1') signatures.push(v);
  });
  if (!timestamp || !signatures.length) return { ok: false, why: 'malformed' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, why: 'malformed' };
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > toleranceSeconds) return { ok: false, why: 'too_old' };

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const expected = crypto.createHmac('sha256', secret)
    .update(`${ts}.${payload}`, 'utf8').digest('hex');
  const want = Buffer.from(expected, 'utf8');

  const matched = signatures.some((sig) => {
    const got = Buffer.from(String(sig), 'utf8');
    // timingSafeEqual throws on a length mismatch, which would itself leak.
    if (got.length !== want.length) return false;
    return crypto.timingSafeEqual(got, want);
  });
  return matched ? { ok: true } : { ok: false, why: 'mismatch' };
}

/** The exact bytes Stripe signed.

    On Vercel `req.body` is a lazy getter: reading it parses the stream, and
    once that has happened the raw bytes are unrecoverable and every signature
    check fails. So the stream is drained FIRST and `req.body` is only consulted
    if that produced nothing, which is the case in other hosts that have already
    buffered the request. Do not reorder these. */
export async function readRawBody(req) {
  const chunks = [];
  try {
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
  } catch {
    /* already consumed by something upstream; fall through */
  }
  if (chunks.length) return Buffer.concat(chunks);

  const body = req.body;
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  // An object here means someone parsed it. Re-serialising changes the bytes
  // and the signature will correctly fail, which is better than accepting it.
  if (body && typeof body === 'object') return Buffer.from(JSON.stringify(body), 'utf8');
  return Buffer.alloc(0);
}

/* ── errors a person can read ──────────────────────────────────────────────
   A raw Stripe message ("Your card was declined." is fine, but
   "No such price: 'price_1234'" is not) can leak configuration and always
   reads like a broken machine. Everything is mapped to a sentence someone can
   act on, in both languages. Anything unrecognised falls through to a
   deliberately vague pair. */
const HUMAN = {
  card_declined: [
    'Your bank declined the payment. Nothing was charged. Trying another card usually works.',
    'Ngân hàng của bạn đã từ chối giao dịch. Chưa có khoản nào bị trừ. Thử một thẻ khác thường sẽ được.',
  ],
  expired_card: [
    'That card has expired. Nothing was charged.',
    'Thẻ đó đã hết hạn. Chưa có khoản nào bị trừ.',
  ],
  incorrect_cvc: [
    'The security code did not match. Nothing was charged.',
    'Mã bảo mật không khớp. Chưa có khoản nào bị trừ.',
  ],
  insufficient_funds: [
    'There were not enough funds on that card. Nothing was charged.',
    'Thẻ đó không đủ số dư. Chưa có khoản nào bị trừ.',
  ],
  processing_error: [
    'The payment provider had trouble just now. Nothing was charged. Please try again in a minute.',
    'Nhà cung cấp thanh toán vừa gặp trục trặc. Chưa có khoản nào bị trừ. Vui lòng thử lại sau một phút.',
  ],
  amount_too_small: [
    'That amount is below what we can accept. Please choose a little more.',
    'Số tiền đó thấp hơn mức chúng tôi có thể nhận. Vui lòng chọn cao hơn một chút.',
  ],
  amount_too_large: [
    'That amount is above what this page can take. Email us and we will arrange it properly.',
    'Số tiền đó vượt quá mức trang này nhận được. Hãy gửi email và chúng tôi sẽ sắp xếp đúng cách.',
  ],
  currency: [
    'We cannot take that currency yet.',
    'Chúng tôi chưa nhận loại tiền đó.',
  ],
  range: [
    'Please choose an amount within the range shown.',
    'Vui lòng chọn số tiền trong khoảng được hiển thị.',
  ],
  not_configured: [
    'Giving is not switched on yet. Please try again shortly.',
    'Kênh quyên góp chưa được bật. Vui lòng thử lại sau ít phút.',
  ],
  default: [
    'Something went wrong on our side and nothing was charged. Please try again, or email hello@anhsonmovement.org and we will sort it out.',
    'Có trục trặc từ phía chúng tôi và chưa có khoản nào bị trừ. Vui lòng thử lại, hoặc gửi email tới hello@anhsonmovement.org và chúng tôi sẽ xử lý.',
  ],
};

export function humanError(codeOrError) {
  const code = typeof codeOrError === 'string'
    ? codeOrError
    : (codeOrError && (codeOrError.stripeCode || codeOrError.code)) || 'default';
  const pair = HUMAN[code] || HUMAN.default;
  return { code: HUMAN[code] ? code : 'default', en: pair[0], vn: pair[1] };
}

/** Log the real cause for us; never return it to the browser. */
export function logStripeFailure(where, err) {
  console.error(`[stripe] ${where}`, {
    message: err && err.message,
    code: err && err.stripeCode,
    type: err && err.stripeType,
    status: err && err.status,
  });
}
