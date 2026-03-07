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
const child = spawn(bash, [scriptPath, ...scriptArgs], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message || error);
  process.exit(1);
});
