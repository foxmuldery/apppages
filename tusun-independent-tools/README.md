# 兔狲独立版工具下载页

本页只展示七款 macOS 独立版工具，严格按制作流程排序。当前所有最新本地产物都未同时满足“Developer ID 签名、Apple 公证、公开 HTTPS 托管、匿名访问复测”四项公开发行门槛，因此页面不提供任何虚构或受限下载 URL，统一标记为“待发布”。

官方 Logo 复制自同一站点 `tusun-film-center/assets/` 的七份已固定网页资产。产品名与功能说明沿用兔狲中心的正式展示目录。版本、Build、系统要求、文件大小和 SHA-256 来自 2026-09-02 核验的本机独立版产物；剧本编辑器 DMG 另从私有 GitHub Release 临时下载复核，未纳入站点仓库。

运行检查：

```bash
python3 -m unittest tusun-independent-tools/test_download_page.py -v
```

本地预览：

```bash
python3 -m http.server 4173
```

当某款工具正式发布时，只把该工具的按钮替换为经过匿名访问验证的独立版 HTTPS URL。测试会拒绝任意包含 `workshop`、`Workshop` 或“工作坊”的下载链接，也会拒绝一次性整套下载入口。
