#!/usr/bin/env node

import { confirm, input, select } from "@inquirer/prompts";
import { Command } from "commander";
import { existsSync } from "node:fs";
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { version: CLI_VERSION } = require("../package.json");

const MANAGED_BLOCK_START_RE = /<!--\s*cbx:workflows:auto:start[^>]*-->/g;
const MANAGED_BLOCK_END_RE = /<!--\s*cbx:workflows:auto:end\s*-->/g;
const TERMINAL_VERIFICATION_BLOCK_START_RE = /<!--\s*cbx:terminal:verification:start[^>]*-->/g;
const TERMINAL_VERIFICATION_BLOCK_END_RE = /<!--\s*cbx:terminal:verification:end\s*-->/g;
const ENGINEERING_RULES_BLOCK_START_RE = /<!--\s*cbx:engineering:auto:start[^>]*-->/g;
const ENGINEERING_RULES_BLOCK_END_RE = /<!--\s*cbx:engineering:auto:end\s*-->/g;
const AGENT_ASSETS_SUBDIR = "Ai Agent Workflow";
const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name"
]);
const COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "tools",
  "target",
  "infer",
  "mcp-servers",
  "metadata",
  "model",
  "handoffs",
  "argument-hint"
]);

const WORKFLOW_PROFILES = {
  antigravity: {
    id: "antigravity",
    label: "Antigravity",
    installsCustomAgents: true,
    project: {
      workflowDirs: [".agent/workflows"],
      agentDirs: [".agent/agents"],
      skillDirs: [".agent/skills"],
      ruleFilesByPriority: [".agent/rules/GEMINI.md"]
    },
    global: {
      workflowDirs: ["~/.gemini/antigravity/workflows"],
      agentDirs: ["~/.gemini/antigravity/agents"],
      skillDirs: ["~/.gemini/antigravity/skills"],
      ruleFilesByPriority: ["~/.gemini/GEMINI.md"]
    },
    detectorPaths: [".agent", ".agent/workflows", ".agent/rules/GEMINI.md"],
    legacyDetectorPaths: [],
    ruleHintName: "GEMINI.md"
  },
  codex: {
    id: "codex",
    label: "Codex",
    installsCustomAgents: false,
    project: {
      workflowDirs: [".agents/workflows"],
      agentDirs: [".agents/agents"],
      skillDirs: [".agents/skills"],
      ruleFilesByPriority: ["AGENTS.md"]
    },
    global: {
      workflowDirs: ["~/.agents/workflows"],
      agentDirs: ["~/.agents/agents"],
      skillDirs: ["~/.agents/skills"],
      ruleFilesByPriority: ["~/.codex/AGENTS.md"]
    },
    detectorPaths: [".agents", ".agents/workflows", ".agents/skills", "AGENTS.md"],
    legacyDetectorPaths: [".codex/skills"],
    ruleHintName: "AGENTS.md"
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    installsCustomAgents: true,
    project: {
      workflowDirs: [".github/copilot/workflows"],
      agentDirs: [".github/agents"],
      skillDirs: [".github/skills"],
      ruleFilesByPriority: ["AGENTS.md", ".github/copilot-instructions.md"]
    },
    global: {
      workflowDirs: ["~/.copilot/workflows"],
      agentDirs: ["~/.copilot/agents"],
      skillDirs: ["~/.copilot/skills"],
      ruleFilesByPriority: ["~/.copilot/copilot-instructions.md"]
    },
    detectorPaths: [
      ".github/agents",
      ".github/skills",
      ".github/copilot-instructions.md",
      ".github/instructions",
      "AGENTS.md"
    ],
    legacyDetectorPaths: [],
    ruleHintName: "AGENTS.md or .github/copilot-instructions.md"
  }
};

const PLATFORM_IDS = Object.keys(WORKFLOW_PROFILES);
const CODEX_WORKFLOW_SKILL_PREFIX = "workflow-";
const CODEX_AGENT_SKILL_PREFIX = "agent-";
const TERMINAL_VERIFIER_PROVIDERS = ["codex", "gemini"];
const DEFAULT_TERMINAL_VERIFIER = "codex";
const POSTMAN_API_KEY_ENV_VAR = "POSTMAN_API_KEY";
const POSTMAN_MCP_URL = "https://mcp.postman.com/minimal";
const POSTMAN_SKILL_ID = "postman";
const POSTMAN_SETTINGS_FILENAME = "postman_setting.json";
const POSTMAN_API_KEY_MISSING_WARNING =
  `Postman API key is not configured. Set ${POSTMAN_API_KEY_ENV_VAR} or update ${POSTMAN_SETTINGS_FILENAME}.`;
const TECH_SCAN_MAX_FILES = 5000;
const TECH_SCAN_IGNORED_DIRS = new Set([
  ".git",
  ".idea",
  ".vscode",
  ".agent",
  ".agents",
  ".github",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".dart_tool",
  ".turbo",
  "target",
  "out",
  ".cache",
  ".cbx"
]);
const TECH_LANGUAGE_BY_EXTENSION = new Map([
  [".ts", "TypeScript"],
  [".tsx", "TypeScript"],
  [".js", "JavaScript"],
  [".jsx", "JavaScript"],
  [".mjs", "JavaScript"],
  [".cjs", "JavaScript"],
  [".dart", "Dart"],
  [".py", "Python"],
  [".go", "Go"],
  [".rs", "Rust"],
  [".java", "Java"],
  [".kt", "Kotlin"],
  [".swift", "Swift"],
  [".cs", "C#"],
  [".cpp", "C++"],
  [".cc", "C++"],
  [".c", "C"],
  [".php", "PHP"],
  [".rb", "Ruby"],
  [".sh", "Shell"],
  [".ps1", "PowerShell"]
]);

function platformInstallsCustomAgents(platformId) {
  const profile = WORKFLOW_PROFILES[platformId];
  return Boolean(profile && profile.installsCustomAgents !== false);
}

const PLATFORM_ALIASES = {
  antigravity: "antigravity",
  "google-antigravity": "antigravity",
  "google-antigravity-cli": "antigravity",
  "google-antigravity-ide": "antigravity",
  codex: "codex",
  openai: "codex",
  copilot: "copilot",
  "github-copilot": "copilot",
  "copilot-chat": "copilot",
  "copilot-cli": "copilot",
  github: "copilot"
};

const TERMINAL_VERIFIER_ALIASES = {
  codex: "codex",
  openai: "codex",
  "openai-codex": "codex",
  gemini: "gemini",
  "gemini-cli": "gemini"
};

function packageRoot() {
  const filename = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(filename), "..");
}

function agentAssetsRoot() {
  const preferred = path.join(packageRoot(), AGENT_ASSETS_SUBDIR);
  return existsSync(preferred) ? preferred : packageRoot();
}

function expandPath(inputPath, cwd = process.cwd()) {
  if (!inputPath) return cwd;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/")) return path.join(os.homedir(), inputPath.slice(2));
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(cwd, inputPath);
}

function normalizePlatform(value) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return PLATFORM_ALIASES[normalized] || normalized;
}

function normalizeScope(value) {
  if (!value) return "project";
  const normalized = value.trim().toLowerCase();
  if (normalized === "project" || normalized === "global") return normalized;
  throw new Error(`Unknown scope '${value}'. Use --scope project or --scope global.`);
}

function normalizeTerminalVerifier(value) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return TERMINAL_VERIFIER_ALIASES[normalized] || null;
}

function normalizePostmanWorkspaceId(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === "null") return null;
  return normalized;
}

function defaultState() {
  return {
    schemaVersion: 1,
    lastSelected: {
      platform: null,
      scope: "project"
    },
    targets: {}
  };
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function getAntigravityTerminalIntegrationDir(profilePaths) {
  return path.join(path.dirname(profilePaths.workflowsDir), "terminal-integration");
}

function buildTerminalVerifierDefaultPrompt() {
  return "Review the latest completed Antigravity task. Focus on bugs, regressions, security risks, and missing tests.";
}

function buildAntigravityTerminalIntegrationConfig({ provider }) {
  return {
    schemaVersion: 1,
    enabled: true,
    provider,
    defaultPrompt: buildTerminalVerifierDefaultPrompt(),
    providers: {
      codex: {
        command: "codex exec --skip-git-repo-check \"{prompt}\""
      },
      gemini: {
        primaryCommand: "gemini -p \"{prompt}\"",
        fallbackCommand: "gemini --prompt \"{prompt}\""
      }
    }
  };
}

function buildAntigravityTerminalIntegrationReadme({ provider, configPath, scriptPsPath, scriptShPath }) {
  return [
    "# Antigravity Terminal Verification",
    "",
    "This directory is managed by cbx.",
    "",
    `- Provider: ${provider}`,
    `- Config: ${toPosixPath(configPath)}`,
    `- PowerShell runner: ${toPosixPath(scriptPsPath)}`,
    `- Bash runner: ${toPosixPath(scriptShPath)}`,
    "",
    "Usage:",
    `- Windows: \`pwsh -NoLogo -NoProfile -File \"${toPosixPath(scriptPsPath)}\" -Prompt \"<summary>\"\``,
    `- macOS/Linux: \`bash \"${toPosixPath(scriptShPath)}\" \"<summary>\"\``,
    "",
    "If your selected CLI is missing, install it and rerun the command."
  ].join("\n");
}

function buildAntigravityTerminalIntegrationPowerShellScript() {
  return [
    "param(",
    "  [string]$Prompt = \"Review the latest completed Antigravity task. Focus on bugs, regressions, security risks, and missing tests.\"",
    ")",
    "",
    "Set-StrictMode -Version Latest",
    "$ErrorActionPreference = \"Stop\"",
    "",
    "$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path",
    "$configPath = Join-Path $scriptDir \"config.json\"",
    "",
    "if (-not (Test-Path $configPath)) {",
    "  Write-Error \"Missing terminal integration config: $configPath\"",
    "  exit 1",
    "}",
    "",
    "$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json",
    "$provider = \"$($config.provider)\".ToLowerInvariant()",
    "",
    "if ($provider -eq \"codex\") {",
    "  & codex exec --skip-git-repo-check \"$Prompt\"",
    "  exit $LASTEXITCODE",
    "}",
    "",
    "if ($provider -eq \"gemini\") {",
    "  & gemini -p \"$Prompt\"",
    "  if ($LASTEXITCODE -eq 0) {",
    "    exit 0",
    "  }",
    "  & gemini --prompt \"$Prompt\"",
    "  exit $LASTEXITCODE",
    "}",
    "",
    "Write-Error \"Unsupported provider in config: $provider\"",
    "exit 1",
    ""
  ].join("\n");
}

function buildAntigravityTerminalIntegrationBashScript() {
  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    "PROMPT=\"${1:-Review the latest completed Antigravity task. Focus on bugs, regressions, security risks, and missing tests.}\"",
    "SCRIPT_DIR=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"",
    "CONFIG_FILE=\"$SCRIPT_DIR/config.json\"",
    "",
    "if [[ ! -f \"$CONFIG_FILE\" ]]; then",
    "  echo \"Missing terminal integration config: $CONFIG_FILE\" >&2",
    "  exit 1",
    "fi",
    "",
    "PROVIDER=\"$(node -e \"const fs=require('fs');const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(String(c.provider||'').toLowerCase());\" \"$CONFIG_FILE\")\"",
    "",
    "if [[ \"$PROVIDER\" == \"codex\" ]]; then",
    "  codex exec --skip-git-repo-check \"$PROMPT\"",
    "  exit $?",
    "fi",
    "",
    "if [[ \"$PROVIDER\" == \"gemini\" ]]; then",
    "  if gemini -p \"$PROMPT\"; then",
    "    exit 0",
    "  fi",
    "  gemini --prompt \"$PROMPT\"",
    "  exit $?",
    "fi",
    "",
    "echo \"Unsupported provider in config: $PROVIDER\" >&2",
    "exit 1",
    ""
  ].join("\n");
}

function buildAntigravityTerminalVerificationBlock({
  provider,
  powerShellScriptPath,
  bashScriptPath
}) {
  return [
    `<!-- cbx:terminal:verification:start provider=${provider} version=1 -->`,
    "## Terminal Verification Integration",
    "",
    "Terminal verification is enabled for this Antigravity installation.",
    `- Provider: \`${provider}\``,
    "",
    "After completing implementation and local checks, run one verifier command:",
    `- Windows: \`pwsh -NoLogo -NoProfile -File \"${toPosixPath(powerShellScriptPath)}\" -Prompt \"<summary>\"\``,
    `- macOS/Linux: \`bash \"${toPosixPath(bashScriptPath)}\" \"<summary>\"\``,
    "",
    "If verifier CLI is unavailable, report it and continue with local verification evidence.",
    "<!-- cbx:terminal:verification:end -->"
  ].join("\n");
}

function findWorkspaceRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    if (existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startDir);
    current = parent;
  }
}

function toRelativeRuleRef(fromRuleFilePath, targetPath) {
  const rel = toPosixPath(path.relative(path.dirname(fromRuleFilePath), targetPath));
  if (!rel || rel === ".") return path.basename(targetPath);
  if (rel.startsWith(".")) return rel;
  return `./${rel}`;
}

function buildEngineeringRulesTemplate() {
  return [
    "# Engineering Rules",
    "",
    "These rules are the default for this project.",
    "",
    "## 1) Build Only What Is Needed (YAGNI)",
    "",
    "- Implement only what current requirements need.",
    '- Do not add speculative abstractions, extension points, or feature flags "for future use."',
    "- If a helper/class is used only once and does not improve clarity, keep it inline.",
    "",
    "## 2) Readability First",
    "",
    "- Code should be understandable in one pass.",
    "- Prefer straightforward flow over clever tricks.",
    "- Reduce nesting and branching where possible.",
    "- Remove dead code and commented-out blocks.",
    "",
    "## 3) Precise Naming (One Look = Clear Intent)",
    "",
    "- Class names must say exactly what they represent.",
    "  - Good: `AttendanceStatisticScreen`",
    "  - Bad: `DataScreen`, `CommonManager`",
    "- Method names must say exactly what they do.",
    "  - Good: `loadCurrentUserSessions`",
    "  - Bad: `handleData`, `processThing`",
    "- Boolean names must read as true/false facts: `isActive`, `hasError`, `canSubmit`.",
    "- Avoid vague suffixes like `Helper`, `Util`, `Manager` unless the type has a narrow, clear responsibility.",
    "",
    "## 4) Keep Functions and Classes Focused",
    "",
    "- One function should do one clear job.",
    "- One class should own one clear responsibility.",
    "- Split when a file mixes unrelated concerns (UI + networking + mapping in one place).",
    "- Prefer small composable units over inheritance-heavy designs.",
    "",
    "## 5) Platform Implementation Rules",
    "",
    "- Keep providers/services focused; do not let one unit fetch unrelated feature data.",
    "- Prevent duplicate network calls (cache or in-flight dedupe) when multiple views depend on the same data.",
    "- Route/build functions must not return placeholder content in production flows.",
    "",
    "## 6) UI Migration Rule (Required for This Project)",
    "",
    "For each migrated screen:",
    "",
    "1. Copy legacy layout/behavior/state flow first (behavior parity).",
    "2. Replace legacy widgets/components with your project design system while preserving behavior.",
    "3. Replace ad-hoc sizing with design tokens (spacing, radius, typography).",
    "4. Verify on both small and large devices.",
    "",
    "## 7) PR / Review Checklist",
    "",
    "Before merge, confirm:",
    "",
    "- Naming is precise and intention-revealing.",
    "- No speculative abstraction was added.",
    "- Logic is simple enough for fast onboarding.",
    "- UI uses design system tokens/components, not ad-hoc sizing.",
    "- Lint/analyze/tests pass.",
    "",
    "## 8) Keep TECH.md Fresh",
    "",
    "- `TECH.md` is generated from current codebase reality.",
    "- Re-run `cbx rules tech-md --overwrite` after major stack or architecture changes.",
    ""
  ].join("\n");
}

function buildEngineeringRulesManagedBlock({
  platform,
  engineeringRulesFilePath,
  techMdFilePath,
  ruleFilePath
}) {
  const engineeringRef = toRelativeRuleRef(ruleFilePath, engineeringRulesFilePath);
  const techRef = toRelativeRuleRef(ruleFilePath, techMdFilePath);

  return [
    `<!-- cbx:engineering:auto:start platform=${platform} version=1 -->`,
    "## Engineering Guardrails (auto-managed)",
    "Apply these before planning, coding, review, and release:",
    "",
    `- Required baseline: \`${engineeringRef}\``,
    `- Project tech map: \`${techRef}\``,
    "",
    "Hard policy:",
    "1. Build only what is needed (YAGNI).",
    "2. Keep logic simple and readable.",
    "3. Use precise, intention-revealing names.",
    "4. Keep classes/functions focused on one responsibility.",
    "",
    "<!-- cbx:engineering:auto:end -->"
  ].join("\n");
}

async function writeTextFile({
  targetPath,
  content,
  overwrite = false,
  dryRun = false
}) {
  const exists = await pathExists(targetPath);
  if (exists && !overwrite) {
    return { action: dryRun ? "would-skip" : "skipped", filePath: targetPath };
  }

  if (!dryRun) {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content, "utf8");
  }

  return {
    action: exists ? (dryRun ? "would-replace" : "replaced") : dryRun ? "would-create" : "created",
    filePath: targetPath
  };
}

async function upsertEngineeringRulesBlock({
  ruleFilePath,
  platform,
  engineeringRulesFilePath,
  techMdFilePath,
  dryRun = false
}) {
  const block = buildEngineeringRulesManagedBlock({
    platform,
    engineeringRulesFilePath,
    techMdFilePath,
    ruleFilePath
  });
  const exists = await pathExists(ruleFilePath);
  const warnings = [];
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeTaggedBlock(original, ENGINEERING_RULES_BLOCK_START_RE, ENGINEERING_RULES_BLOCK_END_RE);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    if (analysis.status === "multiple") {
      warnings.push("Multiple engineering rule blocks found; patched the first valid block.");
    }
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    warnings.push("Malformed engineering rule block; appended a new canonical block.");
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return { action: "unchanged", filePath: ruleFilePath, warnings };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return {
    action: exists ? (dryRun ? "would-patch" : "patched") : dryRun ? "would-create" : "created",
    filePath: ruleFilePath,
    warnings
  };
}

async function collectTechSnapshot(rootDir) {
  const discoveredFiles = [];
  const queue = [rootDir];

  while (queue.length > 0 && discoveredFiles.length < TECH_SCAN_MAX_FILES) {
    const dir = queue.shift();
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".DS_Store")) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (TECH_SCAN_IGNORED_DIRS.has(entry.name)) continue;
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      discoveredFiles.push(fullPath);
      if (discoveredFiles.length >= TECH_SCAN_MAX_FILES) break;
    }
  }

  const languageCounts = new Map();
  const topDirs = new Set();

  for (const fullPath of discoveredFiles) {
    const rel = toPosixPath(path.relative(rootDir, fullPath));
    const firstDir = rel.split("/")[0];
    if (firstDir && firstDir !== rel) topDirs.add(firstDir);

    const extension = path.extname(fullPath).toLowerCase();
    const language = TECH_LANGUAGE_BY_EXTENSION.get(extension);
    if (!language) continue;
    languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
  }

  const fileExists = (name) => existsSync(path.join(rootDir, name));
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageScripts = new Map();
  const frameworks = new Set();
  const lockfiles = [];

  if (fileExists("bun.lock") || fileExists("bun.lockb")) lockfiles.push("bun");
  if (fileExists("pnpm-lock.yaml")) lockfiles.push("pnpm");
  if (fileExists("yarn.lock")) lockfiles.push("yarn");
  if (fileExists("package-lock.json")) lockfiles.push("npm");
  if (fileExists("poetry.lock")) lockfiles.push("poetry");
  if (fileExists("Cargo.lock")) lockfiles.push("cargo");
  if (fileExists("go.sum")) lockfiles.push("go");
  if (fileExists("pubspec.lock")) lockfiles.push("pub");

  if (fileExists("pubspec.yaml")) frameworks.add("Flutter");
  if (fileExists("go.mod")) frameworks.add("Go Modules");
  if (fileExists("Cargo.toml")) frameworks.add("Rust Cargo");
  if (fileExists("requirements.txt") || fileExists("pyproject.toml")) frameworks.add("Python");

  if (existsSync(packageJsonPath)) {
    try {
      const parsed = JSON.parse(await readFile(packageJsonPath, "utf8"));
      const scripts = parsed.scripts && typeof parsed.scripts === "object" ? parsed.scripts : {};
      for (const [name, command] of Object.entries(scripts)) {
        if (typeof command !== "string") continue;
        packageScripts.set(name, command);
      }

      const deps = {
        ...(parsed.dependencies || {}),
        ...(parsed.devDependencies || {}),
        ...(parsed.peerDependencies || {})
      };
      const depNames = new Set(Object.keys(deps));
      const frameworkSignals = [
        ["next", "Next.js"],
        ["react", "React"],
        ["vue", "Vue"],
        ["nuxt", "Nuxt"],
        ["svelte", "Svelte"],
        ["@nestjs/core", "NestJS"],
        ["express", "Express"],
        ["fastify", "Fastify"],
        ["hono", "Hono"],
        ["tailwindcss", "Tailwind CSS"],
        ["prisma", "Prisma"],
        ["drizzle-orm", "Drizzle ORM"],
        ["mongoose", "Mongoose"],
        ["typeorm", "TypeORM"],
        ["@playwright/test", "Playwright"],
        ["vitest", "Vitest"],
        ["jest", "Jest"],
        ["cypress", "Cypress"]
      ];
      for (const [signal, label] of frameworkSignals) {
        if (depNames.has(signal)) frameworks.add(label);
      }
    } catch {
      // ignore malformed package.json
    }
  }

  const sortedLanguages = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]);
  const sortedFrameworks = [...frameworks].sort((a, b) => a.localeCompare(b));
  const sortedTopDirs = [...topDirs].sort((a, b) => a.localeCompare(b)).slice(0, 12);
  const sortedLockfiles = [...new Set(lockfiles)];

  const preferredScriptNames = [
    "lint",
    "analyze",
    "typecheck",
    "test",
    "test:unit",
    "test:e2e",
    "build",
    "dev"
  ];
  const keyScripts = [];
  for (const name of preferredScriptNames) {
    if (!packageScripts.has(name)) continue;
    keyScripts.push({ name, command: packageScripts.get(name) });
  }

  return {
    rootDir,
    scannedFiles: discoveredFiles.length,
    languages: sortedLanguages,
    frameworks: sortedFrameworks,
    lockfiles: sortedLockfiles,
    topDirs: sortedTopDirs,
    keyScripts
  };
}

function buildTechMd(snapshot) {
  const lines = [];
  lines.push("# TECH.md");
  lines.push("");
  lines.push(`Generated by cbx on ${new Date().toISOString()}.`);
  lines.push(`Root: \`${toPosixPath(snapshot.rootDir)}\``);
  lines.push(`Files scanned: ${snapshot.scannedFiles} (max ${TECH_SCAN_MAX_FILES}).`);
  lines.push("");

  lines.push("## Stack Snapshot");
  if (snapshot.frameworks.length === 0) {
    lines.push("- No major framework signal detected.");
  } else {
    for (const framework of snapshot.frameworks) {
      lines.push(`- ${framework}`);
    }
  }
  lines.push("");

  lines.push("## Languages (by file count)");
  if (snapshot.languages.length === 0) {
    lines.push("- No language signals detected.");
  } else {
    for (const [language, count] of snapshot.languages.slice(0, 10)) {
      lines.push(`- ${language}: ${count}`);
    }
  }
  lines.push("");

  lines.push("## Tooling and Lockfiles");
  if (snapshot.lockfiles.length === 0) {
    lines.push("- No lockfiles detected.");
  } else {
    lines.push(`- ${snapshot.lockfiles.join(", ")}`);
  }
  lines.push("");

  lines.push("## Key Scripts");
  if (snapshot.keyScripts.length === 0) {
    lines.push("- No common scripts detected.");
  } else {
    for (const script of snapshot.keyScripts) {
      lines.push(`- \`${script.name}\`: \`${script.command}\``);
    }
  }
  lines.push("");

  lines.push("## Important Top-Level Paths");
  if (snapshot.topDirs.length === 0) {
    lines.push("- No significant top-level directories detected.");
  } else {
    for (const dir of snapshot.topDirs) {
      lines.push(`- \`${dir}/\``);
    }
  }
  lines.push("");

  lines.push("## Maintenance");
  lines.push("- Re-run `cbx rules tech-md --overwrite` after major stack or architecture changes.");
  lines.push("");

  return lines.join("\n");
}

function targetStateKey(platform, scope) {
  return `${platform}:${scope}`;
}

function getStateFilePath(scope, cwd = process.cwd()) {
  if (scope === "global") return path.join(os.homedir(), ".cbx", "state.json");
  return path.join(cwd, ".cbx", "workflows-state.json");
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findNearestUpwardFile(startDir, relativeFilePath) {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, relativeFilePath);
    if (await pathExists(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function resolveWorkspaceRuleFileForGlobalScope(platform, cwd = process.cwd()) {
  if (platform === "codex") {
    return findNearestUpwardFile(cwd, "AGENTS.md");
  }

  const profilePaths = await resolveProfilePaths(platform, "project", cwd);
  for (const candidate of profilePaths.ruleFilesByPriority) {
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

async function syncWorkspaceRuleForGlobalScope({
  platform,
  scope,
  cwd = process.cwd(),
  workflows = [],
  dryRun = false
}) {
  if (scope !== "global") return null;

  const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(platform, cwd);
  if (!workspaceRuleFile) return null;

  const profile = WORKFLOW_PROFILES[platform];
  if (!profile) return null;
  const globalRuleFile = expandPath(profile.global.ruleFilesByPriority[0], cwd);
  if (path.resolve(workspaceRuleFile) === path.resolve(globalRuleFile)) return null;

  const patchResult = await upsertManagedRuleBlock(workspaceRuleFile, platform, workflows, dryRun);
  return {
    workspaceRuleFile,
    globalRuleFile,
    patchResult
  };
}

async function readState(scope, cwd = process.cwd()) {
  const statePath = getStateFilePath(scope, cwd);
  if (!(await pathExists(statePath))) return defaultState();

  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();

    return {
      schemaVersion: 1,
      lastSelected: {
        platform:
          parsed.lastSelected && typeof parsed.lastSelected.platform === "string"
            ? parsed.lastSelected.platform
            : null,
        scope:
          parsed.lastSelected && parsed.lastSelected.scope === "global" ? "global" : "project"
      },
      targets: parsed.targets && typeof parsed.targets === "object" ? parsed.targets : {}
    };
  } catch {
    return defaultState();
  }
}

async function writeState(scope, state, cwd = process.cwd()) {
  const statePath = getStateFilePath(scope, cwd);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function setLastSelectedState(scope, platform, cwd = process.cwd()) {
  const state = await readState(scope, cwd);
  state.lastSelected = { platform, scope };
  await writeState(scope, state, cwd);
}

async function recordBundleInstallState({ scope, platform, bundleId, artifacts, ruleFilePath, cwd }) {
  const state = await readState(scope, cwd);
  const key = targetStateKey(platform, scope);
  if (!state.targets[key]) {
    state.targets[key] = {
      updatedAt: null,
      ruleFile: null,
      bundles: {}
    };
  }

  state.lastSelected = { platform, scope };
  state.targets[key].updatedAt = new Date().toISOString();
  state.targets[key].ruleFile = ruleFilePath ? toPosixPath(ruleFilePath) : null;
  state.targets[key].bundles[bundleId] = {
    installedAt: new Date().toISOString(),
    workflows: artifacts.workflows.map(toPosixPath),
    agents: artifacts.agents.map(toPosixPath),
    skills: artifacts.skills.map(toPosixPath)
  };

  await writeState(scope, state, cwd);
}

async function recordBundleRemovalState({ scope, platform, bundleId, ruleFilePath, cwd }) {
  const state = await readState(scope, cwd);
  const key = targetStateKey(platform, scope);
  if (state.targets[key] && state.targets[key].bundles[bundleId]) {
    delete state.targets[key].bundles[bundleId];
    state.targets[key].updatedAt = new Date().toISOString();
    if (ruleFilePath) state.targets[key].ruleFile = toPosixPath(ruleFilePath);
  }
  state.lastSelected = { platform, scope };
  await writeState(scope, state, cwd);
}

async function resolveProfilePaths(profileId, scope, cwd = process.cwd()) {
  const profile = WORKFLOW_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown platform '${profileId}'.`);
  const cfg = profile[scope];

  return {
    workflowsDir: expandPath(cfg.workflowDirs[0], cwd),
    agentsDir: expandPath(cfg.agentDirs[0], cwd),
    skillsDir: expandPath(cfg.skillDirs[0], cwd),
    ruleFilesByPriority: cfg.ruleFilesByPriority.map((filePath) => expandPath(filePath, cwd))
  };
}

async function listBundleIds() {
  const root = path.join(agentAssetsRoot(), "workflows");
  if (!(await pathExists(root))) return [];

  const entries = await readdir(root, { withFileTypes: true });
  const bundleIds = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const manifestPath = path.join(root, entry.name, "manifest.json");
    if (await pathExists(manifestPath)) {
      bundleIds.push(entry.name);
    }
  }

  return bundleIds.sort((a, b) => a.localeCompare(b));
}

async function readBundleManifest(bundleId) {
  const manifestPath = path.join(agentAssetsRoot(), "workflows", bundleId, "manifest.json");
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Bundle '${bundleId}' not found at ${manifestPath}`);
  }

  const raw = await readFile(manifestPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid manifest JSON for '${bundleId}': ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid manifest for '${bundleId}': expected object.`);
  }

  return parsed;
}

async function chooseBundle(bundleOption) {
  const bundleIds = await listBundleIds();
  if (bundleIds.length === 0) {
    throw new Error("No workflow bundles found in local catalog.");
  }

  if (bundleOption) {
    if (!bundleIds.includes(bundleOption)) {
      throw new Error(`Unknown bundle '${bundleOption}'. Run 'cbx workflows platforms' and docs for options.`);
    }
    return bundleOption;
  }

  if (!process.stdin.isTTY) {
    if (bundleIds.includes("agent-environment-setup")) {
      return "agent-environment-setup";
    }
    return bundleIds[0];
  }

  return select({
    message: "Select workflow bundle:",
    choices: bundleIds.map((id) => ({ name: id, value: id }))
  });
}

async function detectPlatformCandidates(cwd = process.cwd()) {
  const scores = new Map(PLATFORM_IDS.map((id) => [id, 0]));

  for (const platformId of PLATFORM_IDS) {
    const profile = WORKFLOW_PROFILES[platformId];

    for (const marker of profile.detectorPaths) {
      if (await pathExists(expandPath(marker, cwd))) {
        scores.set(platformId, (scores.get(platformId) || 0) + 3);
      }
    }

    for (const legacyMarker of profile.legacyDetectorPaths || []) {
      if (await pathExists(expandPath(legacyMarker, cwd))) {
        scores.set(platformId, (scores.get(platformId) || 0) + 1);
      }
    }
  }

  const maxScore = Math.max(...scores.values());
  if (!Number.isFinite(maxScore) || maxScore <= 0) return [];

  return [...scores.entries()]
    .filter(([, score]) => score === maxScore)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));
}

async function resolvePlatform(optionValue, scope, cwd = process.cwd()) {
  const normalized = normalizePlatform(optionValue);
  if (normalized) {
    if (!WORKFLOW_PROFILES[normalized]) {
      throw new Error(`Unknown platform '${optionValue}'. Use 'cbx workflows platforms'.`);
    }
    return normalized;
  }

  const candidates = await detectPlatformCandidates(cwd);
  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    const state = await readState(scope, cwd);
    if (state.lastSelected.platform && candidates.includes(state.lastSelected.platform)) {
      return state.lastSelected.platform;
    }

    if (!process.stdin.isTTY) {
      throw new Error(`Multiple platforms detected (${candidates.join(", ")}). Use --platform.`);
    }

    return select({
      message: "Multiple platforms detected. Select active platform:",
      choices: candidates.map((id) => ({
        name: `${WORKFLOW_PROFILES[id].label} (${id})`,
        value: id
      }))
    });
  }

  const state = await readState(scope, cwd);
  if (state.lastSelected.platform && WORKFLOW_PROFILES[state.lastSelected.platform]) {
    return state.lastSelected.platform;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Missing --platform in non-interactive mode.");
  }

  return select({
    message: "Select platform:",
    choices: PLATFORM_IDS.map((id) => ({
      name: `${WORKFLOW_PROFILES[id].label} (${id})`,
      value: id
    }))
  });
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseInlineArray(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((item) => stripQuotes(item.replace(/\[|\]/g, "").trim()))
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: "", body: markdown };
  }
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length)
  };
}

function hasFrontmatter(markdown) {
  return /^---\n[\s\S]*?\n---\n?/.test(markdown);
}

function collectTopLevelFrontmatterKeys(frontmatter) {
  const keys = [];
  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!match) continue;
    keys.push(match[1]);
  }
  return unique(keys);
}

function unsupportedCopilotSkillFrontmatterKeys(frontmatter) {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key));
}

function unsupportedCopilotAgentFrontmatterKeys(frontmatter) {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS.has(key));
}

function sanitizeSkillMarkdownForCopilot(markdown) {
  if (!hasFrontmatter(markdown)) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  const { frontmatter, body } = extractFrontmatter(markdown);
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  const removedKeys = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey = /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) {
        continue;
      }
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key)) {
      kept.push(line);
      continue;
    }

    removedKeys.push(key);
    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  const cleanedFrontmatter = kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys
  };
}

function sanitizeAgentMarkdownForCopilot(markdown) {
  if (!hasFrontmatter(markdown)) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  const { frontmatter, body } = extractFrontmatter(markdown);
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  const removedKeys = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey = /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) {
        continue;
      }
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS.has(key)) {
      kept.push(line);
      continue;
    }

    removedKeys.push(key);
    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  const cleanedFrontmatter = kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys
  };
}

function extractFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return stripQuotes(match[1]);
}

function extractFrontmatterArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (bracketMatch) {
    return unique(parseInlineArray(bracketMatch[1]));
  }

  const singleLine = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!singleLine) return [];
  return unique(parseInlineArray(singleLine[1]));
}

function extractHeading(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractFallbackDescription(body) {
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("---")) continue;
    if (line.startsWith("```")) continue;
    return line;
  }
  return "No description available.";
}

function normalizeMarkdownId(fileName) {
  return fileName
    .replace(/\.agent\.md$/i, "")
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function yamlSingleQuoted(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteCodexWorkflowAgentReferences(sourceBody, agentIds) {
  if (!sourceBody || !Array.isArray(agentIds) || agentIds.length === 0) return sourceBody;

  let rewritten = sourceBody;
  const sortedAgentIds = unique(agentIds.filter(Boolean)).sort((a, b) => b.length - a.length);

  for (const agentId of sortedAgentIds) {
    const agentPattern = new RegExp(
      `(^|[^A-Za-z0-9_-])@${escapeRegExp(agentId)}(?=$|[^A-Za-z0-9_-])`,
      "g"
    );
    rewritten = rewritten.replace(
      agentPattern,
      (_match, prefix) => `${prefix}$${CODEX_AGENT_SKILL_PREFIX}${agentId}`
    );
  }

  return rewritten;
}

async function parseWorkflowMetadata(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(raw);
  const id = path.basename(filePath, path.extname(filePath));
  const command = extractFrontmatterValue(frontmatter, "command") || `/${id}`;
  const description =
    extractFrontmatterValue(frontmatter, "description") || extractFallbackDescription(body);
  const heading = extractHeading(body) || id;
  const triggers = unique([
    ...extractFrontmatterArray(frontmatter, "triggers"),
    ...extractFrontmatterArray(frontmatter, "keywords")
  ]).slice(0, 8);

  return {
    id,
    command,
    name: heading,
    description,
    triggers,
    path: filePath
  };
}

async function parseAgentMetadata(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(raw);
  const id = normalizeMarkdownId(path.basename(filePath));
  const name = extractFrontmatterValue(frontmatter, "name") || id;
  const description =
    extractFrontmatterValue(frontmatter, "description") || extractFallbackDescription(body);
  const skills = extractFrontmatterArray(frontmatter, "skills").slice(0, 12);

  return {
    id,
    name,
    description,
    skills,
    path: filePath,
    body: body.trim()
  };
}

function buildCodexWorkflowWrapperSkillMarkdown(wrapperSkillId, workflow) {
  const description = `Callable Codex wrapper for ${workflow.command}: ${workflow.description}`;
  const sourceBody = workflow.body?.trim() || "No source workflow content found.";

  return [
    "---",
    `name: ${wrapperSkillId}`,
    `description: ${yamlSingleQuoted(description)}`,
    "metadata:",
    "  source: cubis-foundry",
    "  wrapper: workflow",
    "  platform: codex",
    `  workflow-id: ${yamlSingleQuoted(workflow.id)}`,
    `  workflow-command: ${yamlSingleQuoted(workflow.command)}`,
    "---",
    "",
    `# Workflow Wrapper: ${workflow.command}`,
    "",
    `Use this skill as a callable replacement for \`${workflow.command}\` workflow instructions in Codex.`,
    "",
    "## Invocation Contract",
    "1. Match the current task against this workflow intent before execution.",
    "2. Follow the sequence and guardrails in the source instructions below.",
    "3. Produce actionable output and call out assumptions before edits.",
    "",
    "## Source Workflow Instructions",
    "",
    sourceBody,
    ""
  ].join("\n");
}

function buildCodexAgentWrapperSkillMarkdown(wrapperSkillId, agent) {
  const description = `Callable Codex wrapper for @${agent.id}: ${agent.description}`;
  const sourceBody = agent.body?.trim() || "No source agent content found.";
  const relatedSkillsLine =
    agent.skills.length > 0
      ? `Related skills from source agent: ${agent.skills.join(", ")}`
      : "Related skills from source agent: (none listed)";

  return [
    "---",
    `name: ${wrapperSkillId}`,
    `description: ${yamlSingleQuoted(description)}`,
    "metadata:",
    "  source: cubis-foundry",
    "  wrapper: agent",
    "  platform: codex",
    `  agent-id: ${yamlSingleQuoted(agent.id)}`,
    "---",
    "",
    `# Agent Wrapper: @${agent.id}`,
    "",
    "Use this skill as a callable replacement for custom @agent files in Codex.",
    "",
    "## Invocation Contract",
    "1. Adopt the role and constraints defined in the source agent content.",
    "2. Apply domain heuristics and escalation rules before coding.",
    "3. Ask clarifying questions when requirements are ambiguous.",
    "",
    `- Source agent name: ${agent.name}`,
    `- Source agent description: ${agent.description}`,
    `- ${relatedSkillsLine}`,
    "",
    "## Source Agent Instructions",
    "",
    sourceBody,
    ""
  ].join("\n");
}

async function writeGeneratedSkillArtifact({
  destinationDir,
  content,
  overwrite,
  dryRun = false
}) {
  const exists = await pathExists(destinationDir);
  if (exists && !overwrite) {
    return { action: dryRun ? "would-skip" : "skipped", path: destinationDir };
  }

  if (!dryRun && exists && overwrite) {
    await rm(destinationDir, { recursive: true, force: true });
  }

  if (!dryRun) {
    await mkdir(destinationDir, { recursive: true });
    await writeFile(path.join(destinationDir, "SKILL.md"), content, "utf8");
  }

  if (dryRun) {
    return { action: exists ? "would-replace" : "would-install", path: destinationDir };
  }

  return { action: exists ? "replaced" : "installed", path: destinationDir };
}

function buildCodexWrapperSkillIds(platformSpec) {
  const workflowIds = (platformSpec.workflows || []).map((fileName) => {
    const id = normalizeMarkdownId(path.basename(fileName));
    return `${CODEX_WORKFLOW_SKILL_PREFIX}${id}`;
  });

  const agentIds = (platformSpec.agents || []).map((fileName) => {
    const id = normalizeMarkdownId(path.basename(fileName));
    return `${CODEX_AGENT_SKILL_PREFIX}${id}`;
  });

  return unique([...workflowIds, ...agentIds]);
}

async function generateCodexWrapperSkills({
  platformRoot,
  platformSpec,
  skillsDir,
  overwrite,
  dryRun = false
}) {
  const installed = [];
  const skipped = [];
  const artifacts = [];
  const generated = [];
  const codexAgentIds = (platformSpec.agents || []).map((fileName) =>
    normalizeMarkdownId(path.basename(fileName))
  );

  for (const workflowFile of platformSpec.workflows || []) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    if (!(await pathExists(source))) {
      throw new Error(`Missing workflow source file for wrapper generation: ${source}`);
    }

    const metadata = await parseWorkflowMetadata(source);
    const raw = await readFile(source, "utf8");
    const sourceBody = extractFrontmatter(raw).body.trim();
    const rewrittenBody = rewriteCodexWorkflowAgentReferences(sourceBody, codexAgentIds);
    const wrapperSkillId = `${CODEX_WORKFLOW_SKILL_PREFIX}${metadata.id}`;
    const destinationDir = path.join(skillsDir, wrapperSkillId);
    const content = buildCodexWorkflowWrapperSkillMarkdown(wrapperSkillId, {
      ...metadata,
      body: rewrittenBody
    });

    const result = await writeGeneratedSkillArtifact({
      destinationDir,
      content,
      overwrite,
      dryRun
    });

    artifacts.push(destinationDir);
    generated.push({ kind: "workflow", id: metadata.id, skillId: wrapperSkillId });
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destinationDir);
    else installed.push(destinationDir);
  }

  for (const agentFile of platformSpec.agents || []) {
    const source = path.join(platformRoot, "agents", agentFile);
    if (!(await pathExists(source))) {
      throw new Error(`Missing agent source file for wrapper generation: ${source}`);
    }

    const metadata = await parseAgentMetadata(source);
    const wrapperSkillId = `${CODEX_AGENT_SKILL_PREFIX}${metadata.id}`;
    const destinationDir = path.join(skillsDir, wrapperSkillId);
    const content = buildCodexAgentWrapperSkillMarkdown(wrapperSkillId, metadata);

    const result = await writeGeneratedSkillArtifact({
      destinationDir,
      content,
      overwrite,
      dryRun
    });

    artifacts.push(destinationDir);
    generated.push({ kind: "agent", id: metadata.id, skillId: wrapperSkillId });
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destinationDir);
    else installed.push(destinationDir);
  }

  return {
    installed,
    skipped,
    artifacts,
    generated
  };
}

async function collectInstalledWorkflows(profileId, scope, cwd = process.cwd()) {
  const profilePaths = await resolveProfilePaths(profileId, scope, cwd);
  if (!(await pathExists(profilePaths.workflowsDir))) return [];

  const entries = await readdir(profilePaths.workflowsDir, { withFileTypes: true });
  const workflows = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name.startsWith(".")) continue;
    const filePath = path.join(profilePaths.workflowsDir, entry.name);
    workflows.push(await parseWorkflowMetadata(filePath));
  }

  return workflows.sort((a, b) => a.command.localeCompare(b.command));
}

function buildManagedWorkflowBlock(platformId, workflows) {
  const lines = [];
  lines.push(`<!-- cbx:workflows:auto:start platform=${platformId} version=1 -->`);
  lines.push("## CBX Workflow Routing (auto-managed)");
  if (platformId === "codex") {
    lines.push("Use Codex callable wrappers:");
    lines.push("- Workflows: `$workflow-<name>`");
    lines.push("- Agents: `$agent-<name>`");
    lines.push("");

    if (workflows.length === 0) {
      lines.push("- No installed workflows found yet.");
    } else {
      for (const workflow of workflows) {
        const triggerPreview = workflow.triggers.slice(0, 2).join(", ");
        const hint = triggerPreview ? ` (${triggerPreview})` : "";
        lines.push(`- \`${workflow.command}\` -> \`$${CODEX_WORKFLOW_SKILL_PREFIX}${workflow.id}\`${hint}`);
      }
    }

    lines.push("");
    lines.push("Selection policy:");
    lines.push("1. If user names a `$workflow-*`, use it directly.");
    lines.push("2. Else map intent to one primary workflow.");
    lines.push("3. Use `$agent-*` wrappers only when role specialization is needed.");
    lines.push("");
    lines.push("<!-- cbx:workflows:auto:end -->");
    return lines.join("\n");
  }

  lines.push("Use the following workflows proactively when task intent matches:");
  lines.push("");

  if (workflows.length === 0) {
    lines.push("- No installed workflows found yet.");
  } else {
    for (const workflow of workflows) {
      lines.push(`- \`${workflow.command}\`: ${workflow.description}`);
      if (workflow.triggers.length > 0) {
        lines.push(`  Triggers: ${workflow.triggers.join(", ")}`);
      } else {
        lines.push("  Triggers: (derived from workflow description)");
      }
      lines.push("");
    }
    if (lines[lines.length - 1] === "") lines.pop();
  }

  lines.push("");
  lines.push("Selection policy:");
  lines.push("1. Match explicit slash command first.");
  lines.push("2. Else match user intent to workflow description and triggers.");
  lines.push("3. Prefer one primary workflow; reference others only when needed.");
  lines.push("");
  lines.push("<!-- cbx:workflows:auto:end -->");

  return lines.join("\n");
}

function analyzeTaggedBlock(content, startPattern, endPattern) {
  const starts = [...content.matchAll(startPattern)];
  const ends = [...content.matchAll(endPattern)];

  if (starts.length === 0 && ends.length === 0) {
    return { status: "absent", starts: 0, ends: 0, range: null };
  }

  let range = null;
  for (const startMatch of starts) {
    const endMatch = ends.find((candidate) => candidate.index > startMatch.index);
    if (endMatch) {
      range = {
        start: startMatch.index,
        end: endMatch.index + endMatch[0].length
      };
      break;
    }
  }

  if (!range) {
    return { status: "malformed", starts: starts.length, ends: ends.length, range: null };
  }

  if (starts.length === 1 && ends.length === 1) {
    return { status: "valid", starts: 1, ends: 1, range };
  }

  return { status: "multiple", starts: starts.length, ends: ends.length, range };
}

function analyzeManagedBlock(content) {
  return analyzeTaggedBlock(content, MANAGED_BLOCK_START_RE, MANAGED_BLOCK_END_RE);
}

function analyzeTerminalVerificationBlock(content) {
  return analyzeTaggedBlock(
    content,
    TERMINAL_VERIFICATION_BLOCK_START_RE,
    TERMINAL_VERIFICATION_BLOCK_END_RE
  );
}

async function resolveRuleFilePath(profileId, scope, cwd = process.cwd()) {
  const profilePaths = await resolveProfilePaths(profileId, scope, cwd);

  for (const ruleFilePath of profilePaths.ruleFilesByPriority) {
    if (await pathExists(ruleFilePath)) return ruleFilePath;
  }

  return profilePaths.ruleFilesByPriority[0] || null;
}

async function upsertManagedRuleBlock(ruleFilePath, platformId, workflows, dryRun = false) {
  const block = buildManagedWorkflowBlock(platformId, workflows);
  const exists = await pathExists(ruleFilePath);
  const warnings = [];
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeManagedBlock(original);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    if (analysis.status === "multiple") {
      warnings.push("Multiple managed workflow blocks found; patched the first valid block.");
    }
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    warnings.push("Malformed managed workflow block; appended a new canonical block.");
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return {
      action: "unchanged",
      filePath: ruleFilePath,
      warnings
    };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return {
    action: exists ? (dryRun ? "would-patch" : "patched") : dryRun ? "would-create" : "created",
    filePath: ruleFilePath,
    warnings
  };
}

async function upsertTerminalVerificationBlock({
  ruleFilePath,
  provider,
  powerShellScriptPath,
  bashScriptPath,
  dryRun = false
}) {
  const block = buildAntigravityTerminalVerificationBlock({
    provider,
    powerShellScriptPath,
    bashScriptPath
  });
  const exists = await pathExists(ruleFilePath);
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeTerminalVerificationBlock(original);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return { action: "unchanged", filePath: ruleFilePath };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  if (!exists) {
    return { action: dryRun ? "would-create" : "created", filePath: ruleFilePath };
  }

  return { action: dryRun ? "would-patch" : "patched", filePath: ruleFilePath };
}

async function removeTerminalVerificationBlock(ruleFilePath, dryRun = false) {
  if (!(await pathExists(ruleFilePath))) {
    return { action: "missing-rule-file", filePath: ruleFilePath };
  }

  const original = await readFile(ruleFilePath, "utf8");
  const analysis = analyzeTerminalVerificationBlock(original);
  if (!analysis.range) {
    return { action: "unchanged", filePath: ruleFilePath };
  }

  const before = original.slice(0, analysis.range.start).trimEnd();
  const after = original.slice(analysis.range.end).trimStart();
  const nextContent = before && after ? `${before}\n\n${after}\n` : `${before}${after}`.trimEnd() + "\n";

  if (!dryRun) {
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return { action: dryRun ? "would-patch" : "patched", filePath: ruleFilePath };
}

async function syncRulesForPlatform({ platform, scope, cwd = process.cwd(), dryRun = false }) {
  const ruleFilePath = await resolveRuleFilePath(platform, scope, cwd);
  if (!ruleFilePath) throw new Error(`No rule file configured for platform '${platform}'.`);

  const workflows = await collectInstalledWorkflows(platform, scope, cwd);
  const patchResult = await upsertManagedRuleBlock(ruleFilePath, platform, workflows, dryRun);
  const workspaceRuleSync = await syncWorkspaceRuleForGlobalScope({
    platform,
    scope,
    cwd,
    workflows,
    dryRun
  });
  const warnings = [...patchResult.warnings];

  if (workspaceRuleSync) {
    warnings.push(
      `Workspace rule file detected at ${workspaceRuleSync.workspaceRuleFile}. In this workspace, it has higher precedence than global ${workspaceRuleSync.globalRuleFile}.`
    );
    warnings.push(`Workspace rule managed block sync action: ${workspaceRuleSync.patchResult.action}.`);
    for (const warning of workspaceRuleSync.patchResult.warnings) {
      warnings.push(`Workspace rule file: ${warning}`);
    }
  }

  if (!dryRun) {
    await setLastSelectedState(scope, platform, cwd);
  }

  return {
    platform,
    scope,
    dryRun,
    filePath: ruleFilePath,
    action: patchResult.action,
    warnings,
    workflowsCount: workflows.length,
    workspaceRuleSync: workspaceRuleSync
      ? {
          filePath: workspaceRuleSync.workspaceRuleFile,
          action: workspaceRuleSync.patchResult.action,
          warnings: workspaceRuleSync.patchResult.warnings
        }
      : null
  };
}

async function safeRemove(targetPath, dryRun = false) {
  if (await pathExists(targetPath)) {
    if (!dryRun) {
      await rm(targetPath, { recursive: true, force: true });
    }
    return true;
  }
  return false;
}

async function copyArtifact({ source, destination, overwrite, dryRun = false }) {
  const exists = await pathExists(destination);
  if (exists && !overwrite) {
    return { action: dryRun ? "would-skip" : "skipped", path: destination };
  }

  if (!dryRun && exists && overwrite) {
    await rm(destination, { recursive: true, force: true });
  }

  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
  }

  if (dryRun) {
    return { action: exists ? "would-replace" : "would-install", path: destination };
  }
  return { action: exists ? "replaced" : "installed", path: destination };
}

async function writeGeneratedArtifact({ destination, content, dryRun = false }) {
  const exists = await pathExists(destination);

  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf8");
  }

  if (dryRun) {
    return { action: exists ? "would-replace" : "would-install", path: destination };
  }

  return { action: exists ? "replaced" : "installed", path: destination };
}

function resolvePostmanSettingsPath({ scope, cwd = process.cwd() }) {
  if (scope === "global") {
    return path.join(os.homedir(), ".cbx", POSTMAN_SETTINGS_FILENAME);
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return path.join(workspaceRoot, POSTMAN_SETTINGS_FILENAME);
}

function buildPostmanMcpConfig({ apiKey = null, mcpUrl = POSTMAN_MCP_URL }) {
  const authHeader = apiKey
    ? `Bearer ${apiKey}`
    : `Bearer \${${POSTMAN_API_KEY_ENV_VAR}}`;
  return {
    mcpServers: {
      postman: {
        url: mcpUrl,
        headers: {
          Authorization: authHeader
        }
      }
    },
    disabled: false
  };
}

function getPostmanApiKeySource({ apiKey, envApiKey }) {
  if (apiKey) return "inline";
  if (envApiKey) return "env";
  return "unset";
}

function normalizePostmanApiKey(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

async function ensureGitIgnoreEntry({
  filePath,
  entry,
  dryRun = false
}) {
  const exists = await pathExists(filePath);
  const original = exists ? await readFile(filePath, "utf8") : "";
  const lines = original.split(/\r?\n/).map((line) => line.trim());
  const alreadyPresent = lines.includes(entry);

  if (alreadyPresent) {
    return { action: "unchanged", filePath };
  }

  if (dryRun) {
    return {
      action: exists ? "would-patch" : "would-create",
      filePath
    };
  }

  const suffix = original.endsWith("\n") || original.length === 0 ? "" : "\n";
  const nextContent = `${original}${suffix}${entry}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, nextContent, "utf8");
  return {
    action: exists ? "patched" : "created",
    filePath
  };
}

async function resolvePostmanInstallSelection({
  scope,
  options,
  cwd = process.cwd()
}) {
  const hasApiKeyOption = options.postmanApiKey !== undefined;
  const hasWorkspaceOption = options.postmanWorkspaceId !== undefined;
  const enabled = Boolean(options.postman) || hasApiKeyOption || hasWorkspaceOption;
  if (!enabled) return { enabled: false };

  const explicitApiKey = hasApiKeyOption ? String(options.postmanApiKey || "").trim() : "";
  let apiKey = explicitApiKey || null;
  const envApiKey = String(process.env[POSTMAN_API_KEY_ENV_VAR] || "").trim();
  let defaultWorkspaceId = hasWorkspaceOption
    ? normalizePostmanWorkspaceId(options.postmanWorkspaceId)
    : null;
  const warnings = [];

  const canPrompt = !options.yes && process.stdin.isTTY;
  if (canPrompt && !hasApiKeyOption && !apiKey && !envApiKey) {
    const promptedApiKey = String(
      await input({
        message: `Postman API key (optional, leave blank to keep ${POSTMAN_API_KEY_ENV_VAR} env mode):`,
        default: ""
      })
    ).trim();
    if (promptedApiKey) {
      apiKey = promptedApiKey;
    }
  }

  if (canPrompt && !hasWorkspaceOption) {
    const promptedWorkspaceId = await input({
      message: "Default Postman workspace ID (optional, leave blank for null):",
      default: ""
    });
    defaultWorkspaceId = normalizePostmanWorkspaceId(promptedWorkspaceId);
  }

  const apiKeySource = getPostmanApiKeySource({ apiKey, envApiKey });
  if (apiKeySource === "unset") {
    warnings.push(POSTMAN_API_KEY_MISSING_WARNING);
  }

  const settingsPath = resolvePostmanSettingsPath({ scope, cwd });
  const settings = {
    apiKey: apiKey || null,
    apiKeyEnvVar: POSTMAN_API_KEY_ENV_VAR,
    apiKeySource,
    defaultWorkspaceId: defaultWorkspaceId ?? null,
    mcpUrl: POSTMAN_MCP_URL,
    generatedBy: "cbx workflows install --postman",
    generatedAt: new Date().toISOString()
  };

  return {
    enabled: true,
    apiKey,
    apiKeySource,
    defaultWorkspaceId: defaultWorkspaceId ?? null,
    warnings,
    settings,
    settingsPath
  };
}

async function configurePostmanInstallArtifacts({
  scope,
  profilePaths,
  postmanSelection,
  overwrite = false,
  dryRun = false,
  cwd = process.cwd()
}) {
  if (!postmanSelection?.enabled) return null;

  let warnings = postmanSelection.warnings.filter((warning) => warning !== POSTMAN_API_KEY_MISSING_WARNING);
  const settingsContent = `${JSON.stringify(postmanSelection.settings, null, 2)}\n`;
  const settingsResult = await writeTextFile({
    targetPath: postmanSelection.settingsPath,
    content: settingsContent,
    overwrite,
    dryRun
  });

  let effectiveApiKey = normalizePostmanApiKey(postmanSelection.settings.apiKey);
  let effectiveDefaultWorkspaceId = postmanSelection.defaultWorkspaceId ?? null;
  let effectiveMcpUrl = postmanSelection.settings.mcpUrl || POSTMAN_MCP_URL;

  if (settingsResult.action === "skipped" || settingsResult.action === "would-skip") {
    try {
      const existingSettingsRaw = await readFile(postmanSelection.settingsPath, "utf8");
      const existingSettings = JSON.parse(existingSettingsRaw);
      effectiveApiKey = normalizePostmanApiKey(existingSettings?.apiKey);
      effectiveDefaultWorkspaceId = normalizePostmanWorkspaceId(existingSettings?.defaultWorkspaceId);
      const existingMcpUrl = String(existingSettings?.mcpUrl || "").trim();
      if (existingMcpUrl) {
        effectiveMcpUrl = existingMcpUrl;
      }
    } catch {
      warnings.push(
        `Existing ${POSTMAN_SETTINGS_FILENAME} could not be parsed. Using install-time Postman values for MCP config.`
      );
    }
  }

  const envApiKey = normalizePostmanApiKey(process.env[POSTMAN_API_KEY_ENV_VAR]);
  const effectiveApiKeySource = getPostmanApiKeySource({
    apiKey: effectiveApiKey,
    envApiKey
  });
  if (effectiveApiKeySource === "unset") {
    warnings.push(POSTMAN_API_KEY_MISSING_WARNING);
  }

  let gitIgnoreResult = null;
  if (scope === "project") {
    const workspaceRoot = findWorkspaceRoot(cwd);
    const gitIgnorePath = path.join(workspaceRoot, ".gitignore");
    gitIgnoreResult = await ensureGitIgnoreEntry({
      filePath: gitIgnorePath,
      entry: POSTMAN_SETTINGS_FILENAME,
      dryRun
    });
  }

  const postmanSkillDir = path.join(profilePaths.skillsDir, POSTMAN_SKILL_ID);
  const postmanMcpPath = path.join(postmanSkillDir, "mcp.json");
  let mcpResult = null;
  const postmanSkillExists = await pathExists(postmanSkillDir);
  if (!dryRun && !postmanSkillExists) {
    mcpResult = {
      action: "missing-postman-skill",
      path: postmanMcpPath
    };
  } else {
    const mcpConfigContent = `${JSON.stringify(
      buildPostmanMcpConfig({
        apiKey: effectiveApiKey,
        mcpUrl: effectiveMcpUrl
      }),
      null,
      2
    )}\n`;
    mcpResult = await writeGeneratedArtifact({
      destination: postmanMcpPath,
      content: mcpConfigContent,
      dryRun
    });
  }

  return {
    enabled: true,
    apiKeySource: effectiveApiKeySource,
    defaultWorkspaceId: effectiveDefaultWorkspaceId,
    warnings,
    settingsPath: postmanSelection.settingsPath,
    settingsResult,
    gitIgnoreResult,
    mcpResult
  };
}

async function installAntigravityTerminalIntegrationArtifacts({
  profilePaths,
  provider,
  dryRun = false
}) {
  const integrationDir = getAntigravityTerminalIntegrationDir(profilePaths);
  const configPath = path.join(integrationDir, "config.json");
  const powerShellScriptPath = path.join(integrationDir, "verify-task.ps1");
  const bashScriptPath = path.join(integrationDir, "verify-task.sh");
  const readmePath = path.join(integrationDir, "README.md");

  const dirExists = await pathExists(integrationDir);
  if (!dryRun && dirExists) {
    await rm(integrationDir, { recursive: true, force: true });
  }

  const configContent = `${JSON.stringify(
    buildAntigravityTerminalIntegrationConfig({ provider }),
    null,
    2
  )}\n`;
  const scriptPs1 = buildAntigravityTerminalIntegrationPowerShellScript();
  const scriptSh = buildAntigravityTerminalIntegrationBashScript();
  const readme = buildAntigravityTerminalIntegrationReadme({
    provider,
    configPath,
    scriptPsPath: powerShellScriptPath,
    scriptShPath: bashScriptPath
  });

  const writes = [];
  writes.push(await writeGeneratedArtifact({ destination: configPath, content: configContent, dryRun }));
  writes.push(await writeGeneratedArtifact({ destination: powerShellScriptPath, content: scriptPs1, dryRun }));
  writes.push(await writeGeneratedArtifact({ destination: bashScriptPath, content: scriptSh, dryRun }));
  writes.push(await writeGeneratedArtifact({ destination: readmePath, content: `${readme}\n`, dryRun }));

  return {
    provider,
    integrationDir,
    configPath,
    powerShellScriptPath,
    bashScriptPath,
    readmePath,
    actions: writes,
    installedPaths: writes.map((item) => item.path)
  };
}

async function sanitizeInstalledSkillsForPlatform({
  platform,
  skillDirs,
  dryRun = false
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const skillDir of skillDirs) {
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    const { changed, content, removedKeys } = sanitizeSkillMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(skillFile, content, "utf8");
    sanitized.push({
      skillId: path.basename(skillDir),
      removedKeys
    });
  }

  return sanitized;
}

async function sanitizeInstalledAgentsForPlatform({
  platform,
  agentFiles,
  dryRun = false
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const agentFile of agentFiles) {
    if (!(await pathExists(agentFile))) continue;
    const raw = await readFile(agentFile, "utf8");
    const { changed, content, removedKeys } = sanitizeAgentMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(agentFile, content, "utf8");
    const agentId = path.basename(agentFile).replace(/\.agent\.md$/i, "").replace(/\.md$/i, "");
    sanitized.push({
      agentId,
      removedKeys
    });
  }

  return sanitized;
}

async function validateCopilotSkillsSchema(skillsDir) {
  if (!(await pathExists(skillsDir))) return [];

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const findings = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotSkillFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      skillId: entry.name,
      unsupportedKeys
    });
  }

  return findings;
}

async function validateCopilotAgentsSchema(agentsDir) {
  if (!(await pathExists(agentsDir))) return [];

  const entries = await readdir(agentsDir, { withFileTypes: true });
  const findings = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) continue;
    const agentFile = path.join(agentsDir, entry.name);
    if (!(await pathExists(agentFile))) continue;

    const raw = await readFile(agentFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotAgentFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      agentId: entry.name.replace(/\.agent\.md$/i, "").replace(/\.md$/i, ""),
      unsupportedKeys
    });
  }

  return findings;
}

async function installBundleArtifacts({
  bundleId,
  manifest,
  platform,
  scope,
  overwrite,
  extraSkillIds = [],
  terminalVerifierSelection = null,
  dryRun = false,
  cwd = process.cwd()
}) {
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const platformSpec = manifest.platforms?.[platform];

  if (!platformSpec) {
    throw new Error(`Bundle '${bundleId}' does not define platform '${platform}'.`);
  }

  if (!dryRun) {
    await mkdir(profilePaths.workflowsDir, { recursive: true });
    await mkdir(profilePaths.skillsDir, { recursive: true });
    if (platformInstallsCustomAgents(platform)) {
      await mkdir(profilePaths.agentsDir, { recursive: true });
    }
  }

  const bundleRoot = path.join(agentAssetsRoot(), "workflows", bundleId);
  const platformRoot = path.join(bundleRoot, "platforms", platform);

  const installed = [];
  const skipped = [];
  const artifacts = { workflows: [], agents: [], skills: [] };

  const workflowFiles = Array.isArray(platformSpec.workflows) ? platformSpec.workflows : [];
  for (const workflowFile of workflowFiles) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    const destination = path.join(profilePaths.workflowsDir, path.basename(workflowFile));

    if (!(await pathExists(source))) {
      throw new Error(`Missing workflow source file: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.workflows.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  const agentFiles = platformInstallsCustomAgents(platform)
    ? Array.isArray(platformSpec.agents)
      ? platformSpec.agents
      : []
    : [];
  for (const agentFile of agentFiles) {
    const source = path.join(platformRoot, "agents", agentFile);
    const destination = path.join(profilePaths.agentsDir, path.basename(agentFile));

    if (!(await pathExists(source))) {
      throw new Error(`Missing agent source file: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.agents.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  const manifestSkillIds = Array.isArray(platformSpec.skills) ? platformSpec.skills : [];
  const skillIds = unique([...manifestSkillIds, ...extraSkillIds.filter(Boolean)]);
  for (const skillId of skillIds) {
    const source = path.join(agentAssetsRoot(), "skills", skillId);
    const destination = path.join(profilePaths.skillsDir, skillId);

    if (!(await pathExists(source))) {
      throw new Error(`Missing skill source directory: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.skills.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  // Copy skills_index.json if it exists in the package skills root
  const skillsIndexSource = path.join(agentAssetsRoot(), "skills", "skills_index.json");
  if (await pathExists(skillsIndexSource)) {
    const skillsIndexDest = path.join(profilePaths.skillsDir, "skills_index.json");
    const indexResult = await copyArtifact({ source: skillsIndexSource, destination: skillsIndexDest, overwrite, dryRun });
    if (indexResult.action === "skipped" || indexResult.action === "would-skip") skipped.push(skillsIndexDest);
    else installed.push(skillsIndexDest);
  }

  let generatedWrapperSkills = [];
  if (platform === "codex") {
    const wrapperResult = await generateCodexWrapperSkills({
      platformRoot,
      platformSpec,
      skillsDir: profilePaths.skillsDir,
      overwrite,
      dryRun
    });
    installed.push(...wrapperResult.installed);
    skipped.push(...wrapperResult.skipped);
    artifacts.skills.push(...wrapperResult.artifacts);
    generatedWrapperSkills = wrapperResult.generated;
  }

  let terminalIntegration = null;
  if (platform === "antigravity" && terminalVerifierSelection?.enabled) {
    terminalIntegration = await installAntigravityTerminalIntegrationArtifacts({
      profilePaths,
      provider: terminalVerifierSelection.provider,
      dryRun
    });
    installed.push(...terminalIntegration.installedPaths);
  }

  const sanitizedSkills = await sanitizeInstalledSkillsForPlatform({
    platform,
    skillDirs: artifacts.skills,
    dryRun
  });
  const sanitizedAgents = await sanitizeInstalledAgentsForPlatform({
    platform,
    agentFiles: artifacts.agents,
    dryRun
  });

  return {
    profilePaths,
    installed,
    skipped,
    artifacts,
    terminalIntegration,
    generatedWrapperSkills,
    sanitizedSkills,
    sanitizedAgents
  };
}

async function seedRuleFileFromTemplateIfMissing({
  bundleId,
  manifest,
  platform,
  scope,
  overwrite = false,
  dryRun = false,
  cwd = process.cwd()
}) {
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec || !platformSpec.rulesTemplate) return { ruleFilePath: null, action: "none" };

  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const ruleFilePath = profilePaths.ruleFilesByPriority[0];
  if (!ruleFilePath) return { ruleFilePath: null, action: "none" };
  if (await pathExists(ruleFilePath) && !overwrite) return { ruleFilePath, action: "exists" };

  const templatePath = path.join(agentAssetsRoot(), "workflows", bundleId, platformSpec.rulesTemplate);
  if (!(await pathExists(templatePath))) return { ruleFilePath, action: "missing-template" };

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await cp(templatePath, ruleFilePath, { recursive: false, force: true });
    return { ruleFilePath, action: "created" };
  }

  return { ruleFilePath, action: "would-create" };
}

function commandToFilename(command) {
  if (!command) return null;
  const normalized = command.trim().replace(/^\//, "").replace(/\s+/g, "-").toLowerCase();
  if (!normalized) return null;
  return `${normalized}.md`;
}

async function findWorkflowFileByTarget(workflowsDir, target) {
  const direct = target.endsWith(".md") ? target : `${target}.md`;
  const directPath = path.join(workflowsDir, direct);
  if (await pathExists(directPath)) return directPath;

  const commandFile = commandToFilename(target);
  if (commandFile) {
    const commandPath = path.join(workflowsDir, commandFile);
    if (await pathExists(commandPath)) return commandPath;
  }

  if (!(await pathExists(workflowsDir))) return null;
  const entries = await readdir(workflowsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const fullPath = path.join(workflowsDir, entry.name);
    const metadata = await parseWorkflowMetadata(fullPath);
    if (metadata.command === target || metadata.id === target || metadata.name === target) {
      return fullPath;
    }
  }

  return null;
}

async function removeBundleArtifacts({
  bundleId,
  manifest,
  platform,
  scope,
  dryRun = false,
  cwd = process.cwd()
}) {
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec) throw new Error(`Bundle '${bundleId}' does not define platform '${platform}'.`);

  const removed = [];

  for (const workflowFile of platformSpec.workflows || []) {
    const destination = path.join(profilePaths.workflowsDir, path.basename(workflowFile));
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const agentFile of platformSpec.agents || []) {
    const destination = path.join(profilePaths.agentsDir, path.basename(agentFile));
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const skillId of platformSpec.skills || []) {
    const destination = path.join(profilePaths.skillsDir, skillId);
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  if (platform === "codex") {
    const wrapperSkillIds = buildCodexWrapperSkillIds(platformSpec);
    for (const skillId of wrapperSkillIds) {
      const destination = path.join(profilePaths.skillsDir, skillId);
      if (await safeRemove(destination, dryRun)) removed.push(destination);
    }
  }

  return { removed, profilePaths };
}

function printPlatforms() {
  console.log("Workflow platforms:");
  for (const profileId of PLATFORM_IDS) {
    const profile = WORKFLOW_PROFILES[profileId];
    const agentsEnabled = platformInstallsCustomAgents(profileId);
    console.log(`- ${profile.id} (${profile.label})`);
    console.log(`  project workflows: ${profile.project.workflowDirs[0]}`);
    console.log(
      `  project agents:    ${agentsEnabled ? profile.project.agentDirs[0] : "(disabled for this platform)"}`
    );
    console.log(`  project skills:    ${profile.project.skillDirs[0]}`);
    console.log(`  project rules:     ${profile.project.ruleFilesByPriority.join(" | ")}`);
    console.log(`  global workflows:  ${profile.global.workflowDirs[0]}`);
    console.log(
      `  global agents:     ${agentsEnabled ? profile.global.agentDirs[0] : "(disabled for this platform)"}`
    );
    console.log(`  global skills:     ${profile.global.skillDirs[0]}`);
    console.log(`  global rules:      ${profile.global.ruleFilesByPriority.join(" | ")}`);
  }
}

function printRuleSyncResult(result) {
  console.log("\nRule sync:");
  if (result.dryRun) {
    console.log("- Mode: dry-run (no files changed)");
  }
  console.log(`- Platform: ${result.platform}`);
  console.log(`- Scope: ${result.scope}`);
  console.log(`- File: ${result.filePath}`);
  console.log(`- Action: ${result.action}`);
  console.log(`- Workflows indexed: ${result.workflowsCount}`);
  if (result.workspaceRuleSync) {
    console.log(`- Workspace precedence file: ${result.workspaceRuleSync.filePath}`);
    console.log(`- Workspace precedence action: ${result.workspaceRuleSync.action}`);
  }

  if (result.warnings.length > 0) {
    console.log("- Warnings:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

function printInstallSummary({
  platform,
  scope,
  bundleId,
  installed,
  skipped,
  generatedWrapperSkills = [],
  sanitizedSkills = [],
  sanitizedAgents = [],
  terminalIntegration = null,
  terminalIntegrationRules = null,
  dryRun = false
}) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Bundle: ${bundleId}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (installed.length > 0) {
    console.log(`\n${dryRun ? "Would install/replace" : "Installed"} (${installed.length}):`);
    for (const item of installed) console.log(`- ${item}`);
  }

  if (skipped.length > 0) {
    console.log(`\n${dryRun ? "Would skip existing" : "Skipped existing"} (${skipped.length}):`);
    for (const item of skipped) console.log(`- ${item}`);
    console.log(`\nTip: rerun with --overwrite to ${dryRun ? "preview replacements" : "replace skipped files"}.`);
  }

  if (installed.length === 0 && skipped.length === 0) {
    console.log("\nNo changes made.");
  }

  if (generatedWrapperSkills.length > 0) {
    const workflowCount = generatedWrapperSkills.filter((item) => item.kind === "workflow").length;
    const agentCount = generatedWrapperSkills.filter((item) => item.kind === "agent").length;
    console.log(
      `\nCodex callable wrapper skills: ${generatedWrapperSkills.length} (workflow=${workflowCount}, agent=${agentCount})`
    );
    console.log("Invoke these with $workflow-... or $agent-... in Codex.");
  }

  if (terminalIntegration) {
    console.log("\nAntigravity terminal verification integration:");
    console.log(`- Provider: ${terminalIntegration.provider}`);
    console.log(`- Directory: ${terminalIntegration.integrationDir}`);
    if (terminalIntegrationRules?.primaryRule) {
      console.log(`- Rule block (${terminalIntegrationRules.primaryRule.filePath}): ${terminalIntegrationRules.primaryRule.action}`);
    }
    if (terminalIntegrationRules?.workspaceRule) {
      console.log(`- Workspace precedence rule (${terminalIntegrationRules.workspaceRule.filePath}): ${terminalIntegrationRules.workspaceRule.action}`);
    }
  }

  if (!dryRun && sanitizedSkills.length > 0) {
    console.log(`\nCopilot skill schema normalization (${sanitizedSkills.length}):`);
    for (const item of sanitizedSkills.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(`- ${item.skillId}: removed unsupported top-level keys (${keys})`);
    }
    if (sanitizedSkills.length > 8) {
      console.log(`- ...and ${sanitizedSkills.length - 8} more skill(s).`);
    }
  }

  if (!dryRun && sanitizedAgents.length > 0) {
    console.log(`\nCopilot agent schema normalization (${sanitizedAgents.length}):`);
    for (const item of sanitizedAgents.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(`- ${item.agentId}: removed unsupported top-level keys (${keys})`);
    }
    if (sanitizedAgents.length > 8) {
      console.log(`- ...and ${sanitizedAgents.length - 8} more agent file(s).`);
    }
  }
}

function printPostmanSetupSummary({ postmanSetup }) {
  if (!postmanSetup?.enabled) return;

  console.log("\nPostman setup:");
  console.log(`- Settings file: ${postmanSetup.settingsResult.action} (${postmanSetup.settingsPath})`);
  console.log(`- API key source: ${postmanSetup.apiKeySource}`);
  console.log(
    `- Default workspace ID: ${postmanSetup.defaultWorkspaceId === null ? "null" : postmanSetup.defaultWorkspaceId}`
  );
  if (postmanSetup.gitIgnoreResult) {
    console.log(
      `- .gitignore (${postmanSetup.gitIgnoreResult.filePath}): ${postmanSetup.gitIgnoreResult.action}`
    );
  }
  if (postmanSetup.mcpResult) {
    console.log(`- Postman MCP config (${postmanSetup.mcpResult.path}): ${postmanSetup.mcpResult.action}`);
  }

  if (postmanSetup.warnings.length > 0) {
    console.log("- Warnings:");
    for (const warning of postmanSetup.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

function printRemoveSummary({
  platform,
  scope,
  target,
  removed,
  terminalIntegrationCleanup = null,
  dryRun = false
}) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Target: ${target}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (removed.length > 0) {
    console.log(`\n${dryRun ? "Would remove" : "Removed"} (${removed.length}):`);
    for (const item of removed) console.log(`- ${item}`);
  } else {
    console.log(`\nNo files were ${dryRun ? "selected for removal" : "removed"}.`);
  }

  if (terminalIntegrationCleanup) {
    console.log("\nAntigravity terminal verification cleanup:");
    console.log(
      `- Integration directory (${terminalIntegrationCleanup.integrationDir}): ${terminalIntegrationCleanup.dirRemoved ? (dryRun ? "would-remove" : "removed") : "unchanged"}`
    );
    if (terminalIntegrationCleanup.primaryRule?.filePath) {
      console.log(
        `- Rule block (${terminalIntegrationCleanup.primaryRule.filePath}): ${terminalIntegrationCleanup.primaryRule.action}`
      );
    }
    if (terminalIntegrationCleanup.workspaceRule?.filePath) {
      console.log(
        `- Workspace precedence rule (${terminalIntegrationCleanup.workspaceRule.filePath}): ${terminalIntegrationCleanup.workspaceRule.action}`
      );
    }
  }
}

async function createDoctorReport({ platform, scope, cwd = process.cwd() }) {
  const profile = WORKFLOW_PROFILES[platform];
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const agentsEnabled = platformInstallsCustomAgents(platform);

  const pathStatus = {
    workflows: {
      path: profilePaths.workflowsDir,
      exists: await pathExists(profilePaths.workflowsDir)
    },
    agents: {
      path: profilePaths.agentsDir,
      enabled: agentsEnabled,
      exists: agentsEnabled ? await pathExists(profilePaths.agentsDir) : null
    },
    skills: {
      path: profilePaths.skillsDir,
      exists: await pathExists(profilePaths.skillsDir)
    }
  };

  let activeRuleFile = null;
  for (const candidate of profilePaths.ruleFilesByPriority) {
    if (await pathExists(candidate)) {
      activeRuleFile = candidate;
      break;
    }
  }

  const preferredRuleFile = profilePaths.ruleFilesByPriority[0];
  const ruleFileToCheck = activeRuleFile || preferredRuleFile;

  let managedBlockStatus = "absent";
  let managedBlockCounts = { starts: 0, ends: 0 };
  if (activeRuleFile && (await pathExists(activeRuleFile))) {
    const content = await readFile(activeRuleFile, "utf8");
    const analysis = analyzeManagedBlock(content);
    managedBlockStatus = analysis.status;
    managedBlockCounts = { starts: analysis.starts, ends: analysis.ends };
  }

  let terminalIntegration = null;
  if (platform === "antigravity") {
    const integrationDir = getAntigravityTerminalIntegrationDir(profilePaths);
    const configPath = path.join(integrationDir, "config.json");
    const exists = await pathExists(integrationDir);
    const configExists = await pathExists(configPath);
    let provider = null;
    let ruleBlockStatus = "unknown";

    if (configExists) {
      try {
        const raw = await readFile(configPath, "utf8");
        const parsed = JSON.parse(raw);
        provider = typeof parsed.provider === "string" ? parsed.provider : null;
      } catch {
        provider = null;
      }
    }

    if (activeRuleFile && (await pathExists(activeRuleFile))) {
      const content = await readFile(activeRuleFile, "utf8");
      ruleBlockStatus = analyzeTerminalVerificationBlock(content).status;
    }

    terminalIntegration = {
      path: integrationDir,
      exists,
      configPath,
      configExists,
      provider,
      ruleBlockStatus
    };
  }

  const recommendations = [];
  const warnings = [];

  if (!activeRuleFile) {
    recommendations.push(
      `No instruction file found. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to create ${profile.ruleHintName}.`
    );
  }

  if (activeRuleFile && managedBlockStatus === "absent") {
    recommendations.push(
      `Instruction file exists but lacks CBX managed block. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}'.`
    );
  }

  if (managedBlockStatus === "multiple" || managedBlockStatus === "malformed") {
    recommendations.push(
      `Managed block is not clean. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to normalize it.`
    );
  }

  if (
    !pathStatus.workflows.exists &&
    !pathStatus.skills.exists &&
    !(pathStatus.agents.enabled && pathStatus.agents.exists)
  ) {
    recommendations.push("No workflow/agent/skill directories found in this scope.");
  }

  if (platform === "codex" && scope === "project") {
    const legacyCodexSkills = path.join(cwd, ".codex", "skills");
    if (await pathExists(legacyCodexSkills)) {
      warnings.push("Legacy path ./.codex/skills detected. Recommended path is ./.agents/skills.");
      recommendations.push(
        "Migrate legacy Codex skills path: move ./.codex/skills to ./.agents/skills to align with official defaults."
      );
    }
  }

  if (scope === "global") {
    const workspaceRule = await resolveWorkspaceRuleFileForGlobalScope(platform, cwd);
    if (workspaceRule) {
      const globalRulePath = expandPath(WORKFLOW_PROFILES[platform].global.ruleFilesByPriority[0], cwd);
      warnings.push(
        `Workspace rule file detected at ${workspaceRule}. In this workspace, it has higher precedence than global ${globalRulePath}.`
      );
      recommendations.push(
        `Use 'cbx workflows sync-rules --platform ${platform} --scope global' from this workspace to sync the managed block to both global and workspace rule files.`
      );
    }
  }

  if (platform === "antigravity" && scope === "project") {
    const gitignorePath = path.join(cwd, ".gitignore");
    if (await pathExists(gitignorePath)) {
      const gitignore = await readFile(gitignorePath, "utf8");
      const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
      const hasAgentIgnore = lines.some((line) => line === ".agent" || line === ".agent/" || line === "/.agent/");
      if (hasAgentIgnore) {
        warnings.push(".agent/ is ignored in .gitignore; this can hide team workflow/rule updates.");
        recommendations.push(
          "Prefer tracking .agent/ in git. For local-only excludes, use '.git/info/exclude' instead of .gitignore."
        );
      }
    }
  }

  if (platform === "antigravity" && terminalIntegration?.exists && !terminalIntegration.configExists) {
    warnings.push(
      `Antigravity terminal integration directory exists without config: ${terminalIntegration.configPath}.`
    );
    recommendations.push(
      "Reinstall with terminal integration enabled to restore config and scripts."
    );
  }

  if (
    platform === "antigravity" &&
    terminalIntegration?.exists &&
    terminalIntegration.ruleBlockStatus === "absent"
  ) {
    warnings.push("Antigravity terminal integration exists but no terminal verification rule block was found.");
    recommendations.push(
      "Re-run install with terminal integration flags (use --overwrite if files already exist)."
    );
  }

  if (platform === "copilot" && pathStatus.skills.exists) {
    const findings = await validateCopilotSkillsSchema(profilePaths.skillsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.skillId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot skill attributes detected in ${findings.length} skill(s): ${preview}${findings.length > 5 ? "; ..." : ""}`
      );
      recommendations.push(
        `Normalize Copilot skill frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`
      );
    }
  }

  if (platform === "copilot" && pathStatus.agents.exists) {
    const findings = await validateCopilotAgentsSchema(profilePaths.agentsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.agentId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot agent attributes detected in ${findings.length} agent file(s): ${preview}${findings.length > 5 ? "; ..." : ""}`
      );
      recommendations.push(
        `Normalize Copilot agent frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`
      );
    }
  }

  return {
    platform,
    scope,
    ruleFileStatus: {
      active: activeRuleFile,
      preferred: ruleFileToCheck,
      exists: Boolean(activeRuleFile)
    },
    paths: pathStatus,
    managedBlockStatus,
    managedBlockCounts,
    terminalIntegration,
    warnings,
    recommendations
  };
}

function printDoctorReport(report) {
  console.log(`Platform: ${report.platform}`);
  console.log(`Scope: ${report.scope}`);

  console.log("\nRule file:");
  console.log(`- Active: ${report.ruleFileStatus.active || "(missing)"}`);
  console.log(`- Preferred: ${report.ruleFileStatus.preferred}`);

  console.log("\nPaths:");
  console.log(`- Workflows: ${report.paths.workflows.path} : ${report.paths.workflows.exists ? "exists" : "missing"}`);
  if (report.paths.agents.enabled === false) {
    console.log(`- Agents: ${report.paths.agents.path} : disabled`);
  } else {
    console.log(`- Agents: ${report.paths.agents.path} : ${report.paths.agents.exists ? "exists" : "missing"}`);
  }
  console.log(`- Skills: ${report.paths.skills.path} : ${report.paths.skills.exists ? "exists" : "missing"}`);

  console.log("\nManaged block:");
  console.log(`- Status: ${report.managedBlockStatus}`);
  console.log(`- Markers: start=${report.managedBlockCounts.starts}, end=${report.managedBlockCounts.ends}`);

  if (report.terminalIntegration) {
    console.log("\nTerminal integration:");
    console.log(`- Path: ${report.terminalIntegration.path}`);
    console.log(`- Exists: ${report.terminalIntegration.exists ? "yes" : "no"}`);
    console.log(`- Config: ${report.terminalIntegration.configPath}`);
    console.log(`- Config present: ${report.terminalIntegration.configExists ? "yes" : "no"}`);
    console.log(`- Provider: ${report.terminalIntegration.provider || "(unknown)"}`);
    console.log(`- Rule block status: ${report.terminalIntegration.ruleBlockStatus}`);
  }

  if (report.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of report.warnings) console.log(`- ${warning}`);
  }

  console.log("\nRecommendations:");
  if (report.recommendations.length === 0) {
    console.log("- No issues detected.");
  } else {
    for (const recommendation of report.recommendations) console.log(`- ${recommendation}`);
  }
}

function withWorkflowBaseOptions(command) {
  return command
    .option("-p, --platform <platform>", "target platform id")
    .option("--scope <scope>", "target scope: project|global", "project");
}

function withInstallOptions(command) {
  return withWorkflowBaseOptions(command)
    .option("-b, --bundle <bundle>", "bundle id (default: agent-environment-setup)")
    .option("--overwrite", "overwrite existing files")
    .option(
      "--postman",
      "optional: install Postman skill and generate postman_setting.json"
    )
    .option(
      "--postman-api-key <key>",
      "optional: set Postman API key inline for generated postman_setting.json and installed Postman MCP config"
    )
    .option(
      "--postman-workspace-id <id|null>",
      "optional: set default Postman workspace ID (use 'null' for no default)"
    )
    .option(
      "--terminal-integration",
      "Antigravity only: enable terminal verification integration (prompts for verifier when interactive)"
    )
    .option(
      "--terminal-verifier <provider>",
      "Antigravity only: verifier provider (codex|gemini). Implies --terminal-integration."
    )
    .option("--dry-run", "preview install without writing files")
    .option("-y, --yes", "skip interactive confirmation");
}

function printSkillsDeprecation() {
  console.log("[deprecation] 'cbx skills ...' is now an alias. Use 'cbx workflows ...'.");
}

async function resolveAntigravityTerminalVerifierSelection({ platform, options }) {
  const verifierRaw = options.terminalVerifier;
  const hasTerminalIntegrationFlag = Boolean(options.terminalIntegration);
  const normalizedVerifier = normalizeTerminalVerifier(verifierRaw);

  if (verifierRaw && !normalizedVerifier) {
    throw new Error(
      `Unsupported --terminal-verifier value '${verifierRaw}'. Allowed: ${TERMINAL_VERIFIER_PROVIDERS.join(", ")}.`
    );
  }

  if (platform !== "antigravity") {
    if (hasTerminalIntegrationFlag || verifierRaw) {
      throw new Error("--terminal-integration and --terminal-verifier are only supported for platform 'antigravity'.");
    }
    return null;
  }

  let enabled = hasTerminalIntegrationFlag || Boolean(normalizedVerifier);
  let provider = normalizedVerifier;

  const canPrompt = !options.yes && process.stdin.isTTY;
  if (!enabled && !provider && canPrompt) {
    enabled = await confirm({
      message: "Enable Antigravity terminal verification integration?",
      default: false
    });
  }

  if (!enabled) return null;

  if (!provider) {
    if (canPrompt) {
      provider = await select({
        message: "Select terminal verifier provider:",
        choices: [
          { name: "Codex CLI", value: "codex" },
          { name: "Gemini CLI", value: "gemini" }
        ]
      });
    } else {
      provider = DEFAULT_TERMINAL_VERIFIER;
    }
  }

  return { enabled: true, provider };
}

async function upsertTerminalVerificationForInstall({
  scope,
  cwd,
  terminalIntegration,
  dryRun = false
}) {
  if (!terminalIntegration) return null;

  const primaryRuleFile = await resolveRuleFilePath("antigravity", scope, cwd);
  if (!primaryRuleFile) return null;

  const primary = await upsertTerminalVerificationBlock({
    ruleFilePath: primaryRuleFile,
    provider: terminalIntegration.provider,
    powerShellScriptPath: terminalIntegration.powerShellScriptPath,
    bashScriptPath: terminalIntegration.bashScriptPath,
    dryRun
  });

  let workspace = null;
  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope("antigravity", cwd);
    const globalRuleFile = expandPath(WORKFLOW_PROFILES.antigravity.global.ruleFilesByPriority[0], cwd);
    if (workspaceRuleFile && path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)) {
      workspace = await upsertTerminalVerificationBlock({
        ruleFilePath: workspaceRuleFile,
        provider: terminalIntegration.provider,
        powerShellScriptPath: terminalIntegration.powerShellScriptPath,
        bashScriptPath: terminalIntegration.bashScriptPath,
        dryRun
      });
    }
  }

  return {
    provider: terminalIntegration.provider,
    primaryRule: primary,
    workspaceRule: workspace,
    integrationDir: terminalIntegration.integrationDir
  };
}

async function cleanupAntigravityTerminalIntegration({
  scope,
  cwd,
  dryRun = false
}) {
  const profilePaths = await resolveProfilePaths("antigravity", scope, cwd);
  const integrationDir = getAntigravityTerminalIntegrationDir(profilePaths);
  const dirRemoved = await safeRemove(integrationDir, dryRun);

  const primaryRuleFile = await resolveRuleFilePath("antigravity", scope, cwd);
  const primaryRule = primaryRuleFile
    ? await removeTerminalVerificationBlock(primaryRuleFile, dryRun)
    : { action: "missing-rule-file", filePath: null };

  let workspaceRule = null;
  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope("antigravity", cwd);
    const globalRuleFile = expandPath(WORKFLOW_PROFILES.antigravity.global.ruleFilesByPriority[0], cwd);
    if (workspaceRuleFile && path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)) {
      workspaceRule = await removeTerminalVerificationBlock(workspaceRuleFile, dryRun);
    }
  }

  return {
    integrationDir,
    dirRemoved,
    primaryRule,
    workspaceRule
  };
}

async function runWorkflowInstall(options) {
  try {
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const bundleId = await chooseBundle(options.bundle);
    const manifest = await readBundleManifest(bundleId);

    if (!dryRun && !options.yes && process.stdin.isTTY) {
      const proceed = await confirm({
        message: `Install bundle '${bundleId}' for ${platform} (${scope})?`,
        default: true
      });
      if (!proceed) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    const terminalVerifierSelection = await resolveAntigravityTerminalVerifierSelection({
      platform,
      options
    });
    const postmanSelection = await resolvePostmanInstallSelection({
      scope,
      options,
      cwd: process.cwd()
    });

    const installResult = await installBundleArtifacts({
      bundleId,
      manifest,
      platform,
      scope,
      overwrite: Boolean(options.overwrite),
      extraSkillIds: postmanSelection.enabled ? [POSTMAN_SKILL_ID] : [],
      terminalVerifierSelection,
      dryRun,
      cwd: process.cwd()
    });

    await seedRuleFileFromTemplateIfMissing({
      bundleId,
      manifest,
      platform,
      scope,
      overwrite: Boolean(options.overwrite),
      dryRun,
      cwd: process.cwd()
    });

    const syncResult = await syncRulesForPlatform({
      platform,
      scope,
      dryRun,
      cwd: process.cwd()
    });
    const engineeringArtifactsResult = await upsertEngineeringArtifacts({
      platform,
      scope,
      overwrite: false,
      dryRun,
      skipTech: false,
      cwd: process.cwd()
    });
    const postmanSetupResult = await configurePostmanInstallArtifacts({
      scope,
      profilePaths: installResult.profilePaths,
      postmanSelection,
      overwrite: Boolean(options.overwrite),
      dryRun,
      cwd: process.cwd()
    });

    const terminalVerificationRuleResult =
      platform === "antigravity" && installResult.terminalIntegration
        ? await upsertTerminalVerificationForInstall({
            scope,
            cwd: process.cwd(),
            terminalIntegration: installResult.terminalIntegration,
            dryRun
          })
        : null;

    if (!dryRun) {
      await recordBundleInstallState({
        scope,
        platform,
        bundleId,
        artifacts: installResult.artifacts,
        ruleFilePath: syncResult.filePath,
        cwd: process.cwd()
      });
    }

    printInstallSummary({
      platform,
      scope,
      bundleId,
      installed: installResult.installed,
      skipped: installResult.skipped,
      generatedWrapperSkills: installResult.generatedWrapperSkills,
      sanitizedSkills: installResult.sanitizedSkills,
      sanitizedAgents: installResult.sanitizedAgents,
      terminalIntegration: installResult.terminalIntegration,
      terminalIntegrationRules: terminalVerificationRuleResult,
      dryRun
    });
    printRuleSyncResult(syncResult);
    printInstallEngineeringSummary({
      engineeringResults: engineeringArtifactsResult.engineeringResults,
      techResult: engineeringArtifactsResult.techResult
    });
    printPostmanSetupSummary({
      postmanSetup: postmanSetupResult
    });
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    } else {
      console.log("\nTip: run `cbx workflows doctor --platform " + platform + " --scope " + scope + "`.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowRemove(target, options) {
  try {
    if (!target) {
      throw new Error("Missing <bundle-or-workflow>. Usage: cbx workflows remove <bundle-or-workflow>");
    }

    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const bundleIds = await listBundleIds();

    let removed = [];
    let removedType = "workflow";
    let terminalIntegrationCleanup = null;

    if (bundleIds.includes(target)) {
      removedType = "bundle";
      const manifest = await readBundleManifest(target);

      if (!dryRun && !options.yes && process.stdin.isTTY) {
        const proceed = await confirm({
          message: `Remove bundle '${target}' from ${platform} (${scope})?`,
          default: true
        });
        if (!proceed) {
          console.log("Cancelled.");
          process.exit(0);
        }
      }

      const removeResult = await removeBundleArtifacts({
        bundleId: target,
        manifest,
        platform,
        scope,
        dryRun,
        cwd: process.cwd()
      });

      removed = removeResult.removed;

      if (platform === "antigravity") {
        terminalIntegrationCleanup = await cleanupAntigravityTerminalIntegration({
          scope,
          cwd: process.cwd(),
          dryRun
        });
        if (terminalIntegrationCleanup.dirRemoved) {
          removed.push(terminalIntegrationCleanup.integrationDir);
        }
      }
    } else {
      const profilePaths = await resolveProfilePaths(platform, scope, process.cwd());
      const workflowFile = await findWorkflowFileByTarget(profilePaths.workflowsDir, target);

      if (!workflowFile) {
        throw new Error(`Could not find workflow or bundle '${target}' in platform '${platform}'.`);
      }

      if (!dryRun && !options.yes && process.stdin.isTTY) {
        const proceed = await confirm({
          message: `Remove workflow '${path.basename(workflowFile)}' from ${platform} (${scope})?`,
          default: true
        });
        if (!proceed) {
          console.log("Cancelled.");
          process.exit(0);
        }
      }

      if (await safeRemove(workflowFile, dryRun)) {
        removed.push(workflowFile);
      }
    }

    const syncResult = await syncRulesForPlatform({
      platform,
      scope,
      dryRun,
      cwd: process.cwd()
    });

    if (!dryRun && removedType === "bundle") {
      await recordBundleRemovalState({
        scope,
        platform,
        bundleId: target,
        ruleFilePath: syncResult.filePath,
        cwd: process.cwd()
      });
    }

    printRemoveSummary({
      platform,
      scope,
      target,
      removed,
      terminalIntegrationCleanup,
      dryRun
    });
    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowSyncRules(options) {
  try {
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const syncResult = await syncRulesForPlatform({ platform, scope, dryRun, cwd: process.cwd() });

    if (options.json) {
      console.log(JSON.stringify(syncResult, null, 2));
      return;
    }

    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowDoctor(platformArg, options) {
  try {
    const scope = normalizeScope(options.scope);
    const platform = await resolvePlatform(platformArg || options.platform, scope, process.cwd());
    const report = await createDoctorReport({ platform, scope, cwd: process.cwd() });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printDoctorReport(report);
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function printRulesInitSummary({
  platform,
  scope,
  dryRun,
  engineeringResults,
  techResult
}) {
  console.log(`Platform: ${platform}`);
  console.log(`Scope: ${scope}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  console.log("\nEngineering rules:");
  for (const item of engineeringResults) {
    console.log(`- Rule file: ${item.ruleFilePath}`);
    console.log(`  - ENGINEERING_RULES.md: ${item.rulesFileResult.action} (${item.rulesFilePath})`);
    console.log(`  - Managed block: ${item.blockResult.action}`);
    if (item.blockResult.warnings.length > 0) {
      for (const warning of item.blockResult.warnings) {
        console.log(`    - warning: ${warning}`);
      }
    }
  }

  if (techResult) {
    console.log("\nTECH.md:");
    console.log(`- Action: ${techResult.action}`);
    console.log(`- File: ${techResult.filePath}`);
    console.log(`- Files scanned: ${techResult.snapshot.scannedFiles}`);
  }
}

function printInstallEngineeringSummary({ engineeringResults, techResult }) {
  console.log("\nEngineering artifacts:");
  for (const item of engineeringResults) {
    console.log(`- ENGINEERING_RULES.md: ${item.rulesFileResult.action} (${item.rulesFilePath})`);
    console.log(`- Managed engineering block (${item.ruleFilePath}): ${item.blockResult.action}`);
    if (item.blockResult.warnings.length > 0) {
      for (const warning of item.blockResult.warnings) {
        console.log(`  - warning: ${warning}`);
      }
    }
  }

  if (techResult) {
    console.log(`- TECH.md: ${techResult.action} (${techResult.filePath})`);
    console.log(`- TECH scan files: ${techResult.snapshot.scannedFiles}`);
  }
}

async function upsertEngineeringArtifacts({
  platform,
  scope,
  overwrite = false,
  skipTech = false,
  dryRun = false,
  cwd = process.cwd()
}) {
  const ruleFilePath = await resolveRuleFilePath(platform, scope, cwd);
  if (!ruleFilePath) throw new Error(`No rule file configured for platform '${platform}'.`);

  const workspaceRoot = findWorkspaceRoot(cwd);
  const techMdPath = path.join(workspaceRoot, "TECH.md");
  const targets = [{ ruleFilePath }];

  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(platform, cwd);
    const globalRuleFile = expandPath(WORKFLOW_PROFILES[platform].global.ruleFilesByPriority[0], cwd);
    if (workspaceRuleFile && path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)) {
      targets.push({ ruleFilePath: workspaceRuleFile });
    }
  }

  const template = buildEngineeringRulesTemplate();
  const engineeringResults = [];
  for (const target of targets) {
    const rulesFilePath = path.join(path.dirname(target.ruleFilePath), "ENGINEERING_RULES.md");
    const rulesFileResult = await writeTextFile({
      targetPath: rulesFilePath,
      content: `${template}\n`,
      overwrite,
      dryRun
    });
    const blockResult = await upsertEngineeringRulesBlock({
      ruleFilePath: target.ruleFilePath,
      platform,
      engineeringRulesFilePath: rulesFilePath,
      techMdFilePath: techMdPath,
      dryRun
    });
    engineeringResults.push({
      ruleFilePath: target.ruleFilePath,
      rulesFilePath,
      rulesFileResult,
      blockResult
    });
  }

  let techResult = null;
  if (!skipTech) {
    const snapshot = await collectTechSnapshot(workspaceRoot);
    const content = buildTechMd(snapshot);
    const fileResult = await writeTextFile({
      targetPath: techMdPath,
      content: `${content}\n`,
      overwrite,
      dryRun
    });
    techResult = {
      ...fileResult,
      snapshot
    };
  }

  return {
    engineeringResults,
    techResult
  };
}

async function runRulesInit(options) {
  try {
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const overwrite = Boolean(options.overwrite);
    const cwd = process.cwd();
    const platform = await resolvePlatform(options.platform, scope, cwd);
    const initResult = await upsertEngineeringArtifacts({
      platform,
      scope,
      overwrite,
      skipTech: Boolean(options.skipTech),
      dryRun,
      cwd
    });

    printRulesInitSummary({
      platform,
      scope,
      dryRun,
      engineeringResults: initResult.engineeringResults,
      techResult: initResult.techResult
    });

    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runRulesTechMd(options) {
  try {
    const dryRun = Boolean(options.dryRun);
    const overwrite = Boolean(options.overwrite);
    const cwd = process.cwd();
    const workspaceRoot = findWorkspaceRoot(cwd);
    const outputPath = options.output ? expandPath(options.output, cwd) : path.join(workspaceRoot, "TECH.md");
    const snapshot = await collectTechSnapshot(workspaceRoot);
    const content = buildTechMd(snapshot);
    const result = await writeTextFile({
      targetPath: outputPath,
      content: `${content}\n`,
      overwrite,
      dryRun
    });

    console.log(`TECH.md action: ${result.action}`);
    console.log(`File: ${result.filePath}`);
    console.log(`Root scanned: ${toPosixPath(workspaceRoot)}`);
    console.log(`Files scanned: ${snapshot.scannedFiles}`);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

const program = new Command();

program
  .name("cbx")
  .description("Cubis Foundry CLI for workflow-first AI agent environments")
  .version(CLI_VERSION);

const workflowsCommand = program
  .command("workflows")
  .description("Install and manage workflow bundles for Antigravity, Codex, and Copilot");

workflowsCommand.command("platforms").description("List workflow platform ids and defaults").action(printPlatforms);

withInstallOptions(
  workflowsCommand.command("install").description("Install a workflow bundle into the selected platform")
).action(runWorkflowInstall);

withInstallOptions(
  workflowsCommand.command("init").description("Alias for 'workflows install'")
).action(runWorkflowInstall);

withWorkflowBaseOptions(
  workflowsCommand
    .command("remove <bundle-or-workflow>")
    .description("Remove an installed bundle or workflow and sync rules")
    .option("--dry-run", "preview remove and sync without writing files")
    .option("-y, --yes", "skip interactive confirmation")
).action(runWorkflowRemove);

withWorkflowBaseOptions(
  workflowsCommand
    .command("sync-rules")
    .description("Rebuild the managed workflow routing block for the selected platform")
    .option("--dry-run", "preview managed rule sync without writing files")
    .option("--json", "output JSON")
).action(runWorkflowSyncRules);

withWorkflowBaseOptions(
  workflowsCommand
    .command("doctor [platform]")
    .description("Validate workflow paths, rule file status, and managed block health")
    .option("--json", "output JSON")
).action(runWorkflowDoctor);

workflowsCommand.action(() => {
  workflowsCommand.help();
});

const skillsCommand = program
  .command("skills")
  .description("Deprecated alias for 'workflows' (kept for one minor release)");

skillsCommand.command("platforms").description("Alias for workflows platforms").action(() => {
  printSkillsDeprecation();
  printPlatforms();
});

withInstallOptions(
  skillsCommand.command("install").description("Alias for workflows install")
).action(async (options) => {
  printSkillsDeprecation();
  await runWorkflowInstall(options);
});

withInstallOptions(skillsCommand.command("init").description("Alias for workflows install")).action(
  async (options) => {
    printSkillsDeprecation();
    await runWorkflowInstall(options);
  }
);

withWorkflowBaseOptions(
  skillsCommand
    .command("remove <bundle-or-workflow>")
    .description("Alias for workflows remove")
    .option("--dry-run", "preview remove and sync without writing files")
    .option("-y, --yes", "skip interactive confirmation")
).action(async (target, options) => {
  printSkillsDeprecation();
  await runWorkflowRemove(target, options);
});

withWorkflowBaseOptions(
  skillsCommand
    .command("sync-rules")
    .description("Alias for workflows sync-rules")
    .option("--dry-run", "preview managed rule sync without writing files")
    .option("--json", "output JSON")
).action(async (options) => {
  printSkillsDeprecation();
  await runWorkflowSyncRules(options);
});

withWorkflowBaseOptions(
  skillsCommand
    .command("doctor [platform]")
    .description("Alias for workflows doctor")
    .option("--json", "output JSON")
).action(async (platform, options) => {
  printSkillsDeprecation();
  await runWorkflowDoctor(platform, options);
});

skillsCommand.action(() => {
  printSkillsDeprecation();
  skillsCommand.help();
});

const rulesCommand = program
  .command("rules")
  .description("Create and sync strict engineering rules and generated TECH.md");

rulesCommand
  .command("init")
  .description(
    "Create/update ENGINEERING_RULES.md, patch active platform rule file with managed guardrail block, and generate TECH.md"
  )
  .option("-p, --platform <platform>", "target platform id")
  .option("--scope <scope>", "target scope: project|global", "project")
  .option("--overwrite", "overwrite existing ENGINEERING_RULES.md and TECH.md")
  .option("--skip-tech", "skip TECH.md generation")
  .option("--dry-run", "preview changes without writing files")
  .action(runRulesInit);

rulesCommand
  .command("tech-md")
  .description("Scan the codebase and generate/update TECH.md")
  .option("--output <path>", "output path (default: <workspace-root>/TECH.md)")
  .option("--overwrite", "overwrite existing TECH.md")
  .option("--dry-run", "preview generation without writing files")
  .action(runRulesTechMd);

rulesCommand.action(() => {
  rulesCommand.help();
});

const agentsCommand = program.command("agents").description("Cubis Agent Bot commands");

agentsCommand
  .command("status")
  .description("Show Cubis Agent Bot availability")
  .action(() => {
    console.log("Cubis Agent Bot is planned but not wired yet.");
    console.log("Use `cbx workflows` to install and manage workflow bundles.");
  });

agentsCommand.action(() => {
  agentsCommand.help();
});

program
  .command("platforms")
  .description("Legacy alias for workflows platforms")
  .action(printPlatforms);

withInstallOptions(program.command("install").description("Legacy alias for workflows install")).action(
  runWorkflowInstall
);

withInstallOptions(program.command("init").description("Legacy alias for workflows install")).action(
  runWorkflowInstall
);

if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
