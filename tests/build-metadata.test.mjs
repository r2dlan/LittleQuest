import assert from "node:assert/strict";
import test from "node:test";
import { buildMetadata } from "../scripts/build-metadata.mjs";

const sha = "a".repeat(40);
test("App and container metadata derive from one version and commit", () => {
  const data = buildMetadata("0.3.0", sha);
  assert.equal(data.version, "0.3.0");
  assert.equal(data.revision, sha);
  assert.equal(data["image-tag"], `v0.3.0-sha.${sha}`);
  assert.equal(data["artifact-prefix"], "LittleQuest-v0.3.0-aaaaaaaaaaaa");
  assert.equal(buildMetadata("0.3.0", sha, "v0.3.0")["image-tag"], "v0.3.0");
});

test("Mismatched releases and versions unsupported by Android fail before either build", () => {
  assert.throws(() => buildMetadata("0.3.0", sha, "v0.2.0"), /does not match/);
  for (const version of [
    "0.3.0-beta.1",
    "0.3",
    "01.2.3",
    "2101.0.0",
    "0.1000.0",
    "0.0.1000",
  ]) {
    assert.throws(() => buildMetadata(version, sha));
  }
  assert.throws(() => buildMetadata("0.3.0", "main"), /SHA/);
});
