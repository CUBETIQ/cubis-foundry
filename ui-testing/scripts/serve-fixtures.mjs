#!/usr/bin/env node

import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "fixtures");
const host = "127.0.0.1";
const port = Number.parseInt(process.env.UI_TESTING_PORT || "4173", 10);

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

const server = http.createServer(async (req, res) => {
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

server.listen(port, host, () => {
  process.stdout.write(`UI testing fixtures available at http://${host}:${port}\n`);
  process.stdout.write(`Serving: ${root}\n`);
});
