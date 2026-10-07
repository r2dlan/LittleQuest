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
  const oldPackages = outdatedVersions(versions, { packages: true });
  log(
    `${dryRun ? "Preview" : "Cleanup"}: ${oldReleases.length} releases, ${oldPackages.length} container versions beyond retention 10.`,
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
  await cleanup({
    request,
    repository: process.env.GITHUB_REPOSITORY || "",
    dryRun: !process.argv.includes("--apply"),
  });
}
