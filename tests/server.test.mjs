import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";

test("Container server accepts network binding and serves offline game files", async (t) => {
  const child = spawn(process.execPath, ["server.mjs"], {
    env: { ...process.env, HOST: "0.0.0.0", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Server startup timed out"));
    }, 5000);
    timer.unref();
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/0\.0\.0\.0:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early: ${code}`));
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /game\.js/);
  for (const file of [
    "game.js",
    "journey-game.js",
    "journey-world.js",
    "characters.js",
    "settings.js",
    "camels.js",
    "wildlife.js",
    "beach.js",
    "sw.js",
    "privacy.html",
  ]) {
    assert.equal((await fetch(`${base}/${file}`)).status, 200, file);
  }
  const privacy = await fetch(`${base}/privacy-details.json`);
  const sprites = await fetch(`${base}/assets/characters-b.png`);
  assert.equal(sprites.status, 200);
  assert.equal(sprites.headers.get("content-type"), "image/png");
  const desertSprites = await fetch(`${base}/assets/characters-desert.png`);
  assert.equal(desertSprites.status, 200);
  assert.equal(desertSprites.headers.get("content-type"), "image/png");
  const snowSprites = await fetch(`${base}/assets/characters-snow.png`);
  assert.equal(snowSprites.status, 200);
  assert.equal(snowSprites.headers.get("content-type"), "image/png");
  for (const file of ["characters-beach.png", "brother-beach.png"]) {
    const beach = await fetch(`${base}/assets/${file}`);
    assert.equal(beach.status, 200);
    assert.equal(beach.headers.get("content-type"), "image/png");
  }
  const camels = await fetch(`${base}/assets/camels.png`);
  assert.equal(camels.status, 200);
  assert.equal(camels.headers.get("content-type"), "image/png");
  const wildlife = await fetch(`${base}/assets/wildlife.png`);
  assert.equal(wildlife.status, 200);
  assert.equal(wildlife.headers.get("content-type"), "image/png");
  assert.equal(privacy.headers.get("content-type"), "application/json");
  assert.equal((await privacy.json()).publisher, "Daniel Andres");
  assert.equal((await fetch(`${base}/missing.html`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e%2fpackage.json`)).status, 404);
});
