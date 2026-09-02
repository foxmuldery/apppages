# 兔狲独立版工具下载页

本页提供一个单独的兔狲AI创作工作坊中心 App 入口，并展示严格按制作流程排序的七款 macOS 独立版工具。中心 App 不计入 01–07；02、03、04、06、07 已提供公开可匿名下载的 internal prerelease，01、05 保持“待发布”。所有可下载包均未完成 Developer ID 正式签名和 Apple 公证，页面明确披露该状态。

官方 Logo 复制自同一站点 `tusun-film-center/assets/` 的七份已固定网页资产。产品名与功能说明沿用兔狲中心的正式展示目录。版本、Build、系统要求、文件大小和 SHA-256 来自 2026-09-02 核验的本机独立版产物；剧本编辑器 DMG 另从私有 GitHub Release 临时下载复核，未纳入站点仓库。

运行检查：

```bash
python3 -m unittest tusun-independent-tools/test_download_page.py -v
```

本地预览：

```bash
python3 -m http.server 4173
```

当某款工具发布时，只把该工具的按钮替换为经过匿名访问、文件大小与 SHA-256 验证的独立版 HTTPS URL。测试会拒绝任意包含 `workshop`、`Workshop` 或“工作坊”的工具下载链接，也会确保中心 App 入口不会混入七个独立版工具卡片。
