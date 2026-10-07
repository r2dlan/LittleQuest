import { pathToFileURL } from "node:url";

export function outdatedVersions(items, { keep = 10, packages = false } = {}) {
  if (!Number.isInteger(keep) || keep < 1)
    throw new Error("Invalid retention count");
  for (const item of items) {
    if (!packages && (item.draft || !item.published_at)) continue;
    if (
      !Number.isSafeInteger(item.id) ||
      !Number.isFinite(
        Date.parse(packages ? item.created_at : item.published_at),
      )
    ) {
      throw new Error("Invalid version metadata; cleanup stopped");
    }
  }
  const sorted = items
    .filter((item) => packages || (!item.draft && item.published_at))
    .sort((a, b) => {
      const date = (item) =>
        Date.parse(packages ? item.created_at : item.published_at);
      return date(b) - date(a) || b.id - a.id;
    });
  const retained = new Set(
    packages
      ? sorted
          .filter((item) => item.metadata?.container?.tags?.includes("latest"))
          .map((item) => item.id)
      : [],
  );
  for (const item of sorted) {
    if (retained.size >= keep) break;
    retained.add(item.id);
  }
  return sorted.filter((item) => !retained.has(item.id));
}

export async function cleanup({
  request,
  readManifest,
  repository,
  dryRun = true,
  log = console.log,
}) {
  const [owner, name] = repository.split("/");
  if (!owner || !name || repository.split("/").length !== 2)
    throw new Error("Invalid repository");
  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const ownerInfo = await request(`/users/${encodeURIComponent(owner)}`);
  const scope = ownerInfo.type === "Organization" ? "orgs" : "users";
  const packagePath = `/${scope}/${encodeURIComponent(owner)}/packages/container/${encodeURIComponent(name.toLowerCase())}`;
  async function list(path, optional = false) {
    const all = [];
    for (let page = 1; ; page++) {
      const data = await request(`${path}?per_page=100&page=${page}`, {
        optional,
      });
      if (data === null) {
        if (page > 1)
          throw new Error("Version list disappeared during pagination");
        return [];
      }
      if (!Array.isArray(data))
        throw new Error(`Expected version list: ${path}`);
      all.push(...data);
      if (data.length < 100) return all;
    }
  }
  // Fetch both complete lists before deleting anything; API errors must stop cleanup.
  const releases = await list(`${repoPath}/releases`);
  const versions = await list(`${packagePath}/versions`, true);
  const oldReleases = outdatedVersions(releases);
  const manifests = new Map();
  for (const version of versions) {
    if (!readManifest) throw new Error("Container manifest reader is required");
    manifests.set(version.name, await readManifest(version.name));
  }
  const oldPackages = outdatedPackages(versions, manifests);
  log(
    `${dryRun ? "Preview" : "Cleanup"}: ${oldReleases.length} releases, ${oldPackages.length} container manifests beyond retention of 10 complete versions.`,
  );
  for (const release of oldReleases) {
    log(
      `${dryRun ? "Would delete" : "Deleting"} release ${release.tag_name} (${release.id}); Git tag retained.`,
    );
    if (!dryRun)
      await request(`${repoPath}/releases/${release.id}`, { method: "DELETE" });
  }
  for (const version of oldPackages) {
    const path = `${packagePath}/versions/${version.id}`;
    if (!dryRun) {
      // A concurrent publisher may have moved latest after the original list request.
      const current = await request(path);
      if (current.metadata?.container?.tags?.includes("latest")) {
        log(`Keeping version ${version.id}: now tagged latest.`);
        continue;
      }
    }
    log(
      `${dryRun ? "Would delete" : "Deleting"} container version ${version.id} (${version.metadata?.container?.tags?.join(", ") || "untagged"}).`,
    );
    if (!dryRun) await request(path, { method: "DELETE" });
  }
}

export function outdatedPackages(versions, manifests, keep = 10) {
  const referenced = new Set();
  for (const version of versions) {
    const manifest = manifests.get(version.name);
    if (manifest?.schemaVersion !== 2)
      throw new Error("Missing or invalid container manifest");
    for (const child of manifest.manifests || []) referenced.add(child.digest);
  }
  // Count image indexes as versions; architecture manifests are their dependencies.
  const roots = versions.filter((version) => !referenced.has(version.name));
  const oldRoots = outdatedVersions(roots, { keep, packages: true });
  const oldIds = new Set(oldRoots.map((version) => version.id));
  const protectedDigests = new Set();
  function protect(digest) {
    if (protectedDigests.has(digest)) return;
    protectedDigests.add(digest);
    for (const child of manifests.get(digest)?.manifests || [])
      protect(child.digest);
  }
  for (const root of roots) if (!oldIds.has(root.id)) protect(root.name);
  // Delete old indexes first, then only dependencies unused by retained versions.
  return [
    ...oldRoots,
    ...versions.filter(
      (version) =>
        referenced.has(version.name) && !protectedDigests.has(version.name),
    ),
  ];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error("GH_TOKEN is required");
  const request = async (path, { method = "GET", optional = false } = {}) => {
    const response = await fetch(
      `${process.env.GITHUB_API_URL || "https://api.github.com"}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
        },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (optional && response.status === 404) return null;
    if (!response.ok)
      throw new Error(`GitHub ${method} ${path}: HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
  const registryName = (process.env.GITHUB_REPOSITORY || "").toLowerCase();
  let registryToken;
  const readManifest = async (digest) => {
    if (!/^sha256:[a-f0-9]{64}$/.test(digest))
      throw new Error("Invalid container digest");
    if (!registryToken) {
      const auth = Buffer.from(`${process.env.GITHUB_ACTOR}:${token}`).toString(
        "base64",
      );
      const response = await fetch(
        `https://ghcr.io/token?service=ghcr.io&scope=${encodeURIComponent(`repository:${registryName}:pull`)}`,
        {
          headers: { Authorization: `Basic ${auth}` },
          signal: AbortSignal.timeout(30000),
        },
      );
      if (!response.ok)
        throw new Error(
          `Container registry authentication: HTTP ${response.status}`,
        );
      registryToken = (await response.json()).token;
      if (!registryToken) throw new Error("Container registry token missing");
    }
    const response = await fetch(
      `https://ghcr.io/v2/${registryName}/manifests/${digest}`,
      {
        headers: {
          Authorization: `Bearer ${registryToken}`,
          Accept:
            "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json",
        },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok)
      throw new Error(`Container manifest ${digest}: HTTP ${response.status}`);
    return response.json();
  };
  await cleanup({
    request,
    readManifest,
    repository: process.env.GITHUB_REPOSITORY || "",
    dryRun: !process.argv.includes("--apply"),
  });
}
