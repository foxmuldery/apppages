/**
 * 只作用于 apps.foxlaoy.com 首页的轻量重写：
 * Cloudflare Pages 项目 apppages 的 Git 构建未触发，
 * 整站手动部署又被 32MB 安装包挡住；这里仅把首页里
 * 旧的卡片系统域名替换为新域名，其他路径完全不经过 Worker。
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originUrl = 'https://apppages.pages.dev' + url.pathname + url.search;
    const res = await fetch(originUrl, { method: request.method, headers: request.headers });
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
