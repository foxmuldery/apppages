/**
 * apppages 的 Cloudflare Pages Git 构建未触发，整站手动部署又被
 * 32MB 安装包挡住（单文件 25MB 限制）。这个 Worker 兜底：
 * 从 apppages.pages.dev 取同路径内容，把 HTML 中的旧卡片域名
 * 替换为新域名；其他内容原样流式返回。
 */
const IMMUTABLE_PATCH_CDN_RE =
  /^\/api\/v1\/patches\/cdn\/441919ad-1e51-4b10-bc7e-6b0437df4912\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/dlc\.vmcode$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isImmutablePatchCdn =
      (request.method === 'GET' || request.method === 'HEAD') &&
      IMMUTABLE_PATCH_CDN_RE.test(url.pathname);

    // Edge-cache immutable Shorebird dlc.vmcode binaries directly on custom domain apps.foxlaoy.com
    // (NEVER caches POST /api/v1/patches/check or /events).
    if (isImmutablePatchCdn) {
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
        return new Response(request.method === 'HEAD' ? null : cached.body, {
          status: cached.status,
          headers: hitHeaders,
        });
      }

      const originUrl = 'https://apppages.pages.dev' + url.pathname;
      const fwdHeaders = new Headers();
      const ua = request.headers.get('user-agent');
      if (ua) fwdHeaders.set('user-agent', ua);
      if (reqRange) fwdHeaders.set('range', reqRange);

      const res = await fetch(originUrl, {
        method: request.method,
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

      return new Response(request.method === 'HEAD' ? null : res.body, {
        status: res.status,
        headers: outHeaders,
      });
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
