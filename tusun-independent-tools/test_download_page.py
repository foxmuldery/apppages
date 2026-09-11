from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
ROOT = Path(__file__).resolve().parent
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
EXPECTED_LINKS = ["https://github.com/foxmuldery/tusun-screenplay-tool/releases/download/v1.0.27/Tusun-Screenplay-Editor-Mac-arm64-v1.0.27.dmg","https://raw.githubusercontent.com/foxmuldery/tusun-batchdesk-updates/main/%E5%85%94%E7%8B%B2%E6%89%B9%E9%87%8F%E5%9B%BE%E7%94%9F%E6%88%90%E5%8F%B0-v1.1.19-macOS-Apple-Silicon.dmg","https://github.com/foxmuldery/tusun-storyboard-workbench-updates/releases/download/v1.0.11/TusunStoryboardWorkbench-Local-1.0.11-macOS.dmg","https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-keyframe-generator-standalone-0.6.2-macos-arm64.zip","https://github.com/foxmuldery/apppages/releases/download/tusun-keyframe-native-v0.2.4-build9/TusunKeyframe-Standalone-0.2.4-macOS-arm64.dmg","https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-voice-studio-standalone-1.1.9-macos-arm64.zip","https://github.com/foxmuldery/apppages/releases/download/tusun-independent-tools-current/tusun-video-workbench-standalone-1.3.1-macos-arm64.pkg"]
UPDATED = [{"id":"batchdesk","version":"v1.1.19 · Build 35","size":"DMG · 28.8 MB","sha":"023b8f872582ec45f358390a48e302b5b6abd24d61fd7c940488b6e2b235ffa8","url":"https://raw.githubusercontent.com/foxmuldery/tusun-batchdesk-updates/main/%E5%85%94%E7%8B%B2%E6%89%B9%E9%87%8F%E5%9B%BE%E7%94%9F%E6%88%90%E5%8F%B0-v1.1.19-macOS-Apple-Silicon.dmg"},{"id":"storyboard","version":"v1.0.11 · Build 127","size":"DMG · 23.6 MB","sha":"8e59086601b189c6c6bdcd6e25131e69d1135ac7a6d71021a27e604bf63e6e6c","url":"https://github.com/foxmuldery/tusun-storyboard-workbench-updates/releases/download/v1.0.11/TusunStoryboardWorkbench-Local-1.0.11-macOS.dmg"},{"id":"keyframe-workbench","version":"v0.2.4 · Build 9","size":"DMG · 54.4 MB","sha":"8a6198c00bfea913877994209b6e702db41037fbc90f0949de945bec1a838582","url":"https://github.com/foxmuldery/apppages/releases/download/tusun-keyframe-native-v0.2.4-build9/TusunKeyframe-Standalone-0.2.4-macOS-arm64.dmg"}]
class DownloadPageTests(unittest.TestCase):
    def test_order(self):
        ids = re.findall(r'<article class="tool-row" id="([^"]+)">', HTML)
        self.assertEqual(ids, ["screenplay", "batchdesk", "storyboard", "keyframe-generator", "keyframe-workbench", "voice", "video"])
    def test_logos(self):
        logos = re.findall(r'<img src="([^"]+)"[^>]+alt="[^"]+官方 Logo"', HTML)
        self.assertEqual(len(logos), 7)
        for logo in logos: self.assertTrue((ROOT / logo).is_file())
    def test_download_targets(self):
        links = re.findall(r'<a class="download-button[^"]*" href="([^"]+)"', HTML)
        self.assertEqual(links, EXPECTED_LINKS)
        self.assertEqual(HTML.count('class="download-button" type="button" disabled'), 7-len(links))
        for link in links: self.assertNotRegex(link, r"(?i)workshop|工作坊")
        self.assertIn(f"<strong>{len(links)} / 7</strong>", HTML)
    def test_frozen_facts(self):
        for target in UPDATED:
            article = re.search(r'<article class="tool-row" id="'+target["id"]+r'">.*?</article>', HTML, re.S).group()
            for key in ("version", "size", "sha", "url"): self.assertIn(target[key], article)
            self.assertIn("未公证", article)
            self.assertIn("尚未完成真实付费出图验收", article)
    def test_all_facts(self):
        for article in re.findall(r'<article class="tool-row".*?</article>', HTML, re.S):
            for label in ("版本", "兼容性", "安装包", "SHA-256", "发行信任"): self.assertIn(label, article)
            self.assertRegex(article, r"<code>[0-9a-f]{64}</code>")
    def test_independent_only_no_prefetch(self):
        self.assertNotIn("tusun-film-center-tools-current", HTML)
        self.assertNotIn("center-download", HTML)
        self.assertNotRegex(HTML.lower(), r"prefetch|preload")
if __name__ == "__main__": unittest.main()
