import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function safeJoin(base, target) {
  const resolved = path.resolve(base, `.${target}`);
  if (!resolved.startsWith(base)) {
    throw new Error("Path traversal denied.");
  }
  return resolved;
}

export function createFixtureServer({ root, host, port }) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${host}:${port}`);
      const pathname = url.pathname.endsWith("/")
        ? `${url.pathname}index.html`
        : url.pathname;
      const filePath = safeJoin(root, pathname);
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
      res.end(data);
    } catch (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`Not found: ${error.message}\n`);
    }
  });
}
