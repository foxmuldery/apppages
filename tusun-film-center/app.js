const tools = {
  screenplay: {
    name: "兔狲剧本编辑器",
    tagline: "编写、整理和打磨影视剧本。",
    description: "集中完成剧本创作、结构整理与版本管理，为分镜和后续制作准备可靠文本。",
    version: "1.0.17",
    icon: "assets/screenplay.png",
  },
  voice: {
    name: "兔狲配音工作台",
    tagline: "录音、配音与角色音色制作。",
    description: "用于录音、配音和角色音色管理，整理可以直接进入后期流程的音频素材。",
    version: "1.1.7",
    icon: "assets/voice.png",
  },
  storyboard: {
    name: "兔狲分镜工作台",
    tagline: "设计镜头与分镜画面。",
    description: "把剧本内容转成镜头和分镜设计，帮助建立清晰的画面制作计划。",
    version: "1.0.6",
    icon: "assets/storyboard.png",
  },
  "keyframe-workbench": {
    name: "兔狲关键帧精调台",
    tagline: "挑选关键画面，组织镜头节奏。",
    description: "从镜头素材中挑选关键画面，组织画面顺序与镜头节奏，为视频制作建立清晰的视觉参考。",
    version: "0.2.0",
    icon: "assets/keyframe-workbench.png",
  },
  "keyframe-generator": {
    name: "兔狲关键帧生成器",
    tagline: "从剧本批量挑选并组织关键帧。",
    description: "导入剧本和摄影圣经，批量筛选关键句并组织角色、场景、道具与关键帧计划；它是独立产品，不覆盖关键帧精调台。",
    version: "0.3.0",
    icon: "assets/keyframe-generator.png",
  },
  batchdesk: {
    name: "兔狲批量图生成台",
    tagline: "批量生成并管理项目图片。",
    description: "面向批量图像生成任务，统一组织生成内容、任务进度与成品素材。",
    version: "1.1.8",
    icon: "assets/batchdesk.png",
  },
  video: {
    name: "兔狲视频工作台",
    tagline: "生成、管理和交付视频镜头。",
    description: "组织视频生成、镜头素材和质量检查，并衔接后期整理与交付。",
    version: "1.2.6",
    icon: "assets/video.png",
  },
};

function setTool(name) {
  const tool = tools[name];
  if (!tool) return;

  document.querySelectorAll("[data-tool]").forEach((button) => {
    const selected = button.dataset.tool === name;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });

  document.querySelectorAll("[data-preview]").forEach((button) => {
    const selected = button.dataset.preview === name;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.querySelector("[data-tool-icon]").src = tool.icon;
  document.querySelector("[data-tool-name]").textContent = tool.name;
  document.querySelector("[data-tool-description]").textContent = tool.description;
  document.querySelector("[data-tool-version]").textContent = `版本 ${tool.version}`;

  document.querySelector("[data-preview-icon]").src = tool.icon;
  document.querySelector("[data-preview-name]").textContent = tool.name;
  document.querySelector("[data-preview-description]").textContent = tool.tagline;
  document.querySelector("[data-preview-version]").textContent = tool.version;
}

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

document.querySelectorAll("[data-preview]").forEach((button) => {
  button.setAttribute("aria-pressed", button.classList.contains("selected") ? "true" : "false");
  button.addEventListener("click", () => setTool(button.dataset.preview));
});

const copyButton = document.querySelector("[data-copy-checksum]");
copyButton?.addEventListener("click", async () => {
  const checksum = document.querySelector("[data-checksum]")?.textContent?.trim();
  if (!checksum) return;

  try {
    await navigator.clipboard.writeText(checksum);
    copyButton.querySelector("span").textContent = "已复制";
    window.setTimeout(() => {
      copyButton.querySelector("span").textContent = "复制";
    }, 1600);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("[data-checksum]"));
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

async function loadReleaseMetadata() {
  try {
    const response = await fetch("version.json", { cache: "no-store" });
    if (!response.ok) return;
    const release = await response.json();

    const versionText = `v${release.version} Build ${release.build}`;
    document.querySelectorAll("[data-version]").forEach((node) => {
      node.textContent = versionText;
    });
    document.querySelectorAll("[data-min-system]").forEach((node) => {
      node.textContent = `macOS ${release.minimum_macos}+`;
    });
    document.querySelectorAll("[data-download-link]").forEach((link) => {
      link.href = release.download_url;
    });
    document.querySelectorAll("[data-checksum]").forEach((node) => {
      node.textContent = release.sha256;
    });
    const size = formatSize(release.size_bytes);
    if (size) {
      document.querySelectorAll("[data-size]").forEach((node) => {
        node.textContent = size;
      });
    }
  } catch {
    // The page ships reviewed fallback metadata so an offline preview remains useful.
  }
}

loadReleaseMetadata();
