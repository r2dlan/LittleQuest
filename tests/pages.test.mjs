import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { preparePages } from "../scripts/prepare-pages.mjs";

test("Pages deploys release assets with a fresh deterministic offline cache and traceable version", async (t) => {
  const temp = await mkdtemp(join(tmpdir(), "littlequest-pages-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const options = {
    output: join(temp, "pages"),
    version: "0.4.2",
    revision: "a".repeat(40),
    releaseTag: "v0.4.2",
  };
  const original = await readFile("web/sw.js", "utf8");
  const cache = await preparePages(options);
  assert.equal(await preparePages(options), cache);
  assert.equal(await readFile("web/sw.js", "utf8"), original);
  assert.equal(
    await readFile(join(options.output, "game.js"), "utf8"),
    await readFile("web/game.js", "utf8"),
  );
  assert.equal(
    await readFile(join(options.output, "privacy.html"), "utf8"),
    await readFile("web/privacy.html", "utf8"),
  );
  assert(
    (await readFile(join(options.output, "sw.js"), "utf8")).includes(cache),
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(options.output, "release.json"), "utf8")),
    { version: "0.4.2", tag: "v0.4.2", revision: options.revision },
  );
  assert.match(
    await readFile(join(options.output, "_headers"), "utf8"),
    /Cache-Control: no-cache/,
  );
  assert.notEqual(
    await preparePages({ ...options, revision: "b".repeat(40) }),
    cache,
  );
  // A changed asset must also invalidate the offline cache, even for the same metadata.
  const changedSource = join(temp, "source");
  await cp("web", changedSource, { recursive: true });
  await writeFile(join(changedSource, "game.js"), "changed");
  assert.notEqual(
    await preparePages({ ...options, source: changedSource }),
    cache,
  );
  await assert.rejects(
    preparePages({ ...options, output: "web" }),
    /web source/,
  );
  await assert.rejects(
    preparePages({ ...options, releaseTag: "v0.4.1" }),
    /does not match/,
  );
  await assert.rejects(
    preparePages({ ...options, releaseTag: "" }),
    /release tag/,
  );
});
