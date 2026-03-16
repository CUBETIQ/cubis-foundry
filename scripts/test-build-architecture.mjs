#!/usr/bin/env node

import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const CLI = path.join(ROOT, "bin", "cubis.js");

function createWorkspace() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "cbx-arch-build-"));
  mkdirSync(path.join(dir, "src", "domain"), { recursive: true });
  mkdirSync(path.join(dir, "src", "data"), { recursive: true });
  mkdirSync(path.join(dir, "src", "presentation"), { recursive: true });
  mkdirSync(path.join(dir, "src", "components"), { recursive: true });
  writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: "arch-fixture",
        version: "1.0.0",
        scripts: {
          lint: "echo lint",
          typecheck: "echo typecheck",
          test: "echo test",
        },
        dependencies: {
          next: "15.0.0",
          react: "19.0.0",
          prisma: "6.0.0",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(dir, "README.md"),
    "# Fixture\n\nArchitecture fixture for build command coverage.\n",
  );
  writeFileSync(
    path.join(dir, "src", "domain", "order.ts"),
    "export const order = 'domain';\n",
  );
  writeFileSync(
    path.join(dir, "src", "data", "orderRepo.ts"),
    "export const orderRepo = 'data';\n",
  );
  writeFileSync(
    path.join(dir, "src", "presentation", "orderView.tsx"),
    "export const OrderView = () => null;\n",
  );
  writeFileSync(
    path.join(dir, "src", "components", "Button.tsx"),
    "export const Button = () => null;\n",
  );
  mkdirSync(path.join(dir, "docs", "specs", "checkout-flow"), {
    recursive: true,
  });
  writeFileSync(
    path.join(dir, "docs", "specs", "checkout-flow", "brief.md"),
    "# Checkout Flow\n",
  );
  return dir;
}

function createStubBins() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "cbx-arch-bins-"));
  const stub = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const help = {
  codex: 'codex exec [--skip-git-repo-check] <prompt>',
  claude: 'claude --print <prompt>',
  gemini: 'gemini --prompt <prompt>',
  copilot: 'copilot --prompt <prompt>'
};
if ((name === 'codex' && args[0] === 'exec' && args[1] === '--help') || (name !== 'codex' && args[0] === '--help')) {
  process.stdout.write(help[name] || '');
  process.exit(0);
}
const prompt = args[args.length - 1] || '';
if (!prompt.includes('ENGINEERING_RULES.md') || !prompt.includes('TECH.md') || !prompt.includes('Load these exact skill IDs first')) {
  console.error('prompt missing required architecture instructions');
  process.exit(2);
}
const logPath = process.env.CBX_STUB_LOG;
if (logPath) {
  fs.appendFileSync(logPath, JSON.stringify({ name, args, cwd: process.cwd(), prompt }) + '\\n');
}
process.stdout.write(JSON.stringify({
  files_written: ['ENGINEERING_RULES.md', 'TECH.md'],
  research_used: prompt.includes('external research evidence'),
  gaps: [],
  next_actions: []
}));
`;
  for (const name of ["codex", "claude", "gemini", "copilot"]) {
    const file = path.join(dir, name);
    writeFileSync(file, stub, "utf8");
    chmodSync(file, 0o755);
  }
  return dir;
}

function runCli(args, { cwd, env }) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    env,
    encoding: "utf8",
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJsonOutput(output) {
  return JSON.parse(String(output || "").trim());
}

function main() {
  const workspace = createWorkspace();
  const stubDir = createStubBins();
  const logPath = path.join(workspace, "stub-log.jsonl");
  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH || ""}`,
    CBX_STUB_LOG: logPath,
  };

  try {
    for (const platform of ["codex", "claude", "gemini", "copilot"]) {
      const dryRun = runCli(
        ["build", "architecture", "--platform", platform, "--dry-run", "--json"],
        { cwd: workspace, env },
      );
      assert(dryRun.status === 0, `${platform} dry-run failed: ${dryRun.stderr}`);
      const dryRunJson = parseJsonOutput(dryRun.stdout);
      assert(dryRunJson.platform === platform, `${platform} dry-run platform mismatch`);
      assert(
        Array.isArray(dryRunJson.skillBundle) &&
          dryRunJson.skillBundle.includes("architecture-doc") &&
          dryRunJson.skillBundle.includes("system-design") &&
          dryRunJson.skillBundle.includes("tech-doc") &&
          dryRunJson.skillBundle.includes("frontend-design"),
        `${platform} dry-run missing core skill bundle`,
      );
      assert(
        Array.isArray(dryRunJson.invocation) && dryRunJson.invocation.length >= 2,
        `${platform} dry-run missing invocation`,
      );
    }

    const buildRun = runCli(
      ["build", "architecture", "--platform", "codex", "--json"],
      { cwd: workspace, env },
    );
    assert(buildRun.status === 0, `codex build failed: ${buildRun.stderr}`);
    const buildJson = parseJsonOutput(buildRun.stdout);
    assert(buildJson.result.filesWritten.includes("ENGINEERING_RULES.md"), "build result missing ENGINEERING_RULES.md");
    assert(buildJson.result.filesWritten.includes("TECH.md"), "build result missing TECH.md");
    assert(
      existsSync(path.join(workspace, ".cbx", "architecture-build.json")),
      "architecture metadata missing",
    );
    const rulesDoc = readFileSync(path.join(workspace, "ENGINEERING_RULES.md"), "utf8");
    const techDoc = readFileSync(path.join(workspace, "TECH.md"), "utf8");
    assert(rulesDoc.includes("cbx:architecture:rules:start"), "rules doc missing architecture block");
    assert(techDoc.includes("cbx:architecture:tech:start"), "tech doc missing architecture block");

    const checkFresh = runCli(
      ["build", "architecture", "--platform", "codex", "--check", "--json"],
      { cwd: workspace, env },
    );
    assert(checkFresh.status === 0, `fresh architecture check failed: ${checkFresh.stderr}`);

    rmSync(path.join(workspace, ".cbx", "architecture-build.json"), { force: true });
    const checkStale = runCli(
      ["build", "architecture", "--platform", "codex", "--check"],
      { cwd: workspace, env },
    );
    assert(checkStale.status !== 0, "stale architecture check should fail");

    const missingEnv = {
      ...process.env,
      PATH: mkdtempSync(path.join(os.tmpdir(), "cbx-empty-path-")),
    };
    const missingRun = runCli(
      ["build", "architecture", "--platform", "copilot", "--dry-run"],
      { cwd: workspace, env: missingEnv },
    );
    assert(missingRun.status !== 0, "missing copilot runtime should fail");

    const logLines = readFileSync(logPath, "utf8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert(logLines.length >= 1, "stub execution log missing");
    assert(
      logLines[0].prompt.includes("Mermaid diagrams"),
      "stub prompt missing Mermaid instruction",
    );

    console.log("Architecture build tests passed.");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(stubDir, { recursive: true, force: true });
  }
}

main();
