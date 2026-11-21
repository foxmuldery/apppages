/**
 * Vercel Asia Edge Function (hkg1 / hnd1 / sin1) for Shorebird OTA Proxy.
 *
 * Zero-ICP, zero-server China-friendly accelerator for `apps.foxlaoy.com`:
 * - POST /api/v1/patches/check  -> app_id-locked, 30s warm-isolate micro-cache keyed by
 *                                  (app_id, channel, release_version, platform, arch, patch_number),
 *                                  rewrites cdn.shorebird.cloud download_url -> public origin.
 * - POST /api/v1/patches/events -> app_id-locked direct pass-through (never cached).
 * - GET/HEAD /api/v1/patches/cdn/<app_id>/<platform>/<arch>/<patch_id>/dlc.vmcode
 *                               -> immutable 1-year Vercel Edge CDN cache + Range pass-through.
 */

export const config = {
  runtime: 'edge',
  regions: ['hkg1', 'hnd1', 'sin1'],
};

const ALLOWED_APP_ID = '441919ad-1e51-4b10-bc7e-6b0437df4912';
const UPSTREAM_ORIGIN = 'https://api.shorebird.dev';
const UPSTREAM_CDN_PREFIX = `https://cdn.shorebird.cloud/api/v1/patches/${ALLOWED_APP_ID}/`;
const IMMUTABLE_PATCH_CDN_RE =
  /^cdn\/(441919ad-1e51-4b10-bc7e-6b0437df4912\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/dlc\.vmcode)$/;

const PATCH_CHECK_CACHE_TTL_MS = 30_000;
const PATCH_CHECK_CACHE_MAX_ENTRIES = 256;
const checkCache = new Map();

function jsonResponse(body, status, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-patch-proxy-hop': 'vercel-edge',
  });
  for (const [k, v] of Object.entries(extraHeaders)) {
    headers.set(k, v);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function buildPatchCheckCacheKey(origin, parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const { app_id, channel, release_version, platform, arch, patch_number } =
    parsed;
  if (
    app_id !== ALLOWED_APP_ID ||
    typeof channel !== 'string' ||
    !channel ||
    typeof release_version !== 'string' ||
    !release_version ||
    typeof platform !== 'string' ||
    !platform ||
    typeof arch !== 'string' ||
    !arch
  ) {
    return null;
  }
  let normalizedPatchNumber;
  if (patch_number === undefined || patch_number === null) {
    normalizedPatchNumber = '0';
  } else if (Number.isInteger(patch_number) && patch_number >= 0) {
    normalizedPatchNumber = String(patch_number);
  } else {
    return null;
  }
  return `${origin}|${app_id}|${channel}|${release_version}|${platform}|${arch}|${normalizedPatchNumber}`;
}

function readCheckCache(key) {
  if (!key) return null;
  const entry = checkCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    checkCache.delete(key);
    return null;
  }
  return entry.serialized;
}

function writeCheckCache(key, serialized) {
  if (!key) return;
  if (checkCache.size >= PATCH_CHECK_CACHE_MAX_ENTRIES) {
    const oldestKey = checkCache.keys().next().value;
    if (oldestKey !== undefined) checkCache.delete(oldestKey);
  }
  checkCache.set(key, {
    serialized,
    expiresAt: Date.now() + PATCH_CHECK_CACHE_TTL_MS,
  });
}

function extractSubpath(url) {
  const qPath = url.searchParams.get('__subpath');
  if (qPath) return qPath.replace(/^\/+/, '');
  const prefix = '/api/v1/patches/';
  if (url.pathname.startsWith(prefix)) {
    return url.pathname.slice(prefix.length).replace(/^\/+/, '');
  }
  return '';
}

async function handlePatchCdn(request, subpath) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  const match = IMMUTABLE_PATCH_CDN_RE.exec(subpath);
  if (!match) {
    return jsonResponse({ error: 'Forbidden patch path' }, 403);
  }

  const relPath = match[1];
  const reqRange = request.headers.get('range');
  const cdnUrl = `https://cdn.shorebird.cloud/api/v1/patches/${relPath}`;

  const fwdHeaders = new Headers();
  fwdHeaders.set(
    'user-agent',
    request.headers.get('user-agent') || 'shorebird-vercel-edge/1.0',
  );
  if (reqRange) fwdHeaders.set('range', reqRange);

  const res = await fetch(cdnUrl, {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: fwdHeaders,
  });

  const outHeaders = new Headers();
  outHeaders.set(
    'content-type',
    res.headers.get('content-type') || 'application/octet-stream',
  );
  const cl = res.headers.get('content-length');
  if (cl) outHeaders.set('content-length', cl);
  const cr = res.headers.get('content-range');
  if (cr) outHeaders.set('content-range', cr);
  const etag = res.headers.get('etag');
  if (etag) outHeaders.set('etag', etag);
  outHeaders.set(
    'accept-ranges',
    res.headers.get('accept-ranges') || 'bytes',
  );
  outHeaders.set('x-patch-proxy-hop', 'vercel-edge');

  if (res.ok) {
    outHeaders.set(
      'cache-control',
      'public, max-age=31536000, s-maxage=31536000, immutable',
    );
    outHeaders.set(
      'cdn-cache-control',
      'public, max-age=31536000, immutable',
    );
    outHeaders.set(
      'vercel-cdn-cache-control',
      'public, max-age=31536000, immutable',
    );
  } else {
    outHeaders.set('cache-control', 'no-store');
  }

  return new Response(request.method === 'HEAD' ? null : res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

async function handlePatchApi(request, url, subpath) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let rawBody = '';
  let parsed = null;
  try {
    rawBody = await request.text();
    parsed = JSON.parse(rawBody);
    const appId =
      subpath === 'check'
        ? parsed?.app_id
        : (parsed?.event?.app_id ?? parsed?.app_id);
    if (appId !== ALLOWED_APP_ID) {
      return jsonResponse({ error: 'Forbidden app_id' }, 403);
    }
  } catch (_) {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const cacheKey =
    subpath === 'check' ? buildPatchCheckCacheKey(url.origin, parsed) : null;

  if (cacheKey) {
    const cached = readCheckCache(cacheKey);
    if (cached !== null) {
      return new Response(cached, {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-patch-check-cache': 'HIT',
          'x-patch-proxy-hop': 'vercel-edge',
        },
      });
    }
  }

  const upstreamUrl = `${UPSTREAM_ORIGIN}/api/v1/patches/${subpath}`;
  const forwardHeaders = new Headers({
    'content-type': 'application/json',
    accept: 'application/json',
  });
  const ua = request.headers.get('user-agent');
  if (ua) forwardHeaders.set('user-agent', ua);

  const upstreamRes = await fetch(upstreamUrl, {
    method: 'POST',
    headers: forwardHeaders,
    body: rawBody,
  });

  const resHeaders = new Headers();
  const ct = upstreamRes.headers.get('content-type');
  if (ct) resHeaders.set('content-type', ct);
  resHeaders.set('cache-control', 'no-store');
  resHeaders.set('x-patch-proxy-hop', 'vercel-edge');

  if (subpath === 'check' && upstreamRes.status === 200) {
    try {
      const payload = await upstreamRes.json();
      const dl = payload?.patch?.download_url;
      const publicCdnPrefix = `${url.origin}/api/v1/patches/cdn/${ALLOWED_APP_ID}/`;
      if (typeof dl === 'string' && dl.startsWith(UPSTREAM_CDN_PREFIX)) {
        payload.patch.download_url =
          publicCdnPrefix + dl.slice(UPSTREAM_CDN_PREFIX.length);
      }
      const serialized = JSON.stringify(payload);
      resHeaders.set('content-type', 'application/json; charset=utf-8');
      resHeaders.set('x-patch-check-cache', cacheKey ? 'MISS' : 'BYPASS');
      if (cacheKey) writeCheckCache(cacheKey, serialized);
      return new Response(serialized, {
        status: 200,
        headers: resHeaders,
      });
    } catch (_) {
      // Fallback below if upstream returned non-JSON
    }
  }

  if (subpath === 'check') {
    resHeaders.set('x-patch-check-cache', 'BYPASS');
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  const url = new URL(request.url);
  const subpath = extractSubpath(url);

  if (subpath.startsWith('cdn/')) {
    return handlePatchCdn(request, subpath);
  }
  if (subpath === 'check' || subpath === 'events') {
    return handlePatchApi(request, url, subpath);
  }
  return jsonResponse({ error: 'Not found' }, 404);
}

export const GET = handler;
export const POST = handler;
export const HEAD = handler;
export const OPTIONS = handler;
