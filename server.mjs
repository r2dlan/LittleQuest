import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname, resolve } from "node:path";

const root = resolve("web");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const server = http
  .createServer(async (req, res) => {
    try {
      const path = resolve(
        root,
        `.${decodeURIComponent(new URL(req.url, "http://localhost").pathname)}`,
      );
      if (!path.startsWith(`${root}/`) && path !== root) throw Error();
      const file =
        path === root || path.endsWith("/")
          ? resolve(path, "index.html")
          : path;
      const body = await readFile(file);
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "text/javascript",
          ".svg": "image/svg+xml",
          ".json": "application/json",
          ".webmanifest": "application/manifest+json",
        }[extname(file)] || "application/octet-stream",
      );
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Nicht gefunden");
    }
  })
  .listen(port, host, () => {
    console.log(`Little Quest: http://${host}:${server.address().port}`);
  });
