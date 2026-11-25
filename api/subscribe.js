// ⚠️  WEB3FORMS DOES NOT WORK FROM HERE.
//     Verified 14 Aug 2026: api.web3forms.com sits behind Cloudflare and answers
//     a request from a Vercel serverless function with 403 and a "Just a moment..."
//     challenge page. The same key and the same payload return success:true from a
//     browser. So the Web3Forms branch below is dead on Vercel — do not "fix" it by
//     changing the payload; the payload was never the problem.
//     Live delivery therefore posts browser -> Web3Forms directly (see asmSend in
//     js/app.js). This function stays for the RESEND route, which is a proper
//     server-to-server API and is not challenged.
// POST /api/subscribe — monthly newsletter sign-up and lead capture.
// Delivers the lead to the team mailbox (hello@anhsonmovement.org) and, when a
// provider that can send arbitrary mail is configured, a confirmation to the person.
//
// Two providers are supported. The first one configured wins:
//   1. WEB3FORMS_KEY   → Web3Forms (free, no domain verification needed)  [simplest]
//   2. RESEND_API_KEY  → Resend    (needs a verified sending domain, can also
//                                   send the subscriber their own confirmation)
//
// Env vars:
//   WEB3FORMS_KEY                              access key from https://web3forms.com
//   RESEND_API_KEY + TEAM_EMAIL + FROM_EMAIL   alternative route

const hits = new Map(); // best-effort per-instance rate limit

function limited(ip) {
  const now = Date.now();
  const win = 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const INTERESTS = {
  newsletter: 'Monthly update',
  volunteer: 'Wants to help / volunteer',
  partner: 'Partnership or organisation',
  stories: 'Wants to share a story',
};

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const useWeb3 = !!process.env.WEB3FORMS_KEY;
  const useResend = !useWeb3 && !!process.env.RESEND_API_KEY && !!process.env.TEAM_EMAIL;
  // GET is a health check: open the URL in a browser to see whether the mail
  // provider is wired up. Never reveals the key itself.
  // GET ?selftest=1 actually calls Web3Forms once and reports the raw answer,
  // so a delivery problem can be diagnosed without filling in the form.
  if (req.method === 'GET' && req.query && req.query.selftest) {
    if (!process.env.WEB3FORMS_KEY) {
      return res.status(200).json({ selftest: 'skipped', why: 'WEB3FORMS_KEY not set' });
    }
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_KEY,
          subject: 'Self-test from the website',
          from_name: 'Anh Son Movement',
          Message: 'Automatic self-test. If this arrives, the wiring works.',
        }),
      });
      const text = await r.text();
      return res.status(200).json({ selftest: 'ran', status: r.status, body: text.slice(0, 500) });
    } catch (e) {
      return res.status(200).json({
        selftest: 'threw',
        error: String((e && e.message) || e).slice(0, 300),
        fetch_available: typeof fetch === 'function',
        node: process.version,
      });
    }
  }
  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint: 'subscribe',
      ready: useWeb3 || useResend,
      provider: useWeb3 ? 'web3forms' : (useResend ? 'resend' : 'none'),
      webthreeforms_key_present: !!process.env.WEB3FORMS_KEY,
      resend_key_present: !!process.env.RESEND_API_KEY,
      team_email_present: !!process.env.TEAM_EMAIL,
      node: process.version,
      fetch_available: typeof fetch === 'function',
      hint: (useWeb3 || useResend)
        ? 'Mail provider configured. POST a submission to use it.'
        : 'Set WEB3FORMS_KEY in Vercel, then redeploy so the build picks it up.',
    });
  }
  if (!useWeb3 && !useResend) {
    console.error('No mail provider configured (set WEB3FORMS_KEY or RESEND_API_KEY + TEAM_EMAIL)');
    return res.status(500).json({ error: 'Sign-up is not configured yet.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many sign-ups. Please try again later.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (clean(body.website, 50)) return res.status(200).json({ ok: true }); // honeypot

  const email = clean(body.email, 140);
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  // Consent is required and must be explicit — no pre-ticked boxes, no silent opt-in.
  if (body.consent !== true) return res.status(400).json({ error: 'Consent is required.' });

  const name = clean(body.name, 80);
  const place = clean(body.place, 80);
  const lang = clean(body.lang, 4) === 'vn' ? 'vn' : 'en';
  const source = clean(body.source, 40) || 'site';
  const picked = (Array.isArray(body.interests) ? body.interests : [])
    .map((k) => INTERESTS[clean(k, 20)])
    .filter(Boolean);
  const wants = picked.length ? picked.join(', ') : INTERESTS.newsletter;

  const subject = `✉️ New subscriber${place ? ' · ' + place : ''}`;

  try {
    // ---------------------------------------------------------------- Web3Forms
    if (useWeb3) {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_KEY,
          subject,
          from_name: 'Anh Son Movement',
          replyto: email,
          Email: email,
          Name: name || '—',
          Where: place || '—',
          'Wants to hear about': wants,
          Language: lang === 'vn' ? 'Vietnamese' : 'English',
          'Signed up from': source,
          Consent: 'Yes — explicit opt-in on the website',
          'Consent given at': new Date().toISOString(),
        }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || out.success === false) throw new Error(`Web3Forms: ${r.status} ${JSON.stringify(out)}`);
      return res.status(200).json({ ok: true, confirmation: false });
    }

    // ---------------------------------------------------------------- Resend
    const from = process.env.FROM_EMAIL || 'Anh Son Movement <onboarding@resend.dev>';
    const row = (label, value) =>
      value
        ? `<tr><td style="padding:8px 14px;color:#635E55;font:600 12px/1.4 system-ui;white-space:nowrap;vertical-align:top">${label}</td>
           <td style="padding:8px 14px;color:#0D1F3D;font:400 15px/1.6 system-ui">${esc(value)}</td></tr>`
        : '';

    const send = async (payload) => {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
      return r.json();
    };

    await send({
      from,
      to: [process.env.TEAM_EMAIL],
      subject,
      reply_to: email,
      html: `
      <div style="background:#FBF5EA;padding:26px;font-family:system-ui,-apple-system,sans-serif">
        <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E7DECD;border-radius:18px;overflow:hidden">
          <div style="background:#0D1F3D;padding:22px 26px;color:#fff">
            <div style="font:800 11px/1 system-ui;letter-spacing:.18em;text-transform:uppercase;color:#C8922E">Anh Sơn Movement</div>
            <div style="font:700 22px/1.2 system-ui;margin-top:6px">New subscriber</div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${row('Email', email)}
            ${row('Name', name)}
            ${row('Where', place)}
            ${row('Wants', wants)}
            ${row('Language', lang === 'vn' ? 'Vietnamese' : 'English')}
            ${row('From', source)}
          </table>
          <div style="padding:14px 20px;background:#FBF5EA;color:#635E55;font:400 12px/1.5 system-ui">
            Explicit opt-in given on the website at ${new Date().toISOString()}.
            Keep this record — it is the proof of consent.
          </div>
        </div>
      </div>`,
    });

    const en = `Thank you for signing up. You will get one quiet update a month — what actually happened, never a fundraising blast. You can unsubscribe from any email, and we never pass your address to anyone.`;
    const vn = `Cảm ơn bạn đã đăng ký. Bạn sẽ nhận một bản tin nhẹ nhàng mỗi tháng — những gì thực sự đã diễn ra, không bao giờ là thư kêu gọi quyên góp. Bạn có thể hủy đăng ký từ bất kỳ email nào, và chúng tôi không bao giờ chuyển địa chỉ của bạn cho ai.`;
    await send({
      from,
      to: [email],
      subject: lang === 'vn' ? 'Cảm ơn bạn 💛 — Anh Sơn Movement' : 'Thank you 💛 — Anh Sơn Movement',
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:26px;color:#0D1F3D;line-height:1.7">
        <p style="font:400 18px/1.6 system-ui">${lang === 'vn' ? vn : en}</p>
        <p style="color:#635E55;font-size:14px">Heard. Valued. Seen.<br>— Anh Sơn Movement</p></div>`,
    }).catch((e) => console.error('confirmation mail failed', e));

    return res.status(200).json({ ok: true, confirmation: true });
  } catch (err) {
    console.error('subscribe failed', err);
    // Surface the cause. Never includes the access key — only status and message.
    const detail = String((err && err.message) || err).replace(
      process.env.WEB3FORMS_KEY || '\u0000', '[key]').slice(0, 300);
    return res.status(500).json({ error: 'Could not sign you up right now.', detail });
  }
}
