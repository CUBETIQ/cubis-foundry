#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const [, , scriptArg, ...scriptArgs] = process.argv;

if (!scriptArg) {
  console.error("Usage: node scripts/run-bash-script.mjs <script> [args...]");
  process.exit(1);
}

const rootDir = process.cwd();
const scriptPath = path.isAbsolute(scriptArg)
  ? scriptArg
  : path.resolve(rootDir, scriptArg);

const windowsBashCandidates = [
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe",
];

function resolveBash() {
  if (process.platform !== "win32") {
    return "bash";
  }

  for (const candidate of windowsBashCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return "bash";
}

const bash = resolveBash();
const stderrChunks = [];
const child = spawn(bash, [scriptPath, ...scriptArgs], {
  cwd: rootDir,
  stdio: ["ignore", "inherit", "pipe"],
  env: process.env,
});

child.stderr.on("data", (chunk) => {
  stderrChunks.push(chunk.toString());
  process.stderr.write(chunk);
});

function isWindowsBashAccessDenied(stderrText = "") {
  if (process.platform !== "win32") return false;
  const normalized = String(stderrText).toLowerCase();
  return (
    normalized.includes("couldn't create signal pipe") ||
    normalized.includes("access is denied") ||
    normalized.includes("e_accessdenied")
  );
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  const stderrText = stderrChunks.join("");
  if ((code ?? 1) !== 0 && isWindowsBashAccessDenied(stderrText)) {
    console.log(
      "[skip] Bash runtime is not permitted in this Windows environment; skipping bash-backed smoke script.",
    );
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  if (isWindowsBashAccessDenied(error?.message)) {
    console.log(
      "[skip] Bash runtime is not permitted in this Windows environment; skipping bash-backed smoke script.",
    );
    process.exit(0);
    return;
  }
  console.error(error.message || error);
  process.exit(1);
});
