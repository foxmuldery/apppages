from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parent
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.download_links = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and ("download" in attrs or "download" in attrs.get("class", "")):
            self.download_links.append(attrs.get("href", ""))
        if tag == "img":
            self.images.append((attrs.get("src", ""), attrs.get("alt", "")))


class DownloadPageTests(unittest.TestCase):
    def test_exact_product_order(self):
        expected = [
            "兔狲剧本编辑器", "兔狲批量图生成台", "兔狲分镜工作台", "兔狲关键帧生成器",
            "兔狲关键帧精调台", "兔狲配音工作台", "兔狲视频工作台",
        ]
        positions = [HTML.index(f"<h3>{name}</h3>") for name in expected]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(HTML.count('class="tool-row"'), 7)

    def test_official_logos_exist(self):
        parser = PageParser()
        parser.feed(HTML)
        product_images = [item for item in parser.images if "官方 Logo" in item[1]]
        self.assertEqual(len(product_images), 7)
        for src, alt in product_images:
            self.assertTrue((ROOT / src).is_file(), alt)

    def test_all_release_facts_present(self):
        for article in re.findall(r'<article class="tool-row".*?</article>', HTML, re.S):
            for label in ("版本", "兼容性", "安装包", "SHA-256", "发行信任"):
                self.assertIn(label, article)
            if "待公开下载包冻结后提供" not in article:
                checksum = re.search(r"<code>([0-9a-f]{64})</code>", article)
                self.assertIsNotNone(checksum)

    def test_only_verified_download_links_are_enabled(self):
        parser = PageParser()
        parser.feed(HTML)
        expected = {
            "https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-batchdesk-standalone-1.1.9-macos-arm64.zip",
            "https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-storyboard-workbench-standalone-1.0.9-macos-arm64.zip",
            "https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-keyframe-generator-standalone-0.6.2-macos-arm64.zip",
            "https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-voice-studio-standalone-1.1.9-macos-arm64.zip",
            "https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-video-workbench-standalone-1.3.1-macos-arm64.pkg",
        }
        self.assertEqual(set(parser.download_links), expected)
        standalone_links = [href for href in parser.download_links if "tusun-independent-tools-current" in href]
        self.assertEqual(len(standalone_links), 5)
        for href in standalone_links:
            self.assertIn("standalone", href)
            self.assertNotRegex(href, r"(?i)workshop|工作坊")
        self.assertEqual(HTML.count('class="download-button" type="button" disabled'), 2)

    def test_center_app_is_not_in_independent_page(self):
        self.assertNotIn("center-app", HTML)
        self.assertNotIn("center-download", HTML)
        self.assertNotIn("tusun-film-center-tools-current", HTML)
        for tool_id in ("screenplay", "keyframe-workbench"):
            article = re.search(rf'<article class="tool-row" id="{tool_id}">.*?</article>', HTML, re.S)
            self.assertIsNotNone(article)
            self.assertNotIn("<a ", article.group(0))
            if tool_id == "screenplay":
                self.assertIn("待公开下载", article.group(0))
            else:
                self.assertIn("待发布", article.group(0))

    def test_no_bundle_download_or_prefetch(self):
        self.assertNotIn("prefetch", HTML.lower())
        self.assertNotIn("preload", HTML.lower())
        self.assertNotRegex(HTML, r"(?i)download.{0,40}(all|bundle|suite|整套|全套)")


if __name__ == "__main__":
    unittest.main()
