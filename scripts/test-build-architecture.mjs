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
if (!prompt.includes('docs/foundation/PRODUCT.md') || !prompt.includes('docs/foundation/ARCHITECTURE.md') || !prompt.includes('docs/foundation/TECH.md') || !prompt.includes('docs/foundation/adr/README.md') || !prompt.includes('Load these exact skill IDs first')) {
  console.error('prompt missing required architecture instructions');
  process.exit(2);
}
const logPath = process.env.CBX_STUB_LOG;
if (logPath) {
  fs.appendFileSync(logPath, JSON.stringify({ name, args, cwd: process.cwd(), prompt }) + '\\n');
}
if (name === 'gemini' && process.env.CBX_STUB_GEMINI_FAIL === '1') {
  process.stderr.write("[MCP error] Error during discovery for MCP server 'PlaywrightMCP': fetch failed\\n");
  process.stderr.write("Permission 'cloudaicompanion.companions.generateChat' denied on resource '//cloudaicompanion.googleapis.com/projects/test/locations/global'.\\n");
  process.exit(1);
}
const foundationDir = path.join(process.cwd(), 'docs', 'foundation');
const fileMap = {
  product: path.join(foundationDir, 'PRODUCT.md'),
  architecture: path.join(foundationDir, 'ARCHITECTURE.md'),
  tech: path.join(foundationDir, 'TECH.md')
};
const richBlocks = {
  product: [
    '<!-- cbx:product:foundation:start version=1 profile=stub -->',
    '## Product Scope',
    'Stub product content grounded in repo evidence.',
    '<!-- cbx:product:foundation:end -->',
    ''
  ].join('\\n'),
  architecture: [
    '<!-- cbx:architecture:doc:start version=1 profile=stub -->',
    '## Architecture Type',
    '- Feature-first modular app with a modular monolith backend.',
    '',
    '## Folder Structure Guide',
    '- apps/ owns runnable surfaces.',
    '- packages/ owns shared code.',
    '<!-- cbx:architecture:doc:end -->',
    ''
  ].join('\\n'),
  tech: [
    '<!-- cbx:architecture:tech:start version=1 snapshot=stub -->',
    '## Stack Snapshot',
    '- Stub tech content.',
    '<!-- cbx:architecture:tech:end -->',
    ''
  ].join('\\n')
};
for (const [nameKey, block] of Object.entries(richBlocks)) {
  const filePath = fileMap[nameKey];
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  fs.writeFileSync(filePath, existing + '\\n' + block, 'utf8');
}
process.stdout.write(JSON.stringify({
  files_written: ['docs/foundation/PRODUCT.md', 'docs/foundation/ARCHITECTURE.md', 'docs/foundation/TECH.md', 'docs/foundation/adr/README.md', 'docs/foundation/adr/0000-template.md'],
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
      assert(
        Array.isArray(dryRunJson.managedTargets) &&
          dryRunJson.managedTargets.every((item) => item.includes("/docs/foundation/")),
        `${platform} dry-run should target docs/foundation`,
      );
    }

    const buildRun = runCli(
      ["build", "architecture", "--platform", "codex", "--json"],
      { cwd: workspace, env },
    );
    assert(buildRun.status === 0, `codex build failed: ${buildRun.stderr}`);
    const buildJson = parseJsonOutput(buildRun.stdout);
    assert(buildJson.result.filesWritten.includes("docs/foundation/PRODUCT.md"), "build result missing docs/foundation/PRODUCT.md");
    assert(buildJson.result.filesWritten.includes("docs/foundation/ARCHITECTURE.md"), "build result missing docs/foundation/ARCHITECTURE.md");
    assert(buildJson.result.filesWritten.includes("docs/foundation/TECH.md"), "build result missing docs/foundation/TECH.md");
    assert(
      existsSync(path.join(workspace, ".cbx", "architecture-build.json")),
      "architecture metadata missing",
    );
    const productDoc = readFileSync(path.join(workspace, "docs", "foundation", "PRODUCT.md"), "utf8");
    const architectureDoc = readFileSync(path.join(workspace, "docs", "foundation", "ARCHITECTURE.md"), "utf8");
    const techDoc = readFileSync(path.join(workspace, "docs", "foundation", "TECH.md"), "utf8");
    assert(productDoc.includes("cbx:product:foundation:start"), "product doc missing managed block");
    assert(architectureDoc.includes("cbx:architecture:doc:start"), "architecture doc missing managed block");
    assert(techDoc.includes("cbx:architecture:tech:start"), "tech doc missing architecture block");
    assert(
      (productDoc.match(/cbx:product:foundation:start/g) || []).length === 1,
      "product doc should contain one managed block after normalization",
    );
    assert(
      (architectureDoc.match(/cbx:architecture:doc:start/g) || []).length === 1,
      "architecture doc should contain one managed block after normalization",
    );
    assert(
      (techDoc.match(/cbx:architecture:tech:start/g) || []).length === 1,
      "tech doc should contain one managed block after normalization",
    );
    assert(
      architectureDoc.includes("## Architecture Type"),
      "architecture doc should include explicit architecture type guidance",
    );
    assert(
      architectureDoc.includes("## Folder Structure Guide"),
      "architecture doc should include folder structure guidance",
    );
    assert(
      existsSync(path.join(workspace, "docs", "foundation", "adr", "README.md")),
      "adr README missing",
    );
    assert(
      existsSync(path.join(workspace, "docs", "foundation", "adr", "0000-template.md")),
      "adr template missing",
    );

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

    const geminiFailRun = runCli(
      ["build", "architecture", "--platform", "gemini"],
      { cwd: workspace, env: { ...env, CBX_STUB_GEMINI_FAIL: "1" } },
    );
    assert(geminiFailRun.status !== 0, "gemini failure should be surfaced");
    assert(
      geminiFailRun.stderr.includes("Gemini CLI is failing while loading MCP servers"),
      "gemini failure missing MCP guidance",
    );
    assert(
      geminiFailRun.stderr.includes("cannot generate chat content"),
      "gemini failure missing auth guidance",
    );

    const logLines = readFileSync(logPath, "utf8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert(logLines.length >= 1, "stub execution log missing");
    assert(
      logLines[0].prompt.includes("docs/foundation/PRODUCT.md") &&
        logLines[0].prompt.includes("docs/foundation/ARCHITECTURE.md") &&
      logLines[0].prompt.includes("docs/foundation/TECH.md") &&
        logLines[0].prompt.includes("Inspect the repository first") &&
        logLines[0].prompt.includes("Inspection anchors:") &&
        logLines[0].prompt.includes("Every major claim should be grounded in repository evidence") &&
        logLines[0].prompt.includes("explicit architecture classification") &&
        logLines[0].prompt.includes("folder-structure guide") &&
        logLines[0].prompt.includes("Use exact required headings in docs/foundation/PRODUCT.md") &&
        logLines[0].prompt.includes("## Repository Structure Guide") &&
        logLines[0].prompt.includes("## Change Hotspots") &&
        logLines[0].prompt.includes("AI-authored"),
      "stub prompt missing scan-first foundation instructions",
    );

    console.log("Architecture build tests passed.");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(stubDir, { recursive: true, force: true });
  }
}

main();
