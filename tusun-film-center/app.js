const tools = {
  screenplay: {
    sequence: "01",
    name: "兔狲剧本编辑器",
    preview: "在本地编写、自动排版与版本备份剧本，并导出 Word / Markdown。",
    tagline: "在本地编写、自动排版与版本备份剧本，并导出 Word / Markdown。",
    description: "在本机完成剧本编写、场景与人物整理、自动排版和版本备份，并导出 Word 或 Markdown 交给后续制作。",
    version: "1.0.27",
    icon: "assets/screenplay.png",
    ports: {
      workshop: {
        range: "52125–52129",
        note: "工作坊版从专用端口段启动，实际端口只在通过身份校验后显示。",
        conflict: "若专用端口身份无法验证，工作坊会提示冲突，不会接管或结束其他服务。",
      },
      standalone: {
        range: "由独立版管理",
        note: "独立版端口规则不由工作坊推断，实际端口请在独立 App 内查看。",
        conflict: "工作坊不会把工作坊版的端口状态套用到独立版。",
      },
    },
  },
  batchdesk: {
    sequence: "02",
    name: "兔狲批量图生成台",
    preview: "导入文档拆成提示语，批量生成、复查并导出项目图片。",
    tagline: "导入文档拆成提示语，批量生成、复查并导出项目图片。",
    description: "导入文档并拆分成提示语，批量生成图片、复查失败任务、整理结果并导出项目素材。",
    version: "1.1.15",
    icon: "assets/batchdesk.png",
    ports: {
      workshop: {
        range: "52155–52159",
        note: "工作坊版只使用隔离的工作坊端口段。",
        conflict: "首选端口被占用时会在 52155–52159 内换用可用端口；陌生服务不会被接管。",
      },
      standalone: {
        range: "52150–52154",
        note: "独立版和工作坊版使用不同端口段与运行目录。",
        conflict: "旧端口或独立版端口冲突只会被提示，不会影响工作坊版进程。",
      },
    },
  },
  storyboard: {
    sequence: "03",
    name: "兔狲分镜工作台",
    preview: "导入剧本，AI 拆解镜头并生成分镜草图，审核后导出通过分镜。",
    tagline: "导入剧本，AI 拆解镜头并生成分镜草图，审核后导出通过分镜。",
    description: "导入剧本后用 AI 拆解镜头并生成分镜草图，在工作台审核、调整，再导出已经通过的分镜。",
    version: "1.0.7",
    icon: "assets/storyboard.png",
    ports: {
      workshop: {
        range: "启动时动态分配",
        note: "工作坊版启动后由本机服务写入并验证实际端口。",
        conflict: "动态端口身份无法验证或落入保留端口段时，工作坊会标为待检查或冲突。",
      },
      standalone: {
        range: "启动时动态分配",
        note: "独立版和工作坊版分别记录自己的动态端口。",
        conflict: "工作坊只读取独立版的受信状态，不会接管它的服务。",
      },
    },
  },
  "keyframe-generator": {
    sequence: "04",
    name: "兔狲关键帧生成器",
    preview: "从剧本筛选关键画面，绑定资产并编排待生成的关键帧顺序。",
    tagline: "从剧本筛选关键画面，绑定资产并编排待生成的关键帧顺序。",
    description: "导入剧本和摄影圣经，按项目、单集与场次隔离管理画面；配置 API 渠道与生图引擎，获取剧本名词推荐并绑定素材，支持二次确认删除和不含 API Key 的本地备份恢复。批量生图当前为安全演示，不会真实生成图片或触发付费 API。",
    version: "0.6.0",
    icon: "assets/keyframe-generator.png",
    ports: {
      workshop: {
        range: "启动时动态分配",
        note: "工作坊版启动后才显示经过验证的动态端口。",
        conflict: "动态端口落入保留端口段或身份不匹配时会标为待检查或冲突。",
      },
      standalone: {
        range: "启动时动态分配",
        note: "独立版使用自己的状态与动态端口。",
        conflict: "独立版端口未验证时会显示待检查，不会借用工作坊版结果。",
      },
    },
  },
  "keyframe-workbench": {
    sequence: "05",
    name: "兔狲关键帧精调台",
    preview: "组合人物、场景与分镜参考，精调提示语和镜头参数，生成并返修 4K 关键帧。",
    tagline: "组合人物、场景与分镜参考，精调提示语和镜头参数，生成并返修 4K 关键帧。",
    description: "组合人物、场景与分镜参考，精调提示语、构图和镜头参数，生成并返修可用于制作的 4K 关键帧。",
    version: "0.2.0",
    icon: "assets/keyframe-workbench.png",
    ports: {
      workshop: {
        range: "52165–52169",
        note: "工作坊版使用隔离的工作坊端口段。",
        conflict: "无法验证的端口占用会被标成冲突，不会被当成本工具实际端口。",
      },
      standalone: {
        range: "52160–52164",
        note: "独立版和工作坊版可以同时运行，端口段互不重叠。",
        conflict: "旧端口 8942 只用于迁移冲突提示，不会被复用或终止。",
      },
    },
  },
  voice: {
    sequence: "06",
    name: "兔狲配音工作台",
    preview: "管理项目与角色，完成音色复刻、AI 配音、逐句录音和配音包导出。",
    tagline: "管理项目与角色，完成音色复刻、AI 配音、逐句录音和配音包导出。",
    description: "集中管理项目、角色与声音素材，完成音色复刻、AI 配音、逐句录音，并导出可交付的配音包。",
    version: "1.1.8",
    icon: "assets/voice.png",
    ports: {
      workshop: {
        range: "52135–52139",
        note: "工作坊版只使用工作坊端口段。",
        conflict: "工作坊端口冲突不会污染独立版状态，也不会结束陌生服务。",
      },
      standalone: {
        range: "52130–52134",
        note: "独立版使用独立的端口段和运行状态。",
        conflict: "旧端口 8322 只用于冲突与迁移提示。",
      },
    },
  },
  video: {
    sequence: "07",
    name: "兔狲视频工作台",
    preview: "按分镜生成视频，管理任务与三帧质检，并导出 Resolve 时间线。",
    tagline: "按分镜生成视频，管理任务与三帧质检，并导出 Resolve 时间线。",
    description: "按分镜组织视频生成任务，管理镜头素材并完成首帧、中帧、尾帧质检，最后导出 Resolve 时间线。",
    version: "1.2.6",
    icon: "assets/video.png",
    ports: {
      workshop: {
        range: "共用 52140–52144",
        note: "两个版本共享经过身份校验的本机视频服务。",
        conflict: "旧端口 8900 只用于冲突检测；陌生服务不会被复用或终止。",
      },
      standalone: {
        range: "共用 52140–52144",
        note: "两个版本共享同一受信视频服务，状态会明确标注为共用。",
        conflict: "共享端口身份无法验证时，两列都会明确提示冲突。",
      },
    },
  },
};

function setTool(name, edition = "workshop") {
  const tool = tools[name];
  const editionDetails = tool?.ports?.[edition];
  if (!tool || !editionDetails) return;

  document.querySelectorAll("[data-tool][data-edition]").forEach((button) => {
    const selected = button.dataset.tool === name && button.dataset.edition === edition;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.querySelectorAll("[data-preview]").forEach((button) => {
    const selected = button.dataset.preview === name;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.querySelector("[data-tool-icon]").src = tool.icon;
  document.querySelector("[data-tool-name]").textContent = tool.name;
  document.querySelector("[data-tool-description]").textContent = tool.description;
  document.querySelector("[data-tool-edition]").textContent = edition === "workshop" ? "工作坊版" : "独立版";
  document.querySelector("[data-tool-status]").textContent = edition === "workshop" ? "状态由本机检测" : "独立版自行维护";
  document.querySelector("[data-tool-version]").textContent = edition === "workshop" ? `版本 ${tool.version}` : "版本以本机安装为准";
  document.querySelector("[data-tool-range]").textContent = editionDetails.range;
  document.querySelector("[data-tool-actual]").textContent = edition === "workshop" ? "请在本机工作坊查看" : "请在独立 App 查看";
  document.querySelector("[data-tool-port-note]").textContent = editionDetails.note;
  document.querySelector("[data-tool-conflict]").textContent = editionDetails.conflict;
  document.querySelector("[data-primary-action]").textContent = edition === "workshop" ? "安装或更新" : "独立版自行维护";
  document.querySelector("[data-secondary-action]").textContent = edition === "workshop" ? "启动" : "工作坊只识别";

  document.querySelector("[data-preview-icon]").src = tool.icon;
  document.querySelector("[data-preview-name]").textContent = tool.name;
  document.querySelector("[data-preview-description]").textContent = tool.preview;
  document.querySelector("[data-preview-version]").textContent = tool.version;
  document.querySelector("[data-preview-port]").textContent = tool.ports.workshop.range;
}

document.querySelectorAll("[data-tool][data-edition]").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool, button.dataset.edition));
});

document.querySelectorAll("[data-preview]").forEach((button) => {
  button.setAttribute("aria-pressed", button.classList.contains("selected") ? "true" : "false");
  button.addEventListener("click", () => setTool(button.dataset.preview, "workshop"));
});

setTool("screenplay", "workshop");

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
