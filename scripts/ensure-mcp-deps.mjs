#!/usr/bin/env node

import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TSUP_SENTINEL = path.join(ROOT, "mcp", "node_modules", "tsup", "package.json");

async function exists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (await exists(TSUP_SENTINEL)) {
    return;
  }

  console.log("[mcp] Installing nested MCP dependencies with npm ci...");
  const result = spawnSync("npm ci --prefix mcp", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  if (result.error) {
    console.error(result.error.message || result.error);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
