// Cloudflare Pages Function: Shorebird Patch Proxy for Flash Memo (留声闪记)
// Allows Mainland China clients (without VPN) to check & report Shorebird patches
// via https://apps.foxlaoy.com/api/v1/patches/{check,events} -> https://api.shorebird.dev
// Strictly locked to Flash Memo's app_id so this endpoint cannot be abused as an open proxy.

const ALLOWED_APP_ID = '441919ad-1e51-4b10-bc7e-6b0437df4912';
const UPSTREAM_ORIGIN = 'https://api.shorebird.dev';

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

  // Only allow the two runtime updater endpoints used by Shorebird's Rust engine
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
  try {
    rawBody = await request.text();
    const parsed = JSON.parse(rawBody);
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

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}
