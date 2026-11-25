// ⚠️  WEB3FORMS DOES NOT WORK FROM HERE.
//     Verified 14 Aug 2026: api.web3forms.com sits behind Cloudflare and answers
//     a request from a Vercel serverless function with 403 and a "Just a moment..."
//     challenge page. The same key and the same payload return success:true from a
//     browser. So the Web3Forms branch below is dead on Vercel — do not "fix" it by
//     changing the payload; the payload was never the problem.
//     Live delivery therefore posts browser -> Web3Forms directly (see asmSend in
//     js/app.js). This function stays for the RESEND route, which is a proper
//     server-to-server API and is not challenged.
// POST /api/nominate — receives a (possibly anonymous) nomination and emails it to the team.
//
// Two providers are supported. The first one configured wins:
//   1. WEB3FORMS_KEY   → Web3Forms (free, unlimited, no domain needed)   [recommended here]
//   2. RESEND_API_KEY  → Resend    (needs a verified sending domain)
//
// Env vars:
//   WEB3FORMS_KEY   access key from https://web3forms.com  (delivers to the address you registered)
//   RESEND_API_KEY  + TEAM_EMAIL + FROM_EMAIL              (alternative route)

const hits = new Map(); // best-effort per-instance rate limit

function limited(ip) {
  const now = Date.now();
  const win = 60 * 60 * 1000; // 1 hour
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5; // max 5 submissions per hour per IP
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const useWeb3 = !!process.env.WEB3FORMS_KEY;
  const useResend = !useWeb3 && !!process.env.RESEND_API_KEY && !!process.env.TEAM_EMAIL;
  // GET is a health check: open the URL in a browser to see whether the mail
  // provider is wired up. Never reveals the key itself.
  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint: 'nominate',
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
    return res.status(500).json({ error: 'Mail is not configured yet.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many messages. Please try again later.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (clean(body.website, 50)) return res.status(200).json({ ok: true }); // honeypot: pretend success

  const LABELS = {
    alone: 'Living alone / rarely sees anyone',
    hardship: 'Struggling financially',
    loss: 'Recently lost someone',
    newplace: 'Far from home, new to the area',
    carer: 'Caring for someone else with no support',
    unseen: 'Feels unseen or unheard',
    other: 'Something else',
  };
  const kind = clean(body.situation, 40);
  if (!LABELS[kind]) return res.status(400).json({ error: 'Please choose the kind of situation.' });
  // Free text is deliberately capped: no special-category data about a third party.
  const note = clean(body.note, 300);
  const situation = LABELS[kind] + (note ? '\n\n' + note : '');

  const about = clean(body.about, 80);
  const city = clean(body.city, 80);
  const reach = clean(body.reach, 200);
  const anonymous = body.anonymous !== false;
  const fromName = anonymous ? '' : clean(body.fromName, 80);
  const fromEmail = anonymous ? '' : clean(body.fromEmail, 120);
  const lang = clean(body.lang, 4) === 'vn' ? 'vn' : 'en';

  const subject = `💛 Nomination${city ? ' · ' + city : ''}${anonymous ? ' · anonymous' : ''}`;
  const sender = anonymous ? 'Anonymous' : [fromName, fromEmail].filter(Boolean).join(' · ') || 'Not given';

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
          ...(fromEmail && isEmail(fromEmail) ? { replyto: fromEmail } : {}),
          'Someone was nominated': anonymous ? 'anonymously' : 'with contact details',
          About: about || '—',
          Where: city || '—',
          'Reach them': reach || '—',
          "What's going on": situation,
          From: sender,
          Language: lang === 'vn' ? 'Vietnamese' : 'English',
          Note: 'Treat as confidential. Delete once the help is done.',
        }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || out.success === false) throw new Error(`Web3Forms: ${r.status} ${JSON.stringify(out)}`);
      return res.status(200).json({ ok: true });
    }

    // ---------------------------------------------------------------- Resend
    const from = process.env.FROM_EMAIL || 'Anh Son Movement <onboarding@resend.dev>';
    const row = (label, value) =>
      value
        ? `<tr><td style="padding:8px 14px;color:#5B6776;font:600 12px/1.4 system-ui;white-space:nowrap;vertical-align:top">${label}</td>
           <td style="padding:8px 14px;color:#16304B;font:400 15px/1.6 system-ui">${esc(value)}</td></tr>`
        : '';

    const html = `
    <div style="background:#FBFAF5;padding:26px;font-family:system-ui,-apple-system,sans-serif">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E8E2D4;border-radius:18px;overflow:hidden">
        <div style="background:linear-gradient(120deg,#1B4A78,#2E86D6,#57AEEC);padding:22px 26px;color:#fff">
          <div style="font:600 12px/1 system-ui;letter-spacing:.18em;text-transform:uppercase;opacity:.85">Anh Sơn Movement</div>
          <div style="font:600 22px/1.2 Georgia,serif;margin-top:6px">Someone was nominated${anonymous ? ' (anonymously)' : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${row('About', about || '—')}
          ${row('Where', city)}
          ${row('Reach them', reach)}
          <tr><td colspan="2" style="padding:14px 14px 4px;color:#5B6776;font:600 12px/1.4 system-ui">What's going on</td></tr>
          <tr><td colspan="2" style="padding:0 14px 16px">
            <div style="background:#F7F3E9;border-left:4px solid #D4B879;border-radius:10px;padding:14px 16px;color:#16304B;font:400 15px/1.65 system-ui;white-space:pre-wrap">${esc(situation)}</div>
          </td></tr>
          ${row('From', sender)}
          ${row('Language', lang === 'vn' ? 'Vietnamese' : 'English')}
        </table>
        <div style="padding:14px 20px;background:#F7F3E9;color:#5B6776;font:400 12px/1.5 system-ui">
          Treat as confidential. Delete once the help is done.
        </div>
      </div>
    </div>`;

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
      html,
      ...(fromEmail && isEmail(fromEmail) ? { reply_to: fromEmail } : {}),
    });

    if (fromEmail && isEmail(fromEmail)) {
      const thanksEn = `Thank you for caring enough to write. A real person from our team has your message and will reach out gently. You just made someone less invisible.`;
      const thanksVn = `Cảm ơn bạn đã quan tâm đủ để viết. Một người thật trong nhóm đã nhận được tin nhắn của bạn và sẽ nhẹ nhàng liên hệ. Bạn vừa khiến ai đó bớt vô hình.`;
      await send({
        from,
        to: [fromEmail],
        subject: lang === 'vn' ? 'Cảm ơn bạn 💛 — Anh Sơn Movement' : 'Thank you 💛 — Anh Sơn Movement',
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:26px;color:#16304B;line-height:1.7">
          <p style="font:400 19px/1.5 Georgia,serif">${lang === 'vn' ? thanksVn : thanksEn}</p>
          <p style="color:#5B6776;font-size:14px">Heard. Valued. Seen.<br>— Anh Sơn Movement</p></div>`,
      }).catch((e) => console.error('thank-you mail failed', e));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('nominate failed', err);
    const detail = String((err && err.message) || err).replace(
      process.env.WEB3FORMS_KEY || '\u0000', '[key]').slice(0, 300);
    return res.status(500).json({ error: 'Could not send right now.', detail });
  }
}
