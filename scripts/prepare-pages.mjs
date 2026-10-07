import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, parse, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { buildMetadata } from "./build-metadata.mjs";

export async function preparePages({
  source = "web",
  output = "dist/pages",
  version,
  revision,
  releaseTag,
}) {
  const metadata = buildMetadata(version, revision, releaseTag);
  if (!releaseTag) throw new Error("Cloudflare Pages requires a release tag");
  const outputPath = resolve(output);
  const sourcePath = resolve(source);
  if (
    outputPath === parse(outputPath).root ||
    outputPath === sourcePath ||
    sourcePath.startsWith(`${outputPath}${sep}`)
  ) {
    throw new Error("Output must not contain the web source");
  }
  const hash = createHash("sha256");
  async function fingerprint(directory, relative = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      const name = join(relative, entry.name);
      if (entry.isDirectory()) await fingerprint(path, name);
      else if (entry.isFile())
        hash
          .update(name)
          .update("\0")
          .update(await readFile(path))
          .update("\0");
      else throw new Error(`Unsupported web asset: ${name}`);
    }
  }
  await fingerprint(source);
  const cacheName = `littlequest-pages-${version}-${revision}-${hash.digest("hex")}`;
  const sw = await readFile(join(source, "sw.js"), "utf8");
  if (!/const CACHE = "[^"]+";/.test(sw))
    throw new Error("Service worker cache declaration missing");
  await rm(output, { recursive: true, force: true });
  await cp(source, output, { recursive: true });
  await writeFile(
    join(output, "sw.js"),
    sw.replace(
      /const CACHE = "[^"]+";/,
      `const CACHE = ${JSON.stringify(cacheName)};`,
    ),
  );
  await writeFile(
    join(output, "release.json"),
    `${JSON.stringify({ version: metadata.version, tag: releaseTag, revision }, null, 2)}\n`,
  );
  await writeFile(
    join(output, "_headers"),
    "/sw.js\n  Cache-Control: no-cache\n/release.json\n  Cache-Control: no-store\n",
  );
  return cacheName;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const project = JSON.parse(await readFile("package.json", "utf8"));
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  await preparePages({
    version: project.version,
    revision,
    releaseTag: process.env.BUILD_RELEASE_TAG || "",
  });
  console.log(
    `Prepared Cloudflare Pages assets for ${process.env.BUILD_RELEASE_TAG} (${revision}).`,
  );
}
