import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanup,
  outdatedPackages,
  outdatedVersions,
} from "../scripts/cleanup-github.mjs";

function versions(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `sha256:${(i + 1).toString(16).padStart(64, "0")}`,
    created_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
    published_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
    tag_name: `v0.0.${i + 1}`,
    metadata: { container: { tags: [`sha-${i + 1}`] } },
  }));
}

test("Retention keeps newest 10 published releases, ignores drafts and uses publication date", () => {
  const items = versions(12);
  items.push({ id: 20, draft: true, published_at: null });
  items[0].published_at = "2027-01-01T00:00:00Z";
  assert.deepEqual(
    outdatedVersions(items).map((v) => v.id),
    [3, 2],
  );
  assert.deepEqual(outdatedVersions(versions(8)), []);
});

test("Container retention counts digests including untagged images and protects latest within 10", () => {
  const items = versions(13);
  items[0].metadata.container.tags.push("latest", "v0.1.0");
  items[1].metadata.container.tags = [];
  assert.deepEqual(
    outdatedVersions(items, { packages: true }).map((v) => v.id),
    [4, 3, 2],
  );
});

test("Multi-platform retention keeps ten complete versions with both architectures and shared layers", () => {
  const roots = versions(12);
  roots[0].metadata.container.tags.push("latest");
  const children = versions(24).map((version, i) => ({
    ...version,
    id: 100 + i,
    name: `sha256:${(100 + i).toString(16).padStart(64, "0")}`,
    metadata: { container: { tags: [] } },
  }));
  const manifests = new Map(
    children.map((v) => [v.name, { schemaVersion: 2 }]),
  );
  roots.forEach((root, i) => {
    manifests.set(root.name, {
      schemaVersion: 2,
      manifests: [
        { digest: children[i * 2].name },
        { digest: children[i * 2 + 1].name },
      ],
    });
  });
  // An obsolete index shares its ARM image with a retained version.
  manifests.get(roots[1].name).manifests[1].digest = children[0].name;
  const removed = outdatedPackages([...children, ...roots], manifests);
  const removedIds = new Set(removed.map((v) => v.id));
  assert(!removedIds.has(roots[0].id));
  assert(!removedIds.has(children[0].id));
  for (const root of roots.filter((root) => !removedIds.has(root.id))) {
    for (const child of manifests.get(root.name).manifests) {
      assert(!removed.some((v) => v.name === child.digest));
    }
  }
  // The unreferenced platform image also counts as a standalone root.
  assert.equal(roots.filter((root) => !removedIds.has(root.id)).length, 9);
  assert(removedIds.has(roots[1].id));
  assert.throws(() => outdatedPackages(roots, new Map()), /manifest/);
});

test("Cleanup paginates before deleting, preview does not mutate and Git tags remain", async () => {
  const items = versions(101);
  const calls = [];
  const request = async (path, options = {}) => {
    calls.push({ path, ...options });
    if (path === "/users/r2dlan") return { type: "Organization" };
    if (path.includes("/releases?"))
      return path.endsWith("page=1") ? items.slice(0, 100) : items.slice(100);
    if (path.includes("/versions?")) return null;
    if (options.method === "DELETE") return null;
    throw new Error(`Unexpected request ${path}`);
  };
  await cleanup({
    request,
    readManifest: async () => ({ schemaVersion: 2 }),
    repository: "r2dlan/LittleQuest",
    log: () => {},
  });
  assert.equal(calls.filter((c) => c.method === "DELETE").length, 0);
  assert(calls.some((c) => c.path.endsWith("page=2")));
  calls.length = 0;
  await cleanup({
    request,
    readManifest: async () => ({ schemaVersion: 2 }),
    repository: "r2dlan/LittleQuest",
    dryRun: false,
    log: () => {},
  });
  assert.equal(calls.filter((c) => c.method === "DELETE").length, 91);
  assert(
    calls
      .filter((c) => c.method === "DELETE")
      .every((c) => c.path.includes("/releases/")),
  );
});

test("Cleanup stops on API errors and rechecks latest before package deletion", async () => {
  const items = versions(11);
  const deleted = [];
  const request = async (path, options = {}) => {
    if (path === "/users/r2dlan") return { type: "Organization" };
    if (path.includes("/releases?")) return [];
    if (path.includes("/versions?")) return items;
    if (options.method === "DELETE") {
      deleted.push(path);
      return null;
    }
    return { metadata: { container: { tags: ["latest"] } } };
  };
  await cleanup({
    request,
    readManifest: async () => ({ schemaVersion: 2 }),
    repository: "r2dlan/LittleQuest",
    dryRun: false,
    log: () => {},
  });
  assert.deepEqual(deleted, []);
  await assert.rejects(
    cleanup({
      request: async (path) => {
        if (path === "/users/r2dlan") return { type: "Organization" };
        if (path.includes("/releases?")) return versions(12);
        throw new Error("HTTP 403");
      },
      repository: "r2dlan/LittleQuest",
      dryRun: false,
      log: () => {},
    }),
    /403/,
  );
});
