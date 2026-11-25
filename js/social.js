// GET /api/social — how many people follow the movement, per channel.
//
// The site publishes this number, so the number has to be defensible. Every
// channel comes back with a `source` saying where it came from:
//
//   live    the platform reported it just now, through its own API
//   manual  a person typed it into an environment variable
//   off     nothing is connected and nothing is claimed
//
// The front end shows that distinction rather than hiding it. A figure somebody
// typed must never look like a figure a platform reported — the legal page on
// this site promises exactly that, and this endpoint is what makes it keepable.
//
// Env vars:
//   IG_ACCESS_TOKEN     already set for /api/instagram — gives Instagram, live
//   IG_API_VERSION      optional, defaults to v23.0
//   FB_PAGE_ID          Facebook page id          ─┬─ both needed, or Facebook
//   FB_PAGE_TOKEN       Facebook page access token ┘   reports itself as off
//   FB_API_VERSION      optional, defaults to v23.0
//   TIKTOK_FOLLOWERS    a plain number the team keeps up to date (manual)
//   TIKTOK_UPDATED      optional ISO date saying when that number was last true
//
// TikTok has no route to a live figure without a separate developer app and
// TikTok's own approval, so it is manual on purpose and labelled as such.

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

async function getJson(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await r.json().catch(() => ({}));
    return { ok: r.ok && !body.error, body };
  } catch (err) {
    return { ok: false, body: { error: { message: String(err && err.message || err) } } };
  }
}

// Meta retires Graph versions on a schedule. A pinned version eventually 400s,
// so fall back to the unversioned host rather than let the counter go dark.
async function meta(host, path, params, version) {
  const build = (v) => {
    const u = new URL(v ? `https://${host}/${v}${path}` : `https://${host}${path}`);
    Object.keys(params).forEach((k) => u.searchParams.set(k, params[k]));
    return u;
  };
  let res = await getJson(build(version));
  if (!res.ok) {
    const retry = await getJson(build(null));
    if (retry.ok) return retry;
  }
  return res;
}

async function instagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) return { key: 'instagram', followers: null, source: 'off' };

  const out = await meta('graph.instagram.com', '/me', {
    fields: 'followers_count,media_count,username',
    access_token: token,
  }, process.env.IG_API_VERSION || 'v23.0');

  if (!out.ok) {
    const code = out.body && out.body.error && out.body.error.code;
    return {
      key: 'instagram',
      followers: null,
      source: 'off',
      // our own diagnostic, not something a visitor is shown
      why: code === 190 ? 'token_expired' : 'unavailable',
    };
  }
  return {
    key: 'instagram',
    followers: num(out.body.followers_count),
    posts: num(out.body.media_count),
    handle: out.body.username || null,
    source: 'live',
  };
}

async function facebook() {
  const id = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!id || !token) return { key: 'facebook', followers: null, source: 'off' };

  const out = await meta('graph.facebook.com', `/${encodeURIComponent(id)}`, {
    fields: 'followers_count,fan_count,name',
    access_token: token,
  }, process.env.FB_API_VERSION || 'v23.0');

  if (!out.ok) return { key: 'facebook', followers: null, source: 'off', why: 'unavailable' };

  // followers_count is the one people mean; fan_count (page likes) is the older
  // metric and is only used when the newer field is absent.
  const f = num(out.body.followers_count);
  return {
    key: 'facebook',
    followers: f == null ? num(out.body.fan_count) : f,
    handle: out.body.name || null,
    source: 'live',
  };
}

function tiktok() {
  const n = num(process.env.TIKTOK_FOLLOWERS);
  if (n == null) return { key: 'tiktok', followers: null, source: 'off' };
  return {
    key: 'tiktok',
    followers: n,
    source: 'manual',
    countedAt: process.env.TIKTOK_UPDATED || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (req.query && req.query.health) {
    return res.status(200).json({
      endpoint: 'social',
      instagram: !!process.env.IG_ACCESS_TOKEN,
      facebook: !!(process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN),
      tiktok: num(process.env.TIKTOK_FOLLOWERS) != null ? 'manual' : 'off',
      hint: 'Call without parameters for the channel figures.',
    });
  }

  // One slow platform must not hold up the others, and a thrown request must
  // not take the whole band down with it.
  const settled = await Promise.all([
    instagram().catch(() => ({ key: 'instagram', followers: null, source: 'off' })),
    facebook().catch(() => ({ key: 'facebook', followers: null, source: 'off' })),
    Promise.resolve(tiktok()),
  ]);

  const live = settled.filter((c) => c.source === 'live' && c.followers != null);
  const known = settled.filter((c) => c.followers != null);

  // Ten minutes is long enough that a busy day costs nothing and short enough
  // that the number on the page is the number on the platform.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  return res.status(200).json({
    channels: settled,
    // Only add up what we can stand behind. A total that silently mixes a live
    // figure with a typed one is the exact thing this endpoint exists to avoid,
    // so both totals are published and the page says which it is showing.
    totalLive: live.length ? live.reduce((a, c) => a + c.followers, 0) : null,
    totalAll: known.length ? known.reduce((a, c) => a + c.followers, 0) : null,
    allLive: known.length > 0 && known.every((c) => c.source === 'live'),
    at: new Date().toISOString(),
  });
}
