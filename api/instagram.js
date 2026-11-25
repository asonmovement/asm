// GET /api/instagram — the movement's own Instagram posts, for the site gallery.
//
// Uses "Instagram API with Instagram Login" (the replacement for the Basic
// Display API, which Meta shut down in December 2024). Needs an Instagram
// PROFESSIONAL account (Business or Creator). A linked Facebook Page is NOT
// required with this setup.
//
// Env vars:
//   IG_ACCESS_TOKEN     long-lived token (60 days) — required
//   IG_API_VERSION      optional, defaults to v23.0; falls back to unversioned
//   IG_LIMIT            optional, how many posts to return (default 12, max 25)
//   IG_REFRESH_SECRET   optional; enables GET ?refresh=<secret> to mint a new
//                       60-day token. Without it that route stays switched off,
//                       because anyone hitting it would otherwise be handed a
//                       working token.
//
// Instagram's media URLs are signed and expire, so the response is cached for
// 30 minutes and served stale for up to a day while it revalidates. Never cache
// this for days: the video links will rot and the gallery will show black tiles.

const FIELDS = [
  'id', 'caption', 'media_type', 'media_product_type',
  'media_url', 'thumbnail_url', 'permalink', 'timestamp',
].join(',');

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

async function callGraph(path, params, version) {
  const base = version
    ? `https://graph.instagram.com/${version}${path}`
    : `https://graph.instagram.com${path}`;
  const url = new URL(base);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok && !body.error, status: r.status, body };
}

// Meta retires Graph API versions on a schedule, so a pinned version eventually
// 400s. Retry unversioned rather than let the gallery go dark on that alone.
async function graph(path, params) {
  const version = process.env.IG_API_VERSION || 'v23.0';
  let res = await callGraph(path, params, version);
  if (!res.ok) {
    const msg = String(res.body && res.body.error && res.body.error.message || '');
    if (/version|unsupported|deprecat/i.test(msg) || res.status === 400) {
      const retry = await callGraph(path, params, null);
      if (retry.ok) return retry;
    }
  }
  return res;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.IG_ACCESS_TOKEN;
  const q = req.query || {};

  // ---- health check: no token needed, reveals nothing sensitive -------------
  if (q.health) {
    return res.status(200).json({
      endpoint: 'instagram',
      ready: !!token,
      api_version: process.env.IG_API_VERSION || 'v23.0',
      refresh_route_enabled: !!process.env.IG_REFRESH_SECRET,
      hint: token
        ? 'Token present. Call this endpoint without parameters to get the feed.'
        : 'Set IG_ACCESS_TOKEN in Vercel and redeploy.',
    });
  }

  if (!token) {
    return res.status(503).json({
      error: 'Instagram is not connected yet.',
      hint: 'Set IG_ACCESS_TOKEN in Vercel, then redeploy.',
      posts: [],
    });
  }

  // ---- token refresh: extends the long-lived token by another 60 days -------
  if (q.refresh) {
    const secret = process.env.IG_REFRESH_SECRET;
    if (!secret) {
      return res.status(404).json({ error: 'Refresh route is disabled. Set IG_REFRESH_SECRET first.' });
    }
    if (clean(q.refresh, 200) !== secret) {
      return res.status(403).json({ error: 'Wrong secret.' });
    }
    const out = await graph('/refresh_access_token', {
      grant_type: 'ig_refresh_token',
      access_token: token,
    });
    if (!out.ok) {
      return res.status(502).json({
        error: 'Could not refresh the token.',
        detail: clean(out.body && out.body.error && out.body.error.message, 300),
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      new_token: out.body.access_token,
      expires_in_days: Math.round((out.body.expires_in || 0) / 86400),
      next_step: 'Paste new_token into IG_ACCESS_TOKEN in Vercel, then redeploy.',
    });
  }

  // ---- the feed ------------------------------------------------------------
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || parseInt(process.env.IG_LIMIT, 10) || 12, 1), 25);

  try {
    const out = await graph('/me/media', { fields: FIELDS, limit: String(limit), access_token: token });
    if (!out.ok) {
      const msg = clean(out.body && out.body.error && out.body.error.message, 300);
      // 190 = token expired or revoked. Say so plainly so it is obvious what to fix.
      const code = out.body && out.body.error && out.body.error.code;
      return res.status(502).json({
        error: code === 190 ? 'The Instagram token has expired.' : 'Instagram did not answer.',
        detail: msg,
        posts: [],
      });
    }

    const posts = (out.body.data || [])
      // A carousel's own media_url is absent; use its thumbnail. Anything with
      // neither is unrenderable, so drop it rather than show an empty tile.
      .map((m) => {
        const isVideo = m.media_type === 'VIDEO';
        const poster = m.thumbnail_url || (isVideo ? '' : m.media_url) || '';
        return {
          id: m.id,
          type: m.media_type,
          isReel: m.media_product_type === 'REELS',
          video: isVideo ? (m.media_url || '') : '',
          image: poster,
          permalink: m.permalink || '',
          caption: clean(m.caption, 300),
          at: m.timestamp || '',
        };
      })
      .filter((p) => (p.image || p.video) && p.permalink);

    // Signed CDN links go stale, so this must not be cached for long. Serving
    // stale while revalidating keeps the gallery up if Instagram has a wobble.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({ count: posts.length, posts });
  } catch (err) {
    console.error('instagram feed failed', err);
    return res.status(502).json({
      error: 'Could not reach Instagram.',
      detail: clean(err && err.message, 300),
      posts: [],
    });
  }
}
