const STATS_KEY = "catbreak:stats";
const DEFAULT_VERSION = "0.3.1";
const DEFAULT_DOWNLOAD_URL = "https://apps.foxlaoy.com/catbreak/downloads/CatBreak-mac.zip";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/catbreak/stats.json") {
      return json(await readStats(env));
    }

    if (url.pathname === "/catbreak/download") {
      if (request.method === "HEAD") {
        return redirectToDownload(env);
      }

      if (request.method !== "GET") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }

      await incrementStats(env);
      return redirectToDownload(env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function readStats(env) {
  const stored = await env.DOWNLOAD_STATS.get(STATS_KEY, "json");
  return normalizeStats(stored, env);
}

async function incrementStats(env) {
  const current = await readStats(env);
  const version = current.version;
  const versions = { ...current.versions };
  versions[version] = (versions[version] || 0) + 1;

  const next = {
    totalDownloads: current.totalDownloads + 1,
    version,
    versionDownloads: versions[version],
    versions,
    updatedAt: new Date().toISOString(),
  };

  await env.DOWNLOAD_STATS.put(STATS_KEY, JSON.stringify(next));
  return next;
}

function normalizeStats(value, env) {
  const version = String(env.APP_VERSION || value?.version || DEFAULT_VERSION);
  const versions = isRecord(value?.versions) ? value.versions : {};
  const versionDownloads = toCount(
    versions[version] ?? value?.versionDownloads ?? value?.version_downloads
  );

  return {
    totalDownloads: toCount(
      value?.totalDownloads ?? value?.total_downloads ?? value?.downloads ?? value?.total
    ),
    version,
    versionDownloads,
    versions: {
      ...versions,
      [version]: versionDownloads,
    },
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null,
  };
}

function redirectToDownload(env) {
  const downloadUrl = env.DOWNLOAD_URL || DEFAULT_DOWNLOAD_URL;

  return new Response(null, {
    status: 302,
    headers: {
      Location: downloadUrl,
      "Cache-Control": "no-store",
    },
  });
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
