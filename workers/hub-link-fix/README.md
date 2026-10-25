# hub-link-fix

临时 Worker：只用于把 `apps.foxlaoy.com` 首页里的旧卡片系统域名
`cards.laoyuanyingshi.com` 替换为 `cards.foxlaoy.com`。

背景：Cloudflare Pages 项目 `apppages` 的 Git 构建没有触发，整站手动部署
又被 `tusun-film-center/downloads/` 下 6 个 32MB 安装包挡住（Pages 单文件
25MB 限制）。

```bash
# 部署（需要 pages/workers 权限）
wrangler deploy --config workers/hub-link-fix/wrangler.toml

# 路由（只作用于该 host）
# apps.foxlaoy.com/*  -> apppages-link-fix
```

重新部署 `apppages` 后，可删除路由与 Worker。
