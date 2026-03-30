#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import { ROOT, pathExists } from "./lib/skill-inventory.mjs";

const execFile = promisify(execFileCallback);
const errors = [];

const REMOVED_PATHS = [
  "docs/google_mcp_with_notebookllm_research (1).md",
  "workflows/skills/doc.md",
];

function error(message) {
  errors.push(message);
}

async function gitTrackedFiles(targetPath) {
  const { stdout } = await execFile("git", ["ls-files", "--", targetPath], {
    cwd: ROOT,
  });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function ensureRemovedPath(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (await pathExists(absolutePath)) {
    error(`${relativePath} should be removed from the repository tree.`);
  }
  const tracked = await gitTrackedFiles(relativePath);
  if (tracked.length > 0) {
    error(`${relativePath} should not remain tracked in git.`);
  }
}

async function main() {
  const trackedCoverage = await gitTrackedFiles("mcp/coverage");
  if (trackedCoverage.length > 0) {
    error("Generated coverage output under mcp/coverage must not remain tracked.");
  }
  if (await pathExists(path.join(ROOT, "mcp", "coverage"))) {
    error("mcp/coverage should not exist in the working tree.");
  }

  for (const relativePath of REMOVED_PATHS) {
    await ensureRemovedPath(relativePath);
  }

  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("cleanup invariants OK");
}

await main();
