/**
 * apppages 的 Cloudflare Pages Git 构建未触发，整站手动部署又被
 * 32MB 安装包挡住（单文件 25MB 限制）。这个 Worker 负责：
 * 1. 直连代理 Shorebird 热更新（/api/v1/patches/{check,events,cdn/...}），
 *    省去 worker -> apppages.pages.dev -> Pages Function 二次跳板：
 *    - cdn/.../dlc.vmcode：Edge 不可变长缓存 + Range 断点续传
 *    - check：按 (app_id, channel, release_version, platform, arch, patch_number)
 *      做 45s 短 TTL Edge 微缓存（严禁跨 patch_number 串台，仅缓存 HTTP 200）
 *    - events：直连上游，永不缓存
 * 2. 其他路径从 apppages.pages.dev 取同路径内容，把 HTML 中的旧卡片域名
 *    替换为新域名；其他内容原样流式返回。
 */
const ALLOWED_APP_ID = '441919ad-1e51-4b10-bc7e-6b0437df4912';
const UPSTREAM_ORIGIN = 'https://api.shorebird.dev';
const UPSTREAM_CDN_PREFIX = `https://cdn.shorebird.cloud/api/v1/patches/${ALLOWED_APP_ID}/`;
const PUBLIC_CDN_PREFIX = `https://apps.foxlaoy.com/api/v1/patches/cdn/${ALLOWED_APP_ID}/`;
const PATCH_CHECK_CACHE_TTL_SECONDS = 45;
const IMMUTABLE_PATCH_CDN_RE =
  /^\/api\/v1\/patches\/cdn\/(441919ad-1e51-4b10-bc7e-6b0437df4912\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/dlc\.vmcode)$/;

function jsonResponse(body, status, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-patch-proxy-hop': 'direct-worker',
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

async function handlePatchCdn(request, url, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  const match = IMMUTABLE_PATCH_CDN_RE.exec(url.pathname);
  if (!match) {
    return jsonResponse({ error: 'Forbidden patch path' }, 403);
  }

  const relPath = match[1];
  const reqRange = request.headers.get('range');
  const canonicalUrl = `${url.origin}${url.pathname}`;
  const cache = caches.default;
  const cacheKey = new Request(canonicalUrl, { method: 'GET' });
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
    hitHeaders.set('x-patch-proxy-hop', 'direct-worker');
    return new Response(request.method === 'HEAD' ? null : cached.body, {
      status: cached.status,
      headers: hitHeaders,
    });
  }

  const cdnUrl = `https://cdn.shorebird.cloud/api/v1/patches/${relPath}`;
  const fwdHeaders = new Headers();
  fwdHeaders.set(
    'user-agent',
    request.headers.get('user-agent') || 'shorebird-proxy/1.0',
  );
  if (reqRange) fwdHeaders.set('range', reqRange);

  const res = await fetch(cdnUrl, {
    method: 'GET',
    headers: fwdHeaders,
    cf: {
      cacheEverything: true,
      cacheTtl: 31536000,
    },
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
  outHeaders.set(
    'accept-ranges',
    res.headers.get('accept-ranges') || 'bytes',
  );
  outHeaders.set(
    'cache-control',
    res.ok ? 'public, max-age=31536000, immutable' : 'no-store',
  );
  outHeaders.set('cf-cache-status', 'MISS');
  outHeaders.set('x-patch-edge-cache', 'MISS');
  outHeaders.set('x-patch-proxy-hop', 'direct-worker');

  if (
    request.method === 'GET' &&
    !reqRange &&
    res.status === 200 &&
    res.body
  ) {
    const [clientBody, cacheBody] = res.body.tee();
    const cacheHeaders = new Headers(outHeaders);
    cacheHeaders.delete('cf-cache-status');
    cacheHeaders.delete('x-patch-edge-cache');
    cacheHeaders.delete('x-patch-proxy-hop');
    ctx.waitUntil(
      cache.put(
        cacheKey,
        new Response(cacheBody, {
          status: 200,
          headers: cacheHeaders,
        }),
      ),
    );
    return new Response(clientBody, {
      status: 200,
      headers: outHeaders,
    });
  }

  if (request.method === 'HEAD') {
    res.body?.cancel();
    return new Response(null, {
      status: res.status,
      headers: outHeaders,
    });
  }

  return new Response(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

async function handlePatchApi(request, url, subpath, ctx) {
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

  const cache = caches.default;
  const cacheKey =
    subpath === 'check' ? buildPatchCheckCacheKey(url.origin, parsed) : null;

  if (cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const hitHeaders = new Headers({
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-patch-check-cache': 'HIT',
        'x-patch-proxy-hop': 'direct-worker',
      });
      return new Response(cached.body, {
        status: 200,
        headers: hitHeaders,
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
  resHeaders.set('x-patch-proxy-hop', 'direct-worker');

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

      if (cacheKey) {
        const cacheEntry = new Response(serialized, {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': `public, max-age=${PATCH_CHECK_CACHE_TTL_SECONDS}`,
          },
        });
        ctx.waitUntil(cache.put(cacheKey, cacheEntry));
      }

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/v1/patches/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
      const subpath = url.pathname.slice('/api/v1/patches/'.length);
      if (subpath.startsWith('cdn/')) {
        return handlePatchCdn(request, url, ctx);
      }
      if (subpath === 'check' || subpath === 'events') {
        return handlePatchApi(request, url, subpath, ctx);
      }
      return jsonResponse({ error: 'Not found' }, 404);
    }

    const originUrl = 'https://apppages.pages.dev' + url.pathname + url.search;
    const init = { method: request.method, headers: request.headers };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }
    const res = await fetch(originUrl, init);
    const type = res.headers.get('content-type') || '';
    if (request.method === 'HEAD' || !type.includes('text/html')) return res;

    let html = await res.text();
    html = html.split('https://cards.laoyuanyingshi.com').join('https://cards.foxlaoy.com');

    const headers = new Headers(res.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=300');
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(html, { status: res.status, headers });
  }
};
