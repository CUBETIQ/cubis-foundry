#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFixtureServer } from "./lib/fixture-server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "fixtures");
const host = "127.0.0.1";
const port = Number.parseInt(process.env.UI_TESTING_PORT || "4173", 10);
const server = createFixtureServer({ root, host, port });

server.listen(port, host, () => {
  process.stdout.write(`UI testing fixtures available at http://${host}:${port}\n`);
  process.stdout.write(`Serving: ${root}\n`);
});
