import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function buildMetadata(version, revision, releaseTag = "") {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error("Project version must use major.minor.patch");
  }
  const [major, minor, patch] = version.split(".").map(Number);
  if (major > 2100 || minor > 999 || patch > 999) {
    throw new Error("Project version exceeds Android versionCode limits");
  }
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid commit SHA");
  if (releaseTag && releaseTag !== `v${version}`) {
    throw new Error(
      `Release tag ${releaseTag} does not match project version v${version}`,
    );
  }
  return {
    version,
    revision,
    "image-tag": releaseTag || `v${version}-sha.${revision}`,
    "artifact-prefix": `LittleQuest-${releaseTag || `v${version}-${revision.slice(0, 12)}`}`,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const project = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  if (
    lock.version !== project.version ||
    lock.packages[""].version !== project.version
  ) {
    throw new Error("package.json and package-lock.json versions must match");
  }
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const metadata = buildMetadata(
    project.version,
    revision,
    process.env.BUILD_RELEASE_TAG || "",
  );
  const output = Object.entries(metadata)
    .map(([key, value]) => `${key}=${value}\n`)
    .join("");
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  else console.log(output);
}
