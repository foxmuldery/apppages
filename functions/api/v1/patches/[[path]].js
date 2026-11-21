// Cloudflare Pages Function: Shorebird Patch Proxy for Flash Memo (留声闪记)
// Allows Mainland China clients (without VPN) to check, download, & report Shorebird patches
// via https://apps.foxlaoy.com/api/v1/patches/{check,events,cdn/...}
// Strictly locked to Flash Memo's app_id so this endpoint cannot be abused as an open proxy.

const ALLOWED_APP_ID = '441919ad-1e51-4b10-bc7e-6b0437df4912';
const UPSTREAM_ORIGIN = 'https://api.shorebird.dev';
const UPSTREAM_CDN_PREFIX = `https://cdn.shorebird.cloud/api/v1/patches/${ALLOWED_APP_ID}/`;
const PUBLIC_CDN_PREFIX = `https://apps.foxlaoy.com/api/v1/patches/cdn/${ALLOWED_APP_ID}/`;
const PATCH_CHECK_CACHE_TTL_SECONDS = 45;

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
  const params = new URLSearchParams({
    app_id,
    channel,
    release_version,
    platform,
    arch,
    patch_number: normalizedPatchNumber,
  });
  return new Request(`${origin}/__edge_patch_check_v1?${params.toString()}`, {
    method: 'GET',
  });
}

export async function onRequest(context) {
  const { request, params } = context;
  const segments = Array.isArray(params.path)
    ? params.path
    : params.path
      ? [params.path]
      : [];
  const subpath = segments.join('/');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  // 1. China-direct binary stream proxy for dlc.vmcode artifacts (strictly locked to ALLOWED_APP_ID)
  if (segments[0] === 'cdn') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    const appIdSeg = segments[1];
    const fileSeg = segments[segments.length - 1];
    if (
      segments.length < 5 ||
      appIdSeg !== ALLOWED_APP_ID ||
      fileSeg !== 'dlc.vmcode' ||
      segments.some((s) => !s || s === '.' || s === '..')
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden patch path' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const reqRange = request.headers.get('range');
    const url = new URL(request.url);
    const canonicalUrl = `${url.origin}${url.pathname}`;
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = new Request(canonicalUrl, { method: 'GET' });

    if (cache) {
      const matchReq = reqRange
        ? new Request(canonicalUrl, {
            method: 'GET',
            headers: { range: reqRange },
          })
        : cacheKey;
      const cached = await cache.match(matchReq);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set('cf-cache-status', 'HIT');
        hitHeaders.set('x-patch-edge-cache', 'HIT');
        return new Response(request.method === 'HEAD' ? null : cached.body, {
          status: cached.status,
          headers: hitHeaders,
        });
      }
    }

    const relPath = segments.slice(1).join('/');
    const cdnUrl = `https://cdn.shorebird.cloud/api/v1/patches/${relPath}`;
    const cdnHeaders = new Headers();
    cdnHeaders.set(
      'user-agent',
      request.headers.get('user-agent') || 'shorebird-proxy/1.0',
    );
    if (reqRange) cdnHeaders.set('range', reqRange);
    const cdnRes = await fetch(cdnUrl, {
      method: 'GET',
      headers: cdnHeaders,
      cf: {
        cacheEverything: true,
        cacheTtl: 31536000,
      },
    });
    const outHeaders = new Headers();
    outHeaders.set(
      'content-type',
      cdnRes.headers.get('content-type') || 'application/octet-stream',
    );
    const cl = cdnRes.headers.get('content-length');
    if (cl) outHeaders.set('content-length', cl);
    const cr = cdnRes.headers.get('content-range');
    if (cr) outHeaders.set('content-range', cr);
    outHeaders.set(
      'accept-ranges',
      cdnRes.headers.get('accept-ranges') || 'bytes',
    );
    outHeaders.set(
      'cache-control',
      cdnRes.ok ? 'public, max-age=31536000, immutable' : 'no-store',
    );
    outHeaders.set('x-patch-edge-cache', 'MISS');

    if (
      cache &&
      request.method === 'GET' &&
      !reqRange &&
      cdnRes.status === 200 &&
      cdnRes.body
    ) {
      const [clientBody, cacheBody] = cdnRes.body.tee();
      const cacheHeaders = new Headers(outHeaders);
      cacheHeaders.delete('x-patch-edge-cache');
      const cacheEntry = new Response(cacheBody, {
        status: 200,
        headers: cacheHeaders,
      });
      if (typeof context.waitUntil === 'function') {
        context.waitUntil(cache.put(cacheKey, cacheEntry));
      } else {
        await cache.put(cacheKey, cacheEntry);
      }
      return new Response(clientBody, {
        status: 200,
        headers: outHeaders,
      });
    }

    if (request.method === 'HEAD') {
      cdnRes.body?.cancel();
      return new Response(null, {
        status: cdnRes.status,
        headers: outHeaders,
      });
    }

    return new Response(cdnRes.body, {
      status: cdnRes.status,
      headers: outHeaders,
    });
  }

  // 2. Only allow the two runtime updater endpoints used by Shorebird's Rust engine
  if (subpath !== 'check' && subpath !== 'events') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
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
      return new Response(JSON.stringify({ error: 'Forbidden app_id' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const reqUrl = new URL(request.url);
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey =
    cache && subpath === 'check'
      ? buildPatchCheckCacheKey(reqUrl.origin, parsed)
      : null;

  if (cache && cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-patch-check-cache': 'HIT',
        },
      });
    }
  }

  const upstreamUrl = `${UPSTREAM_ORIGIN}/api/v1/patches/${subpath}`;
  const forwardHeaders = new Headers();
  forwardHeaders.set('content-type', 'application/json');
  forwardHeaders.set('accept', 'application/json');
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

  // Rewrite cdn.shorebird.cloud download_url -> apps.foxlaoy.com/api/v1/patches/cdn/...
  // so Mainland China clients never stall on SNI-throttled *.shorebird.cloud!
  if (subpath === 'check' && upstreamRes.status === 200) {
    try {
      const payload = await upstreamRes.json();
      const dl = payload?.patch?.download_url;
      if (typeof dl === 'string' && dl.startsWith(UPSTREAM_CDN_PREFIX)) {
        payload.patch.download_url =
          PUBLIC_CDN_PREFIX + dl.slice(UPSTREAM_CDN_PREFIX.length);
      }
      const serialized = JSON.stringify(payload);
      resHeaders.set('content-type', 'application/json; charset=utf-8');
      resHeaders.set('x-patch-check-cache', cacheKey ? 'MISS' : 'BYPASS');
      if (cache && cacheKey) {
        const cacheEntry = new Response(serialized, {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': `public, max-age=${PATCH_CHECK_CACHE_TTL_SECONDS}`,
          },
        });
        if (typeof context.waitUntil === 'function') {
          context.waitUntil(cache.put(cacheKey, cacheEntry));
        } else {
          await cache.put(cacheKey, cacheEntry);
        }
      }
      return new Response(serialized, {
        status: 200,
        headers: resHeaders,
      });
    } catch (_) {
      // Fallback below if non-JSON
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
