// GET /api/thanks?key=… — the people who gave and left a name, so Sơn can
// thank them himself.
//
// There is no database behind this. Stripe already holds every gift, so this
// reads Stripe and renders it; nothing about a giver is stored a second time.
// That matters beyond tidiness: when someone asks to be forgotten, there is
// exactly one place to go, and deleting it there deletes it everywhere.
//
// The route is off unless THANKS_SECRET is set, and the key is compared in
// constant time. It is a private page, so it says so to crawlers and is never
// cached anywhere.
//
// Env vars:
//   THANKS_SECRET   any long random string — without it this route 404s
//   STRIPE_SECRET_KEY  already set for /api/checkout
//
// GET /api/thanks?key=…            a readable page
// GET /api/thanks?key=…&format=json  the same as JSON
// GET /api/thanks?key=…&days=90    how far back to look (default 60, max 365)

import { timingSafeEqual } from 'node:crypto';
import { stripeCall, isZeroDecimal, toMajorUnits, logStripeFailure } from '../lib/stripe.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Never leak whether a wrong key was close to right.
function sameSecret(given, want) {
  const a = Buffer.from(String(given || ''), 'utf8');
  const b = Buffer.from(String(want || ''), 'utf8');
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

const SYMBOL = { eur: '€', usd: '$', vnd: '₫' };

function money(amountMinor, currency) {
  const cur = String(currency || '').toLowerCase();
  const major = isZeroDecimal(cur) ? amountMinor : toMajorUnits(amountMinor, cur);
  const sym = SYMBOL[cur] || '';
  try {
    const n = new Intl.NumberFormat(cur === 'vnd' ? 'vi-VN' : 'en-GB', {
      minimumFractionDigits: isZeroDecimal(cur) ? 0 : 2,
      maximumFractionDigits: isZeroDecimal(cur) ? 0 : 2,
    }).format(major);
    return cur === 'vnd' ? `${n} ${sym}` : `${sym}${n}`;
  } catch {
    return `${major} ${cur.toUpperCase()}`;
  }
}

function page(rows, meta) {
  const body = rows.length
    ? rows.map((r) => `<tr class="${r.anonymous ? 'anon' : ''}">
        <td class="d">${esc(r.date)}</td>
        <td class="n">${r.anonymous
          ? '<span class="tag">anonymous</span>'
          : esc(r.name || '<no name given>')}</td>
        <td class="e">${r.anonymous ? '' : esc(r.email || '')}</td>
        <td class="a">${esc(r.amount)}</td>
        <td class="f">${esc(r.frequency)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No gifts in this period yet.</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>People to thank</title>
<style>
  :root{--navy:#0D1F3D;--gold:#C8922E;--paper:#F6F2E8;--line:#E0D8C7;--muted:#5D6678}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:#17202F;
       font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px 18px 60px}
  .wrap{max-width:860px;margin:0 auto}
  h1{font-size:1.7rem;margin:0 0 .2em;letter-spacing:-.01em}
  .sub{color:var(--muted);margin:0 0 1.6em;font-size:.95rem}
  .stats{display:flex;flex-wrap:wrap;gap:22px;margin:0 0 1.6em;padding-bottom:1.2em;
         border-bottom:1px solid var(--line)}
  .stat b{display:block;font-size:1.5rem;line-height:1.1;font-variant-numeric:tabular-nums}
  .stat span{font-size:.72rem;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
  .tw{overflow-x:auto}
  table{border-collapse:collapse;width:100%;min-width:560px;background:#fff;
        border:1px solid var(--line);border-radius:8px;overflow:hidden}
  th,td{text-align:left;padding:11px 13px;border-bottom:1px solid var(--line);vertical-align:top}
  th{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:#FAF6EE}
  tr:last-child td{border-bottom:none}
  td.a{font-variant-numeric:tabular-nums;white-space:nowrap}
  td.d{white-space:nowrap;color:var(--muted);font-size:.9rem}
  td.n{font-weight:600}
  td.e{color:var(--muted);font-size:.9rem;word-break:break-all}
  td.f{font-size:.82rem;color:var(--muted)}
  tr.anon td.n{font-weight:400}
  .tag{display:inline-block;font-size:.68rem;letter-spacing:.09em;text-transform:uppercase;
       color:var(--muted);background:#EFE9DC;padding:3px 8px;border-radius:99px}
  .empty{color:var(--muted);text-align:center;padding:30px}
  .note{margin-top:1.6em;font-size:.84rem;color:var(--muted);max-width:62ch}
</style></head><body><div class="wrap">
<h1>People to thank</h1>
<p class="sub">Gifts received in the last ${esc(meta.days)} days, newest first. Read live from Stripe.</p>
<div class="stats">
  <div class="stat"><b>${esc(String(meta.named))}</b><span>left a name</span></div>
  <div class="stat"><b>${esc(String(meta.anonymous))}</b><span>anonymous</span></div>
  <div class="stat"><b>${esc(String(meta.total))}</b><span>gifts in total</span></div>
</div>
<div class="tw"><table>
<thead><tr><th>When</th><th>Name</th><th>Email</th><th>Amount</th><th>How often</th></tr></thead>
<tbody>${body}</tbody>
</table></div>
<p class="note">This page is private and is not indexed. Nothing here is stored by the website —
it is read from Stripe each time you open it, which is why deleting a gift in Stripe removes it
from here as well. People who chose to give anonymously are counted but never named.</p>
</div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.THANKS_SECRET;
  const q = req.query || {};

  // Without a secret configured the route does not exist at all — better than
  // an unprotected page nobody remembered to switch off.
  if (!secret) return res.status(404).json({ error: 'Not found' });
  if (!sameSecret(q.key, secret)) return res.status(404).json({ error: 'Not found' });
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const days = Math.min(Math.max(parseInt(q.days, 10) || 60, 1), 365);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  let sessions = [];
  try {
    // Stripe pages at 100. Two pages is 200 gifts, which is plenty for a list
    // somebody reads by eye; more than that and this wants a different shape.
    let starting_after = null;
    for (let page = 0; page < 2; page++) {
      const params = {
        limit: 100,
        'created[gte]': since,
        'expand[]': 'data.customer_details',
      };
      if (starting_after) params.starting_after = starting_after;
      const out = await stripeCall('/checkout/sessions', { method: 'GET', query: params });
      const data = (out && out.data) || [];
      sessions = sessions.concat(data);
      if (!out || !out.has_more || !data.length) break;
      starting_after = data[data.length - 1].id;
    }
  } catch (err) {
    logStripeFailure('read gifts for the thanks list', err);
    return res.status(502).json({ error: 'Could not read the gifts from Stripe.' });
  }

  const rows = sessions
    .filter((s) => s && s.payment_status === 'paid')
    .map((s) => {
      const md = s.metadata || {};
      const details = s.customer_details || {};
      const anonymous = md.giver === 'anonymous';
      const name = anonymous ? '' : (md.giver_name || details.name || '');
      return {
        at: s.created || 0,
        date: new Date((s.created || 0) * 1000).toISOString().slice(0, 10),
        anonymous,
        name,
        email: anonymous ? '' : (details.email || s.customer_email || ''),
        amount: money(s.amount_total, s.currency),
        frequency: md.frequency === 'monthly' ? 'every month' : 'once',
      };
    })
    .sort((a, b) => b.at - a.at);

  const meta = {
    days,
    total: rows.length,
    named: rows.filter((r) => !r.anonymous && r.name).length,
    anonymous: rows.filter((r) => r.anonymous).length,
  };

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (String(q.format || '').toLowerCase() === 'json') {
    return res.status(200).json({ ...meta, gifts: rows });
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page(rows, meta));
}
