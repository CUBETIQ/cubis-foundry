// @ts-nocheck

import { confirm, input, select } from "@inquirer/prompts";
import { parse as parseJsonc } from "jsonc-parser";
import { existsSync } from "node:fs";
import {
  chmod,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn, execFile as execFileCallback } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { registerCommands } from "./commands/register.js";
import { DEFAULT_SKILL_PROFILE } from "./constants.js";
import {
  buildInitExecutionPlan,
  formatInitSummary,
  promptInitApplyConfirmation,
  promptInitBundle,
  promptInitMcpRuntime,
  promptInitMcpSelection,
  promptInitPlatforms,
  promptInitPostmanMode,
  promptInitScope,
  promptInitSkillProfile,
  promptOptionalSecret,
  renderInitWelcome,
} from "./init/index.js";
import {
  agentAssetsRoot,
  expandPath,
  findWorkspaceRoot,
  packageRoot,
  workflowSkillsRoot,
} from "./pathing.js";

const require = createRequire(import.meta.url);
const { version: CLI_VERSION } = require("../../package.json");
const execFile = promisify(execFileCallback);

const MANAGED_BLOCK_START_RE = /<!--\s*cbx:workflows:auto:start[^>]*-->/g;
const MANAGED_BLOCK_END_RE = /<!--\s*cbx:workflows:auto:end\s*-->/g;
const TERMINAL_VERIFICATION_BLOCK_START_RE =
  /<!--\s*cbx:terminal:verification:start[^>]*-->/g;
const TERMINAL_VERIFICATION_BLOCK_END_RE =
  /<!--\s*cbx:terminal:verification:end\s*-->/g;
const ENGINEERING_RULES_BLOCK_START_RE =
  /<!--\s*cbx:engineering:auto:start[^>]*-->/g;
const ENGINEERING_RULES_BLOCK_END_RE = /<!--\s*cbx:engineering:auto:end\s*-->/g;
const ENGINEERING_RULES_FILE_BLOCK_START_RE =
  /<!--\s*cbx:engineering:rules:start[^>]*-->/g;
const ENGINEERING_RULES_FILE_BLOCK_END_RE =
  /<!--\s*cbx:engineering:rules:end\s*-->/g;
const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name",
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
  "argument-hint",
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
      commandDirs: [".gemini/commands"],
      ruleFilesByPriority: [".agent/rules/GEMINI.md"],
    },
    global: {
      workflowDirs: [
        "~/.gemini/antigravity/workflows",
        "~/.gemini/antigravity/global_workflows",
      ],
      agentDirs: [
        "~/.gemini/antigravity/agents",
        "~/.gemini/antigravity/global_agents",
      ],
      skillDirs: [
        "~/.gemini/antigravity/skills",
        "~/.gemini/antigravity/global_skills",
      ],
      commandDirs: ["~/.gemini/commands"],
      ruleFilesByPriority: ["~/.gemini/GEMINI.md"],
    },
    detectorPaths: [".agent", ".agent/workflows", ".agent/rules/GEMINI.md"],
    legacyDetectorPaths: [],
    ruleHintName: "GEMINI.md",
  },
  codex: {
    id: "codex",
    label: "Codex",
    installsCustomAgents: false,
    project: {
      workflowDirs: [".agents/workflows"],
      agentDirs: [".agents/agents"],
      skillDirs: [".agents/skills"],
      ruleFilesByPriority: ["AGENTS.md"],
    },
    global: {
      workflowDirs: ["~/.agents/workflows"],
      agentDirs: ["~/.agents/agents"],
      skillDirs: ["~/.agents/skills"],
      ruleFilesByPriority: ["~/.codex/AGENTS.md"],
    },
    detectorPaths: [
      ".agents",
      ".agents/workflows",
      ".agents/skills",
      "AGENTS.md",
    ],
    legacyDetectorPaths: [".codex/skills"],
    ruleHintName: "AGENTS.md",
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    installsCustomAgents: true,
    project: {
      workflowDirs: [".github/copilot/workflows"],
      agentDirs: [".github/agents"],
      skillDirs: [".github/skills"],
      promptDirs: [".github/prompts"],
      ruleFilesByPriority: [".github/copilot-instructions.md", "AGENTS.md"],
    },
    global: {
      workflowDirs: ["~/.copilot/workflows"],
      agentDirs: ["~/.copilot/agents"],
      skillDirs: ["~/.copilot/skills"],
      promptDirs: ["~/.copilot/prompts"],
      ruleFilesByPriority: ["~/.copilot/copilot-instructions.md"],
    },
    detectorPaths: [
      ".github/agents",
      ".github/skills",
      ".github/copilot-instructions.md",
      ".github/instructions",
      "AGENTS.md",
    ],
    legacyDetectorPaths: [],
    ruleHintName: "AGENTS.md or .github/copilot-instructions.md",
  },
};

const PLATFORM_IDS = Object.keys(WORKFLOW_PROFILES);
const CODEX_WORKFLOW_SKILL_PREFIX = "workflow-";
const CODEX_AGENT_SKILL_PREFIX = "agent-";
const TERMINAL_VERIFIER_PROVIDERS = ["codex", "gemini"];
const DEFAULT_TERMINAL_VERIFIER = "codex";
const POSTMAN_API_KEY_ENV_VAR = "POSTMAN_API_KEY";
const POSTMAN_MODE_TO_URL = Object.freeze({
  minimal: "https://mcp.postman.com/minimal",
  code: "https://mcp.postman.com/code",
  full: "https://mcp.postman.com/mcp",
});
const POSTMAN_VALID_MODES = new Set(Object.keys(POSTMAN_MODE_TO_URL));
const DEFAULT_POSTMAN_MODE = "minimal";
const DEFAULT_POSTMAN_INSTALL_MODE = "full";
const DEFAULT_POSTMAN_CONFIG_MODE = "minimal";
const POSTMAN_MCP_URL = "https://mcp.postman.com/minimal";
const POSTMAN_API_BASE_URL = "https://api.getpostman.com";
const POSTMAN_SKILL_ID = "postman";
const FOUNDRY_MCP_SERVER_ID = "cubis-foundry";
const FOUNDRY_MCP_COMMAND = "cbx";
const STITCH_SKILL_ID = "stitch";
const STITCH_MCP_SERVER_ID = "StitchMCP";
const STITCH_API_KEY_ENV_VAR = "STITCH_API_KEY";
const STITCH_MCP_URL = "https://stitch.googleapis.com/mcp";
const POSTMAN_WORKSPACE_MANUAL_CHOICE = "__postman_workspace_manual__";
const CBX_CONFIG_FILENAME = "cbx_config.json";
const CBX_CREDENTIALS_ENV_FILENAME = "credentials.env";
const LEGACY_POSTMAN_CONFIG_FILENAME = ["postman", "setting.json"].join("_");
const DEFAULT_CREDENTIAL_PROFILE_NAME = "default";
const RESERVED_CREDENTIAL_PROFILE_NAMES = new Set(["all"]);
const CREDENTIAL_SERVICES = new Set(["postman", "stitch"]);
const MCP_RUNTIMES = new Set(["docker", "local"]);
const MCP_FALLBACKS = new Set(["local", "fail", "skip"]);
const MCP_UPDATE_POLICIES = new Set(["pinned", "latest"]);
const DEFAULT_MCP_RUNTIME = "docker";
const DEFAULT_MCP_FALLBACK = "local";
const DEFAULT_MCP_UPDATE_POLICY = "pinned";
const DEFAULT_MCP_DOCKER_IMAGE = `ghcr.io/cubetiq/foundry-mcp:${CLI_VERSION}`;
const DEFAULT_MCP_DOCKER_CONTAINER_NAME = "cbx-mcp";
const DEFAULT_MCP_DOCKER_HOST_PORT = 3310;
const MCP_DOCKER_CONTAINER_PORT = 3100;
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
  ".cbx",
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
  [".ps1", "PowerShell"],
]);
const TECH_PACKAGE_PREVIEW_LIMIT = 40;
const TECH_JS_FRAMEWORK_SIGNALS = [
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
  ["cypress", "Cypress"],
];
const TECH_DART_FRAMEWORK_SIGNALS = [
  ["flutter_riverpod", "Riverpod"],
  ["riverpod", "Riverpod"],
  ["go_router", "go_router"],
  ["dio", "Dio"],
  ["freezed", "Freezed"],
  ["bloc", "BLoC"],
];
const TECH_GO_FRAMEWORK_SIGNALS = [
  ["github.com/gofiber/fiber/v2", "Go Fiber"],
  ["github.com/gin-gonic/gin", "Gin"],
  ["github.com/labstack/echo/v4", "Echo"],
  ["github.com/go-chi/chi/v5", "Chi"],
];
const TECH_PYTHON_FRAMEWORK_SIGNALS = [
  ["fastapi", "FastAPI"],
  ["django", "Django"],
  ["flask", "Flask"],
  ["pydantic", "Pydantic"],
  ["sqlalchemy", "SQLAlchemy"],
];
const TECH_RUST_FRAMEWORK_SIGNALS = [
  ["axum", "Axum"],
  ["actix-web", "Actix Web"],
  ["rocket", "Rocket"],
  ["tokio", "Tokio"],
];
const SKILL_PROFILES = new Set(["core", "web-backend", "full"]);
const REMOVE_ALL_SCOPES = new Set(["project", "global", "all"]);
const CATALOG_FILES = Object.freeze({
  core: path.join("catalogs", "core.json"),
  "web-backend": path.join("catalogs", "web-backend.json"),
});

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
  github: "copilot",
};

const TERMINAL_VERIFIER_ALIASES = {
  codex: "codex",
  openai: "codex",
  "openai-codex": "codex",
  gemini: "gemini",
  "gemini-cli": "gemini",
};

function normalizePlatform(value) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return PLATFORM_ALIASES[normalized] || normalized;
}

function normalizeScope(value) {
  if (!value) return "project";
  const normalized = value.trim().toLowerCase();
  if (normalized === "project" || normalized === "global") return normalized;
  throw new Error(
    `Unknown scope '${value}'. Use --scope project or --scope global.`,
  );
}

function normalizeRemoveAllScope(value) {
  const normalized = String(value || "all")
    .trim()
    .toLowerCase();
  if (REMOVE_ALL_SCOPES.has(normalized)) return normalized;
  if (normalized === "workspace") return "project";
  if (normalized === "user") return "global";
  throw new Error(
    `Unknown scope '${value}'. Use --scope project, --scope global, or --scope all.`,
  );
}

function normalizeSkillProfile(value) {
  const normalized = String(value || DEFAULT_SKILL_PROFILE)
    .trim()
    .toLowerCase();
  if (!SKILL_PROFILES.has(normalized)) {
    throw new Error(
      `Unknown skill profile '${value}'. Use core|web-backend|full.`,
    );
  }
  return normalized;
}

function resolveWorkflowSkillInstallOptions(options) {
  const allSkills = Boolean(options.allSkills);
  let skillProfile = normalizeSkillProfile(
    options.skillProfile || DEFAULT_SKILL_PROFILE,
  );

  if (allSkills) {
    skillProfile = "full";
  }

  return {
    skillProfile,
  };
}

function normalizeMcpScope(value, fallback = "project") {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "project" || normalized === "workspace") return "project";
  if (normalized === "global" || normalized === "user") return "global";
  throw new Error(
    `Unknown MCP scope '${value}'. Use project/workspace or global/user.`,
  );
}

function normalizeMcpRuntime(value, fallback = DEFAULT_MCP_RUNTIME) {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MCP_RUNTIMES.has(normalized)) {
    throw new Error(`Unknown MCP runtime '${value}'. Use docker|local.`);
  }
  return normalized;
}

function normalizePostmanMode(value, fallback = DEFAULT_POSTMAN_MODE) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (!POSTMAN_VALID_MODES.has(normalized)) {
    throw new Error(`Unknown Postman mode '${value}'. Use minimal|code|full.`);
  }
  return normalized;
}

function resolvePostmanMcpUrlForMode(mode) {
  const normalized = normalizePostmanMode(mode, DEFAULT_POSTMAN_MODE);
  return POSTMAN_MODE_TO_URL[normalized] || POSTMAN_MCP_URL;
}

function resolvePostmanModeFromUrl(url, fallback = DEFAULT_POSTMAN_MODE) {
  const normalizedUrl = String(url || "").trim();
  for (const [mode, modeUrl] of Object.entries(POSTMAN_MODE_TO_URL)) {
    if (normalizedUrl === modeUrl) return mode;
  }
  return normalizePostmanMode(fallback, DEFAULT_POSTMAN_MODE);
}

function normalizeMcpFallback(value, fallback = DEFAULT_MCP_FALLBACK) {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MCP_FALLBACKS.has(normalized)) {
    throw new Error(`Unknown MCP fallback '${value}'. Use local|fail|skip.`);
  }
  return normalized;
}

function normalizeMcpUpdatePolicy(value, fallback = DEFAULT_MCP_UPDATE_POLICY) {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MCP_UPDATE_POLICIES.has(normalized)) {
    throw new Error(`Unknown MCP update policy '${value}'. Use pinned|latest.`);
  }
  return normalized;
}

function normalizePortNumber(value, fallback = DEFAULT_MCP_DOCKER_HOST_PORT) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(
      `Invalid port '${value}'. Use an integer between 1 and 65535.`,
    );
  }
  return parsed;
}

function parseDockerPsRow(line) {
  const [id, image, status, names] = String(line || "").split("\t");
  if (!id || !names) return null;
  return {
    id: id.trim(),
    image: String(image || "").trim(),
    status: String(status || "").trim(),
    name: String(names || "").trim(),
  };
}

async function checkDockerAvailable({ cwd = process.cwd() } = {}) {
  try {
    await execFile("docker", ["ps"], { cwd });
    return true;
  } catch {
    return false;
  }
}

async function checkDockerImageExists({ image, cwd = process.cwd() }) {
  try {
    await execFile("docker", ["image", "inspect", image], { cwd });
    return true;
  } catch {
    return false;
  }
}

async function pullMcpDockerImage({ image, cwd = process.cwd() }) {
  await execFile("docker", ["pull", image], { cwd });
  return {
    action: "pulled",
    image,
  };
}

async function buildMcpDockerImageLocal({ image, cwd = process.cwd() }) {
  const dockerContext = path.join(packageRoot(), "mcp");
  if (!(await pathExists(path.join(dockerContext, "Dockerfile")))) {
    throw new Error(`MCP Dockerfile is missing at ${dockerContext}.`);
  }
  await execFile("docker", ["build", "-t", image, dockerContext], { cwd });
  return {
    action: "built-local",
    image,
    context: dockerContext,
  };
}

async function ensureMcpDockerImage({
  image,
  updatePolicy,
  buildLocal = false,
  cwd = process.cwd(),
}) {
  if (buildLocal) {
    return buildMcpDockerImageLocal({ image, cwd });
  }
  if (updatePolicy === "pinned") {
    const exists = await checkDockerImageExists({ image, cwd });
    if (exists) {
      return {
        action: "already-present",
        image,
      };
    }
  }
  return pullMcpDockerImage({ image, cwd });
}

async function inspectDockerContainerByName({ name, cwd = process.cwd() }) {
  try {
    const { stdout } = await execFile(
      "docker",
      [
        "ps",
        "-a",
        "--filter",
        `name=^/${name}$`,
        "--format",
        "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}",
      ],
      { cwd },
    );
    const row = String(stdout || "")
      .trim()
      .split(/\r?\n/)
      .map((line) => parseDockerPsRow(line))
      .find(Boolean);
    if (!row || row.name !== name) return null;
    return row;
  } catch {
    return null;
  }
}

async function resolveDockerContainerHostPort({
  name,
  containerPort = MCP_DOCKER_CONTAINER_PORT,
  cwd = process.cwd(),
}) {
  try {
    const { stdout } = await execFile(
      "docker",
      ["port", name, `${containerPort}/tcp`],
      { cwd },
    );
    const line = String(stdout || "")
      .trim()
      .split(/\r?\n/)[0];
    if (!line) return null;
    const match = line.match(/:(\d+)\s*$/);
    return match ? Number.parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

async function inspectDockerContainerMounts({ name, cwd = process.cwd() }) {
  try {
    const { stdout } = await execFile(
      "docker",
      ["inspect", "--format", "{{json .Mounts}}", name],
      { cwd },
    );
    const parsed = JSON.parse(String(stdout || "").trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPathInsideRoot(targetPath, rootPath) {
  const target = path.resolve(targetPath);
  const root = path.resolve(rootPath);
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
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

function normalizeCredentialProfileName(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function credentialProfileNameKey(value) {
  const normalized = normalizeCredentialProfileName(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeCredentialService(value, { allowAll = false } = {}) {
  if (!value) return allowAll ? "all" : "postman";
  const normalized = String(value).trim().toLowerCase();
  if (allowAll && normalized === "all") return "all";
  if (!CREDENTIAL_SERVICES.has(normalized)) {
    throw new Error(
      `Unknown credential service '${value}'. Use ${allowAll ? "postman|stitch|all" : "postman|stitch"}.`,
    );
  }
  return normalized;
}

function defaultEnvVarForCredentialService(service) {
  return service === "stitch"
    ? STITCH_API_KEY_ENV_VAR
    : POSTMAN_API_KEY_ENV_VAR;
}

function defaultMcpUrlForCredentialService(service) {
  return service === "stitch" ? STITCH_MCP_URL : POSTMAN_MCP_URL;
}

function isCredentialServiceEnvVar(value) {
  return (
    typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim())
  );
}

function normalizeCredentialProfileRecord(
  service,
  rawProfile,
  fallbackName = DEFAULT_CREDENTIAL_PROFILE_NAME,
) {
  const defaultEnvVar = defaultEnvVarForCredentialService(service);
  const source =
    rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
      ? rawProfile
      : {};
  const name = normalizeCredentialProfileName(source.name) || fallbackName;
  const envVarCandidate =
    normalizePostmanApiKey(source.apiKeyEnvVar) || defaultEnvVar;
  const apiKeyEnvVar = isCredentialServiceEnvVar(envVarCandidate)
    ? envVarCandidate
    : defaultEnvVar;
  const profile = {
    name,
    apiKey: null,
    apiKeyEnvVar,
  };
  if (service === "postman") {
    profile.workspaceId = normalizePostmanWorkspaceId(
      source.workspaceId ?? source.defaultWorkspaceId,
    );
  }
  return profile;
}

function dedupeCredentialProfiles(profiles) {
  const seen = new Set();
  const deduped = [];
  for (const profile of profiles) {
    const key = credentialProfileNameKey(profile?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(profile);
  }
  return deduped;
}

function storedCredentialSource(profile) {
  if (normalizePostmanApiKey(profile?.apiKey)) return "inline";
  if (normalizePostmanApiKey(profile?.apiKeyEnvVar)) return "env";
  return "unset";
}

function defaultState() {
  return {
    schemaVersion: 1,
    lastSelected: {
      platform: null,
      scope: "project",
    },
    targets: {},
  };
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function getAntigravityTerminalIntegrationDir(profilePaths) {
  return path.join(
    path.dirname(profilePaths.workflowsDir),
    "terminal-integration",
  );
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
        command: 'codex exec --skip-git-repo-check "{prompt}"',
      },
      gemini: {
        primaryCommand: 'gemini -p "{prompt}"',
        fallbackCommand: 'gemini --prompt "{prompt}"',
      },
    },
  };
}

function buildAntigravityTerminalIntegrationReadme({
  provider,
  configPath,
  scriptPsPath,
  scriptShPath,
}) {
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
    "If your selected CLI is missing, install it and rerun the command.",
  ].join("\n");
}

function buildAntigravityTerminalIntegrationPowerShellScript() {
  return [
    "param(",
    '  [string]$Prompt = "Review the latest completed Antigravity task. Focus on bugs, regressions, security risks, and missing tests."',
    ")",
    "",
    "Set-StrictMode -Version Latest",
    '$ErrorActionPreference = "Stop"',
    "",
    "$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path",
    '$configPath = Join-Path $scriptDir "config.json"',
    "",
    "if (-not (Test-Path $configPath)) {",
    '  Write-Error "Missing terminal integration config: $configPath"',
    "  exit 1",
    "}",
    "",
    "$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json",
    '$provider = "$($config.provider)".ToLowerInvariant()',
    "",
    'if ($provider -eq "codex") {',
    '  & codex exec --skip-git-repo-check "$Prompt"',
    "  exit $LASTEXITCODE",
    "}",
    "",
    'if ($provider -eq "gemini") {',
    '  & gemini -p "$Prompt"',
    "  if ($LASTEXITCODE -eq 0) {",
    "    exit 0",
    "  }",
    '  & gemini --prompt "$Prompt"',
    "  exit $LASTEXITCODE",
    "}",
    "",
    'Write-Error "Unsupported provider in config: $provider"',
    "exit 1",
    "",
  ].join("\n");
}

function buildAntigravityTerminalIntegrationBashScript() {
  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    'PROMPT="${1:-Review the latest completed Antigravity task. Focus on bugs, regressions, security risks, and missing tests.}"',
    'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
    'CONFIG_FILE="$SCRIPT_DIR/config.json"',
    "",
    'if [[ ! -f "$CONFIG_FILE" ]]; then',
    '  echo "Missing terminal integration config: $CONFIG_FILE" >&2',
    "  exit 1",
    "fi",
    "",
    "PROVIDER=\"$(node -e \"const fs=require('fs');const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(String(c.provider||'').toLowerCase());\" \"$CONFIG_FILE\")\"",
    "",
    'if [[ "$PROVIDER" == "codex" ]]; then',
    '  codex exec --skip-git-repo-check "$PROMPT"',
    "  exit $?",
    "fi",
    "",
    'if [[ "$PROVIDER" == "gemini" ]]; then',
    '  if gemini -p "$PROMPT"; then',
    "    exit 0",
    "  fi",
    '  gemini --prompt "$PROMPT"',
    "  exit $?",
    "fi",
    "",
    'echo "Unsupported provider in config: $PROVIDER" >&2',
    "exit 1",
    "",
  ].join("\n");
}

function buildAntigravityTerminalVerificationBlock({
  provider,
  powerShellScriptPath,
  bashScriptPath,
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
    "<!-- cbx:terminal:verification:end -->",
  ].join("\n");
}

function buildEngineeringRulesTemplate() {
  return [
    "# Engineering Rules",
    "",
    "These rules are the default for this project.",
    "",
    "<!-- cbx:engineering:rules:start version=2 -->",
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
    "## 3) SOLID, Used Pragmatically",
    "",
    "- SRP: each module/function has one clear responsibility.",
    "- OCP: extend behavior through composition when it prevents risky rewrites.",
    "- LSP: child implementations must preserve parent contract behavior.",
    "- ISP: prefer small focused interfaces over large catch-all contracts.",
    "- DIP: depend on stable abstractions at boundaries, not concrete implementation details.",
    "- Do not force SOLID patterns if they add ceremony without maintenance benefit.",
    "",
    "## 4) Precise Naming (One Look = Clear Intent)",
    "",
    "- Class names must say exactly what they represent.",
    "- Method names must say exactly what they do.",
    "- Boolean names must read as true/false facts: `isActive`, `hasError`, `canSubmit`.",
    "- Avoid vague suffixes like `Helper`, `Util`, `Manager` unless responsibility is narrow and explicit.",
    "",
    "## 5) Keep Functions and Classes Focused",
    "",
    "- One function should do one clear job.",
    "- One class should own one clear responsibility.",
    "- Split when a file mixes unrelated concerns (UI + networking + mapping in one place).",
    "- Prefer small composable units over inheritance-heavy designs.",
    "",
    "## 6) Platform Implementation Rules",
    "",
    "- Keep providers/services focused; do not let one unit fetch unrelated feature data.",
    "- Prevent duplicate network calls (cache or in-flight dedupe) when multiple views depend on the same data.",
    "- Route/build functions must not return placeholder content in production flows.",
    "",
    "## 7) PR / Review Checklist",
    "",
    "Before merge, confirm:",
    "",
    "- Naming is precise and intention-revealing.",
    "- No speculative abstraction was added.",
    "- Logic is simple enough for fast onboarding.",
    "- Lint/analyze/tests pass.",
    "",
    "## 8) Response Contract (Decision Log Required)",
    "",
    "- For planning/review/execution summaries, use a `Decision Log` structure.",
    "- Each decision entry should include: `Context`, `Decision`, `Rationale`, `Tradeoffs`, `Validation`.",
    "- Include a `Files Used` section with full absolute paths (not shorthand names).",
    "- Never hide key file paths behind aliases or abbreviated labels.",
    "",
    "## 9) Keep TECH.md Fresh",
    "",
    "- `TECH.md` is generated from current codebase reality.",
    "- Re-run `cbx rules tech-md --overwrite` after major stack or architecture changes.",
    "<!-- cbx:engineering:rules:end -->",
    "",
  ].join("\n");
}

function buildEngineeringRulesManagedBlock({
  platform,
  engineeringRulesFilePath,
  techMdFilePath,
  ruleFilePath,
}) {
  const engineeringRef = toPosixPath(path.resolve(engineeringRulesFilePath));
  const techRef = toPosixPath(path.resolve(techMdFilePath));
  const ruleRef = toPosixPath(path.resolve(ruleFilePath));

  return [
    `<!-- cbx:engineering:auto:start platform=${platform} version=1 -->`,
    "## Engineering Guardrails (auto-managed)",
    "Apply these before planning, coding, review, and release:",
    "",
    `- Required baseline: \`${engineeringRef}\``,
    `- Project tech map: \`${techRef}\``,
    `- Active platform rule file: \`${ruleRef}\``,
    "",
    "Hard policy:",
    "1. Start from product outcomes and ship the smallest valuable slice.",
    "2. Keep architecture simple (KISS) and avoid speculative work (YAGNI).",
    "3. Apply SOLID pragmatically to reduce change risk, not add ceremony.",
    "4. Use clear naming with focused responsibilities and explicit boundaries.",
    "5. Require validation evidence (lint/types/tests) before merge.",
    "6. Use Decision Log response style and include full absolute file paths in `Files Used`.",
    "",
    "<!-- cbx:engineering:auto:end -->",
  ].join("\n");
}

async function writeTextFile({
  targetPath,
  content,
  overwrite = false,
  dryRun = false,
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
    action: exists
      ? dryRun
        ? "would-replace"
        : "replaced"
      : dryRun
        ? "would-create"
        : "created",
    filePath: targetPath,
  };
}

function extractEngineeringRulesManagedBlock(template) {
  const match = String(template || "").match(
    /<!--\s*cbx:engineering:rules:start[\s\S]*?<!--\s*cbx:engineering:rules:end\s*-->/,
  );
  return match ? match[0] : template;
}

function isLikelyGeneratedEngineeringRules(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n");
  if (!normalized.includes("# Engineering Rules")) return false;
  return (
    normalized.includes("## 1) Build Only What Is Needed (YAGNI)") ||
    normalized.includes("## 1) Product-First Planning (PM Lens)") ||
    normalized.includes("<!-- cbx:engineering:rules:start")
  );
}

async function upsertEngineeringRulesFile({
  targetPath,
  template,
  overwrite = false,
  dryRun = false,
}) {
  const exists = await pathExists(targetPath);
  if (!exists) {
    return writeTextFile({
      targetPath,
      content: `${template}\n`,
      overwrite: true,
      dryRun,
    });
  }

  const original = await readFile(targetPath, "utf8");
  if (overwrite) {
    return writeTextFile({
      targetPath,
      content: `${template}\n`,
      overwrite: true,
      dryRun,
    });
  }

  const analysis = analyzeTaggedBlock(
    original,
    ENGINEERING_RULES_FILE_BLOCK_START_RE,
    ENGINEERING_RULES_FILE_BLOCK_END_RE,
  );

  if (analysis.status === "absent") {
    if (!isLikelyGeneratedEngineeringRules(original)) {
      return { action: dryRun ? "would-skip" : "skipped", filePath: targetPath };
    }
    return writeTextFile({
      targetPath,
      content: `${template}\n`,
      overwrite: true,
      dryRun,
    });
  }

  if (!analysis.range) {
    return { action: dryRun ? "would-skip" : "skipped", filePath: targetPath };
  }

  const managedBlock = extractEngineeringRulesManagedBlock(template);
  const nextContent = `${original.slice(0, analysis.range.start)}${managedBlock}${original.slice(analysis.range.end)}`;
  if (nextContent === original) {
    return { action: "unchanged", filePath: targetPath };
  }

  if (!dryRun) {
    await writeFile(targetPath, nextContent, "utf8");
  }

  return {
    action: dryRun ? "would-patch" : "patched",
    filePath: targetPath,
  };
}

async function upsertEngineeringRulesBlock({
  ruleFilePath,
  platform,
  engineeringRulesFilePath,
  techMdFilePath,
  dryRun = false,
}) {
  const block = buildEngineeringRulesManagedBlock({
    platform,
    engineeringRulesFilePath,
    techMdFilePath,
    ruleFilePath,
  });
  const exists = await pathExists(ruleFilePath);
  const warnings = [];
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeTaggedBlock(
    original,
    ENGINEERING_RULES_BLOCK_START_RE,
    ENGINEERING_RULES_BLOCK_END_RE,
  );

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    if (analysis.status === "multiple") {
      warnings.push(
        "Multiple engineering rule blocks found; patched the first valid block.",
      );
    }
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    warnings.push(
      "Malformed engineering rule block; appended a new canonical block.",
    );
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return { action: "unchanged", filePath: ruleFilePath, warnings };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return {
    action: exists
      ? dryRun
        ? "would-patch"
        : "patched"
      : dryRun
        ? "would-create"
        : "created",
    filePath: ruleFilePath,
    warnings,
  };
}

function normalizeTechPackageName(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value)
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase();
  return normalized || null;
}

function parseTomlSections(content) {
  const sections = new Map();
  let currentSection = "";
  sections.set(currentSection, []);

  for (const line of content.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!sections.has(currentSection)) sections.set(currentSection, []);
      continue;
    }
    sections.get(currentSection).push(line);
  }

  return sections;
}

function parsePubspecDependencyNames(content) {
  const packages = new Set();
  let currentSection = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (!line.startsWith(" ")) {
      const sectionMatch = trimmed.match(/^([a-zA-Z0-9_]+):\s*$/);
      if (!sectionMatch) {
        currentSection = null;
        continue;
      }
      currentSection = sectionMatch[1];
      continue;
    }

    if (
      currentSection !== "dependencies" &&
      currentSection !== "dev_dependencies"
    )
      continue;
    const depMatch = trimmed.match(/^([a-zA-Z0-9_]+):/);
    if (!depMatch) continue;
    const packageName = normalizeTechPackageName(depMatch[1]);
    if (!packageName || packageName === "flutter" || packageName === "sdk")
      continue;
    packages.add(packageName);
  }

  return packages;
}

function parseGoModuleNames(content) {
  const modules = new Set();
  let inRequireBlock = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;

    if (trimmed.startsWith("require (")) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && trimmed === ")") {
      inRequireBlock = false;
      continue;
    }

    if (inRequireBlock) {
      const moduleName = normalizeTechPackageName(trimmed.split(/\s+/)[0]);
      if (moduleName) modules.add(moduleName);
      continue;
    }

    if (trimmed.startsWith("require ")) {
      const moduleName = normalizeTechPackageName(
        trimmed.slice("require ".length).trim().split(/\s+/)[0],
      );
      if (moduleName) modules.add(moduleName);
    }
  }

  return modules;
}

function parseRequirementsPackageNames(content) {
  const packages = new Set();
  for (const rawLine of content.split(/\r?\n/)) {
    const withoutComment = rawLine.split("#")[0].trim();
    if (!withoutComment) continue;
    if (withoutComment.startsWith("-")) continue;

    const cleaned = withoutComment.split(";")[0].trim();
    const match = cleaned.match(/^([A-Za-z0-9_.-]+)/);
    if (!match) continue;
    const packageName = normalizeTechPackageName(match[1]);
    if (packageName) packages.add(packageName);
  }
  return packages;
}

function parsePyprojectPackageNames(content) {
  const packages = new Set();
  const sections = parseTomlSections(content);

  const projectSection = sections.get("project");
  if (projectSection) {
    const projectBody = projectSection.join("\n");
    const dependenciesArrayMatch = projectBody.match(
      /dependencies\s*=\s*\[([\s\S]*?)\]/m,
    );
    if (dependenciesArrayMatch) {
      const entries =
        dependenciesArrayMatch[1].match(/"([^"]+)"|'([^']+)'/g) || [];
      for (const entry of entries) {
        const normalizedEntry = normalizeTechPackageName(entry);
        if (!normalizedEntry) continue;
        const packageName = normalizeTechPackageName(
          normalizedEntry.split(/[<>=!~\s\[]/)[0],
        );
        if (packageName) packages.add(packageName);
      }
    }

    for (const line of projectSection) {
      const trimmed = line.trim();
      const optionalDepsMatch = trimmed.match(
        /^([A-Za-z0-9_.-]+)\s*=\s*\[\s*("([^"]+)"|'([^']+)')/,
      );
      if (!optionalDepsMatch) continue;
      const entry = optionalDepsMatch[3] || optionalDepsMatch[4];
      const packageName = normalizeTechPackageName(
        String(entry).split(/[<>=!~\s\[]/)[0],
      );
      if (packageName) packages.add(packageName);
    }
  }

  for (const [sectionName, lines] of sections.entries()) {
    const isPoetryDependencySection =
      sectionName === "tool.poetry.dependencies" ||
      /^tool\.poetry\.group\.[^.]+\.dependencies$/.test(sectionName);
    if (!isPoetryDependencySection) continue;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const depMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=/);
      if (!depMatch) continue;
      const packageName = normalizeTechPackageName(depMatch[1]);
      if (!packageName || packageName === "python") continue;
      packages.add(packageName);
    }
  }

  return packages;
}

function parseCargoCrateNames(content) {
  const crates = new Set();
  const sections = parseTomlSections(content);

  for (const [sectionName, lines] of sections.entries()) {
    const isDependencySection =
      sectionName === "dependencies" ||
      sectionName === "dev-dependencies" ||
      sectionName === "build-dependencies" ||
      sectionName === "workspace.dependencies" ||
      /\.dependencies$/.test(sectionName) ||
      /\.dev-dependencies$/.test(sectionName) ||
      /\.build-dependencies$/.test(sectionName);
    if (!isDependencySection) continue;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const depMatch = trimmed.match(/^([A-Za-z0-9_-]+)\s*=/);
      if (!depMatch) continue;
      const crateName = normalizeTechPackageName(depMatch[1]);
      if (crateName) crates.add(crateName);
    }
  }

  return crates;
}

function addFrameworkSignalsFromPackages({ packages, frameworks, signals }) {
  for (const [signal, frameworkLabel] of signals) {
    if (packages.has(signal.toLowerCase())) {
      frameworks.add(frameworkLabel);
    }
  }
}

function toSortedArray(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function collectChildDirs(relativeFiles, prefix) {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const dirs = new Set();
  for (const filePath of relativeFiles) {
    if (!filePath.startsWith(normalizedPrefix)) continue;
    const remainder = filePath.slice(normalizedPrefix.length);
    if (!remainder) continue;
    const firstSegment = remainder.split("/")[0];
    if (!firstSegment || firstSegment.includes(".")) continue;
    dirs.add(firstSegment);
  }
  return [...dirs].sort((a, b) => a.localeCompare(b));
}

function hasPathPrefix(relativeFiles, prefix) {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return relativeFiles.some((filePath) => filePath.startsWith(normalizedPrefix));
}

function inferArchitectureForApp(rootPath, relativeFiles, relativeDirs) {
  const rootPrefix = rootPath === "." ? "" : `${rootPath}/`;
  const structurePaths = [...new Set([...relativeFiles, ...relativeDirs])];
  const appStructurePaths = structurePaths.filter((entryPath) =>
    entryPath.startsWith(rootPrefix),
  );
  const appFiles = relativeFiles.filter((filePath) => filePath.startsWith(rootPrefix));
  const rel = (p) => (rootPath === "." ? p : `${rootPath}/${p}`);
  const architectureSignals = [];
  const structureHints = [];

  const hasLibCore = hasPathPrefix(appStructurePaths, rel("lib/core"));
  const hasLibFeatures = hasPathPrefix(appStructurePaths, rel("lib/features"));
  const hasSrcCore = hasPathPrefix(appStructurePaths, rel("src/core"));
  const hasSrcFeatures = hasPathPrefix(appStructurePaths, rel("src/features"));

  if ((hasLibCore && hasLibFeatures) || (hasSrcCore && hasSrcFeatures)) {
    architectureSignals.push("feature-first modular architecture");
  }

  const hasCleanLib = [
    rel("lib/domain"),
    rel("lib/data"),
    rel("lib/presentation"),
  ].every((prefix) => hasPathPrefix(appStructurePaths, prefix));
  const hasCleanSrc = [
    rel("src/domain"),
    rel("src/data"),
    rel("src/presentation"),
  ].every((prefix) => hasPathPrefix(appStructurePaths, prefix));
  if (hasCleanLib || hasCleanSrc) {
    architectureSignals.push("Clean Architecture (domain/data/presentation)");
  }

  const hasHexagonal = [
    rel("src/domain"),
    rel("src/application"),
    rel("src/infrastructure"),
  ].every((prefix) => hasPathPrefix(appStructurePaths, prefix));
  if (hasHexagonal) {
    architectureSignals.push(
      "hexagonal / ports-and-adapters (domain/application/infrastructure)",
    );
  }

  const hasMvc = [
    rel("src/controllers"),
    rel("src/models"),
    rel("src/views"),
  ].every((prefix) => hasPathPrefix(appStructurePaths, prefix));
  if (hasMvc) {
    architectureSignals.push("MVC");
  }

  const hasMvvm =
    (hasPathPrefix(appStructurePaths, rel("lib/viewmodels")) ||
      hasPathPrefix(appStructurePaths, rel("src/viewmodels")) ||
      appFiles.some((filePath) => /viewmodel/i.test(filePath))) &&
    (hasPathPrefix(appStructurePaths, rel("lib/views")) ||
      hasPathPrefix(appStructurePaths, rel("src/views")) ||
      hasPathPrefix(appStructurePaths, rel("lib/screens")) ||
      hasPathPrefix(appStructurePaths, rel("src/screens")));
  if (hasMvvm) {
    architectureSignals.push("MVVM");
  }

  if (hasPathPrefix(appStructurePaths, rel("src/modules"))) {
    architectureSignals.push("Nest-style module architecture");
  }

  if (hasLibCore && hasLibFeatures) {
    const coreModules = collectChildDirs(appStructurePaths, rel("lib/core"));
    const featureModules = collectChildDirs(appStructurePaths, rel("lib/features"));
    const featurePreview = featureModules.slice(0, 8).join(", ");
    const remainingFeatureCount = Math.max(0, featureModules.length - 8);
    structureHints.push("- `lib/core/` present for shared/core concerns.");
    if (coreModules.length > 0) {
      structureHints.push(`- Core modules: ${coreModules.join(", ")}.`);
    }
    if (featureModules.length > 0) {
      structureHints.push(
        `- Feature modules: ${featurePreview}${remainingFeatureCount > 0 ? ` (+${remainingFeatureCount} more)` : ""}.`,
      );
    }
    if (appFiles.some((filePath) => filePath === rel("lib/main.dart"))) {
      structureHints.push("- `lib/main.dart` present as app entrypoint.");
    }
  } else if (hasSrcFeatures) {
    const featureModules = collectChildDirs(appStructurePaths, rel("src/features"));
    if (featureModules.length > 0) {
      const featurePreview = featureModules.slice(0, 8).join(", ");
      const remainingFeatureCount = Math.max(0, featureModules.length - 8);
      structureHints.push(
        `- \`src/features/\` modules: ${featurePreview}${remainingFeatureCount > 0 ? ` (+${remainingFeatureCount} more)` : ""}.`,
      );
    }
  }

  return {
    rootPath,
    architectureSignals,
    structureHints,
  };
}

function inferArchitectureByApp(relativeFiles, relativeDirs) {
  const appRoots = new Set(["."]);
  for (const relPath of relativeFiles) {
    const segments = relPath.split("/");
    if (segments.length >= 3 && (segments[0] === "apps" || segments[0] === "packages")) {
      appRoots.add(`${segments[0]}/${segments[1]}`);
      continue;
    }
    if (
      segments.length >= 2 &&
      (segments[1] === "pubspec.yaml" || segments[1] === "package.json")
    ) {
      appRoots.add(segments[0]);
    }
  }

  const sortedRoots = [...appRoots]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 20);
  return sortedRoots.map((rootPath) =>
    inferArchitectureForApp(rootPath, relativeFiles, relativeDirs),
  );
}

async function collectTechSnapshot(rootDir) {
  const discoveredFiles = [];
  const discoveredDirs = [];
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
        discoveredDirs.push(fullPath);
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
  const packageJsonFiles = [];
  const pubspecFiles = [];
  const goModFiles = [];
  const pyprojectFiles = [];
  const requirementsFiles = [];
  const cargoTomlFiles = [];

  for (const fullPath of discoveredFiles) {
    const rel = toPosixPath(path.relative(rootDir, fullPath));
    const firstDir = rel.split("/")[0];
    if (firstDir && firstDir !== rel) topDirs.add(firstDir);

    const extension = path.extname(fullPath).toLowerCase();
    const language = TECH_LANGUAGE_BY_EXTENSION.get(extension);
    if (language) {
      languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
    }

    const baseName = path.basename(fullPath).toLowerCase();
    if (baseName === "package.json") packageJsonFiles.push(fullPath);
    if (baseName === "pubspec.yaml") pubspecFiles.push(fullPath);
    if (baseName === "go.mod") goModFiles.push(fullPath);
    if (baseName === "pyproject.toml") pyprojectFiles.push(fullPath);
    if (baseName === "cargo.toml") cargoTomlFiles.push(fullPath);
    if (
      baseName === "requirements.txt" ||
      /^requirements(?:[-_.].+)?\.txt$/.test(baseName)
    ) {
      requirementsFiles.push(fullPath);
    }
  }

  const relativeFiles = discoveredFiles.map((fullPath) =>
    toPosixPath(path.relative(rootDir, fullPath)),
  );
  const relativeDirs = discoveredDirs.map((fullPath) =>
    toPosixPath(path.relative(rootDir, fullPath)),
  );

  const fileExists = (name) => existsSync(path.join(rootDir, name));
  const rootPackageJsonPath = path.join(rootDir, "package.json");
  const packageScripts = new Map();
  const frameworks = new Set();
  const lockfiles = [];
  const javascriptPackages = new Set();
  const dartPackages = new Set();
  const goModules = new Set();
  const pythonPackages = new Set();
  const rustCrates = new Set();

  if (fileExists("bun.lock") || fileExists("bun.lockb")) lockfiles.push("bun");
  if (fileExists("pnpm-lock.yaml")) lockfiles.push("pnpm");
  if (fileExists("yarn.lock")) lockfiles.push("yarn");
  if (fileExists("package-lock.json")) lockfiles.push("npm");
  if (fileExists("poetry.lock")) lockfiles.push("poetry");
  if (fileExists("Cargo.lock")) lockfiles.push("cargo");
  if (fileExists("go.sum")) lockfiles.push("go");
  if (fileExists("pubspec.lock")) lockfiles.push("pub");

  if (pubspecFiles.length > 0) frameworks.add("Flutter");
  if (goModFiles.length > 0) frameworks.add("Go Modules");
  if (cargoTomlFiles.length > 0) frameworks.add("Rust Cargo");
  if (requirementsFiles.length > 0 || pyprojectFiles.length > 0)
    frameworks.add("Python");

  for (const packageJsonFile of packageJsonFiles) {
    try {
      const parsed = JSON.parse(await readFile(packageJsonFile, "utf8"));
      const deps = {
        ...(parsed.dependencies || {}),
        ...(parsed.devDependencies || {}),
        ...(parsed.peerDependencies || {}),
        ...(parsed.optionalDependencies || {}),
      };
      for (const depName of Object.keys(deps)) {
        const normalized = normalizeTechPackageName(depName);
        if (normalized) javascriptPackages.add(normalized);
      }

      if (path.resolve(packageJsonFile) === path.resolve(rootPackageJsonPath)) {
        const scripts =
          parsed.scripts && typeof parsed.scripts === "object"
            ? parsed.scripts
            : {};
        for (const [name, command] of Object.entries(scripts)) {
          if (typeof command !== "string") continue;
          packageScripts.set(name, command);
        }
      }
    } catch {
      // ignore malformed package.json
    }
  }

  for (const pubspecFile of pubspecFiles) {
    try {
      const content = await readFile(pubspecFile, "utf8");
      for (const packageName of parsePubspecDependencyNames(content)) {
        dartPackages.add(packageName);
      }
    } catch {
      // ignore malformed pubspec.yaml
    }
  }

  for (const goModFile of goModFiles) {
    try {
      const content = await readFile(goModFile, "utf8");
      for (const moduleName of parseGoModuleNames(content)) {
        goModules.add(moduleName);
      }
    } catch {
      // ignore unreadable go.mod
    }
  }

  for (const pyprojectFile of pyprojectFiles) {
    try {
      const content = await readFile(pyprojectFile, "utf8");
      for (const packageName of parsePyprojectPackageNames(content)) {
        pythonPackages.add(packageName);
      }
    } catch {
      // ignore malformed pyproject.toml
    }
  }

  for (const requirementsFile of requirementsFiles) {
    try {
      const content = await readFile(requirementsFile, "utf8");
      for (const packageName of parseRequirementsPackageNames(content)) {
        pythonPackages.add(packageName);
      }
    } catch {
      // ignore unreadable requirements file
    }
  }

  for (const cargoTomlFile of cargoTomlFiles) {
    try {
      const content = await readFile(cargoTomlFile, "utf8");
      for (const crateName of parseCargoCrateNames(content)) {
        rustCrates.add(crateName);
      }
    } catch {
      // ignore malformed Cargo.toml
    }
  }

  addFrameworkSignalsFromPackages({
    packages: javascriptPackages,
    frameworks,
    signals: TECH_JS_FRAMEWORK_SIGNALS,
  });
  addFrameworkSignalsFromPackages({
    packages: dartPackages,
    frameworks,
    signals: TECH_DART_FRAMEWORK_SIGNALS,
  });
  addFrameworkSignalsFromPackages({
    packages: goModules,
    frameworks,
    signals: TECH_GO_FRAMEWORK_SIGNALS,
  });
  addFrameworkSignalsFromPackages({
    packages: pythonPackages,
    frameworks,
    signals: TECH_PYTHON_FRAMEWORK_SIGNALS,
  });
  addFrameworkSignalsFromPackages({
    packages: rustCrates,
    frameworks,
    signals: TECH_RUST_FRAMEWORK_SIGNALS,
  });

  const sortedLanguages = [...languageCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const sortedFrameworks = [...frameworks].sort((a, b) => a.localeCompare(b));
  const sortedTopDirs = [...topDirs]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12);
  const sortedLockfiles = [...new Set(lockfiles)];

  const preferredScriptNames = [
    "lint",
    "analyze",
    "typecheck",
    "test",
    "test:unit",
    "test:e2e",
    "build",
    "dev",
  ];
  const keyScripts = [];
  for (const name of preferredScriptNames) {
    if (!packageScripts.has(name)) continue;
    keyScripts.push({ name, command: packageScripts.get(name) });
  }

  const mcpSignals = [];
  const mcpSignalPaths = [
    "cbx_config.json",
    ".cbx/mcp",
    ".vscode/mcp.json",
    ".gemini/settings.json",
    ".copilot/mcp-config.json",
  ];
  for (const signalPath of mcpSignalPaths) {
    if (fileExists(signalPath)) {
      mcpSignals.push(signalPath);
    }
  }

  // --- Entry-point detection ---
  const entryPoints = [];
  try {
    const rootPkg = JSON.parse(await readFile(rootPackageJsonPath, "utf8"));
    if (rootPkg.bin) {
      const bins =
        typeof rootPkg.bin === "string"
          ? { [rootPkg.name || "bin"]: rootPkg.bin }
          : rootPkg.bin;
      for (const [name, target] of Object.entries(bins)) {
        entryPoints.push(`bin: ${name} → ${target}`);
      }
    }
    if (rootPkg.main) entryPoints.push(`main: ${rootPkg.main}`);
    if (rootPkg.module) entryPoints.push(`module: ${rootPkg.module}`);
    if (rootPkg.exports) entryPoints.push("package exports field present");
  } catch {
    // no root package.json or malformed
  }
  if (fileExists("Dockerfile") || fileExists("mcp/Dockerfile")) {
    try {
      const dockerfilePath = fileExists("Dockerfile")
        ? path.join(rootDir, "Dockerfile")
        : path.join(rootDir, "mcp/Dockerfile");
      const dockerContent = await readFile(dockerfilePath, "utf8");
      const entrypointMatch = dockerContent.match(
        /^(?:ENTRYPOINT|CMD)\s+(.+)$/m,
      );
      if (entrypointMatch) {
        entryPoints.push(`docker: ${entrypointMatch[0].slice(0, 80).trim()}`);
      }
    } catch {
      // ignore
    }
  }

  // --- README excerpt (first 3 non-empty lines for project overview) ---
  let readmeExcerpt = "";
  for (const readmeName of ["README.md", "readme.md", "Readme.md"]) {
    if (fileExists(readmeName)) {
      try {
        const readmeContent = await readFile(
          path.join(rootDir, readmeName),
          "utf8",
        );
        const readmeLines = readmeContent.split("\n").filter((l) => {
          const trimmed = l.trim();
          return trimmed.length > 0 && !trimmed.startsWith("![");
        });
        readmeExcerpt = readmeLines.slice(0, 3).join("\n");
      } catch {
        // ignore
      }
      break;
    }
  }

  // --- Monorepo detection ---
  const isMonorepo = packageJsonFiles.length > 1;
  let workspaceRoots = [];
  if (isMonorepo) {
    try {
      const rootPkg = JSON.parse(await readFile(rootPackageJsonPath, "utf8"));
      if (Array.isArray(rootPkg.workspaces)) {
        workspaceRoots = rootPkg.workspaces;
      } else if (rootPkg.workspaces?.packages) {
        workspaceRoots = rootPkg.workspaces.packages;
      }
    } catch {
      // ignore
    }
  }

  // --- MCP server detection (is this project itself an MCP server?) ---
  const isMcpServer =
    javascriptPackages.has("@modelcontextprotocol/sdk") ||
    dartPackages.has("mcp_dart") ||
    pythonPackages.has("mcp");

  // --- CI/CD detection ---
  const cicdSignals = [];
  const ciPaths = [
    [".github/workflows", "GitHub Actions"],
    ["Jenkinsfile", "Jenkins"],
    [".gitlab-ci.yml", "GitLab CI"],
    [".circleci", "CircleCI"],
    ["azure-pipelines.yml", "Azure Pipelines"],
    [".travis.yml", "Travis CI"],
    ["bitbucket-pipelines.yml", "Bitbucket Pipelines"],
    [".buildkite", "Buildkite"],
    ["vercel.json", "Vercel"],
    ["netlify.toml", "Netlify"],
    ["fly.toml", "Fly.io"],
    ["render.yaml", "Render"],
    ["railway.json", "Railway"],
  ];
  for (const [ciPath, ciName] of ciPaths) {
    if (fileExists(ciPath)) cicdSignals.push(ciName);
  }

  // --- Directory purpose annotations ---
  const DIR_PURPOSES = new Map([
    ["src", "source"],
    ["lib", "library"],
    ["bin", "executables"],
    ["scripts", "automation"],
    ["test", "tests"],
    ["tests", "tests"],
    ["__tests__", "tests"],
    ["spec", "tests"],
    ["docs", "documentation"],
    ["doc", "documentation"],
    ["mcp", "MCP server"],
    ["api", "API layer"],
    ["app", "application"],
    ["pages", "routes (pages)"],
    ["routes", "routes"],
    ["components", "UI components"],
    ["public", "static assets"],
    ["static", "static assets"],
    ["assets", "assets"],
    ["config", "configuration"],
    ["generated", "generated code"],
    ["migrations", "DB migrations"],
    ["prisma", "Prisma schema"],
    ["workflows", "CI/CD or automation"],
    ["packages", "monorepo packages"],
    ["apps", "monorepo apps"],
    ["tools", "tooling"],
    ["utils", "utilities"],
    ["helpers", "helpers"],
    ["middleware", "middleware"],
    ["services", "services"],
    ["models", "data models"],
    ["controllers", "controllers"],
    ["views", "views"],
    ["templates", "templates"],
    ["fixtures", "test fixtures"],
    ["e2e", "end-to-end tests"],
    ["integration", "integration tests"],
  ]);
  const annotatedDirs = sortedTopDirs.map((dir) => ({
    name: dir,
    purpose: DIR_PURPOSES.get(dir.toLowerCase()) || null,
  }));
  const architectureByApp = inferArchitectureByApp(relativeFiles, relativeDirs);

  return {
    rootDir,
    scannedFiles: discoveredFiles.length,
    languages: sortedLanguages,
    frameworks: sortedFrameworks,
    lockfiles: sortedLockfiles,
    topDirs: sortedTopDirs,
    annotatedDirs,
    keyScripts,
    packageSignals: {
      javascript: toSortedArray(javascriptPackages),
      dart: toSortedArray(dartPackages),
      go: toSortedArray(goModules),
      python: toSortedArray(pythonPackages),
      rust: toSortedArray(rustCrates),
    },
    mcpSignals: toSortedArray(mcpSignals),
    entryPoints,
    readmeExcerpt,
    isMonorepo,
    workspaceRoots,
    isMcpServer,
    cicdSignals,
    architectureByApp,
  };
}

function appendTechPackageSection(lines, heading, packages) {
  lines.push(`### ${heading}`);
  if (!packages || packages.length === 0) {
    lines.push("- None detected.");
  } else {
    const preview = packages.slice(0, TECH_PACKAGE_PREVIEW_LIMIT);
    for (const packageName of preview) {
      lines.push(`- \`${packageName}\``);
    }
    if (packages.length > TECH_PACKAGE_PREVIEW_LIMIT) {
      lines.push(
        `- ... (+${packages.length - TECH_PACKAGE_PREVIEW_LIMIT} more)`,
      );
    }
  }
  lines.push("");
}

function inferRecommendedSkills(snapshot) {
  const recommended = new Set();
  const hasFramework = (name) => snapshot.frameworks.includes(name);
  const hasJsPkg = (name) => snapshot.packageSignals.javascript.includes(name);

  if (hasFramework("Next.js")) {
    recommended.add("nextjs-developer");
    recommended.add("react-expert");
    recommended.add("typescript-pro");
  }
  if (hasFramework("React")) {
    recommended.add("react-expert");
  }
  if (hasFramework("NestJS")) {
    recommended.add("nestjs-expert");
    recommended.add("nodejs-best-practices");
  }
  if (hasFramework("FastAPI")) {
    recommended.add("fastapi-expert");
    recommended.add("python-pro");
  }
  if (hasFramework("Go Modules")) {
    recommended.add("golang-pro");
  }
  if (hasFramework("Rust Cargo")) {
    recommended.add("rust-pro");
  }
  if (hasFramework("Flutter")) {
    recommended.add("flutter-expert");
    recommended.add("mobile-design");
  }

  // Language-level signals when no framework match already added the skill
  const hasLanguage = (lang) => snapshot.languages.some(([l]) => l === lang);
  if (hasLanguage("TypeScript") && !recommended.has("typescript-pro")) {
    recommended.add("typescript-pro");
  }
  if (
    (hasLanguage("JavaScript") || hasLanguage("TypeScript")) &&
    !recommended.has("nodejs-best-practices") &&
    !recommended.has("nextjs-developer") &&
    !recommended.has("nestjs-expert")
  ) {
    recommended.add("nodejs-best-practices");
  }
  if (hasLanguage("Python") && !recommended.has("python-pro")) {
    recommended.add("python-pro");
  }

  // MCP server detection
  if (snapshot.isMcpServer) {
    recommended.add("api-patterns");
  }

  // Docker / DevOps signals
  if (
    snapshot.cicdSignals.length > 0 ||
    snapshot.entryPoints.some((ep) => ep.startsWith("docker:"))
  ) {
    recommended.add("devops-engineer");
  }

  // Testing signals
  if (hasFramework("Playwright")) {
    recommended.add("playwright-expert");
  }
  if (hasFramework("Vitest") || hasFramework("Jest")) {
    recommended.add("test-master");
  }

  // Database signals
  if (
    hasFramework("Prisma") ||
    hasFramework("Drizzle ORM") ||
    hasFramework("TypeORM") ||
    hasFramework("Mongoose") ||
    hasFramework("SQLAlchemy")
  ) {
    recommended.add("database-skills");
  }

  if (recommended.size === 0) {
    recommended.add("clean-code");
    recommended.add("plan-writing");
  }

  return [...recommended].sort((a, b) => a.localeCompare(b));
}

function inferContextBudget(snapshot) {
  const webBackendSignals = new Set([
    "Next.js",
    "React",
    "NestJS",
    "FastAPI",
    "Go Modules",
    "Rust Cargo",
  ]);
  const webBackendDetected = snapshot.frameworks.some((framework) =>
    webBackendSignals.has(framework),
  );
  const hasMcp = snapshot.isMcpServer || snapshot.mcpSignals.length > 0;
  const suggestedProfile =
    webBackendDetected || hasMcp ? "web-backend" : "core";
  return {
    suggestedProfile,
  };
}

function inferTechnicalConstraints(snapshot, contextBudget) {
  const constraints = [];

  constraints.push(
    `Context profile baseline: \`${contextBudget.suggestedProfile}\` (keep task scope aligned to this default unless a wider profile is explicitly needed).`,
  );

  if (snapshot.isMonorepo) {
    constraints.push(
      "Treat each workspace/package boundary as a contract; avoid hidden cross-workspace coupling.",
    );
  }

  if (snapshot.mcpSignals.length > 0 || snapshot.isMcpServer) {
    constraints.push(
      "MCP surfaces are present; keep tool contracts and MCP config paths stable across updates.",
    );
  }

  if (snapshot.lockfiles.length > 1) {
    constraints.push(
      `Multiple lockfile/package-manager signals detected (${snapshot.lockfiles.join(", ")}); avoid accidental lockfile churn.`,
    );
  }

  if (snapshot.cicdSignals.length > 0) {
    constraints.push(
      `Delivery pipeline signals detected (${snapshot.cicdSignals.join(", ")}); preserve CI compatibility for build/test flows.`,
    );
  }

  if (constraints.length === 1) {
    constraints.push(
      "No strict platform constraints auto-detected; default to ENGINEERING_RULES.md and existing repository conventions.",
    );
  }

  return constraints;
}

function buildTechMd(snapshot, { compact = false } = {}) {
  const lines = [];
  const recommendedSkills = inferRecommendedSkills(snapshot);
  const contextBudget = inferContextBudget(snapshot);
  const technicalConstraints = inferTechnicalConstraints(
    snapshot,
    contextBudget,
  );

  lines.push("# TECH.md");
  lines.push("");
  lines.push(`Generated by cbx on ${new Date().toISOString()}.`);
  lines.push(`Root: \`${toPosixPath(snapshot.rootDir)}\``);
  lines.push(
    `Files scanned: ${snapshot.scannedFiles} (max ${TECH_SCAN_MAX_FILES}).`,
  );
  lines.push(`Mode: ${compact ? "compact" : "full"}.`);
  lines.push("");

  lines.push("## Steering Intent");
  lines.push(
    "- This file follows a Kiro-style steering shape: technology stack, project structure, tooling/workflows, and technical constraints.",
  );
  lines.push(
    "- Keep this file factual and codebase-derived; avoid aspirational or speculative architecture notes.",
  );
  lines.push(
    "- Use this as the default context hand-off for agents before deep implementation work.",
  );
  lines.push("");

  // --- Project Overview ---
  lines.push("## Project Overview");
  if (snapshot.readmeExcerpt) {
    lines.push("");
    lines.push(snapshot.readmeExcerpt);
  }
  lines.push("");
  if (snapshot.isMonorepo) {
    lines.push("**Monorepo** — multiple package.json files detected.");
    if (snapshot.workspaceRoots.length > 0) {
      lines.push(
        `Workspace roots: ${snapshot.workspaceRoots.map((r) => `\`${r}\``).join(", ")}`,
      );
    }
    lines.push("");
  }
  if (snapshot.isMcpServer) {
    lines.push(
      "**MCP Server** — this project exposes tools via the Model Context Protocol.",
    );
    lines.push("");
  }

  lines.push("## Technology Stack");
  if (snapshot.frameworks.length === 0) {
    lines.push("- Framework/runtime signals: none detected.");
  } else {
    lines.push(`- Framework/runtime signals: ${snapshot.frameworks.join(", ")}.`);
  }
  if (snapshot.languages.length === 0) {
    lines.push("- Primary languages: none detected.");
  } else {
    const languagePreview = snapshot.languages
      .slice(0, 5)
      .map(([language, count]) => `${language} (${count})`)
      .join(", ");
    lines.push(`- Primary languages: ${languagePreview}.`);
  }
  if (snapshot.lockfiles.length === 0) {
    lines.push("- Lockfile/package manager signals: none detected.");
  } else {
    lines.push(
      `- Lockfile/package manager signals: ${snapshot.lockfiles.join(", ")}.`,
    );
  }
  if (snapshot.cicdSignals.length === 0) {
    lines.push("- CI/CD platform signals: none detected.");
  } else {
    lines.push(`- CI/CD platform signals: ${snapshot.cicdSignals.join(", ")}.`);
  }
  lines.push("");

  lines.push("## Project Structure");
  if (snapshot.isMonorepo) {
    lines.push("- Repository shape: monorepo.");
    if (snapshot.workspaceRoots.length > 0) {
      lines.push(
        `- Workspace globs: ${snapshot.workspaceRoots.map((r) => `\`${r}\``).join(", ")}`,
      );
    }
  } else {
    lines.push("- Repository shape: single-project workspace.");
  }
  if (snapshot.entryPoints.length > 0) {
    lines.push(`- Entry points detected: ${snapshot.entryPoints.length}.`);
  } else {
    lines.push("- Entry points detected: none.");
  }
  if (snapshot.annotatedDirs && snapshot.annotatedDirs.length > 0) {
    const topDirPreview = snapshot.annotatedDirs
      .slice(0, 10)
      .map(({ name, purpose }) => (purpose ? `${name} (${purpose})` : name))
      .join(", ");
    lines.push(`- Top directories: ${topDirPreview}.`);
  } else if (snapshot.topDirs.length > 0) {
    lines.push(`- Top directories: ${snapshot.topDirs.slice(0, 10).join(", ")}.`);
  } else {
    lines.push("- Top directories: none detected.");
  }
  lines.push("");

  lines.push("## Architecture Patterns (Per App)");
  if (!snapshot.architectureByApp || snapshot.architectureByApp.length === 0) {
    lines.push("- No app-level architecture signals detected.");
  } else {
    for (const appArchitecture of snapshot.architectureByApp) {
      const appRootLabel =
        appArchitecture.rootPath === "."
          ? ". (repository root)"
          : appArchitecture.rootPath;
      lines.push(`### ${appRootLabel}`);
      if (appArchitecture.architectureSignals.length === 0) {
        lines.push("- Inferred style: not enough signals to classify.");
      } else {
        lines.push(
          `- Inferred style: ${appArchitecture.architectureSignals.join(", ")}.`,
        );
      }
      if (appArchitecture.structureHints.length > 0) {
        for (const hint of appArchitecture.structureHints) {
          lines.push(hint);
        }
      }
      lines.push("");
    }
  }

  lines.push("## Technical Constraints and Preferences");
  for (const constraint of technicalConstraints) {
    lines.push(`- ${constraint}`);
  }
  lines.push("");

  lines.push("## Tooling and Workflows");
  if (snapshot.keyScripts.length === 0) {
    lines.push("- Key npm scripts: none detected.");
  } else {
    const keyScriptPreview = snapshot.keyScripts
      .slice(0, 8)
      .map((script) => `\`${script.name}\``)
      .join(", ");
    lines.push(`- Key npm scripts: ${keyScriptPreview}.`);
  }
  if (snapshot.mcpSignals.length === 0) {
    lines.push("- MCP config signals: none detected.");
  } else {
    lines.push(
      `- MCP config signals: ${snapshot.mcpSignals.map((signal) => `\`${signal}\``).join(", ")}.`,
    );
  }
  lines.push("");

  if (snapshot.mcpSignals.length > 0 || snapshot.isMcpServer) {
    lines.push("## MCP Security Baseline");
    lines.push(
      "- Treat all MCP servers as third-party code. Verify source and trust level before enabling.",
    );
    lines.push(
      "- Never commit secrets in MCP config files. Use environment variables and least-privilege tokens.",
    );
    lines.push(
      "- Keep approved environment variable lists explicit so MCP servers cannot read arbitrary env values.",
    );
    lines.push(
      "- Prefer workspace-scoped MCP configs to isolate credentials and blast radius per project.",
    );
    lines.push(
      "- Restrict config file permissions (`chmod 600`) for user/workspace MCP settings when available.",
    );
    lines.push(
      "- Auto-approve only low-risk read-only tools from trusted servers; review all write-capable tool calls.",
    );
    lines.push(
      "- Regularly audit MCP logs/tool usage and remove stale auto-approvals.",
    );
    lines.push(
      "- Incident response baseline: disable suspect server, revoke tokens, audit external service activity.",
    );
    lines.push("");
  }

  // --- Architecture: Entry Points ---
  if (snapshot.entryPoints.length > 0) {
    lines.push("## Entry Points");
    for (const ep of snapshot.entryPoints) {
      lines.push(`- ${ep}`);
    }
    lines.push("");
  }

  // --- Stack Snapshot ---
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

  lines.push("## Recommended Skills");
  for (const skillId of recommendedSkills) {
    lines.push(`- \`${skillId}\``);
  }
  lines.push("");

  // --- CI/CD & Deployment ---
  if (snapshot.cicdSignals.length > 0) {
    lines.push("## CI/CD & Deployment");
    for (const signal of snapshot.cicdSignals) {
      lines.push(`- ${signal}`);
    }
    lines.push("");
  }

  lines.push("## MCP Footprint");
  if (!snapshot.mcpSignals || snapshot.mcpSignals.length === 0) {
    lines.push("- No MCP configuration signals detected in workspace.");
  } else {
    for (const signal of snapshot.mcpSignals) {
      lines.push(`- \`${signal}\``);
    }
  }
  lines.push("");

  lines.push("## Context Budget Notes");
  lines.push(
    `- Suggested install profile: \`${contextBudget.suggestedProfile}\``,
  );
  lines.push(
    "- Use `--all-skills` only when task scope clearly requires full catalog breadth.",
  );
  lines.push("");

  if (!compact) {
    lines.push("## Package Signals");
    appendTechPackageSection(
      lines,
      "JavaScript / TypeScript (package.json)",
      snapshot.packageSignals.javascript,
    );
    appendTechPackageSection(
      lines,
      "Dart / Flutter (pubspec.yaml)",
      snapshot.packageSignals.dart,
    );
    appendTechPackageSection(
      lines,
      "Go Modules (go.mod)",
      snapshot.packageSignals.go,
    );
    appendTechPackageSection(
      lines,
      "Python Packages (requirements / pyproject)",
      snapshot.packageSignals.python,
    );
    appendTechPackageSection(
      lines,
      "Rust Crates (Cargo.toml)",
      snapshot.packageSignals.rust,
    );

    lines.push("## Tooling and Lockfiles");
    if (snapshot.lockfiles.length === 0) {
      lines.push("- No lockfiles detected.");
    } else {
      lines.push(`- ${snapshot.lockfiles.join(", ")}`);
    }
    lines.push("");

    lines.push("## Development Commands");
    if (snapshot.keyScripts.length === 0) {
      lines.push("- No common scripts detected.");
    } else {
      for (const script of snapshot.keyScripts) {
        lines.push(`- \`${script.name}\`: \`${script.command}\``);
      }
    }
    lines.push("");

    lines.push("## Codebase Map");
    if (snapshot.annotatedDirs && snapshot.annotatedDirs.length > 0) {
      for (const { name, purpose } of snapshot.annotatedDirs) {
        const suffix = purpose ? ` — ${purpose}` : "";
        lines.push(`- \`${name}/\`${suffix}`);
      }
    } else if (snapshot.topDirs.length === 0) {
      lines.push("- No significant top-level directories detected.");
    } else {
      for (const dir of snapshot.topDirs) {
        lines.push(`- \`${dir}/\``);
      }
    }
    lines.push("");
  }

  lines.push("## Maintenance");
  lines.push(
    `- Re-run \`cbx rules tech-md --overwrite${compact ? " --compact" : ""}\` after major stack or architecture changes.`,
  );
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

async function resolveWorkspaceRuleFileForGlobalScope(
  platform,
  cwd = process.cwd(),
) {
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
  dryRun = false,
}) {
  if (scope !== "global") return null;

  const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(
    platform,
    cwd,
  );
  if (!workspaceRuleFile) return null;

  const profile = WORKFLOW_PROFILES[platform];
  if (!profile) return null;
  const globalRuleFile = expandPath(profile.global.ruleFilesByPriority[0], cwd);
  if (path.resolve(workspaceRuleFile) === path.resolve(globalRuleFile))
    return null;

  const patchResult = await upsertManagedRuleBlock(
    workspaceRuleFile,
    platform,
    workflows,
    dryRun,
  );
  return {
    workspaceRuleFile,
    globalRuleFile,
    patchResult,
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
          parsed.lastSelected &&
          typeof parsed.lastSelected.platform === "string"
            ? parsed.lastSelected.platform
            : null,
        scope:
          parsed.lastSelected && parsed.lastSelected.scope === "global"
            ? "global"
            : "project",
      },
      targets:
        parsed.targets && typeof parsed.targets === "object"
          ? parsed.targets
          : {},
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

async function recordBundleInstallState({
  scope,
  platform,
  bundleId,
  artifacts,
  ruleFilePath,
  cwd,
}) {
  const state = await readState(scope, cwd);
  const key = targetStateKey(platform, scope);
  if (!state.targets[key]) {
    state.targets[key] = {
      updatedAt: null,
      ruleFile: null,
      bundles: {},
    };
  }

  state.lastSelected = { platform, scope };
  state.targets[key].updatedAt = new Date().toISOString();
  state.targets[key].ruleFile = ruleFilePath ? toPosixPath(ruleFilePath) : null;
  state.targets[key].bundles[bundleId] = {
    installedAt: new Date().toISOString(),
    workflows: artifacts.workflows.map(toPosixPath),
    agents: artifacts.agents.map(toPosixPath),
    skills: artifacts.skills.map(toPosixPath),
    commands: (artifacts.commands || []).map(toPosixPath),
    prompts: (artifacts.prompts || []).map(toPosixPath),
  };

  await writeState(scope, state, cwd);
}

async function recordBundleRemovalState({
  scope,
  platform,
  bundleId,
  ruleFilePath,
  cwd,
}) {
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
  const workflowDirs = Array.isArray(cfg.workflowDirs) ? cfg.workflowDirs : [];
  const agentDirs = Array.isArray(cfg.agentDirs) ? cfg.agentDirs : [];
  const skillDirs = Array.isArray(cfg.skillDirs) ? cfg.skillDirs : [];
  const commandDirs = Array.isArray(cfg.commandDirs) ? cfg.commandDirs : [];
  const promptDirs = Array.isArray(cfg.promptDirs) ? cfg.promptDirs : [];

  const resolvePreferredDir = async (dirs) => {
    if (dirs.length === 0) return null;
    const expanded = dirs.map((dirPath) => expandPath(dirPath, cwd));
    for (const candidate of expanded) {
      if (await pathExists(candidate)) return candidate;
    }
    return expanded[0];
  };

  return {
    workflowsDir: await resolvePreferredDir(workflowDirs),
    agentsDir: await resolvePreferredDir(agentDirs),
    skillsDir: await resolvePreferredDir(skillDirs),
    commandsDir: commandDirs[0] ? expandPath(commandDirs[0], cwd) : null,
    promptsDir: promptDirs[0] ? expandPath(promptDirs[0], cwd) : null,
    ruleFilesByPriority: cfg.ruleFilesByPriority.map((filePath) =>
      expandPath(filePath, cwd),
    ),
  };
}

function expandUniquePaths(pathList, cwd = process.cwd()) {
  const seen = new Set();
  const output = [];
  for (const value of pathList || []) {
    const normalized = String(value || "").trim();
    if (!normalized) continue;
    const expanded = expandPath(normalized, cwd);
    const key = path.resolve(expanded);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(expanded);
  }
  return output;
}

function resolveProfilePathCandidates(profileId, scope, cwd = process.cwd()) {
  const profile = WORKFLOW_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown platform '${profileId}'.`);
  const cfg = profile[scope];
  return {
    workflowsDirs: expandUniquePaths(cfg.workflowDirs, cwd),
    agentsDirs: expandUniquePaths(cfg.agentDirs, cwd),
    skillsDirs: expandUniquePaths(cfg.skillDirs, cwd),
    commandsDirs: expandUniquePaths(cfg.commandDirs, cwd),
    promptsDirs: expandUniquePaths(cfg.promptDirs, cwd),
    ruleFilesByPriority: expandUniquePaths(cfg.ruleFilesByPriority, cwd),
  };
}

function resolveLegacySkillDirsForCleanup(platform, scope, cwd = process.cwd()) {
  if (platform !== "codex") return [];
  if (scope === "global") {
    return [path.join(os.homedir(), ".codex", "skills")];
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return [path.join(workspaceRoot, ".codex", "skills")];
}

async function resolveArtifactProfilePaths(
  profileId,
  scope,
  cwd = process.cwd(),
) {
  const scopedPaths = await resolveProfilePaths(profileId, scope, cwd);
  if (scope !== "global") return scopedPaths;

  // Global install mode is skills-only. Keep workflows/agents in workspace scope.
  const workspacePaths = await resolveProfilePaths(profileId, "project", cwd);
  return {
    ...scopedPaths,
    workflowsDir: workspacePaths.workflowsDir,
    agentsDir: workspacePaths.agentsDir,
    commandsDir: workspacePaths.commandsDir ?? scopedPaths.commandsDir,
    promptsDir: workspacePaths.promptsDir ?? scopedPaths.promptsDir,
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
  const manifestPath = path.join(
    agentAssetsRoot(),
    "workflows",
    bundleId,
    "manifest.json",
  );
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Bundle '${bundleId}' not found at ${manifestPath}`);
  }

  const raw = await readFile(manifestPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid manifest JSON for '${bundleId}': ${error.message}`,
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid manifest for '${bundleId}': expected object.`);
  }

  return parsed;
}

function extractSkillIdFromIndexPath(indexPathValue) {
  const raw = String(indexPathValue || "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/");
  const marker = "/skills/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return null;
  const remainder = normalized.slice(markerIndex + marker.length);
  const [skillId] = remainder.split("/");
  const normalizedSkillId = String(skillId || "").trim();
  return normalizedSkillId || null;
}

async function resolveTopLevelSkillIdsFromIndex() {
  const skillsRoot = workflowSkillsRoot();
  const indexPath = path.join(skillsRoot, "skills_index.json");
  if (!(await pathExists(indexPath))) return [];

  let parsed;
  try {
    parsed = JSON.parse(await readFile(indexPath, "utf8"));
  } catch {
    parsed = [];
  }
  const entries = Array.isArray(parsed) ? parsed : [];

  const candidates = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const byName = normalizeCredentialProfileName(entry.name);
    if (byName) candidates.push(byName);
    const byPath = extractSkillIdFromIndexPath(entry.path);
    if (byPath) candidates.push(byPath);
  }

  const topLevelIds = [];
  const seen = new Set();
  for (const rawCandidate of candidates) {
    const skillId = String(rawCandidate || "").trim();
    if (!skillId || skillId.startsWith(".")) continue;
    if (skillId === ".system" || skillId.startsWith(".system/")) continue;
    const key = skillId.toLowerCase();
    if (seen.has(key)) continue;

    const skillDir = path.join(skillsRoot, skillId);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillDir)) || !(await pathExists(skillFile)))
      continue;

    seen.add(key);
    topLevelIds.push(skillId);
  }

  topLevelIds.sort((a, b) => a.localeCompare(b));
  return topLevelIds;
}

async function readSkillCatalogIds(catalogPath) {
  if (!(await pathExists(catalogPath))) return [];
  let parsed;
  try {
    parsed = JSON.parse(await readFile(catalogPath, "utf8"));
  } catch {
    return [];
  }

  const values = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.skills)
      ? parsed.skills
      : [];
  const ids = [];
  const seen = new Set();
  for (const value of values) {
    const id = String(value || "").trim();
    if (!id || id.startsWith(".")) continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
  }
  return ids;
}

async function listTopLevelSkillIdsFromRoot(rootPath) {
  if (!(await pathExists(rootPath))) return [];
  const entries = await readdir(rootPath, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillId = entry.name;
    const skillFile = path.join(rootPath, skillId, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;
    out.push(skillId);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

async function resolveSkillSourceDirectory(skillId) {
  const normalized = String(skillId || "").trim();
  if (!normalized) return null;
  const candidate = path.join(workflowSkillsRoot(), normalized);
  const skillFile = path.join(candidate, "SKILL.md");
  if ((await pathExists(candidate)) && (await pathExists(skillFile))) {
    return candidate;
  }
  return null;
}

async function resolveCatalogSkillIds({ profile }) {
  const workflowCatalogPath = path.join(
    workflowSkillsRoot(),
    CATALOG_FILES[profile] || "",
  );
  const workflowCatalogIds = await readSkillCatalogIds(workflowCatalogPath);
  const workflowProfileIds =
    workflowCatalogIds.length > 0
      ? workflowCatalogIds
      : profile === "full"
        ? await listTopLevelSkillIdsFromRoot(workflowSkillsRoot())
        : [];

  return workflowProfileIds;
}

async function resolveInstallSkillIds({
  platformSpec,
  extraSkillIds = [],
  skillProfile = DEFAULT_SKILL_PROFILE,
}) {
  const fallbackManifestSkillIds = Array.isArray(platformSpec.skills)
    ? platformSpec.skills
    : [];
  const catalogSelectedIds = await resolveCatalogSkillIds({
    profile: normalizeSkillProfile(skillProfile),
  });

  let selected =
    catalogSelectedIds.length > 0
      ? catalogSelectedIds
      : fallbackManifestSkillIds;
  if (selected.length === 0) {
    const indexedSkillIds = await resolveTopLevelSkillIdsFromIndex();
    selected = indexedSkillIds;
  }
  if (
    Array.isArray(platformSpec.skillAllowList) &&
    platformSpec.skillAllowList.length > 0
  ) {
    const allow = new Set(
      platformSpec.skillAllowList.map((item) => String(item).toLowerCase()),
    );
    selected = selected.filter((skillId) =>
      allow.has(String(skillId).toLowerCase()),
    );
  }
  if (
    Array.isArray(platformSpec.skillBlockList) &&
    platformSpec.skillBlockList.length > 0
  ) {
    const blocked = new Set(
      platformSpec.skillBlockList.map((item) => String(item).toLowerCase()),
    );
    selected = selected.filter(
      (skillId) => !blocked.has(String(skillId).toLowerCase()),
    );
  }

  return unique([...selected, ...extraSkillIds.filter(Boolean)]);
}

async function chooseBundle(bundleOption) {
  const bundleIds = await listBundleIds();
  if (bundleIds.length === 0) {
    throw new Error("No workflow bundles found in local catalog.");
  }

  if (bundleOption) {
    if (!bundleIds.includes(bundleOption)) {
      throw new Error(
        `Unknown bundle '${bundleOption}'. Run 'cbx workflows platforms' and docs for options.`,
      );
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
    choices: bundleIds.map((id) => ({ name: id, value: id })),
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
      throw new Error(
        `Unknown platform '${optionValue}'. Use 'cbx workflows platforms'.`,
      );
    }
    return normalized;
  }

  const candidates = await detectPlatformCandidates(cwd);
  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    const state = await readState(scope, cwd);
    if (
      state.lastSelected.platform &&
      candidates.includes(state.lastSelected.platform)
    ) {
      return state.lastSelected.platform;
    }

    if (!process.stdin.isTTY) {
      throw new Error(
        `Multiple platforms detected (${candidates.join(", ")}). Use --platform.`,
      );
    }

    return select({
      message: "Multiple platforms detected. Select active platform:",
      choices: candidates.map((id) => ({
        name: `${WORKFLOW_PROFILES[id].label} (${id})`,
        value: id,
      })),
    });
  }

  const state = await readState(scope, cwd);
  if (
    state.lastSelected.platform &&
    WORKFLOW_PROFILES[state.lastSelected.platform]
  ) {
    return state.lastSelected.platform;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Missing --platform in non-interactive mode.");
  }

  return select({
    message: "Select platform:",
    choices: PLATFORM_IDS.map((id) => ({
      name: `${WORKFLOW_PROFILES[id].label} (${id})`,
      value: id,
    })),
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
    body: markdown.slice(match[0].length),
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
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
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

  const cleanedFrontmatter = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys,
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
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
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

  const cleanedFrontmatter = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys,
  };
}

function extractFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return stripQuotes(match[1]);
}

function extractFrontmatterArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(
    new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"),
  );
  if (bracketMatch) {
    return unique(parseInlineArray(bracketMatch[1]));
  }

  const singleLine = frontmatter.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"),
  );
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
  if (!sourceBody || !Array.isArray(agentIds) || agentIds.length === 0)
    return normalizeCodexWrapperMentions(sourceBody);

  let rewritten = sourceBody;
  const sortedAgentIds = unique(agentIds.filter(Boolean)).sort(
    (a, b) => b.length - a.length,
  );

  for (const agentId of sortedAgentIds) {
    const agentPattern = new RegExp(
      `(^|[^A-Za-z0-9_-])@${escapeRegExp(agentId)}(?=$|[^A-Za-z0-9_-])`,
      "g",
    );
    rewritten = rewritten.replace(
      agentPattern,
      (_match, prefix) => `${prefix}$${CODEX_AGENT_SKILL_PREFIX}${agentId}`,
    );
  }

  return normalizeCodexWrapperMentions(rewritten);
}

function rewriteCodexAgentSkillReferences(sourceBody) {
  if (!sourceBody) return sourceBody;
  // Agent source files live under platforms/*/agents, but wrapper skills live
  // under .agents/skills/agent-*. Rebase ../skills/<id> links accordingly.
  const rebased = sourceBody.replace(/\(\.\.\/skills\//g, "(../");
  return normalizeCodexWrapperMentions(rebased);
}

function normalizeCodexWrapperMentions(sourceBody) {
  if (!sourceBody) return sourceBody;
  return sourceBody.replace(
    /`\$(workflow|agent)-([A-Za-z0-9_-]+|\*)`/g,
    (_match, kind, id) => `$${kind}-${id}`,
  );
}

async function parseWorkflowMetadata(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(raw);
  const id = path.basename(filePath, path.extname(filePath));
  const command = extractFrontmatterValue(frontmatter, "command") || `/${id}`;
  const description =
    extractFrontmatterValue(frontmatter, "description") ||
    extractFallbackDescription(body);
  const heading = extractHeading(body) || id;
  const triggers = unique([
    ...extractFrontmatterArray(frontmatter, "triggers"),
    ...extractFrontmatterArray(frontmatter, "keywords"),
  ]).slice(0, 8);

  return {
    id,
    command,
    name: heading,
    description,
    triggers,
    path: filePath,
  };
}

async function parseAgentMetadata(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(raw);
  const id = normalizeMarkdownId(path.basename(filePath));
  const name = extractFrontmatterValue(frontmatter, "name") || id;
  const description =
    extractFrontmatterValue(frontmatter, "description") ||
    extractFallbackDescription(body);
  const skills = extractFrontmatterArray(frontmatter, "skills").slice(0, 12);

  return {
    id,
    name,
    description,
    skills,
    path: filePath,
    body: body.trim(),
  };
}

function buildCodexWorkflowWrapperSkillMarkdown(wrapperSkillId, workflow) {
  const description = `Callable Codex wrapper for ${workflow.command}: ${workflow.description}`;
  const sourceBody =
    workflow.body?.trim() || "No source workflow content found.";

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
    "",
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
    "",
  ].join("\n");
}

async function writeGeneratedSkillArtifact({
  destinationDir,
  content,
  overwrite,
  dryRun = false,
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
    return {
      action: exists ? "would-replace" : "would-install",
      path: destinationDir,
    };
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
  dryRun = false,
}) {
  const installed = [];
  const skipped = [];
  const artifacts = [];
  const generated = [];
  const codexAgentIds = (platformSpec.agents || []).map((fileName) =>
    normalizeMarkdownId(path.basename(fileName)),
  );

  for (const workflowFile of platformSpec.workflows || []) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    if (!(await pathExists(source))) {
      throw new Error(
        `Missing workflow source file for wrapper generation: ${source}`,
      );
    }

    const metadata = await parseWorkflowMetadata(source);
    const raw = await readFile(source, "utf8");
    const sourceBody = extractFrontmatter(raw).body.trim();
    const rewrittenBody = rewriteCodexWorkflowAgentReferences(
      sourceBody,
      codexAgentIds,
    );
    const wrapperSkillId = `${CODEX_WORKFLOW_SKILL_PREFIX}${metadata.id}`;
    const destinationDir = path.join(skillsDir, wrapperSkillId);
    const content = buildCodexWorkflowWrapperSkillMarkdown(wrapperSkillId, {
      ...metadata,
      body: rewrittenBody,
    });

    const result = await writeGeneratedSkillArtifact({
      destinationDir,
      content,
      overwrite,
      dryRun,
    });

    artifacts.push(destinationDir);
    generated.push({
      kind: "workflow",
      id: metadata.id,
      skillId: wrapperSkillId,
    });
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destinationDir);
    else installed.push(destinationDir);
  }

  for (const agentFile of platformSpec.agents || []) {
    const source = path.join(platformRoot, "agents", agentFile);
    if (!(await pathExists(source))) {
      throw new Error(
        `Missing agent source file for wrapper generation: ${source}`,
      );
    }

    const metadata = await parseAgentMetadata(source);
    const rewrittenBody = rewriteCodexAgentSkillReferences(metadata.body);
    const wrapperSkillId = `${CODEX_AGENT_SKILL_PREFIX}${metadata.id}`;
    const destinationDir = path.join(skillsDir, wrapperSkillId);
    const content = buildCodexAgentWrapperSkillMarkdown(wrapperSkillId, {
      ...metadata,
      body: rewrittenBody,
    });

    const result = await writeGeneratedSkillArtifact({
      destinationDir,
      content,
      overwrite,
      dryRun,
    });

    artifacts.push(destinationDir);
    generated.push({ kind: "agent", id: metadata.id, skillId: wrapperSkillId });
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destinationDir);
    else installed.push(destinationDir);
  }

  return {
    installed,
    skipped,
    artifacts,
    generated,
  };
}

async function resolvePlatformAgentSkillDependencies({
  platformRoot,
  platformSpec,
}) {
  const dependencyIds = [];

  for (const agentFile of platformSpec.agents || []) {
    const source = path.join(platformRoot, "agents", agentFile);
    if (!(await pathExists(source))) continue;
    const metadata = await parseAgentMetadata(source);
    dependencyIds.push(...metadata.skills);
  }

  return unique(dependencyIds.filter(Boolean));
}

async function collectInstalledWorkflows(
  profileId,
  scope,
  cwd = process.cwd(),
) {
  // Global install mode keeps workflows/agents in workspace paths.
  // Index using artifact-aware paths so sync-rules reflects installed workflows.
  const profilePaths = await resolveArtifactProfilePaths(profileId, scope, cwd);
  if (!(await pathExists(profilePaths.workflowsDir))) return [];

  const entries = await readdir(profilePaths.workflowsDir, {
    withFileTypes: true,
  });
  const workflows = [];

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".md") ||
      entry.name.startsWith(".")
    )
      continue;
    const filePath = path.join(profilePaths.workflowsDir, entry.name);
    workflows.push(await parseWorkflowMetadata(filePath));
  }

  return workflows.sort((a, b) => a.command.localeCompare(b.command));
}

function buildManagedWorkflowBlock(platformId, workflows) {
  const lines = [];
  lines.push(
    `<!-- cbx:workflows:auto:start platform=${platformId} version=1 -->`,
  );
  lines.push("## CBX Workflow Routing (auto-managed)");
  if (platformId === "codex") {
    lines.push("Use Codex callable wrappers:");
    lines.push("- Workflows: $workflow-<name>");
    lines.push("- Agents: $agent-<name>");
    lines.push(
      "- Use raw $workflow-* / $agent-* tokens (no backticks) so Codex can render icons.",
    );
    lines.push("");

    if (workflows.length === 0) {
      lines.push("- No installed workflows found yet.");
    } else {
      for (const workflow of workflows) {
        const triggerPreview = workflow.triggers.slice(0, 2).join(", ");
        const hint = triggerPreview ? ` (${triggerPreview})` : "";
        lines.push(
          `- ${workflow.command} -> $${CODEX_WORKFLOW_SKILL_PREFIX}${workflow.id}${hint}`,
        );
      }
    }

    lines.push("");
    lines.push("Selection policy:");
    lines.push("1. If user names a $workflow-*, use it directly.");
    lines.push("2. Else map intent to one primary workflow.");
    lines.push(
      "3. Use $agent-* wrappers only when role specialization is needed.",
    );
    lines.push("");
    lines.push("<!-- cbx:workflows:auto:end -->");
    return lines.join("\n");
  }

  lines.push(
    "Use the following workflows proactively when task intent matches:",
  );
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
  lines.push(
    "3. Prefer one primary workflow; reference others only when needed.",
  );
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
    const endMatch = ends.find(
      (candidate) => candidate.index > startMatch.index,
    );
    if (endMatch) {
      range = {
        start: startMatch.index,
        end: endMatch.index + endMatch[0].length,
      };
      break;
    }
  }

  if (!range) {
    return {
      status: "malformed",
      starts: starts.length,
      ends: ends.length,
      range: null,
    };
  }

  if (starts.length === 1 && ends.length === 1) {
    return { status: "valid", starts: 1, ends: 1, range };
  }

  return {
    status: "multiple",
    starts: starts.length,
    ends: ends.length,
    range,
  };
}

function analyzeManagedBlock(content) {
  return analyzeTaggedBlock(
    content,
    MANAGED_BLOCK_START_RE,
    MANAGED_BLOCK_END_RE,
  );
}

function analyzeTerminalVerificationBlock(content) {
  return analyzeTaggedBlock(
    content,
    TERMINAL_VERIFICATION_BLOCK_START_RE,
    TERMINAL_VERIFICATION_BLOCK_END_RE,
  );
}

async function resolveRuleFilePath(profileId, scope, cwd = process.cwd()) {
  const profilePaths = await resolveProfilePaths(profileId, scope, cwd);

  for (const ruleFilePath of profilePaths.ruleFilesByPriority) {
    if (await pathExists(ruleFilePath)) return ruleFilePath;
  }

  return profilePaths.ruleFilesByPriority[0] || null;
}

async function upsertManagedRuleBlock(
  ruleFilePath,
  platformId,
  workflows,
  dryRun = false,
) {
  const block = buildManagedWorkflowBlock(platformId, workflows);
  const exists = await pathExists(ruleFilePath);
  const warnings = [];
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeManagedBlock(original);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    if (analysis.status === "multiple") {
      warnings.push(
        "Multiple managed workflow blocks found; patched the first valid block.",
      );
    }
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    warnings.push(
      "Malformed managed workflow block; appended a new canonical block.",
    );
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return {
      action: "unchanged",
      filePath: ruleFilePath,
      warnings,
    };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return {
    action: exists
      ? dryRun
        ? "would-patch"
        : "patched"
      : dryRun
        ? "would-create"
        : "created",
    filePath: ruleFilePath,
    warnings,
  };
}

async function upsertTerminalVerificationBlock({
  ruleFilePath,
  provider,
  powerShellScriptPath,
  bashScriptPath,
  dryRun = false,
}) {
  const block = buildAntigravityTerminalVerificationBlock({
    provider,
    powerShellScriptPath,
    bashScriptPath,
  });
  const exists = await pathExists(ruleFilePath);
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeTerminalVerificationBlock(original);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    const trimmed = original.trimEnd();
    nextContent =
      trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return { action: "unchanged", filePath: ruleFilePath };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  if (!exists) {
    return {
      action: dryRun ? "would-create" : "created",
      filePath: ruleFilePath,
    };
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
  const nextContent =
    before && after
      ? `${before}\n\n${after}\n`
      : `${before}${after}`.trimEnd() + "\n";

  if (!dryRun) {
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return { action: dryRun ? "would-patch" : "patched", filePath: ruleFilePath };
}

async function syncRulesForPlatform({
  platform,
  scope,
  cwd = process.cwd(),
  dryRun = false,
}) {
  const ruleFilePath = await resolveRuleFilePath(platform, scope, cwd);
  if (!ruleFilePath)
    throw new Error(`No rule file configured for platform '${platform}'.`);

  const workflows = await collectInstalledWorkflows(platform, scope, cwd);
  const patchResult = await upsertManagedRuleBlock(
    ruleFilePath,
    platform,
    workflows,
    dryRun,
  );
  const workspaceRuleSync = await syncWorkspaceRuleForGlobalScope({
    platform,
    scope,
    cwd,
    workflows,
    dryRun,
  });
  const warnings = [...patchResult.warnings];

  if (workspaceRuleSync) {
    warnings.push(
      `Workspace rule file detected at ${workspaceRuleSync.workspaceRuleFile}. In this workspace, it has higher precedence than global ${workspaceRuleSync.globalRuleFile}.`,
    );
    warnings.push(
      `Workspace rule managed block sync action: ${workspaceRuleSync.patchResult.action}.`,
    );
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
          warnings: workspaceRuleSync.patchResult.warnings,
        }
      : null,
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

async function copyArtifact({
  source,
  destination,
  overwrite,
  dryRun = false,
  useSymlinks = false,
}) {
  const exists = await pathExists(destination);
  if (exists && !overwrite) {
    return { action: dryRun ? "would-skip" : "skipped", path: destination };
  }

  if (!dryRun && exists && overwrite) {
    await rm(destination, { recursive: true, force: true });
  }

  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    if (useSymlinks) {
      const absSource = path.resolve(source);
      await symlink(absSource, destination);
    } else {
      await cp(source, destination, { recursive: true, force: true });
    }
  }

  if (dryRun) {
    return {
      action: exists
        ? useSymlinks
          ? "would-replace (link)"
          : "would-replace"
        : useSymlinks
          ? "would-link"
          : "would-install",
      path: destination,
    };
  }
  return {
    action: exists
      ? useSymlinks
        ? "linked (replaced)"
        : "replaced"
      : useSymlinks
        ? "linked"
        : "installed",
    path: destination,
  };
}

async function writeGeneratedArtifact({
  destination,
  content,
  dryRun = false,
}) {
  const exists = await pathExists(destination);

  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf8");
  }

  if (dryRun) {
    return {
      action: exists ? "would-replace" : "would-install",
      path: destination,
    };
  }

  return { action: exists ? "replaced" : "installed", path: destination };
}

function resolveLegacyPostmanConfigPath({ scope, cwd = process.cwd() }) {
  if (scope === "global") {
    return path.join(os.homedir(), ".cbx", LEGACY_POSTMAN_CONFIG_FILENAME);
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return path.join(workspaceRoot, LEGACY_POSTMAN_CONFIG_FILENAME);
}

function resolveCbxConfigPath({ scope, cwd = process.cwd() }) {
  if (scope === "global") {
    return path.join(os.homedir(), ".cbx", CBX_CONFIG_FILENAME);
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return path.join(workspaceRoot, CBX_CONFIG_FILENAME);
}

async function assertNoLegacyOnlyPostmanConfig({ scope, cwd = process.cwd() }) {
  const configPath = resolveCbxConfigPath({ scope, cwd });
  if (await pathExists(configPath)) return;

  const legacyPath = resolveLegacyPostmanConfigPath({ scope, cwd });
  if (!(await pathExists(legacyPath))) return;

  throw new Error(
    `Legacy Postman config detected at ${legacyPath}. Create ${configPath} first (for example: cbx workflows config --scope ${scope} --clear-workspace-id).`,
  );
}

function resolveMcpRootPath({ scope, cwd = process.cwd() }) {
  if (scope === "global") {
    return path.join(os.homedir(), ".cbx", "mcp");
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return path.join(workspaceRoot, ".cbx", "mcp");
}

function resolveManagedCredentialsEnvPath() {
  return path.join(os.homedir(), ".cbx", CBX_CREDENTIALS_ENV_FILENAME);
}

function parseShellEnvValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvFileLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const normalized = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  return {
    name: match[1],
    value: parseShellEnvValue(match[2]),
  };
}

async function loadManagedCredentialsEnv() {
  const envPath = resolveManagedCredentialsEnvPath();
  if (!(await pathExists(envPath))) {
    return {
      envPath,
      loaded: [],
      skipped: [],
      exists: false,
    };
  }
  const raw = await readFile(envPath, "utf8");
  const loaded = [];
  const skipped = [];
  for (const line of raw.split(/\r?\n/)) {
    const entry = parseEnvFileLine(line);
    if (!entry) continue;
    if (process.env[entry.name]) {
      skipped.push(entry.name);
      continue;
    }
    process.env[entry.name] = entry.value;
    loaded.push(entry.name);
  }
  return {
    envPath,
    loaded,
    skipped,
    exists: true,
  };
}

function quoteShellEnvValue(value) {
  const normalized = String(value ?? "");
  // Single-quote with POSIX-safe escaping for embedded single quotes.
  return `'${normalized.replace(/'/g, `'\"'\"'`)}'`;
}

async function persistManagedCredentialsEnv({ envVarNames, dryRun = false }) {
  const envPath = resolveManagedCredentialsEnvPath();
  const existingEntries = new Map();
  const existsBefore = await pathExists(envPath);

  if (existsBefore) {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const entry = parseEnvFileLine(line);
      if (!entry) continue;
      existingEntries.set(entry.name, entry.value);
    }
  }

  const persisted = [];
  const missing = [];
  for (const envName of envVarNames || []) {
    const name = String(envName || "").trim();
    if (!name) continue;
    const value = normalizePostmanApiKey(process.env[name]);
    if (!value) {
      missing.push(name);
      continue;
    }
    existingEntries.set(name, value);
    persisted.push(name);
  }

  const orderedNames = [...existingEntries.keys()].sort((a, b) =>
    a.localeCompare(b),
  );
  const body = [
    "# Managed by cbx workflows config keys persist-env",
    "# Stores credential env vars for future cbx sessions.",
    ...orderedNames.map(
      (name) => `export ${name}=${quoteShellEnvValue(existingEntries.get(name))}`,
    ),
    "",
  ].join("\n");

  if (!dryRun) {
    await mkdir(path.dirname(envPath), { recursive: true });
    await writeFile(envPath, body, "utf8");
    await chmod(envPath, 0o600);
  }

  return {
    envPath,
    persisted,
    missing,
    dryRun,
    action: dryRun ? "would-update" : existsBefore ? "updated" : "created",
  };
}

function resolvePostmanMcpDefinitionPath({
  platform,
  scope,
  cwd = process.cwd(),
}) {
  return path.join(
    resolveMcpRootPath({ scope, cwd }),
    platform,
    `${POSTMAN_SKILL_ID}.json`,
  );
}

function resolveStitchMcpDefinitionPath({ scope, cwd = process.cwd() }) {
  return path.join(
    resolveMcpRootPath({ scope, cwd }),
    "antigravity",
    "stitch.json",
  );
}

function buildPostmanAuthHeader({ apiKeyEnvVar = POSTMAN_API_KEY_ENV_VAR }) {
  return `Bearer \${${apiKeyEnvVar}}`;
}

function buildStitchApiHeader({ apiKeyEnvVar = STITCH_API_KEY_ENV_VAR }) {
  return `X-Goog-Api-Key: \${${apiKeyEnvVar}}`;
}

function buildPostmanMcpDefinition({
  apiKeyEnvVar = POSTMAN_API_KEY_ENV_VAR,
  mcpUrl = POSTMAN_MCP_URL,
}) {
  return {
    schemaVersion: 1,
    server: POSTMAN_SKILL_ID,
    transport: "http",
    url: mcpUrl,
    headers: {
      Authorization: buildPostmanAuthHeader({ apiKeyEnvVar }),
    },
  };
}

function buildStitchMcpDefinition({
  apiKeyEnvVar = STITCH_API_KEY_ENV_VAR,
  mcpUrl = STITCH_MCP_URL,
}) {
  return {
    schemaVersion: 1,
    server: STITCH_MCP_SERVER_ID,
    transport: "command",
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      mcpUrl,
      "--header",
      buildStitchApiHeader({ apiKeyEnvVar }),
    ],
    env: {},
  };
}

function buildVsCodePostmanServer({
  apiKeyEnvVar = POSTMAN_API_KEY_ENV_VAR,
  mcpUrl = POSTMAN_MCP_URL,
}) {
  return {
    type: "sse",
    url: mcpUrl,
    headers: {
      Authorization: buildPostmanAuthHeader({ apiKeyEnvVar }),
    },
  };
}

function buildFoundryServeArgs({ scope = "auto" } = {}) {
  const normalizedScope =
    scope === "global" || scope === "project" || scope === "auto"
      ? scope
      : "auto";
  return ["mcp", "serve", "--transport", "stdio", "--scope", normalizedScope];
}

function buildVsCodeFoundryServer({ scope = "auto" } = {}) {
  return {
    type: "stdio",
    command: FOUNDRY_MCP_COMMAND,
    args: buildFoundryServeArgs({ scope }),
    env: {},
  };
}

function buildCopilotCliPostmanServer({
  apiKeyEnvVar = POSTMAN_API_KEY_ENV_VAR,
  mcpUrl = POSTMAN_MCP_URL,
}) {
  return {
    type: "http",
    url: mcpUrl,
    headers: {
      Authorization: buildPostmanAuthHeader({ apiKeyEnvVar }),
    },
    tools: ["*"],
  };
}

function buildCopilotCliFoundryServer({ scope = "auto" } = {}) {
  return {
    type: "stdio",
    command: FOUNDRY_MCP_COMMAND,
    args: buildFoundryServeArgs({ scope }),
    env: {},
    tools: ["*"],
  };
}

function buildGeminiPostmanServer({
  apiKeyEnvVar = POSTMAN_API_KEY_ENV_VAR,
  mcpUrl = POSTMAN_MCP_URL,
}) {
  return {
    httpUrl: mcpUrl,
    headers: {
      Authorization: buildPostmanAuthHeader({ apiKeyEnvVar }),
    },
  };
}

function buildGeminiFoundryServer({ scope = "auto" } = {}) {
  return {
    command: FOUNDRY_MCP_COMMAND,
    args: buildFoundryServeArgs({ scope }),
    env: {},
  };
}

function buildGeminiStitchServer({
  apiKeyEnvVar = STITCH_API_KEY_ENV_VAR,
  mcpUrl = STITCH_MCP_URL,
}) {
  return {
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      mcpUrl,
      "--header",
      buildStitchApiHeader({ apiKeyEnvVar }),
    ],
    env: {},
  };
}

function getPostmanApiKeySource({ apiKey, envApiKey }) {
  if (apiKey) return "inline";
  if (envApiKey) return "env";
  return "unset";
}

function getStitchApiKeySource({ apiKey, envApiKey }) {
  if (apiKey) return "inline";
  if (envApiKey) return "env";
  return "unset";
}

function normalizePostmanApiKey(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function parseStoredCredentialServiceConfig({ service, rawService }) {
  if (
    !rawService ||
    typeof rawService !== "object" ||
    Array.isArray(rawService)
  ) {
    return null;
  }

  const defaultEnvVar = defaultEnvVarForCredentialService(service);
  const defaultMcpUrl = defaultMcpUrlForCredentialService(service);
  const mcpUrl =
    String(rawService.mcpUrl || defaultMcpUrl).trim() || defaultMcpUrl;
  const profiles = [];
  const rawProfiles = [];
  if (Array.isArray(rawService.profiles)) {
    rawProfiles.push(...rawService.profiles);
  } else if (
    service === "stitch" &&
    rawService.profiles &&
    typeof rawService.profiles === "object"
  ) {
    for (const [profileName, profileValue] of Object.entries(
      rawService.profiles,
    )) {
      if (!profileValue || typeof profileValue !== "object") continue;
      rawProfiles.push({
        ...profileValue,
        name: profileValue.name || profileName,
      });
    }
  }

  for (const rawProfile of rawProfiles) {
    const name = normalizeCredentialProfileName(rawProfile?.name);
    if (!name) continue;
    profiles.push(normalizeCredentialProfileRecord(service, rawProfile, name));
  }

  if (profiles.length === 0) {
    profiles.push(
      normalizeCredentialProfileRecord(
        service,
        {
          name: DEFAULT_CREDENTIAL_PROFILE_NAME,
          apiKeyEnvVar: rawService.apiKeyEnvVar,
          workspaceId:
            service === "postman" ? rawService.defaultWorkspaceId : null,
        },
        DEFAULT_CREDENTIAL_PROFILE_NAME,
      ),
    );
  }

  const dedupedProfiles = dedupeCredentialProfiles(profiles);
  const activeProfileNameCandidate =
    normalizeCredentialProfileName(rawService.activeProfileName) ||
    dedupedProfiles[0].name;
  const activeProfile =
    dedupedProfiles.find(
      (profile) =>
        credentialProfileNameKey(profile.name) ===
        credentialProfileNameKey(activeProfileNameCandidate),
    ) || dedupedProfiles[0];
  const activeProfileName = activeProfile.name;

  if (service === "postman" && activeProfile.workspaceId === null) {
    const legacyWorkspaceId = normalizePostmanWorkspaceId(
      rawService.defaultWorkspaceId,
    );
    if (legacyWorkspaceId) {
      activeProfile.workspaceId = legacyWorkspaceId;
    }
  }

  return {
    mcpUrl,
    profiles: dedupedProfiles,
    activeProfileName,
    activeProfile,
    apiKeyEnvVar:
      String(activeProfile.apiKeyEnvVar || defaultEnvVar).trim() ||
      defaultEnvVar,
    defaultWorkspaceId:
      service === "postman"
        ? normalizePostmanWorkspaceId(activeProfile.workspaceId)
        : null,
  };
}

function parseStoredPostmanConfig(raw) {
  if (!raw || typeof raw !== "object") return null;
  const source =
    raw.postman && typeof raw.postman === "object" ? raw.postman : raw;
  return parseStoredCredentialServiceConfig({
    service: "postman",
    rawService: source,
  });
}

function parseStoredStitchConfig(raw) {
  if (!raw || typeof raw !== "object") return null;
  const source =
    raw.stitch && typeof raw.stitch === "object" ? raw.stitch : raw;
  if (!source || typeof source !== "object" || Array.isArray(source))
    return null;
  const hasStitchShape =
    source.profiles !== undefined ||
    source.apiKey !== undefined ||
    source.apiKeyEnvVar !== undefined ||
    source.mcpUrl !== undefined ||
    source.activeProfileName !== undefined;
  if (!hasStitchShape) return null;
  return parseStoredCredentialServiceConfig({
    service: "stitch",
    rawService: source,
    allowMissing: true,
  });
}

function upsertNormalizedPostmanConfig(target, postmanState) {
  const next =
    target && typeof target === "object" && !Array.isArray(target)
      ? target
      : {};
  const existingPostman =
    next.postman &&
    typeof next.postman === "object" &&
    !Array.isArray(next.postman)
      ? next.postman
      : {};
  const { apiKey: _legacyPostmanApiKey, ...existingPostmanSafe } =
    existingPostman;
  const serviceConfig =
    postmanState || parseStoredPostmanConfig({ postman: existingPostman });
  if (!serviceConfig) return next;

  next.postman = {
    ...existingPostmanSafe,
    profiles: serviceConfig.profiles,
    activeProfileName: serviceConfig.activeProfileName,
    apiKeyEnvVar: serviceConfig.apiKeyEnvVar,
    apiKeySource: storedCredentialSource(serviceConfig.activeProfile),
    defaultWorkspaceId: serviceConfig.defaultWorkspaceId,
    mcpUrl: serviceConfig.mcpUrl,
  };
  return next;
}

function upsertNormalizedStitchConfig(target, stitchState) {
  const next =
    target && typeof target === "object" && !Array.isArray(target)
      ? target
      : {};
  const existingStitch =
    next.stitch &&
    typeof next.stitch === "object" &&
    !Array.isArray(next.stitch)
      ? next.stitch
      : {};
  const { apiKey: _legacyStitchApiKey, ...existingStitchSafe } = existingStitch;
  const serviceConfig =
    stitchState ||
    parseStoredStitchConfig({ stitch: existingStitch }) ||
    parseStoredCredentialServiceConfig({
      service: "stitch",
      rawService: existingStitch,
      allowMissing: true,
    });
  if (!serviceConfig) return next;

  next.stitch = {
    ...existingStitchSafe,
    server: existingStitch.server || STITCH_MCP_SERVER_ID,
    profiles: serviceConfig.profiles,
    activeProfileName: serviceConfig.activeProfileName,
    apiKeyEnvVar: serviceConfig.apiKeyEnvVar,
    apiKeySource: storedCredentialSource(serviceConfig.activeProfile),
    mcpUrl: serviceConfig.mcpUrl,
  };
  return next;
}

function resolveCredentialEffectiveStatus({
  service,
  serviceConfig,
  env = process.env,
}) {
  if (!serviceConfig) return null;
  const defaultEnvVar = defaultEnvVarForCredentialService(service);
  const defaultMcpUrl = defaultMcpUrlForCredentialService(service);
  const activeProfile =
    serviceConfig.activeProfile || serviceConfig.profiles?.[0] || null;
  const apiKeyEnvVar =
    String(activeProfile?.apiKeyEnvVar || defaultEnvVar).trim() ||
    defaultEnvVar;
  const envApiKey = normalizePostmanApiKey(env?.[apiKeyEnvVar]);
  const storedSource = normalizePostmanApiKey(activeProfile?.apiKeyEnvVar)
    ? "env"
    : "unset";
  const effectiveSource = envApiKey ? "env" : "unset";

  return {
    service,
    activeProfileName: serviceConfig.activeProfileName,
    activeProfile,
    profileCount: Array.isArray(serviceConfig.profiles)
      ? serviceConfig.profiles.length
      : 0,
    storedSource,
    effectiveSource,
    effectiveEnvVar: apiKeyEnvVar,
    envVarPresent: Boolean(envApiKey),
    workspaceId:
      service === "postman"
        ? normalizePostmanWorkspaceId(activeProfile?.workspaceId)
        : null,
    mcpUrl: normalizePostmanApiKey(serviceConfig.mcpUrl) || defaultMcpUrl,
    mode:
      service === "postman"
        ? resolvePostmanModeFromUrl(
            serviceConfig.mcpUrl,
            DEFAULT_POSTMAN_CONFIG_MODE,
          )
        : null,
  };
}

async function fetchPostmanWorkspaces({
  apiKey,
  apiBaseUrl = POSTMAN_API_BASE_URL,
  timeoutMs = 12000,
}) {
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/workspaces`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.error?.name ||
        `Postman API request failed (${response.status} ${response.statusText}).`;
      throw new Error(message);
    }

    const workspaces = Array.isArray(payload?.workspaces)
      ? payload.workspaces
      : [];
    return workspaces
      .map((workspace) => {
        const id = normalizePostmanWorkspaceId(workspace?.id);
        if (!id) return null;
        const name = String(workspace?.name || "").trim() || id;
        const type = String(workspace?.type || "").trim() || null;
        const visibility = String(workspace?.visibility || "").trim() || null;
        return { id, name, type, visibility };
      })
      .filter(Boolean);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Postman workspace lookup timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function promptPostmanWorkspaceSelection({
  apiKey,
  defaultWorkspaceId = null,
}) {
  let selectedWorkspaceId = normalizePostmanWorkspaceId(defaultWorkspaceId);
  let usedWorkspaceSelector = false;
  const warnings = [];
  const selectableApiKey = normalizePostmanApiKey(apiKey);

  if (selectableApiKey) {
    try {
      const fetchedWorkspaces = await fetchPostmanWorkspaces({
        apiKey: selectableApiKey,
      });
      if (fetchedWorkspaces.length > 0) {
        usedWorkspaceSelector = true;
        const sortedWorkspaces = [...fetchedWorkspaces].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const workspaceChoice = await select({
          message: "Choose default Postman workspace for this install:",
          choices: [
            { name: "No default workspace (null)", value: null },
            ...sortedWorkspaces.map((workspace) => {
              const details = [workspace.type, workspace.visibility]
                .filter(Boolean)
                .join(", ");
              const suffix = details ? ` - ${details}` : "";
              return {
                name: `${workspace.name} (${workspace.id})${suffix}`,
                value: workspace.id,
              };
            }),
            {
              name: "Enter workspace ID manually",
              value: POSTMAN_WORKSPACE_MANUAL_CHOICE,
            },
          ],
          default: selectedWorkspaceId,
        });

        if (workspaceChoice === POSTMAN_WORKSPACE_MANUAL_CHOICE) {
          const promptedWorkspaceId = await input({
            message:
              "Default Postman workspace ID (optional, leave blank for null):",
            default: selectedWorkspaceId || "",
          });
          selectedWorkspaceId =
            normalizePostmanWorkspaceId(promptedWorkspaceId);
        } else {
          selectedWorkspaceId = normalizePostmanWorkspaceId(workspaceChoice);
        }
      }
    } catch (error) {
      warnings.push(
        `Could not load Postman workspaces for selection: ${error.message}`,
      );
    }
  }

  if (!usedWorkspaceSelector) {
    const promptedWorkspaceId = await input({
      message:
        "Default Postman workspace ID (optional, leave blank for null):",
      default: selectedWorkspaceId || "",
    });
    selectedWorkspaceId = normalizePostmanWorkspaceId(promptedWorkspaceId);
  }

  return {
    workspaceId: selectedWorkspaceId,
    warnings,
  };
}

function parseJsonLenient(raw) {
  try {
    return {
      ok: true,
      value: JSON.parse(raw),
      mode: "json",
    };
  } catch (jsonError) {
    const errors = [];
    const value = parseJsonc(raw, errors, {
      allowTrailingComma: true,
      disallowComments: false,
      allowEmptyContent: false,
    });
    if (errors.length === 0) {
      return {
        ok: true,
        value,
        mode: "jsonc",
      };
    }
    return {
      ok: false,
      value: null,
      error: jsonError,
    };
  }
}

async function readJsonFileIfExists(filePath) {
  if (!(await pathExists(filePath))) return { exists: false, value: null };
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = parseJsonLenient(raw);
    if (!parsed.ok) {
      return { exists: true, value: null, error: parsed.error };
    }
    return { exists: true, value: parsed.value };
  } catch (error) {
    return { exists: true, value: null, error };
  }
}

async function upsertJsonObjectFile({ targetPath, updater, dryRun = false }) {
  const exists = await pathExists(targetPath);
  const warnings = [];
  let parsed = {};

  if (exists) {
    try {
      const raw = await readFile(targetPath, "utf8");
      const decoded = parseJsonLenient(raw);
      if (!decoded.ok) {
        warnings.push(
          `Existing JSON at ${targetPath} could not be parsed. Resetting structure.`,
        );
      } else if (
        decoded.value &&
        typeof decoded.value === "object" &&
        !Array.isArray(decoded.value)
      ) {
        parsed = decoded.value;
      } else {
        warnings.push(
          `Existing JSON at ${targetPath} was not an object. Resetting structure.`,
        );
      }
    } catch {
      warnings.push(
        `Existing JSON at ${targetPath} could not be parsed. Resetting structure.`,
      );
    }
  }

  const nextValue = updater(parsed);
  const content = `${JSON.stringify(nextValue, null, 2)}\n`;
  const writeResult = await writeGeneratedArtifact({
    destination: targetPath,
    content,
    dryRun,
  });

  return {
    action: writeResult.action,
    filePath: targetPath,
    warnings,
  };
}

async function removeGeneratedArtifactIfExists({ targetPath, dryRun = false }) {
  const exists = await pathExists(targetPath);
  if (!exists) {
    return {
      action: "missing",
      path: targetPath,
    };
  }

  if (!dryRun) {
    await rm(targetPath, { recursive: true, force: true });
  }

  return {
    action: dryRun ? "would-remove" : "removed",
    path: targetPath,
  };
}

async function applyPostmanMcpForPlatform({
  platform,
  mcpScope,
  apiKeyEnvVar,
  mcpUrl,
  includePostmanMcp = true,
  stitchApiKeyEnvVar,
  stitchMcpUrl,
  includeStitchMcp = false,
  includeFoundryMcp = true,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const workspaceRoot = findWorkspaceRoot(cwd);
  const warnings = [];
  const foundryScope = mcpScope === "global" ? "global" : "project";

  if (platform === "antigravity") {
    const settingsPath =
      mcpScope === "global"
        ? path.join(os.homedir(), ".gemini", "settings.json")
        : path.join(workspaceRoot, ".gemini", "settings.json");
    const result = await upsertJsonObjectFile({
      targetPath: settingsPath,
      updater: (existing) => {
        const next = { ...existing };
        const mcpServers =
          next.mcpServers &&
          typeof next.mcpServers === "object" &&
          !Array.isArray(next.mcpServers)
            ? { ...next.mcpServers }
            : {};
        if (includePostmanMcp) {
          mcpServers[POSTMAN_SKILL_ID] = buildGeminiPostmanServer({
            apiKeyEnvVar,
            mcpUrl,
          });
        }
        if (includeFoundryMcp) {
          mcpServers[FOUNDRY_MCP_SERVER_ID] = buildGeminiFoundryServer({
            scope: foundryScope,
          });
        } else {
          delete mcpServers[FOUNDRY_MCP_SERVER_ID];
        }
        if (includeStitchMcp) {
          mcpServers[STITCH_MCP_SERVER_ID] = buildGeminiStitchServer({
            apiKeyEnvVar: stitchApiKeyEnvVar,
            mcpUrl: stitchMcpUrl,
          });
        }
        next.mcpServers = mcpServers;
        return next;
      },
      dryRun,
    });
    return {
      kind: "gemini-settings",
      scope: mcpScope,
      path: settingsPath,
      action: result.action,
      warnings: [...warnings, ...result.warnings],
    };
  }

  if (platform === "copilot") {
    const configPath =
      mcpScope === "global"
        ? path.join(os.homedir(), ".copilot", "mcp-config.json")
        : path.join(workspaceRoot, ".vscode", "mcp.json");
    const result = await upsertJsonObjectFile({
      targetPath: configPath,
      updater: (existing) => {
        const next = { ...existing };
        if (mcpScope === "global") {
          const mcpServers =
            next.mcpServers &&
            typeof next.mcpServers === "object" &&
            !Array.isArray(next.mcpServers)
              ? { ...next.mcpServers }
              : {};
          if (includePostmanMcp) {
            mcpServers[POSTMAN_SKILL_ID] = buildCopilotCliPostmanServer({
              apiKeyEnvVar,
              mcpUrl,
            });
          }
          if (includeFoundryMcp) {
            mcpServers[FOUNDRY_MCP_SERVER_ID] = buildCopilotCliFoundryServer({
              scope: foundryScope,
            });
          } else {
            delete mcpServers[FOUNDRY_MCP_SERVER_ID];
          }
          next.mcpServers = mcpServers;
          return next;
        }

        const servers =
          next.servers &&
          typeof next.servers === "object" &&
          !Array.isArray(next.servers)
            ? { ...next.servers }
            : {};
        if (includePostmanMcp) {
          servers[POSTMAN_SKILL_ID] = buildVsCodePostmanServer({
            apiKeyEnvVar,
            mcpUrl,
          });
        }
        if (includeFoundryMcp) {
          servers[FOUNDRY_MCP_SERVER_ID] = buildVsCodeFoundryServer({
            scope: foundryScope,
          });
        } else {
          delete servers[FOUNDRY_MCP_SERVER_ID];
        }
        next.servers = servers;
        return next;
      },
      dryRun,
    });
    return {
      kind: mcpScope === "global" ? "copilot-cli-mcp" : "vscode-mcp",
      scope: mcpScope,
      path: configPath,
      action: result.action,
      warnings: [...warnings, ...result.warnings],
    };
  }

  if (platform === "codex") {
    if (mcpScope === "project") {
      const vscodePath = path.join(workspaceRoot, ".vscode", "mcp.json");
      const result = await upsertJsonObjectFile({
        targetPath: vscodePath,
        updater: (existing) => {
        const next = { ...existing };
        const servers =
            next.servers &&
            typeof next.servers === "object" &&
            !Array.isArray(next.servers)
              ? { ...next.servers }
              : {};
          if (includePostmanMcp) {
            servers[POSTMAN_SKILL_ID] = buildVsCodePostmanServer({
              apiKeyEnvVar,
              mcpUrl,
            });
          }
          if (includeFoundryMcp) {
            servers[FOUNDRY_MCP_SERVER_ID] = buildVsCodeFoundryServer({
              scope: foundryScope,
            });
          } else {
            delete servers[FOUNDRY_MCP_SERVER_ID];
          }
          next.servers = servers;
          return next;
        },
        dryRun,
      });
      return {
        kind: "vscode-mcp",
        scope: mcpScope,
        path: vscodePath,
        action: result.action,
        warnings: [...warnings, ...result.warnings],
      };
    }

    const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");
    if (dryRun) {
      return {
        kind: "codex-cli",
        scope: mcpScope,
        path: codexConfigPath,
        action: "would-patch",
        warnings,
      };
    }

    try {
      await execFile("codex", ["mcp", "remove", POSTMAN_SKILL_ID], { cwd });
    } catch {
      // Best effort. Add will still run and becomes source of truth.
    }
    try {
      await execFile("codex", ["mcp", "remove", FOUNDRY_MCP_SERVER_ID], {
        cwd,
      });
    } catch {
      // Best effort. Add will still run and becomes source of truth.
    }

    if (includePostmanMcp) {
      try {
        await execFile(
          "codex",
          [
            "mcp",
            "add",
            POSTMAN_SKILL_ID,
            "--url",
            mcpUrl,
            "--bearer-token-env-var",
            apiKeyEnvVar || POSTMAN_API_KEY_ENV_VAR,
          ],
          { cwd },
        );
      } catch (error) {
        warnings.push(
          `Failed to register Postman MCP via Codex CLI. Ensure 'codex' is installed and rerun. (${error.message})`,
        );
        return {
          kind: "codex-cli",
          scope: mcpScope,
          path: codexConfigPath,
          action: "failed",
          warnings,
        };
      }
    }

    if (includeFoundryMcp) {
      try {
        await execFile(
          "codex",
          [
            "mcp",
            "add",
            FOUNDRY_MCP_SERVER_ID,
            "--",
            FOUNDRY_MCP_COMMAND,
            ...buildFoundryServeArgs({ scope: foundryScope }),
          ],
          { cwd },
        );
      } catch (error) {
        warnings.push(
          `Failed to register ${FOUNDRY_MCP_SERVER_ID} MCP via Codex CLI. Ensure 'cbx' and 'codex' are installed and rerun. (${error.message})`,
        );
      }
    }

    return {
      kind: "codex-cli",
      scope: mcpScope,
      path: codexConfigPath,
      action: "patched",
      warnings,
    };
  }

  return {
    kind: "unknown",
    scope: mcpScope,
    path: null,
    action: "skipped",
    warnings: [
      `Unsupported platform '${platform}' for Postman MCP installation.`,
    ],
  };
}

async function ensureGitIgnoreEntry({ filePath, entry, dryRun = false }) {
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
      filePath,
    };
  }

  const suffix = original.endsWith("\n") || original.length === 0 ? "" : "\n";
  const nextContent = `${original}${suffix}${entry}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, nextContent, "utf8");
  return {
    action: exists ? "patched" : "created",
    filePath,
  };
}

async function resolvePostmanInstallSelection({
  platform,
  scope,
  options,
  cwd = process.cwd(),
}) {
  const hasWorkspaceOption = options.postmanWorkspaceId !== undefined;
  const hasInlinePostmanApiKeyOption = options.postmanApiKey !== undefined;
  const hasInlineStitchApiKeyOption = options.stitchApiKey !== undefined;
  if (hasInlinePostmanApiKeyOption || hasInlineStitchApiKeyOption) {
    throw new Error(
      "Inline API keys are no longer allowed. Use environment variables and --env-var profiles (for example POSTMAN_API_KEY_* and STITCH_API_KEY_*).",
    );
  }

  const stitchRequested = Boolean(options.stitch);
  const postmanRequested =
    Boolean(options.postman) ||
    hasWorkspaceOption ||
    options.postmanMode !== undefined;
  const foundryOnlyRequested =
    options.foundryMcp === true && !postmanRequested && !stitchRequested;
  const enabled = postmanRequested || stitchRequested || foundryOnlyRequested;
  if (!enabled) return { enabled: false };
  const requestedPostmanMode = postmanRequested
    ? normalizePostmanMode(options.postmanMode, DEFAULT_POSTMAN_INSTALL_MODE)
    : null;
  const requestedMcpUrl = requestedPostmanMode
    ? resolvePostmanMcpUrlForMode(requestedPostmanMode)
    : null;

  const envApiKey = normalizePostmanApiKey(
    process.env[POSTMAN_API_KEY_ENV_VAR],
  );
  let defaultWorkspaceId = hasWorkspaceOption
    ? normalizePostmanWorkspaceId(options.postmanWorkspaceId)
    : null;
  let workspaceSelectionSource = hasWorkspaceOption ? "option" : "none";
  const requestedMcpScope = options.mcpScope
    ? normalizeMcpScope(options.mcpScope, normalizeMcpScope(scope, "project"))
    : null;
  let mcpScope = requestedMcpScope || normalizeMcpScope(scope, "project");
  const warnings = [];
  const stitchEnabled =
    stitchRequested ||
    (platform === "antigravity" && options.stitchDefaultForAntigravity !== false);
  const envStitchApiKey = normalizePostmanApiKey(
    process.env[STITCH_API_KEY_ENV_VAR],
  );
  const requestedRuntime = normalizeMcpRuntime(
    options.mcpRuntime,
    DEFAULT_MCP_RUNTIME,
  );
  const requestedFallback = normalizeMcpFallback(
    options.mcpFallback,
    DEFAULT_MCP_FALLBACK,
  );
  const requestedImage =
    normalizePostmanApiKey(options.mcpImage) || DEFAULT_MCP_DOCKER_IMAGE;
  const requestedUpdatePolicy = normalizeMcpUpdatePolicy(
    options.mcpUpdatePolicy,
    DEFAULT_MCP_UPDATE_POLICY,
  );
  const mcpBuildLocal = Boolean(options.mcpBuildLocal);
  const mcpToolSync = options.mcpToolSync !== false;
  const foundryMcpEnabled = options.foundryMcp !== false;

  const canPrompt = !options.yes && process.stdin.isTTY;
  if (postmanRequested && canPrompt && !hasWorkspaceOption) {
    const workspaceSelection = await promptPostmanWorkspaceSelection({
      apiKey: envApiKey,
      defaultWorkspaceId,
    });
    defaultWorkspaceId = workspaceSelection.workspaceId;
    warnings.push(...workspaceSelection.warnings);
    workspaceSelectionSource = "interactive";
  }

  if (canPrompt && !requestedMcpScope) {
    mcpScope = await select({
      message: "Install MCP config in workspace or global scope?",
      choices: [
        {
          name: scope === "global" ? "Global (recommended)" : "Global",
          value: "global",
        },
        {
          name: scope === "project" ? "Workspace (recommended)" : "Workspace",
          value: "project",
        },
      ],
      default: mcpScope,
    });
  }

  let effectiveRuntime = requestedRuntime;
  let runtimeSkipped = false;
  let dockerImageAction = "not-requested";
  if (requestedRuntime === "docker") {
    const dockerAvailable = await checkDockerAvailable({ cwd });
    if (!dockerAvailable) {
      if (requestedFallback === "fail") {
        throw new Error(
          "Docker runtime requested but Docker is unavailable. Install/start Docker, or use --mcp-fallback local|skip.",
        );
      }
      if (requestedFallback === "skip") {
        runtimeSkipped = true;
        warnings.push(
          "Docker runtime unavailable; skipping MCP runtime patch because --mcp-fallback=skip.",
        );
      } else {
        effectiveRuntime = "local";
        warnings.push(
          "Docker runtime unavailable; falling back to local runtime (--mcp-fallback=local).",
        );
      }
    } else {
      try {
        const ensured = await ensureMcpDockerImage({
          image: requestedImage,
          updatePolicy: requestedUpdatePolicy,
          buildLocal: mcpBuildLocal,
          cwd,
        });
        dockerImageAction = ensured.action;
      } catch (error) {
        if (requestedFallback === "fail") {
          throw new Error(
            `Docker runtime requested but MCP image preparation failed (${error.message}).`,
          );
        }
        if (requestedFallback === "skip") {
          runtimeSkipped = true;
          dockerImageAction = "failed";
          warnings.push(
            `MCP Docker image preparation failed; skipping MCP runtime patch because --mcp-fallback=skip. (${error.message})`,
          );
        } else {
          effectiveRuntime = "local";
          dockerImageAction = "failed";
          warnings.push(
            `MCP Docker image preparation failed; falling back to local runtime (--mcp-fallback=local). (${error.message})`,
          );
        }
      }
    }
  }

  const apiKeySource = postmanRequested ? (envApiKey ? "env" : "unset") : null;
  if (postmanRequested && apiKeySource === "unset") {
    warnings.push(
      `Postman API key is not configured. Set ${profileEnvVarAlias("postman", DEFAULT_CREDENTIAL_PROFILE_NAME)}.`,
    );
  }

  const stitchApiKeySource = stitchEnabled
    ? envStitchApiKey
      ? "env"
      : "unset"
    : null;
  if (stitchEnabled && stitchApiKeySource === "unset") {
    warnings.push(
      `Google Stitch API key is not configured. Set ${profileEnvVarAlias("stitch", DEFAULT_CREDENTIAL_PROFILE_NAME)}.`,
    );
  }

  const cbxConfigPath = resolveCbxConfigPath({ scope: mcpScope, cwd });
  const defaultPostmanEnvVar = profileEnvVarAlias(
    "postman",
    DEFAULT_CREDENTIAL_PROFILE_NAME,
  );
  const defaultProfile = normalizeCredentialProfileRecord("postman", {
    name: DEFAULT_CREDENTIAL_PROFILE_NAME,
    apiKeyEnvVar: defaultPostmanEnvVar,
    workspaceId: defaultWorkspaceId ?? null,
  });
  const cbxConfig = {
    schemaVersion: 1,
    generatedBy: "cbx workflows install",
    generatedAt: new Date().toISOString(),
    mcp: {
      scope: mcpScope,
      server: postmanRequested
        ? POSTMAN_SKILL_ID
        : stitchEnabled
          ? STITCH_MCP_SERVER_ID
          : FOUNDRY_MCP_SERVER_ID,
      platform,
      runtime: requestedRuntime,
      fallback: requestedFallback,
      effectiveRuntime: runtimeSkipped ? null : effectiveRuntime,
      docker: {
        image: requestedImage,
        updatePolicy: requestedUpdatePolicy,
        buildLocal: mcpBuildLocal,
      },
      catalog: {
        toolSync: mcpToolSync && (postmanRequested || stitchEnabled),
      },
    },
  };
  if (postmanRequested) {
    cbxConfig.postman = {
      profiles: [defaultProfile],
      activeProfileName: defaultProfile.name,
      apiKeyEnvVar: defaultProfile.apiKeyEnvVar,
      apiKeySource: storedCredentialSource(defaultProfile),
      defaultWorkspaceId: defaultProfile.workspaceId,
      mcpUrl: requestedMcpUrl,
    };
  }
  if (stitchEnabled) {
    const defaultStitchEnvVar = profileEnvVarAlias(
      "stitch",
      DEFAULT_CREDENTIAL_PROFILE_NAME,
    );
    const defaultStitchProfile = normalizeCredentialProfileRecord("stitch", {
      name: DEFAULT_CREDENTIAL_PROFILE_NAME,
      apiKeyEnvVar: defaultStitchEnvVar,
    });
    cbxConfig.stitch = {
      server: STITCH_MCP_SERVER_ID,
      profiles: [defaultStitchProfile],
      activeProfileName: defaultStitchProfile.name,
      apiKeyEnvVar: defaultStitchProfile.apiKeyEnvVar,
      apiKeySource: storedCredentialSource(defaultStitchProfile),
      mcpUrl: STITCH_MCP_URL,
    };
  }

  return {
    enabled: true,
    postmanEnabled: postmanRequested,
    apiKeySource,
    stitchEnabled,
    stitchApiKeySource,
    mcpRuntime: requestedRuntime,
    effectiveMcpRuntime: runtimeSkipped ? null : effectiveRuntime,
    mcpFallback: requestedFallback,
    mcpImage: requestedImage,
    mcpUpdatePolicy: requestedUpdatePolicy,
    mcpBuildLocal,
    dockerImageAction,
    mcpToolSync,
    foundryMcpEnabled,
    runtimeSkipped,
    postmanMode: requestedPostmanMode,
    defaultWorkspaceId: defaultWorkspaceId ?? null,
    workspaceSelectionSource,
    mcpScope,
    warnings,
    cbxConfig,
    cbxConfigPath,
  };
}

async function configurePostmanInstallArtifacts({
  platform,
  scope,
  profilePaths,
  postmanSelection,
  overwrite = false,
  dryRun = false,
  cwd = process.cwd(),
}) {
  if (!postmanSelection?.enabled) return null;
  const shouldInstallPostman = Boolean(postmanSelection.postmanEnabled);

  let warnings = [...postmanSelection.warnings];
  await assertNoLegacyOnlyPostmanConfig({
    scope: postmanSelection.mcpScope,
    cwd,
  });
  const cbxConfigContent = `${JSON.stringify(postmanSelection.cbxConfig, null, 2)}\n`;
  const cbxConfigResult = await writeTextFile({
    targetPath: postmanSelection.cbxConfigPath,
    content: cbxConfigContent,
    overwrite,
    dryRun,
  });

  const installPostmanConfig = parseStoredPostmanConfig(
    postmanSelection.cbxConfig,
  );
  let effectiveApiKeyEnvVar = String(
    installPostmanConfig?.apiKeyEnvVar || POSTMAN_API_KEY_ENV_VAR,
  ).trim();
  let effectiveDefaultWorkspaceId =
    installPostmanConfig?.defaultWorkspaceId ??
    postmanSelection.defaultWorkspaceId ??
    null;
  let effectiveMcpUrl =
    installPostmanConfig?.mcpUrl ||
    postmanSelection.cbxConfig?.postman?.mcpUrl ||
    POSTMAN_MCP_URL;
  const shouldInstallStitch = Boolean(postmanSelection.stitchEnabled);
  const installStitchConfig = shouldInstallStitch
    ? parseStoredStitchConfig(postmanSelection.cbxConfig)
    : null;
  let effectiveStitchApiKeyEnvVar = shouldInstallStitch
    ? String(
        installStitchConfig?.apiKeyEnvVar || STITCH_API_KEY_ENV_VAR,
      ).trim() || STITCH_API_KEY_ENV_VAR
    : STITCH_API_KEY_ENV_VAR;
  let effectiveStitchMcpUrl = shouldInstallStitch
    ? installStitchConfig?.mcpUrl || STITCH_MCP_URL
    : STITCH_MCP_URL;

  if (
    cbxConfigResult.action === "skipped" ||
    cbxConfigResult.action === "would-skip"
  ) {
    const existingCbxConfig = await readJsonFileIfExists(
      postmanSelection.cbxConfigPath,
    );
    if (
      existingCbxConfig.value &&
      typeof existingCbxConfig.value === "object" &&
      !Array.isArray(existingCbxConfig.value)
    ) {
      const migration = migrateInlineCredentialsInConfig(
        existingCbxConfig.value,
      );
      if (migration.findings.length > 0) {
        warnings.push(
          `Detected ${migration.findings.length} inline key field(s) in existing ${CBX_CONFIG_FILENAME}; migrated to env-var aliases.`,
        );
        if (!dryRun) {
          await writeFile(
            postmanSelection.cbxConfigPath,
            `${JSON.stringify(migration.next, null, 2)}\n`,
            "utf8",
          );
        }
        existingCbxConfig.value = migration.next;
      }
    }
    const storedPostmanConfig = parseStoredPostmanConfig(
      existingCbxConfig.value,
    );
    const storedStitchConfig = shouldInstallStitch
      ? parseStoredStitchConfig(existingCbxConfig.value)
      : null;

    if (shouldInstallPostman && storedPostmanConfig) {
      effectiveApiKeyEnvVar =
        storedPostmanConfig.apiKeyEnvVar || POSTMAN_API_KEY_ENV_VAR;
      effectiveDefaultWorkspaceId = storedPostmanConfig.defaultWorkspaceId;
      effectiveMcpUrl =
        storedPostmanConfig.mcpUrl ||
        postmanSelection.cbxConfig?.postman?.mcpUrl ||
        POSTMAN_MCP_URL;
    } else if (shouldInstallPostman) {
      warnings.push(
        `Existing ${CBX_CONFIG_FILENAME} could not be parsed. Using install-time Postman values for MCP config.`,
      );
    }

    if (storedStitchConfig) {
      effectiveStitchApiKeyEnvVar =
        String(
          storedStitchConfig.apiKeyEnvVar || STITCH_API_KEY_ENV_VAR,
        ).trim() || STITCH_API_KEY_ENV_VAR;
      effectiveStitchMcpUrl = storedStitchConfig.mcpUrl || STITCH_MCP_URL;
    }

    if (
      postmanSelection.workspaceSelectionSource &&
      postmanSelection.workspaceSelectionSource !== "none"
    ) {
      const requestedWorkspaceId = postmanSelection.defaultWorkspaceId ?? null;
      const persistedWorkspaceId = effectiveDefaultWorkspaceId ?? null;
      if (requestedWorkspaceId !== persistedWorkspaceId) {
        const configScope =
          postmanSelection.mcpScope === "global" ? "global" : "project";
        const configHint =
          requestedWorkspaceId === null
            ? `cbx workflows config --scope ${configScope} --clear-workspace-id`
            : `cbx workflows config --scope ${configScope} --workspace-id \"${requestedWorkspaceId}\"`;
        warnings.push(
          `Selected Postman workspace (${requestedWorkspaceId === null ? "null" : requestedWorkspaceId}) was not saved because ${CBX_CONFIG_FILENAME} already exists. Re-run with --overwrite or run '${configHint}'.`,
        );
      }
    }
  }

  const envApiKey = shouldInstallPostman
    ? normalizePostmanApiKey(
        process.env[effectiveApiKeyEnvVar || POSTMAN_API_KEY_ENV_VAR],
      )
    : null;
  const effectiveApiKeySource = shouldInstallPostman
    ? envApiKey
      ? "env"
      : "unset"
    : null;
  if (shouldInstallPostman && effectiveApiKeySource === "unset") {
    warnings.push(
      `Postman API key is not configured. Set ${effectiveApiKeyEnvVar || POSTMAN_API_KEY_ENV_VAR}.`,
    );
  }
  const envStitchApiKey = normalizePostmanApiKey(
    process.env[effectiveStitchApiKeyEnvVar],
  );
  const effectiveStitchApiKeySource = shouldInstallStitch
    ? envStitchApiKey
      ? "env"
      : "unset"
    : null;
  if (shouldInstallStitch && effectiveStitchApiKeySource === "unset") {
    warnings.push(
      `Google Stitch API key is not configured. Set ${effectiveStitchApiKeyEnvVar || STITCH_API_KEY_ENV_VAR}.`,
    );
  }

  const gitIgnoreResults = [];
  if (postmanSelection.mcpScope === "project") {
    const workspaceRoot = findWorkspaceRoot(cwd);
    const gitIgnorePath = path.join(workspaceRoot, ".gitignore");
    const configIgnore = await ensureGitIgnoreEntry({
      filePath: gitIgnorePath,
      entry: CBX_CONFIG_FILENAME,
      dryRun,
    });
    gitIgnoreResults.push(configIgnore);

    const mcpIgnore = await ensureGitIgnoreEntry({
      filePath: gitIgnorePath,
      entry: ".cbx/mcp/",
      dryRun,
    });
    gitIgnoreResults.push(mcpIgnore);
  }

  let mcpDefinitionPath = null;
  let mcpDefinitionResult = null;
  if (shouldInstallPostman) {
    mcpDefinitionPath = resolvePostmanMcpDefinitionPath({
      platform,
      scope: postmanSelection.mcpScope,
      cwd,
    });
    const mcpDefinitionContent = `${JSON.stringify(
      buildPostmanMcpDefinition({
        apiKeyEnvVar: effectiveApiKeyEnvVar,
        mcpUrl: effectiveMcpUrl,
      }),
      null,
      2,
    )}\n`;
    mcpDefinitionResult = await writeGeneratedArtifact({
      destination: mcpDefinitionPath,
      content: mcpDefinitionContent,
      dryRun,
    });
  }
  let stitchMcpDefinitionPath = null;
  let stitchMcpDefinitionResult = null;
  if (shouldInstallStitch) {
    stitchMcpDefinitionPath = resolveStitchMcpDefinitionPath({
      scope: postmanSelection.mcpScope,
      cwd,
    });
    const stitchMcpDefinitionContent = `${JSON.stringify(
      buildStitchMcpDefinition({
        apiKeyEnvVar: effectiveStitchApiKeyEnvVar,
        mcpUrl: effectiveStitchMcpUrl,
      }),
      null,
      2,
    )}\n`;
    stitchMcpDefinitionResult = await writeGeneratedArtifact({
      destination: stitchMcpDefinitionPath,
      content: stitchMcpDefinitionContent,
      dryRun,
    });
  }

  const mcpRuntimeResult = postmanSelection.runtimeSkipped
    ? {
        kind: "platform-mcp",
        scope: postmanSelection.mcpScope,
        path: null,
        action: "skipped",
        warnings: [],
      }
    : await applyPostmanMcpForPlatform({
        platform,
      mcpScope: postmanSelection.mcpScope,
      apiKeyEnvVar: effectiveApiKeyEnvVar,
      mcpUrl: effectiveMcpUrl,
      includePostmanMcp: shouldInstallPostman,
      stitchApiKeyEnvVar: effectiveStitchApiKeyEnvVar,
      stitchMcpUrl: effectiveStitchMcpUrl,
      includeStitchMcp: shouldInstallStitch,
        includeFoundryMcp: postmanSelection.foundryMcpEnabled,
        dryRun,
        cwd,
      });
  warnings.push(...(mcpRuntimeResult.warnings || []));

  let mcpCatalogSyncResults = [];
  if (
    postmanSelection.mcpToolSync &&
    (shouldInstallPostman || shouldInstallStitch) &&
    !dryRun
  ) {
    try {
      const currentConfig = await readJsonFileIfExists(
        postmanSelection.cbxConfigPath,
      );
      const services = [];
      if (shouldInstallPostman) services.push("postman");
      if (shouldInstallStitch) services.push("stitch");
      mcpCatalogSyncResults = await syncMcpToolCatalogs({
        scope: postmanSelection.mcpScope,
        services,
        configValue: currentConfig.value || postmanSelection.cbxConfig,
        cwd,
        dryRun: false,
      });
    } catch (error) {
      warnings.push(`MCP tool catalog sync failed: ${error.message}`);
    }
  }

  const legacySkillMcpCleanup = shouldInstallPostman
    ? await removeGeneratedArtifactIfExists({
        targetPath: path.join(
          profilePaths.skillsDir,
          POSTMAN_SKILL_ID,
          "mcp.json",
        ),
        dryRun,
      })
    : null;

  return {
    enabled: true,
    mcpScope: postmanSelection.mcpScope,
    mcpRuntime: postmanSelection.mcpRuntime,
    effectiveMcpRuntime: postmanSelection.effectiveMcpRuntime,
    mcpFallback: postmanSelection.mcpFallback,
    mcpImage: postmanSelection.mcpImage,
    mcpUpdatePolicy: postmanSelection.mcpUpdatePolicy,
    mcpBuildLocal: postmanSelection.mcpBuildLocal,
    dockerImageAction: postmanSelection.dockerImageAction,
    mcpToolSync: postmanSelection.mcpToolSync,
    foundryMcpEnabled: postmanSelection.foundryMcpEnabled,
    postmanEnabled: shouldInstallPostman,
    postmanMode:
      shouldInstallPostman && effectiveMcpUrl
        ? resolvePostmanModeFromUrl(effectiveMcpUrl, DEFAULT_POSTMAN_INSTALL_MODE)
        : null,
    postmanMcpUrl: shouldInstallPostman ? effectiveMcpUrl : null,
    apiKeySource: effectiveApiKeySource,
    stitchApiKeySource: effectiveStitchApiKeySource,
    defaultWorkspaceId: effectiveDefaultWorkspaceId,
    warnings,
    cbxConfigPath: postmanSelection.cbxConfigPath,
    cbxConfigResult,
    gitIgnoreResults,
    mcpDefinitionPath,
    mcpDefinitionResult,
    stitchMcpDefinitionPath,
    stitchMcpDefinitionResult,
    mcpRuntimeResult,
    mcpCatalogSyncResults,
    legacySkillMcpCleanup,
  };
}

function resolveMcpScopeFromConfigDocument(configValue, fallbackScope) {
  try {
    if (
      configValue?.mcp &&
      typeof configValue.mcp === "object" &&
      !Array.isArray(configValue.mcp)
    ) {
      return normalizeMcpScope(configValue.mcp.scope, fallbackScope);
    }
  } catch {
    // Fall through to fallback scope.
  }
  return normalizeMcpScope(fallbackScope, "global");
}

async function applyPostmanConfigArtifacts({
  platform,
  mcpScope,
  configValue,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const warnings = [];
  const postmanState = ensureCredentialServiceState(configValue, "postman");
  const stitchState = parseStoredStitchConfig(configValue);
  const postmanApiKeyEnvVar =
    normalizePostmanApiKey(postmanState.apiKeyEnvVar) || POSTMAN_API_KEY_ENV_VAR;
  const postmanMcpUrl = postmanState.mcpUrl || POSTMAN_MCP_URL;
  const stitchEnabled = Boolean(stitchState);
  const stitchApiKeyEnvVar =
    normalizePostmanApiKey(stitchState?.apiKeyEnvVar) || STITCH_API_KEY_ENV_VAR;
  const stitchMcpUrl = stitchState?.mcpUrl || STITCH_MCP_URL;

  const mcpDefinitionPath = resolvePostmanMcpDefinitionPath({
    platform,
    scope: mcpScope,
    cwd,
  });
  const mcpDefinitionContent = `${JSON.stringify(
    buildPostmanMcpDefinition({
      apiKeyEnvVar: postmanApiKeyEnvVar,
      mcpUrl: postmanMcpUrl,
    }),
    null,
    2,
  )}\n`;
  const mcpDefinitionResult = await writeGeneratedArtifact({
    destination: mcpDefinitionPath,
    content: mcpDefinitionContent,
    dryRun,
  });

  let stitchMcpDefinitionPath = null;
  let stitchMcpDefinitionResult = null;
  if (stitchEnabled) {
    stitchMcpDefinitionPath = resolveStitchMcpDefinitionPath({
      scope: mcpScope,
      cwd,
    });
    const stitchMcpDefinitionContent = `${JSON.stringify(
      buildStitchMcpDefinition({
        apiKeyEnvVar: stitchApiKeyEnvVar,
        mcpUrl: stitchMcpUrl,
      }),
      null,
      2,
    )}\n`;
    stitchMcpDefinitionResult = await writeGeneratedArtifact({
      destination: stitchMcpDefinitionPath,
      content: stitchMcpDefinitionContent,
      dryRun,
    });
  }

  let mcpRuntimeResult = null;
  if (!platform) {
    warnings.push(
      "Skipped platform runtime MCP target patch because platform could not be resolved. Re-run with --platform <codex|antigravity|copilot>.",
    );
  } else {
    mcpRuntimeResult = await applyPostmanMcpForPlatform({
      platform,
      mcpScope,
      apiKeyEnvVar: postmanApiKeyEnvVar,
      mcpUrl: postmanMcpUrl,
      stitchApiKeyEnvVar,
      stitchMcpUrl,
      includeStitchMcp: stitchEnabled,
      includeFoundryMcp: true,
      dryRun,
      cwd,
    });
    warnings.push(...(mcpRuntimeResult.warnings || []));
  }

  return {
    mcpDefinitionPath,
    mcpDefinitionResult,
    stitchMcpDefinitionPath,
    stitchMcpDefinitionResult,
    mcpRuntimeResult,
    warnings,
  };
}

async function installAntigravityTerminalIntegrationArtifacts({
  profilePaths,
  provider,
  dryRun = false,
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
    2,
  )}\n`;
  const scriptPs1 = buildAntigravityTerminalIntegrationPowerShellScript();
  const scriptSh = buildAntigravityTerminalIntegrationBashScript();
  const readme = buildAntigravityTerminalIntegrationReadme({
    provider,
    configPath,
    scriptPsPath: powerShellScriptPath,
    scriptShPath: bashScriptPath,
  });

  const writes = [];
  writes.push(
    await writeGeneratedArtifact({
      destination: configPath,
      content: configContent,
      dryRun,
    }),
  );
  writes.push(
    await writeGeneratedArtifact({
      destination: powerShellScriptPath,
      content: scriptPs1,
      dryRun,
    }),
  );
  writes.push(
    await writeGeneratedArtifact({
      destination: bashScriptPath,
      content: scriptSh,
      dryRun,
    }),
  );
  writes.push(
    await writeGeneratedArtifact({
      destination: readmePath,
      content: `${readme}\n`,
      dryRun,
    }),
  );

  return {
    provider,
    integrationDir,
    configPath,
    powerShellScriptPath,
    bashScriptPath,
    readmePath,
    actions: writes,
    installedPaths: writes.map((item) => item.path),
  };
}

async function sanitizeInstalledSkillsForPlatform({
  platform,
  skillDirs,
  dryRun = false,
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const skillDir of skillDirs) {
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    const { changed, content, removedKeys } =
      sanitizeSkillMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(skillFile, content, "utf8");
    sanitized.push({
      skillId: path.basename(skillDir),
      removedKeys,
    });
  }

  return sanitized;
}

async function sanitizeInstalledAgentsForPlatform({
  platform,
  agentFiles,
  dryRun = false,
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const agentFile of agentFiles) {
    if (!(await pathExists(agentFile))) continue;
    const raw = await readFile(agentFile, "utf8");
    const { changed, content, removedKeys } =
      sanitizeAgentMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(agentFile, content, "utf8");
    const agentId = path
      .basename(agentFile)
      .replace(/\.agent\.md$/i, "")
      .replace(/\.md$/i, "");
    sanitized.push({
      agentId,
      removedKeys,
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
      unsupportedKeys,
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
      unsupportedKeys,
    });
  }

  return findings;
}

async function findNestedSkillDirs(rootDir, depth = 0, nested = []) {
  if (!(await pathExists(rootDir))) return nested;
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const childDir = path.join(rootDir, entry.name);
    const skillFile = path.join(childDir, "SKILL.md");

    // Treat direct children and deeper descendants as nested skills.
    // Once a nested skill boundary is detected, stop descending further.
    if (depth >= 0 && (await pathExists(skillFile))) {
      nested.push(childDir);
      continue;
    }

    await findNestedSkillDirs(childDir, depth + 1, nested);
  }
  return nested;
}

async function cleanupNestedDuplicateSkills({
  skillsRootDir,
  installedSkillDirs,
  dryRun = false,
}) {
  if (
    !skillsRootDir ||
    !Array.isArray(installedSkillDirs) ||
    installedSkillDirs.length === 0
  )
    return [];

  const topLevelSkillIds = new Set();
  for (const skillDir of installedSkillDirs) {
    const skillId = path.basename(skillDir);
    if (!skillId || skillId.startsWith(".")) continue;
    const topLevelSkillFile = path.join(skillsRootDir, skillId, "SKILL.md");
    if (await pathExists(topLevelSkillFile)) {
      topLevelSkillIds.add(skillId.toLowerCase());
    }
  }

  if (topLevelSkillIds.size === 0) return [];

  const cleanup = [];
  for (const topLevelSkillDir of installedSkillDirs) {
    const ownerSkillId = path.basename(topLevelSkillDir);
    if (!ownerSkillId || ownerSkillId.startsWith(".")) continue;
    if (!(await pathExists(topLevelSkillDir))) continue;
    const nestedSkillDirs = await findNestedSkillDirs(topLevelSkillDir);
    for (const nestedDir of nestedSkillDirs) {
      const nestedSkillId = path.basename(nestedDir);
      if (!topLevelSkillIds.has(nestedSkillId.toLowerCase())) continue;
      if (!dryRun) {
        await rm(nestedDir, { recursive: true, force: true });
      }
      cleanup.push({
        nestedSkillId,
        path: nestedDir,
        ownerSkillId,
        action: dryRun ? "would-remove" : "removed",
      });
    }
  }

  return cleanup;
}

async function installBundleArtifacts({
  bundleId,
  manifest,
  platform,
  scope,
  overwrite,
  profilePathsOverride = null,
  extraSkillIds = [],
  skillProfile = DEFAULT_SKILL_PROFILE,
  terminalVerifierSelection = null,
  useSymlinks = false,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const profilePaths =
    profilePathsOverride ||
    (await resolveArtifactProfilePaths(platform, scope, cwd));
  const platformSpec = manifest.platforms?.[platform];

  if (!platformSpec) {
    throw new Error(
      `Bundle '${bundleId}' does not define platform '${platform}'.`,
    );
  }

  if (!dryRun) {
    await mkdir(profilePaths.workflowsDir, { recursive: true });
    await mkdir(profilePaths.skillsDir, { recursive: true });
    if (platformInstallsCustomAgents(platform)) {
      await mkdir(profilePaths.agentsDir, { recursive: true });
    }
    if (
      profilePaths.commandsDir &&
      Array.isArray(platformSpec.commands) &&
      platformSpec.commands.length > 0
    ) {
      await mkdir(profilePaths.commandsDir, { recursive: true });
    }
    if (
      profilePaths.promptsDir &&
      Array.isArray(platformSpec.prompts) &&
      platformSpec.prompts.length > 0
    ) {
      await mkdir(profilePaths.promptsDir, { recursive: true });
    }
  }

  const bundleRoot = path.join(agentAssetsRoot(), "workflows", bundleId);
  const platformRoot = path.join(bundleRoot, "platforms", platform);

  const installed = [];
  const skipped = [];
  const artifacts = {
    workflows: [],
    agents: [],
    skills: [],
    commands: [],
    prompts: [],
  };

  // Bind useSymlinks into copyArtifact so every call site inherits it
  const copyArt = (args) => copyArtifact({ ...args, useSymlinks });

  const workflowFiles = Array.isArray(platformSpec.workflows)
    ? platformSpec.workflows
    : [];
  for (const workflowFile of workflowFiles) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    const destination = path.join(
      profilePaths.workflowsDir,
      path.basename(workflowFile),
    );

    if (!(await pathExists(source))) {
      throw new Error(`Missing workflow source file: ${source}`);
    }

    const result = await copyArt({
      source,
      destination,
      overwrite,
      dryRun,
    });
    artifacts.workflows.push(destination);
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }

  const agentFiles = platformInstallsCustomAgents(platform)
    ? Array.isArray(platformSpec.agents)
      ? platformSpec.agents
      : []
    : [];
  for (const agentFile of agentFiles) {
    const source = path.join(platformRoot, "agents", agentFile);
    const destination = path.join(
      profilePaths.agentsDir,
      path.basename(agentFile),
    );

    if (!(await pathExists(source))) {
      throw new Error(`Missing agent source file: ${source}`);
    }

    const result = await copyArt({
      source,
      destination,
      overwrite,
      dryRun,
    });
    artifacts.agents.push(destination);
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }

  const commandFiles = Array.isArray(platformSpec.commands)
    ? platformSpec.commands
    : [];
  for (const commandFile of commandFiles) {
    if (!profilePaths.commandsDir) continue;
    const source = path.join(platformRoot, "commands", commandFile);
    const destination = path.join(
      profilePaths.commandsDir,
      path.basename(commandFile),
    );

    if (!(await pathExists(source))) {
      throw new Error(`Missing command source file: ${source}`);
    }

    const result = await copyArt({
      source,
      destination,
      overwrite,
      dryRun,
    });
    artifacts.commands.push(destination);
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }

  const promptFiles = Array.isArray(platformSpec.prompts)
    ? platformSpec.prompts
    : [];
  for (const promptFile of promptFiles) {
    if (!profilePaths.promptsDir) continue;
    const source = path.join(platformRoot, "prompts", promptFile);
    const destination = path.join(
      profilePaths.promptsDir,
      path.basename(promptFile),
    );

    if (!(await pathExists(source))) {
      throw new Error(`Missing prompt source file: ${source}`);
    }

    const result = await copyArt({
      source,
      destination,
      overwrite,
      dryRun,
    });
    artifacts.prompts.push(destination);
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }
  const agentSkillDependencies = await resolvePlatformAgentSkillDependencies({
    platformRoot,
    platformSpec,
  });
  const skillIds = await resolveInstallSkillIds({
    platformSpec,
    extraSkillIds: [...extraSkillIds, ...agentSkillDependencies],
    skillProfile,
  });
  for (const skillId of skillIds) {
    const source = await resolveSkillSourceDirectory(skillId);
    const destination = path.join(profilePaths.skillsDir, skillId);

    if (!source) {
      throw new Error(
        `Missing skill source directory for '${skillId}' (checked ${workflowSkillsRoot()}).`,
      );
    }

    const result = await copyArt({
      source,
      destination,
      overwrite,
      dryRun,
    });
    artifacts.skills.push(destination);
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }

  // Copy skills_index.json if it exists in the package skills root
  const skillsIndexSource = path.join(
    workflowSkillsRoot(),
    "skills_index.json",
  );
  if (await pathExists(skillsIndexSource)) {
    const skillsIndexDest = path.join(
      profilePaths.skillsDir,
      "skills_index.json",
    );
    const indexResult = await copyArt({
      source: skillsIndexSource,
      destination: skillsIndexDest,
      overwrite,
      dryRun,
    });
    if (indexResult.action === "skipped" || indexResult.action === "would-skip")
      skipped.push(skillsIndexDest);
    else installed.push(skillsIndexDest);
  }

  let generatedWrapperSkills = [];
  if (platform === "codex") {
    const wrapperResult = await generateCodexWrapperSkills({
      platformRoot,
      platformSpec,
      skillsDir: profilePaths.skillsDir,
      overwrite,
      dryRun,
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
      dryRun,
    });
    installed.push(...terminalIntegration.installedPaths);
  }

  const duplicateSkillCleanup = await cleanupNestedDuplicateSkills({
    skillsRootDir: profilePaths.skillsDir,
    installedSkillDirs: artifacts.skills,
    dryRun,
  });

  const sanitizedSkills = await sanitizeInstalledSkillsForPlatform({
    platform,
    skillDirs: artifacts.skills,
    dryRun,
  });
  const sanitizedAgents = await sanitizeInstalledAgentsForPlatform({
    platform,
    agentFiles: artifacts.agents,
    dryRun,
  });

  return {
    profilePaths,
    installed,
    skipped,
    artifacts,
    terminalIntegration,
    generatedWrapperSkills,
    duplicateSkillCleanup,
    sanitizedSkills,
    sanitizedAgents,
  };
}

async function installCodexProjectWorkflowTemplates({
  bundleId,
  manifest,
  overwrite,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const platform = "codex";
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec) return { installed: [], skipped: [] };

  const workflowFiles = Array.isArray(platformSpec.workflows)
    ? platformSpec.workflows
    : [];
  if (workflowFiles.length === 0) return { installed: [], skipped: [] };

  const profilePaths = await resolveProfilePaths(platform, "project", cwd);
  if (!dryRun) {
    await mkdir(profilePaths.workflowsDir, { recursive: true });
  }

  const bundleRoot = path.join(agentAssetsRoot(), "workflows", bundleId);
  const platformRoot = path.join(bundleRoot, "platforms", platform);
  const installed = [];
  const skipped = [];

  for (const workflowFile of workflowFiles) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    const destination = path.join(
      profilePaths.workflowsDir,
      path.basename(workflowFile),
    );

    if (!(await pathExists(source))) {
      throw new Error(`Missing workflow source file: ${source}`);
    }

    const result = await copyArtifact({
      source,
      destination,
      overwrite,
      dryRun,
    });
    if (result.action === "skipped" || result.action === "would-skip")
      skipped.push(destination);
    else installed.push(destination);
  }

  return { installed, skipped };
}

async function seedRuleFileFromTemplateIfMissing({
  bundleId,
  manifest,
  platform,
  scope,
  overwrite = false,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec || !platformSpec.rulesTemplate)
    return { ruleFilePath: null, action: "none" };

  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const ruleFilePath = profilePaths.ruleFilesByPriority[0];
  if (!ruleFilePath) return { ruleFilePath: null, action: "none" };
  if ((await pathExists(ruleFilePath)) && !overwrite)
    return { ruleFilePath, action: "exists" };

  const templatePath = path.join(
    agentAssetsRoot(),
    "workflows",
    bundleId,
    platformSpec.rulesTemplate,
  );
  if (!(await pathExists(templatePath)))
    return { ruleFilePath, action: "missing-template" };

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await cp(templatePath, ruleFilePath, { recursive: false, force: true });
    return { ruleFilePath, action: "created" };
  }

  return { ruleFilePath, action: "would-create" };
}

function commandToFilename(command) {
  if (!command) return null;
  const normalized = command
    .trim()
    .replace(/^\//, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
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
    if (
      metadata.command === target ||
      metadata.id === target ||
      metadata.name === target
    ) {
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
  profilePathsOverride = null,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const profilePaths =
    profilePathsOverride ||
    (await resolveArtifactProfilePaths(platform, scope, cwd));
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec)
    throw new Error(
      `Bundle '${bundleId}' does not define platform '${platform}'.`,
    );

  const removed = [];

  for (const workflowFile of platformSpec.workflows || []) {
    const destination = path.join(
      profilePaths.workflowsDir,
      path.basename(workflowFile),
    );
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const agentFile of platformSpec.agents || []) {
    const destination = path.join(
      profilePaths.agentsDir,
      path.basename(agentFile),
    );
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const commandFile of platformSpec.commands || []) {
    if (!profilePaths.commandsDir) continue;
    const destination = path.join(
      profilePaths.commandsDir,
      path.basename(commandFile),
    );
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const promptFile of platformSpec.prompts || []) {
    if (!profilePaths.promptsDir) continue;
    const destination = path.join(
      profilePaths.promptsDir,
      path.basename(promptFile),
    );
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  const skillIds = await resolveInstallSkillIds({
    platformSpec,
    extraSkillIds: [],
  });
  for (const skillId of skillIds) {
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
      `  project agents:    ${agentsEnabled ? profile.project.agentDirs[0] : "(disabled for this platform)"}`,
    );
    console.log(`  project skills:    ${profile.project.skillDirs[0]}`);
    if (
      Array.isArray(profile.project.commandDirs) &&
      profile.project.commandDirs.length > 0
    ) {
      console.log(`  project commands:  ${profile.project.commandDirs[0]}`);
    }
    if (
      Array.isArray(profile.project.promptDirs) &&
      profile.project.promptDirs.length > 0
    ) {
      console.log(`  project prompts:   ${profile.project.promptDirs[0]}`);
    }
    console.log(
      `  project rules:     ${profile.project.ruleFilesByPriority.join(" | ")}`,
    );
    console.log(`  global workflows:  ${profile.global.workflowDirs[0]}`);
    console.log(
      `  global agents:     ${agentsEnabled ? profile.global.agentDirs[0] : "(disabled for this platform)"}`,
    );
    console.log(`  global skills:     ${profile.global.skillDirs[0]}`);
    if (
      Array.isArray(profile.global.commandDirs) &&
      profile.global.commandDirs.length > 0
    ) {
      console.log(`  global commands:   ${profile.global.commandDirs[0]}`);
    }
    if (
      Array.isArray(profile.global.promptDirs) &&
      profile.global.promptDirs.length > 0
    ) {
      console.log(`  global prompts:    ${profile.global.promptDirs[0]}`);
    }
    console.log(
      `  global rules:      ${profile.global.ruleFilesByPriority.join(" | ")}`,
    );
    console.log(
      "  default install:   workflows/agents/commands/prompts -> project, skills -> global",
    );
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
    console.log(
      `- Workspace precedence file: ${result.workspaceRuleSync.filePath}`,
    );
    console.log(
      `- Workspace precedence action: ${result.workspaceRuleSync.action}`,
    );
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
  duplicateSkillCleanup = [],
  sanitizedSkills = [],
  sanitizedAgents = [],
  terminalIntegration = null,
  terminalIntegrationRules = null,
  dryRun = false,
}) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Bundle: ${bundleId}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (installed.length > 0) {
    console.log(
      `\n${dryRun ? "Would install/replace" : "Installed"} (${installed.length}):`,
    );
    for (const item of installed) console.log(`- ${item}`);
  }

  if (skipped.length > 0) {
    console.log(
      `\n${dryRun ? "Would skip existing" : "Skipped existing"} (${skipped.length}):`,
    );
    for (const item of skipped) console.log(`- ${item}`);
    console.log(
      `\nTip: rerun with --overwrite to ${dryRun ? "preview replacements" : "replace skipped files"}.`,
    );
  }

  if (installed.length === 0 && skipped.length === 0) {
    console.log("\nNo changes made.");
  }

  if (generatedWrapperSkills.length > 0) {
    const workflowCount = generatedWrapperSkills.filter(
      (item) => item.kind === "workflow",
    ).length;
    const agentCount = generatedWrapperSkills.filter(
      (item) => item.kind === "agent",
    ).length;
    console.log(
      `\nCodex callable wrapper skills: ${generatedWrapperSkills.length} (workflow=${workflowCount}, agent=${agentCount})`,
    );
    console.log("Invoke these with $workflow-... or $agent-... in Codex.");
  }

  if (terminalIntegration) {
    console.log("\nAntigravity terminal verification integration:");
    console.log(`- Provider: ${terminalIntegration.provider}`);
    console.log(`- Directory: ${terminalIntegration.integrationDir}`);
    if (terminalIntegrationRules?.primaryRule) {
      console.log(
        `- Rule block (${terminalIntegrationRules.primaryRule.filePath}): ${terminalIntegrationRules.primaryRule.action}`,
      );
    }
    if (terminalIntegrationRules?.workspaceRule) {
      console.log(
        `- Workspace precedence rule (${terminalIntegrationRules.workspaceRule.filePath}): ${terminalIntegrationRules.workspaceRule.action}`,
      );
    }
  }

  if (duplicateSkillCleanup.length > 0) {
    console.log(
      `\nNested duplicate skill cleanup (${duplicateSkillCleanup.length}):`,
    );
    for (const item of duplicateSkillCleanup.slice(0, 10)) {
      console.log(
        `- ${item.path}: ${item.action} duplicate skill '${item.nestedSkillId}' nested under '${item.ownerSkillId}'`,
      );
    }
    if (duplicateSkillCleanup.length > 10) {
      console.log(
        `- ...and ${duplicateSkillCleanup.length - 10} more duplicate skill folder(s).`,
      );
    }
  }

  if (!dryRun && sanitizedSkills.length > 0) {
    console.log(
      `\nCopilot skill schema normalization (${sanitizedSkills.length}):`,
    );
    for (const item of sanitizedSkills.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(
        `- ${item.skillId}: removed unsupported top-level keys (${keys})`,
      );
    }
    if (sanitizedSkills.length > 8) {
      console.log(`- ...and ${sanitizedSkills.length - 8} more skill(s).`);
    }
  }

  if (!dryRun && sanitizedAgents.length > 0) {
    console.log(
      `\nCopilot agent schema normalization (${sanitizedAgents.length}):`,
    );
    for (const item of sanitizedAgents.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(
        `- ${item.agentId}: removed unsupported top-level keys (${keys})`,
      );
    }
    if (sanitizedAgents.length > 8) {
      console.log(`- ...and ${sanitizedAgents.length - 8} more agent file(s).`);
    }
  }
}

function printPostmanSetupSummary({ postmanSetup }) {
  if (!postmanSetup?.enabled) return;

  console.log("\nMCP setup:");
  console.log(`- MCP scope: ${postmanSetup.mcpScope}`);
  if (postmanSetup.postmanEnabled && postmanSetup.postmanMode) {
    console.log(`- Postman mode: ${postmanSetup.postmanMode}`);
  }
  if (postmanSetup.postmanEnabled && postmanSetup.postmanMcpUrl) {
    console.log(`- Postman MCP URL: ${postmanSetup.postmanMcpUrl}`);
  }
  console.log(
    `- Config file: ${postmanSetup.cbxConfigResult.action} (${postmanSetup.cbxConfigPath})`,
  );
  console.log(`- MCP runtime (requested): ${postmanSetup.mcpRuntime}`);
  console.log(
    `- MCP runtime (effective): ${postmanSetup.effectiveMcpRuntime || "skipped"}`,
  );
  console.log(`- MCP fallback: ${postmanSetup.mcpFallback}`);
  console.log(`- MCP image: ${postmanSetup.mcpImage}`);
  console.log(`- MCP update policy: ${postmanSetup.mcpUpdatePolicy}`);
  console.log(
    `- MCP build local: ${postmanSetup.mcpBuildLocal ? "yes" : "no"}`,
  );
  console.log(`- MCP image prepare: ${postmanSetup.dockerImageAction}`);
  console.log(
    `- MCP tool sync: ${postmanSetup.mcpToolSync ? "enabled" : "disabled"}`,
  );
  console.log(
    `- Foundry MCP side-by-side: ${postmanSetup.foundryMcpEnabled ? "enabled" : "disabled"}`,
  );
  if (postmanSetup.postmanEnabled) {
    console.log(`- Postman API key source: ${postmanSetup.apiKeySource}`);
  }
  if (postmanSetup.stitchApiKeySource) {
    console.log(`- Stitch API key source: ${postmanSetup.stitchApiKeySource}`);
  }
  if (postmanSetup.postmanEnabled) {
    console.log(
      `- Default workspace ID: ${postmanSetup.defaultWorkspaceId === null ? "null" : postmanSetup.defaultWorkspaceId}`,
    );
  }
  for (const ignoreResult of postmanSetup.gitIgnoreResults || []) {
    console.log(
      `- .gitignore (${ignoreResult.filePath}): ${ignoreResult.action}`,
    );
  }
  if (postmanSetup.mcpDefinitionPath && postmanSetup.mcpDefinitionResult) {
    console.log(
      `- Managed MCP definition (${postmanSetup.mcpDefinitionPath}): ${postmanSetup.mcpDefinitionResult.action}`,
    );
  }
  if (
    postmanSetup.stitchMcpDefinitionPath &&
    postmanSetup.stitchMcpDefinitionResult
  ) {
    console.log(
      `- Managed Stitch MCP definition (${postmanSetup.stitchMcpDefinitionPath}): ${postmanSetup.stitchMcpDefinitionResult.action}`,
    );
  }
  if (postmanSetup.mcpRuntimeResult) {
    console.log(
      `- Platform MCP target (${postmanSetup.mcpRuntimeResult.path || "n/a"}): ${postmanSetup.mcpRuntimeResult.action}`,
    );
  }
  if (Array.isArray(postmanSetup.mcpCatalogSyncResults)) {
    for (const syncItem of postmanSetup.mcpCatalogSyncResults) {
      if (syncItem.action === "skipped") {
        console.log(
          `- MCP catalog ${syncItem.service}: skipped (${syncItem.reason})`,
        );
      } else {
        console.log(
          `- MCP catalog ${syncItem.service}: ${syncItem.action} (${syncItem.toolCount} tools)`,
        );
      }
    }
  }
  if (postmanSetup.legacySkillMcpCleanup) {
    console.log(
      `- Legacy skill mcp.json cleanup (${postmanSetup.legacySkillMcpCleanup.path}): ${postmanSetup.legacySkillMcpCleanup.action}`,
    );
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
  dryRun = false,
}) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Target: ${target}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (removed.length > 0) {
    console.log(
      `\n${dryRun ? "Would remove" : "Removed"} (${removed.length}):`,
    );
    for (const item of removed) console.log(`- ${item}`);
  } else {
    console.log(
      `\nNo files were ${dryRun ? "selected for removal" : "removed"}.`,
    );
  }

  if (terminalIntegrationCleanup) {
    console.log("\nAntigravity terminal verification cleanup:");
    console.log(
      `- Integration directory (${terminalIntegrationCleanup.integrationDir}): ${terminalIntegrationCleanup.dirRemoved ? (dryRun ? "would-remove" : "removed") : "unchanged"}`,
    );
    if (terminalIntegrationCleanup.primaryRule?.filePath) {
      console.log(
        `- Rule block (${terminalIntegrationCleanup.primaryRule.filePath}): ${terminalIntegrationCleanup.primaryRule.action}`,
      );
    }
    if (terminalIntegrationCleanup.workspaceRule?.filePath) {
      console.log(
        `- Workspace precedence rule (${terminalIntegrationCleanup.workspaceRule.filePath}): ${terminalIntegrationCleanup.workspaceRule.action}`,
      );
    }
  }
}

async function createDoctorReport({ platform, scope, cwd = process.cwd() }) {
  const profile = WORKFLOW_PROFILES[platform];
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const artifactPaths = await resolveArtifactProfilePaths(platform, scope, cwd);
  const agentsEnabled = platformInstallsCustomAgents(platform);

  const pathStatus = {
    workflows: {
      path: artifactPaths.workflowsDir,
      exists: await pathExists(artifactPaths.workflowsDir),
    },
    agents: {
      path: artifactPaths.agentsDir,
      enabled: agentsEnabled,
      exists: agentsEnabled ? await pathExists(artifactPaths.agentsDir) : null,
    },
    skills: {
      path: artifactPaths.skillsDir,
      exists: await pathExists(artifactPaths.skillsDir),
    },
    commands: {
      path: artifactPaths.commandsDir,
      enabled: Boolean(artifactPaths.commandsDir),
      exists: artifactPaths.commandsDir
        ? await pathExists(artifactPaths.commandsDir)
        : null,
    },
    prompts: {
      path: artifactPaths.promptsDir,
      enabled: Boolean(artifactPaths.promptsDir),
      exists: artifactPaths.promptsDir
        ? await pathExists(artifactPaths.promptsDir)
        : null,
    },
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
    const integrationDir = getAntigravityTerminalIntegrationDir(artifactPaths);
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
      ruleBlockStatus,
    };
  }

  const recommendations = [];
  const warnings = [];

  if (!activeRuleFile) {
    recommendations.push(
      `No instruction file found. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to create ${profile.ruleHintName}.`,
    );
  }

  if (activeRuleFile && managedBlockStatus === "absent") {
    recommendations.push(
      `Instruction file exists but lacks CBX managed block. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}'.`,
    );
  }

  if (managedBlockStatus === "multiple" || managedBlockStatus === "malformed") {
    recommendations.push(
      `Managed block is not clean. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to normalize it.`,
    );
  }

  if (
    !pathStatus.workflows.exists &&
    !pathStatus.skills.exists &&
    !(pathStatus.agents.enabled && pathStatus.agents.exists) &&
    !(pathStatus.commands.enabled && pathStatus.commands.exists) &&
    !(pathStatus.prompts.enabled && pathStatus.prompts.exists)
  ) {
    recommendations.push(
      "No workflow/agent/skill/command/prompt directories found in this scope.",
    );
  }

  if (platform === "codex" && scope === "project") {
    const legacyCodexSkills = path.join(cwd, ".codex", "skills");
    if (await pathExists(legacyCodexSkills)) {
      warnings.push(
        "Legacy path ./.codex/skills detected. Recommended path is ./.agents/skills.",
      );
      recommendations.push(
        "Migrate legacy Codex skills path: move ./.codex/skills to ./.agents/skills to align with official defaults.",
      );
    }
  }

  if (scope === "global") {
    const workspaceRule = await resolveWorkspaceRuleFileForGlobalScope(
      platform,
      cwd,
    );
    if (workspaceRule) {
      const globalRulePath = expandPath(
        WORKFLOW_PROFILES[platform].global.ruleFilesByPriority[0],
        cwd,
      );
      warnings.push(
        `Workspace rule file detected at ${workspaceRule}. In this workspace, it has higher precedence than global ${globalRulePath}.`,
      );
      recommendations.push(
        `Use 'cbx workflows sync-rules --platform ${platform} --scope global' from this workspace to sync the managed block to both global and workspace rule files.`,
      );
    }
  }

  if (platform === "antigravity" && scope === "project") {
    const gitignorePath = path.join(cwd, ".gitignore");
    if (await pathExists(gitignorePath)) {
      const gitignore = await readFile(gitignorePath, "utf8");
      const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
      const hasAgentIgnore = lines.some(
        (line) =>
          line === ".agent" || line === ".agent/" || line === "/.agent/",
      );
      if (hasAgentIgnore) {
        warnings.push(
          ".agent/ is ignored in .gitignore; this can hide team workflow/rule updates.",
        );
        recommendations.push(
          "Prefer tracking .agent/ in git. For local-only excludes, use '.git/info/exclude' instead of .gitignore.",
        );
      }
    }
  }

  if (
    platform === "antigravity" &&
    terminalIntegration?.exists &&
    !terminalIntegration.configExists
  ) {
    warnings.push(
      `Antigravity terminal integration directory exists without config: ${terminalIntegration.configPath}.`,
    );
    recommendations.push(
      "Reinstall with terminal integration enabled to restore config and scripts.",
    );
  }

  if (
    platform === "antigravity" &&
    terminalIntegration?.exists &&
    terminalIntegration.ruleBlockStatus === "absent"
  ) {
    warnings.push(
      "Antigravity terminal integration exists but no terminal verification rule block was found.",
    );
    recommendations.push(
      "Re-run install with terminal integration flags (use --overwrite if files already exist).",
    );
  }

  if (
    platform === "antigravity" &&
    pathStatus.workflows.exists &&
    pathStatus.commands.enabled &&
    !pathStatus.commands.exists
  ) {
    warnings.push(
      "Antigravity workflows are present but .gemini/commands is missing.",
    );
    recommendations.push(
      `Reinstall to generate command files: cbx workflows install --platform antigravity --bundle agent-environment-setup --scope ${scope} --overwrite`,
    );
  }

  if (
    platform === "copilot" &&
    pathStatus.workflows.exists &&
    pathStatus.prompts.enabled &&
    !pathStatus.prompts.exists
  ) {
    warnings.push(
      "Copilot workflows are present but prompts directory is missing.",
    );
    recommendations.push(
      `Reinstall to generate prompt files: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
    );
  }

  if (platform === "copilot" && pathStatus.skills.exists) {
    const findings = await validateCopilotSkillsSchema(artifactPaths.skillsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.skillId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot skill attributes detected in ${findings.length} skill(s): ${preview}${findings.length > 5 ? "; ..." : ""}`,
      );
      recommendations.push(
        `Normalize Copilot skill frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
      );
    }
  }

  if (platform === "copilot" && pathStatus.agents.exists) {
    const findings = await validateCopilotAgentsSchema(artifactPaths.agentsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.agentId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot agent attributes detected in ${findings.length} agent file(s): ${preview}${findings.length > 5 ? "; ..." : ""}`,
      );
      recommendations.push(
        `Normalize Copilot agent frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
      );
    }
  }

  return {
    platform,
    scope,
    ruleFileStatus: {
      active: activeRuleFile,
      preferred: ruleFileToCheck,
      exists: Boolean(activeRuleFile),
    },
    paths: pathStatus,
    managedBlockStatus,
    managedBlockCounts,
    terminalIntegration,
    warnings,
    recommendations,
  };
}

function printDoctorReport(report) {
  console.log(`Platform: ${report.platform}`);
  console.log(`Scope: ${report.scope}`);

  console.log("\nRule file:");
  console.log(`- Active: ${report.ruleFileStatus.active || "(missing)"}`);
  console.log(`- Preferred: ${report.ruleFileStatus.preferred}`);

  console.log("\nPaths:");
  console.log(
    `- Workflows: ${report.paths.workflows.path} : ${report.paths.workflows.exists ? "exists" : "missing"}`,
  );
  if (report.paths.agents.enabled === false) {
    console.log(`- Agents: ${report.paths.agents.path} : disabled`);
  } else {
    console.log(
      `- Agents: ${report.paths.agents.path} : ${report.paths.agents.exists ? "exists" : "missing"}`,
    );
  }
  console.log(
    `- Skills: ${report.paths.skills.path} : ${report.paths.skills.exists ? "exists" : "missing"}`,
  );
  if (report.paths.commands.enabled === false) {
    console.log(`- Commands: (disabled)`);
  } else {
    console.log(
      `- Commands: ${report.paths.commands.path} : ${report.paths.commands.exists ? "exists" : "missing"}`,
    );
  }
  if (report.paths.prompts.enabled === false) {
    console.log(`- Prompts: (disabled)`);
  } else {
    console.log(
      `- Prompts: ${report.paths.prompts.path} : ${report.paths.prompts.exists ? "exists" : "missing"}`,
    );
  }

  console.log("\nManaged block:");
  console.log(`- Status: ${report.managedBlockStatus}`);
  console.log(
    `- Markers: start=${report.managedBlockCounts.starts}, end=${report.managedBlockCounts.ends}`,
  );

  if (report.terminalIntegration) {
    console.log("\nTerminal integration:");
    console.log(`- Path: ${report.terminalIntegration.path}`);
    console.log(
      `- Exists: ${report.terminalIntegration.exists ? "yes" : "no"}`,
    );
    console.log(`- Config: ${report.terminalIntegration.configPath}`);
    console.log(
      `- Config present: ${report.terminalIntegration.configExists ? "yes" : "no"}`,
    );
    console.log(
      `- Provider: ${report.terminalIntegration.provider || "(unknown)"}`,
    );
    console.log(
      `- Rule block status: ${report.terminalIntegration.ruleBlockStatus}`,
    );
  }

  if (report.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of report.warnings) console.log(`- ${warning}`);
  }

  console.log("\nRecommendations:");
  if (report.recommendations.length === 0) {
    console.log("- No issues detected.");
  } else {
    for (const recommendation of report.recommendations)
      console.log(`- ${recommendation}`);
  }
}

function withWorkflowBaseOptions(command) {
  return command
    .option("-p, --platform <platform>", "target platform id")
    .option("--scope <scope>", "target scope: project|global", "project");
}

function withInstallOptions(command) {
  return command
    .option("-p, --platform <platform>", "target platform id")
    .option("--scope <scope>", "target scope: project|global", "global")
    .option(
      "-b, --bundle <bundle>",
      "bundle id (default: agent-environment-setup)",
    )
    .option("--overwrite", "overwrite existing files")
    .option(
      "--postman",
      "optional: install Postman skill and generate cbx_config.json",
    )
    .option(
      "--postman-mode <mode>",
      "Postman MCP mode for --postman: minimal|code|full (default: full)",
    )
    .option(
      "--stitch",
      "optional: include Stitch MCP profile/config alongside Postman",
    )
    .option(
      "--postman-api-key <key>",
      "deprecated: inline key mode is disabled. Use env vars + profiles.",
    )
    .option(
      "--postman-workspace-id <id|null>",
      "optional: set default Postman workspace ID (use 'null' for no default)",
    )
    .option(
      "--stitch-api-key <key>",
      "deprecated: inline key mode is disabled. Use env vars + profiles.",
    )
    .option(
      "--mcp-scope <scope>",
      "optional: MCP config scope for --postman (project|workspace|global|user)",
    )
    .option(
      "--mcp-runtime <runtime>",
      "MCP runtime: docker|local",
      DEFAULT_MCP_RUNTIME,
    )
    .option(
      "--mcp-fallback <fallback>",
      "When docker runtime is unavailable: local|fail|skip",
      DEFAULT_MCP_FALLBACK,
    )
    .option(
      "--mcp-image <image:tag>",
      "Docker image for MCP runtime",
      DEFAULT_MCP_DOCKER_IMAGE,
    )
    .option(
      "--mcp-update-policy <policy>",
      "MCP image update policy: pinned|latest",
      DEFAULT_MCP_UPDATE_POLICY,
    )
    .option(
      "--mcp-build-local",
      "build MCP Docker image from local package mcp/ directory instead of pulling",
    )
    .option(
      "--mcp-tool-sync",
      "enable automatic MCP tool catalog sync (default: enabled)",
    )
    .option("--no-mcp-tool-sync", "disable automatic MCP tool catalog sync")
    .option(
      "--no-foundry-mcp",
      "disable side-by-side cubis-foundry MCP registration during --postman setup",
    )
    .option(
      "--terminal-integration",
      "Antigravity only: enable terminal verification integration (prompts for verifier when interactive)",
    )
    .option(
      "--terminal-verifier <provider>",
      "Antigravity only: verifier provider (codex|gemini). Implies --terminal-integration.",
    )
    .option(
      "--skill-profile <profile>",
      "skill install profile: core|web-backend|full (default: core)",
      DEFAULT_SKILL_PROFILE,
    )
    .option("--all-skills", "alias for --skill-profile full")
    .option(
      "--target <path>",
      "install into target project directory instead of cwd",
    )
    .option(
      "--link",
      "create symlinks instead of copies (edits in source are instantly reflected)",
    )
    .option("--dry-run", "preview install without writing files")
    .option("-y, --yes", "skip interactive confirmation");
}

function registerConfigKeysSubcommands(configCommand) {
  const keysCommand = configCommand
    .command("keys")
    .description(
      "Manage named key profiles in cbx_config.json for Postman/Stitch",
    );

  keysCommand
    .command("list")
    .description("List key profiles")
    .option("--service <service>", "postman|stitch|all", "all")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .action(runWorkflowConfigKeysList);

  keysCommand
    .command("add")
    .description("Add key profile")
    .option("--service <service>", "postman|stitch", "postman")
    .requiredOption("--name <profile>", "profile name")
    .requiredOption("--env-var <envVar>", "environment variable alias")
    .option(
      "--workspace-id <id|null>",
      "optional: Postman profile workspace ID",
    )
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--dry-run", "preview changes without writing files")
    .action(runWorkflowConfigKeysAdd);

  keysCommand
    .command("use")
    .description("Set active key profile")
    .option("--service <service>", "postman|stitch", "postman")
    .requiredOption("--name <profile>", "profile name")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--dry-run", "preview changes without writing files")
    .action(runWorkflowConfigKeysUse);

  keysCommand
    .command("remove")
    .description("Remove key profile")
    .option("--service <service>", "postman|stitch", "postman")
    .requiredOption("--name <profile>", "profile name")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--dry-run", "preview changes without writing files")
    .action(runWorkflowConfigKeysRemove);

  keysCommand
    .command("migrate-inline")
    .description(
      "Migrate legacy inline API keys to env-var aliases and rewrite config safely",
    )
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--redact", "accepted for compatibility; output is always redacted")
    .option("--dry-run", "preview changes without writing files")
    .action(runWorkflowConfigKeysMigrateInline);

  keysCommand
    .command("doctor")
    .description(
      "Check config and generated MCP artifacts for unsafe inline credential usage",
    )
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .action(runWorkflowConfigKeysDoctor);

  keysCommand
    .command("persist-env")
    .description(
      "Persist configured credential env vars into ~/.cbx/credentials.env (mode 600)",
    )
    .option("--service <service>", "postman|stitch|all", "all")
    .option("--profile <profile>", "persist only this profile name")
    .option(
      "--all-profiles",
      "persist all profiles for selected service(s) instead of active profile only",
    )
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--dry-run", "preview changes without writing files")
    .action(runWorkflowConfigKeysPersistEnv);
}

async function resolveAntigravityTerminalVerifierSelection({
  platform,
  options,
}) {
  const verifierRaw = options.terminalVerifier;
  const hasTerminalIntegrationFlag = Boolean(options.terminalIntegration);
  const normalizedVerifier = normalizeTerminalVerifier(verifierRaw);

  if (verifierRaw && !normalizedVerifier) {
    throw new Error(
      `Unsupported --terminal-verifier value '${verifierRaw}'. Allowed: ${TERMINAL_VERIFIER_PROVIDERS.join(", ")}.`,
    );
  }

  if (platform !== "antigravity") {
    if (hasTerminalIntegrationFlag || verifierRaw) {
      throw new Error(
        "--terminal-integration and --terminal-verifier are only supported for platform 'antigravity'.",
      );
    }
    return null;
  }

  let enabled = hasTerminalIntegrationFlag || Boolean(normalizedVerifier);
  let provider = normalizedVerifier;

  const canPrompt = !options.yes && process.stdin.isTTY;
  if (!enabled && !provider && canPrompt) {
    enabled = await confirm({
      message: "Enable Antigravity terminal verification integration?",
      default: false,
    });
  }

  if (!enabled) return null;

  if (!provider) {
    if (canPrompt) {
      provider = await select({
        message: "Select terminal verifier provider:",
        choices: [
          { name: "Codex CLI", value: "codex" },
          { name: "Gemini CLI", value: "gemini" },
        ],
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
  dryRun = false,
}) {
  if (!terminalIntegration) return null;

  const primaryRuleFile = await resolveRuleFilePath("antigravity", scope, cwd);
  if (!primaryRuleFile) return null;

  const primary = await upsertTerminalVerificationBlock({
    ruleFilePath: primaryRuleFile,
    provider: terminalIntegration.provider,
    powerShellScriptPath: terminalIntegration.powerShellScriptPath,
    bashScriptPath: terminalIntegration.bashScriptPath,
    dryRun,
  });

  let workspace = null;
  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(
      "antigravity",
      cwd,
    );
    const globalRuleFile = expandPath(
      WORKFLOW_PROFILES.antigravity.global.ruleFilesByPriority[0],
      cwd,
    );
    if (
      workspaceRuleFile &&
      path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)
    ) {
      workspace = await upsertTerminalVerificationBlock({
        ruleFilePath: workspaceRuleFile,
        provider: terminalIntegration.provider,
        powerShellScriptPath: terminalIntegration.powerShellScriptPath,
        bashScriptPath: terminalIntegration.bashScriptPath,
        dryRun,
      });
    }
  }

  return {
    provider: terminalIntegration.provider,
    primaryRule: primary,
    workspaceRule: workspace,
    integrationDir: terminalIntegration.integrationDir,
  };
}

async function cleanupAntigravityTerminalIntegration({
  scope,
  cwd,
  dryRun = false,
}) {
  const profilePaths = await resolveArtifactProfilePaths(
    "antigravity",
    scope,
    cwd,
  );
  const integrationDir = getAntigravityTerminalIntegrationDir(profilePaths);
  const dirRemoved = await safeRemove(integrationDir, dryRun);

  const primaryRuleFile = await resolveRuleFilePath("antigravity", scope, cwd);
  const primaryRule = primaryRuleFile
    ? await removeTerminalVerificationBlock(primaryRuleFile, dryRun)
    : { action: "missing-rule-file", filePath: null };

  let workspaceRule = null;
  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(
      "antigravity",
      cwd,
    );
    const globalRuleFile = expandPath(
      WORKFLOW_PROFILES.antigravity.global.ruleFilesByPriority[0],
      cwd,
    );
    if (
      workspaceRuleFile &&
      path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)
    ) {
      workspaceRule = await removeTerminalVerificationBlock(
        workspaceRuleFile,
        dryRun,
      );
    }
  }

  return {
    integrationDir,
    dirRemoved,
    primaryRule,
    workspaceRule,
  };
}

async function performWorkflowInstall(
  options,
  { postmanSelectionOverride = null } = {},
) {
  const cwd = options.target ? path.resolve(options.target) : process.cwd();
  await loadManagedCredentialsEnv();
  if (options.target) {
    const targetExists = await pathExists(cwd);
    if (!targetExists) {
      throw new Error(`Target directory does not exist: ${cwd}`);
    }
  }
  const useSymlinks = Boolean(options.link);
  const scope = normalizeScope(options.scope);
  const ruleScope = scope === "global" ? "project" : scope;
  const dryRun = Boolean(options.dryRun);
  const platform = await resolvePlatform(options.platform, scope, cwd);
  const artifactProfilePaths = await resolveArtifactProfilePaths(
    platform,
    scope,
    cwd,
  );
  const bundleId = await chooseBundle(options.bundle);
  const manifest = await readBundleManifest(bundleId);

  if (!dryRun && !options.yes && process.stdin.isTTY) {
    const proceed = await confirm({
      message: `Install bundle '${bundleId}' for ${platform} (${scope})?`,
      default: true,
    });
    if (!proceed) {
      return {
        cancelled: true,
        platform,
        scope,
        ruleScope,
      };
    }
  }

  const terminalVerifierSelection =
    await resolveAntigravityTerminalVerifierSelection({
      platform,
      options,
    });
  const postmanSelection =
    postmanSelectionOverride ||
    (await resolvePostmanInstallSelection({
      platform,
      scope,
      options,
      cwd,
    }));
  const skillInstallOptions = resolveWorkflowSkillInstallOptions(options);
  const extraSkillIds = [];
  if (postmanSelection?.postmanEnabled) {
    extraSkillIds.push(POSTMAN_SKILL_ID);
  }
  if (postmanSelection?.stitchEnabled) {
    extraSkillIds.push(STITCH_SKILL_ID);
  }

  const installResult = await installBundleArtifacts({
    bundleId,
    manifest,
    platform,
    scope,
    overwrite: Boolean(options.overwrite),
    profilePathsOverride: artifactProfilePaths,
    extraSkillIds,
    skillProfile: skillInstallOptions.skillProfile,
    terminalVerifierSelection,
    useSymlinks,
    dryRun,
    cwd,
  });

  if (platform === "codex" && scope === "global") {
    const codexProjectPaths = await resolveProfilePaths("codex", "project", cwd);
    if (
      path.resolve(artifactProfilePaths.workflowsDir) !==
      path.resolve(codexProjectPaths.workflowsDir)
    ) {
      const codexProjectWorkflows = await installCodexProjectWorkflowTemplates({
        bundleId,
        manifest,
        overwrite: Boolean(options.overwrite),
        dryRun,
        cwd,
      });
      installResult.installed.push(...codexProjectWorkflows.installed);
      installResult.skipped.push(...codexProjectWorkflows.skipped);
    }
  }

  await seedRuleFileFromTemplateIfMissing({
    bundleId,
    manifest,
    platform,
    scope: ruleScope,
    overwrite: Boolean(options.overwrite),
    dryRun,
    cwd,
  });

  const syncResult = await syncRulesForPlatform({
    platform,
    scope: ruleScope,
    dryRun,
    cwd,
  });
  const engineeringArtifactsResult = await upsertEngineeringArtifacts({
    platform,
    scope: ruleScope,
    overwrite: false,
    dryRun,
    skipTech: false,
    cwd,
  });
  const postmanSetupResult = await configurePostmanInstallArtifacts({
    platform,
    scope,
    profilePaths: installResult.profilePaths,
    postmanSelection,
    overwrite: Boolean(options.overwrite),
    dryRun,
    cwd,
  });

  const terminalVerificationRuleResult =
    platform === "antigravity" && installResult.terminalIntegration
      ? await upsertTerminalVerificationForInstall({
          scope: ruleScope,
          cwd,
          terminalIntegration: installResult.terminalIntegration,
          dryRun,
        })
      : null;

  if (!dryRun) {
    await recordBundleInstallState({
      scope,
      platform,
      bundleId,
      artifacts: installResult.artifacts,
      ruleFilePath: syncResult.filePath,
      cwd,
    });
  }

  return {
    cancelled: false,
    cwd,
    scope,
    ruleScope,
    dryRun,
    platform,
    bundleId,
    installResult,
    syncResult,
    engineeringArtifactsResult,
    postmanSetupResult,
    terminalVerificationRuleResult,
  };
}

async function runWorkflowInstall(options) {
  try {
    const result = await performWorkflowInstall(options);
    if (result.cancelled) {
      console.log("Cancelled.");
      process.exit(0);
    }

    printInstallSummary({
      platform: result.platform,
      scope: result.scope,
      bundleId: result.bundleId,
      installed: result.installResult.installed,
      skipped: result.installResult.skipped,
      generatedWrapperSkills: result.installResult.generatedWrapperSkills,
      duplicateSkillCleanup: result.installResult.duplicateSkillCleanup,
      sanitizedSkills: result.installResult.sanitizedSkills,
      sanitizedAgents: result.installResult.sanitizedAgents,
      terminalIntegration: result.installResult.terminalIntegration,
      terminalIntegrationRules: result.terminalVerificationRuleResult,
      dryRun: result.dryRun,
    });
    printRuleSyncResult(result.syncResult);
    printInstallEngineeringSummary({
      engineeringResults: result.engineeringArtifactsResult.engineeringResults,
      techResult: result.engineeringArtifactsResult.techResult,
    });
    printPostmanSetupSummary({
      postmanSetup: result.postmanSetupResult,
    });
    if (result.dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
    } else {
      console.log(
        "\nTip: run `cbx workflows doctor --platform " +
          result.platform +
          " --scope " +
          result.ruleScope +
          "`.",
      );
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

async function listInstalledTopLevelSkillDirs(skillsDir) {
  if (!skillsDir || !(await pathExists(skillsDir))) return [];
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillId = entry.name;
    const skillFile = path.join(skillsDir, skillId, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;
    out.push(path.join(skillsDir, skillId));
  }
  return out.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function isProtectedInstalledSkillId(skillId) {
  const normalized = String(skillId || "")
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith("workflow-") || normalized.startsWith("agent-"))
    return true;
  return normalized.startsWith(".");
}

async function runWorkflowPruneSkills(options) {
  try {
    const cwd = process.cwd();
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, cwd);
    const profilePaths = await resolveArtifactProfilePaths(
      platform,
      scope,
      cwd,
    );
    const bundleId = await chooseBundle(
      options.bundle || "agent-environment-setup",
    );
    const manifest = await readBundleManifest(bundleId);
    const platformSpec = manifest.platforms?.[platform];
    if (!platformSpec) {
      throw new Error(
        `Bundle '${bundleId}' does not define platform '${platform}'.`,
      );
    }
    if (
      !profilePaths.skillsDir ||
      !(await pathExists(profilePaths.skillsDir))
    ) {
      console.log(
        `No skills directory found at ${profilePaths.skillsDir || "(unset)"}. Nothing to prune.`,
      );
      return;
    }

    const skillInstallOptions = resolveWorkflowSkillInstallOptions(options);
    const desiredSkillIds = await resolveInstallSkillIds({
      platformSpec,
      extraSkillIds: [],
      skillProfile: skillInstallOptions.skillProfile,
    });
    const desiredSet = new Set(
      desiredSkillIds.map((skillId) => String(skillId).toLowerCase()),
    );

    const installedSkillDirs = await listInstalledTopLevelSkillDirs(
      profilePaths.skillsDir,
    );
    const installedSkillIds = installedSkillDirs.map((dirPath) =>
      path.basename(dirPath),
    );
    const nestedPlan = await cleanupNestedDuplicateSkills({
      skillsRootDir: profilePaths.skillsDir,
      installedSkillDirs,
      dryRun: true,
    });

    const removeOutOfProfile = installedSkillIds
      .filter((skillId) => !isProtectedInstalledSkillId(skillId))
      .filter((skillId) => !desiredSet.has(skillId.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    const hasWork = nestedPlan.length > 0 || removeOutOfProfile.length > 0;
    if (!hasWork) {
      console.log(
        "No stale skills found. Installed set already matches selected profile.",
      );
      console.log(`Profile: ${skillInstallOptions.skillProfile}`);
      return;
    }

    if (!dryRun && !options.yes && process.stdin.isTTY) {
      const proceed = await confirm({
        message: `Prune ${nestedPlan.length + removeOutOfProfile.length} stale skill path(s) for ${platform} (${scope})?`,
        default: true,
      });
      if (!proceed) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    const nestedResult = await cleanupNestedDuplicateSkills({
      skillsRootDir: profilePaths.skillsDir,
      installedSkillDirs,
      dryRun,
    });

    const removedOutOfProfile = [];
    for (const skillId of removeOutOfProfile) {
      const targetDir = path.join(profilePaths.skillsDir, skillId);
      if (!dryRun) {
        await rm(targetDir, { recursive: true, force: true });
      }
      removedOutOfProfile.push({
        skillId,
        path: targetDir,
        action: dryRun ? "would-remove" : "removed",
      });
    }

    const beforeCount = installedSkillIds.length;
    const afterCount = dryRun
      ? beforeCount - nestedResult.length - removedOutOfProfile.length
      : (await listInstalledTopLevelSkillDirs(profilePaths.skillsDir)).length;

    console.log("Skill prune summary:");
    console.log(`- Platform/scope: ${platform}/${scope}`);
    console.log(`- Bundle: ${bundleId}`);
    console.log(`- Profile: ${skillInstallOptions.skillProfile}`);
    console.log(`- Installed before: ${beforeCount}`);
    console.log(`- Nested duplicates: ${nestedResult.length}`);
    console.log(`- Out-of-profile: ${removedOutOfProfile.length}`);
    console.log(`- Installed after: ${afterCount}`);

    if (nestedResult.length > 0) {
      console.log("\nNested duplicate removals:");
      for (const item of nestedResult) {
        console.log(`- ${item.action}: ${item.path}`);
      }
    }
    if (removedOutOfProfile.length > 0) {
      console.log("\nOut-of-profile removals:");
      for (const item of removedOutOfProfile) {
        console.log(`- ${item.action}: ${item.path}`);
      }
    }
    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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
      throw new Error(
        "Missing <bundle-or-workflow>. Usage: cbx workflows remove <bundle-or-workflow>",
      );
    }

    const cwd = process.cwd();
    const scope = normalizeScope(options.scope);
    const ruleScope = scope === "global" ? "project" : scope;
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, cwd);
    const artifactProfilePaths = await resolveArtifactProfilePaths(
      platform,
      scope,
      cwd,
    );
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
          default: true,
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
        profilePathsOverride: artifactProfilePaths,
        dryRun,
        cwd,
      });

      removed = removeResult.removed;

      if (platform === "antigravity") {
        terminalIntegrationCleanup =
          await cleanupAntigravityTerminalIntegration({
            scope,
            cwd,
            dryRun,
          });
        if (terminalIntegrationCleanup.dirRemoved) {
          removed.push(terminalIntegrationCleanup.integrationDir);
        }
      }
    } else {
      const workflowFile = await findWorkflowFileByTarget(
        artifactProfilePaths.workflowsDir,
        target,
      );

      if (!workflowFile) {
        throw new Error(
          `Could not find workflow or bundle '${target}' in platform '${platform}'.`,
        );
      }

      if (!dryRun && !options.yes && process.stdin.isTTY) {
        const proceed = await confirm({
          message: `Remove workflow '${path.basename(workflowFile)}' from ${platform} (${scope})?`,
          default: true,
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
      scope: ruleScope,
      dryRun,
      cwd,
    });

    if (!dryRun && removedType === "bundle") {
      await recordBundleRemovalState({
        scope,
        platform,
        bundleId: target,
        ruleFilePath: syncResult.filePath,
        cwd,
      });
    }

    printRemoveSummary({
      platform,
      scope,
      target,
      removed,
      terminalIntegrationCleanup,
      dryRun,
    });
    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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

function resolveRemoveAllScopes(scopeOption) {
  const normalizedScope = normalizeRemoveAllScope(scopeOption);
  if (normalizedScope === "all") return ["project", "global"];
  return [normalizedScope];
}

function resolveRemoveAllPlatforms(platformOption) {
  const raw = String(platformOption || "all")
    .trim()
    .toLowerCase();
  if (!raw || raw === "all") return [...PLATFORM_IDS];
  const candidates = raw
    .split(",")
    .map((item) => normalizePlatform(item))
    .filter(Boolean);
  const normalized = [];
  for (const candidate of candidates) {
    if (!WORKFLOW_PROFILES[candidate]) {
      throw new Error(
        `Unknown platform '${candidate}'. Use codex|antigravity|copilot|all.`,
      );
    }
    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }
  if (normalized.length === 0) return [...PLATFORM_IDS];
  return normalized;
}

function stripManagedBlocksFromRuleContent(content) {
  const patterns = [
    /[ \t]*<!--\s*cbx:workflows:auto:start[^>]*-->[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->[ \t]*\n?/g,
    /[ \t]*<!--\s*cbx:terminal:verification:start[^>]*-->[\s\S]*?<!--\s*cbx:terminal:verification:end\s*-->[ \t]*\n?/g,
    /[ \t]*<!--\s*cbx:engineering:auto:start[^>]*-->[\s\S]*?<!--\s*cbx:engineering:auto:end\s*-->[ \t]*\n?/g,
  ];
  let next = String(content || "");
  for (const pattern of patterns) {
    next = next.replace(pattern, "");
  }
  next = next.replace(/\n{3,}/g, "\n\n").trimEnd();
  if (next.length > 0) next = `${next}\n`;
  return next;
}

async function removeManagedBlocksFromRuleFile({ filePath, dryRun = false }) {
  if (!(await pathExists(filePath))) {
    return { filePath, action: "missing" };
  }
  const original = await readFile(filePath, "utf8");
  const next = stripManagedBlocksFromRuleContent(original);
  if (next === original) {
    return { filePath, action: "unchanged" };
  }
  if (!next.trim()) {
    if (!dryRun) {
      await rm(filePath, { recursive: true, force: true });
    }
    return {
      filePath,
      action: dryRun ? "would-remove" : "removed",
    };
  }
  if (!dryRun) {
    await writeFile(filePath, next, "utf8");
  }
  return {
    filePath,
    action: dryRun ? "would-patch" : "patched",
  };
}

async function removePathRecord({
  targetPath,
  category,
  dryRun = false,
  records,
}) {
  if (!targetPath) return;
  if (await safeRemove(targetPath, dryRun)) {
    records.push({
      path: targetPath,
      category,
      action: dryRun ? "would-remove" : "removed",
    });
  }
}

async function removeEmptyDirectoryRecord({
  dirPath,
  category,
  dryRun = false,
  records,
}) {
  if (!dirPath) return;
  if (!(await pathExists(dirPath))) return;

  let entries = [];
  try {
    entries = await readdir(dirPath);
  } catch {
    return;
  }

  if (entries.length > 0) return;

  if (dryRun) {
    records.push({
      path: dirPath,
      category,
      action: "would-remove",
    });
    return;
  }

  await rm(dirPath, { recursive: true, force: true });
  records.push({
    path: dirPath,
    category,
    action: "removed",
  });
}

async function removeMcpRuntimeEntriesJson({
  filePath,
  keyName,
  serverIds,
  dryRun = false,
}) {
  if (!(await pathExists(filePath))) {
    return { path: filePath, action: "missing", warnings: [] };
  }

  const warnings = [];
  let parsed = {};
  try {
    const raw = await readFile(filePath, "utf8");
    const decoded = parseJsonLenient(raw);
    if (
      !decoded.ok ||
      !decoded.value ||
      typeof decoded.value !== "object" ||
      Array.isArray(decoded.value)
    ) {
      warnings.push(
        `Skipped MCP runtime cleanup for ${filePath} because JSON structure is invalid.`,
      );
      return { path: filePath, action: "skipped", warnings };
    }
    parsed = decoded.value;
  } catch (error) {
    warnings.push(
      `Skipped MCP runtime cleanup for ${filePath}: ${error.message}`,
    );
    return { path: filePath, action: "skipped", warnings };
  }

  const next = cloneJsonObject(parsed);
  const table =
    next[keyName] &&
    typeof next[keyName] === "object" &&
    !Array.isArray(next[keyName])
      ? { ...next[keyName] }
      : {};
  let changed = false;
  for (const serverId of serverIds) {
    if (Object.prototype.hasOwnProperty.call(table, serverId)) {
      delete table[serverId];
      changed = true;
    }
  }
  if (!changed) {
    return { path: filePath, action: "unchanged", warnings };
  }
  next[keyName] = table;

  if (!dryRun) {
    await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }
  return {
    path: filePath,
    action: dryRun ? "would-patch" : "patched",
    warnings,
  };
}

async function removePlatformMcpRuntimeTargets({
  platform,
  scope,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const workspaceRoot = findWorkspaceRoot(cwd);
  const serverIds = [POSTMAN_SKILL_ID, FOUNDRY_MCP_SERVER_ID, STITCH_MCP_SERVER_ID];

  if (platform === "antigravity") {
    const settingsPath =
      scope === "global"
        ? path.join(os.homedir(), ".gemini", "settings.json")
        : path.join(workspaceRoot, ".gemini", "settings.json");
    return [
      await removeMcpRuntimeEntriesJson({
        filePath: settingsPath,
        keyName: "mcpServers",
        serverIds,
        dryRun,
      }),
    ];
  }

  if (platform === "copilot") {
    const targetPath =
      scope === "global"
        ? path.join(os.homedir(), ".copilot", "mcp-config.json")
        : path.join(workspaceRoot, ".vscode", "mcp.json");
    const keyName = scope === "global" ? "mcpServers" : "servers";
    return [
      await removeMcpRuntimeEntriesJson({
        filePath: targetPath,
        keyName,
        serverIds,
        dryRun,
      }),
    ];
  }

  if (platform === "codex") {
    if (scope === "project") {
      return [
        await removeMcpRuntimeEntriesJson({
          filePath: path.join(workspaceRoot, ".vscode", "mcp.json"),
          keyName: "servers",
          serverIds,
          dryRun,
        }),
      ];
    }

    const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");
    if (dryRun) {
      return [
        {
          path: codexConfigPath,
          action: "would-patch",
          warnings: [],
        },
      ];
    }

    const warnings = [];
    for (const serverId of serverIds) {
      try {
        await execFile("codex", ["mcp", "remove", serverId], { cwd });
      } catch (error) {
        warnings.push(
          `Could not remove '${serverId}' via codex CLI: ${error.message}`,
        );
      }
    }
    return [
      {
        path: codexConfigPath,
        action: "patched",
        warnings,
      },
    ];
  }

  return [
    {
      path: null,
      action: "skipped",
      warnings: [`Unsupported platform '${platform}' for MCP runtime cleanup.`],
    },
  ];
}

async function runWorkflowRemoveAll(options) {
  try {
    const opts = resolveActionOptions(options);
    const dryRun = Boolean(opts.dryRun);
    const includeCredentials = Boolean(opts.includeCredentials);
    const cwd = opts.target ? path.resolve(opts.target) : process.cwd();
    const targetExists = await pathExists(cwd);
    if (!targetExists) {
      throw new Error(`Target directory does not exist: ${cwd}`);
    }

    const scopes = resolveRemoveAllScopes(opts.scope);
    const platforms = resolveRemoveAllPlatforms(opts.platform);
    const bundleIds = await listBundleIds();
    const knownTopLevelSkillIds =
      await listTopLevelSkillIdsFromRoot(workflowSkillsRoot());

    if (!dryRun && !opts.yes && process.stdin.isTTY) {
      const proceed = await confirm({
        message: `Remove ALL CBX-managed artifacts for platforms [${platforms.join(", ")}] and scopes [${scopes.join(", ")}]?`,
        default: false,
      });
      if (!proceed) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    const removedRecords = [];
    const ruleRecords = [];
    const mcpRuntimeRecords = [];
    const warnings = [];

    for (const scope of scopes) {
      for (const platform of platforms) {
        const artifactProfilePaths = await resolveProfilePaths(
          platform,
          scope,
          cwd,
        );
        const profileCandidates = resolveProfilePathCandidates(
          platform,
          scope,
          cwd,
        );
        const legacySkillDirs = resolveLegacySkillDirsForCleanup(
          platform,
          scope,
          cwd,
        );
        const allSkillDirs = expandUniquePaths(
          [...profileCandidates.skillsDirs, ...legacySkillDirs],
          cwd,
        );
        const isPrimaryDir = (candidateDir, primaryDir) => {
          if (!candidateDir || !primaryDir) return false;
          return path.resolve(candidateDir) === path.resolve(primaryDir);
        };
        const alternateWorkflowsDirs = profileCandidates.workflowsDirs.filter(
          (dirPath) => !isPrimaryDir(dirPath, artifactProfilePaths.workflowsDir),
        );
        const alternateAgentsDirs = profileCandidates.agentsDirs.filter(
          (dirPath) => !isPrimaryDir(dirPath, artifactProfilePaths.agentsDir),
        );
        const alternateCommandsDirs = profileCandidates.commandsDirs.filter(
          (dirPath) => !isPrimaryDir(dirPath, artifactProfilePaths.commandsDir),
        );
        const alternatePromptsDirs = profileCandidates.promptsDirs.filter(
          (dirPath) => !isPrimaryDir(dirPath, artifactProfilePaths.promptsDir),
        );
        const alternateSkillsDirs = allSkillDirs.filter(
          (dirPath) => !isPrimaryDir(dirPath, artifactProfilePaths.skillsDir),
        );

        for (const bundleId of bundleIds) {
          const manifest = await readBundleManifest(bundleId);
          const removedBundle = await removeBundleArtifacts({
            bundleId,
            manifest,
            platform,
            scope,
            profilePathsOverride: artifactProfilePaths,
            dryRun,
            cwd,
          });
          for (const removedPath of removedBundle.removed) {
            removedRecords.push({
              path: removedPath,
              category: `${platform}/${scope}/bundle`,
              action: dryRun ? "would-remove" : "removed",
            });
          }

          const platformSpec = manifest.platforms?.[platform];
          if (!platformSpec) continue;

          const workflowFiles = (platformSpec.workflows || []).map((entry) =>
            path.basename(entry),
          );
          const agentFiles = (platformSpec.agents || []).map((entry) =>
            path.basename(entry),
          );
          const commandFiles = (platformSpec.commands || []).map((entry) =>
            path.basename(entry),
          );
          const promptFiles = (platformSpec.prompts || []).map((entry) =>
            path.basename(entry),
          );
          const skillIds = await resolveInstallSkillIds({
            platformSpec,
            extraSkillIds: [],
          });
          const wrapperSkillIds =
            platform === "codex" ? buildCodexWrapperSkillIds(platformSpec) : [];
          const bundleSkillIds = [...new Set([...skillIds, ...wrapperSkillIds])];

          for (const workflowsDir of alternateWorkflowsDirs) {
            for (const workflowFile of workflowFiles) {
              await removePathRecord({
                targetPath: path.join(workflowsDir, workflowFile),
                category: `${platform}/${scope}/bundle-alt`,
                dryRun,
                records: removedRecords,
              });
            }
          }
          for (const agentsDir of alternateAgentsDirs) {
            for (const agentFile of agentFiles) {
              await removePathRecord({
                targetPath: path.join(agentsDir, agentFile),
                category: `${platform}/${scope}/bundle-alt`,
                dryRun,
                records: removedRecords,
              });
            }
          }
          for (const commandsDir of alternateCommandsDirs) {
            for (const commandFile of commandFiles) {
              await removePathRecord({
                targetPath: path.join(commandsDir, commandFile),
                category: `${platform}/${scope}/bundle-alt`,
                dryRun,
                records: removedRecords,
              });
            }
          }
          for (const promptsDir of alternatePromptsDirs) {
            for (const promptFile of promptFiles) {
              await removePathRecord({
                targetPath: path.join(promptsDir, promptFile),
                category: `${platform}/${scope}/bundle-alt`,
                dryRun,
                records: removedRecords,
              });
            }
          }
          for (const skillsDir of alternateSkillsDirs) {
            for (const skillId of bundleSkillIds) {
              await removePathRecord({
                targetPath: path.join(skillsDir, skillId),
                category: `${platform}/${scope}/bundle-alt`,
                dryRun,
                records: removedRecords,
              });
            }
          }
        }

        for (const skillsDir of allSkillDirs) {
          for (const entry of [
            POSTMAN_SKILL_ID,
            STITCH_SKILL_ID,
            "skills_index.json",
          ]) {
            await removePathRecord({
              targetPath: path.join(skillsDir, entry),
              category: `${platform}/${scope}/extra-skill`,
              dryRun,
              records: removedRecords,
            });
          }
          for (const skillId of knownTopLevelSkillIds) {
            await removePathRecord({
              targetPath: path.join(skillsDir, skillId),
              category: `${platform}/${scope}/known-skill`,
              dryRun,
              records: removedRecords,
            });
          }
        }

        if (platform === "antigravity") {
          const terminalCleanup = await cleanupAntigravityTerminalIntegration({
            scope,
            cwd,
            dryRun,
          });
          if (terminalCleanup.dirRemoved) {
            removedRecords.push({
              path: terminalCleanup.integrationDir,
              category: `${platform}/${scope}/terminal-integration`,
              action: dryRun ? "would-remove" : "removed",
            });
          }
        }

        await removePathRecord({
          targetPath: resolvePostmanMcpDefinitionPath({
            platform,
            scope,
            cwd,
          }),
          category: `${platform}/${scope}/mcp-definition`,
          dryRun,
          records: removedRecords,
        });
        if (platform === "antigravity") {
          await removePathRecord({
            targetPath: resolveStitchMcpDefinitionPath({ scope, cwd }),
            category: `${platform}/${scope}/stitch-mcp-definition`,
            dryRun,
            records: removedRecords,
          });
        }

        const runtimeResults = await removePlatformMcpRuntimeTargets({
          platform,
          scope,
          dryRun,
          cwd,
        });
        mcpRuntimeRecords.push(
          ...runtimeResults.map((item) => ({ platform, scope, ...item })),
        );
        for (const runtimeResult of runtimeResults) {
          if (runtimeResult.warnings?.length > 0) {
            warnings.push(...runtimeResult.warnings);
          }
        }

        for (const managedDir of expandUniquePaths(
          [
            ...profileCandidates.skillsDirs,
            ...profileCandidates.agentsDirs,
            ...profileCandidates.workflowsDirs,
            ...profileCandidates.commandsDirs,
            ...profileCandidates.promptsDirs,
            ...legacySkillDirs,
          ],
          cwd,
        )) {
          await removeEmptyDirectoryRecord({
            dirPath: managedDir,
            category: `${platform}/${scope}/managed-dir-empty`,
            dryRun,
            records: removedRecords,
          });
        }

        const scopedProfilePaths = await resolveProfilePaths(platform, scope, cwd);
        const ruleCandidates = [...scopedProfilePaths.ruleFilesByPriority];
        if (scope === "global") {
          const workspaceRule = await resolveWorkspaceRuleFileForGlobalScope(
            platform,
            cwd,
          );
          if (workspaceRule) {
            ruleCandidates.push(workspaceRule);
          }
        }
        for (const rulePath of [...new Set(ruleCandidates)]) {
          const result = await removeManagedBlocksFromRuleFile({
            filePath: rulePath,
            dryRun,
          });
          ruleRecords.push({ platform, scope, ...result });
        }
      }

      const stateFilePath = getStateFilePath(scope, cwd);
      await removePathRecord({
        targetPath: stateFilePath,
        category: `${scope}/state`,
        dryRun,
        records: removedRecords,
      });
      await removePathRecord({
        targetPath: resolveCbxConfigPath({ scope, cwd }),
        category: `${scope}/cbx-config`,
        dryRun,
        records: removedRecords,
      });
      await removePathRecord({
        targetPath: resolveLegacyPostmanConfigPath({ scope, cwd }),
        category: `${scope}/legacy-config`,
        dryRun,
        records: removedRecords,
      });
      await removePathRecord({
        targetPath: resolveMcpRootPath({ scope, cwd }),
        category: `${scope}/mcp-root`,
        dryRun,
        records: removedRecords,
      });

      if (scope === "project") {
        const workspaceRoot = findWorkspaceRoot(cwd);
        for (const projectFile of [
          path.join(workspaceRoot, "AGENTS.md"),
          path.join(workspaceRoot, "ENGINEERING_RULES.md"),
          path.join(workspaceRoot, "TECH.md"),
        ]) {
          await removePathRecord({
            targetPath: projectFile,
            category: "project/rules-doc",
            dryRun,
            records: removedRecords,
          });
        }
        await removePathRecord({
          targetPath: path.join(workspaceRoot, ".cbx"),
          category: "project/.cbx-root",
          dryRun,
          records: removedRecords,
        });
      } else if (scope === "global" || includeCredentials) {
        await removePathRecord({
          targetPath: resolveManagedCredentialsEnvPath(),
          category: "global/credentials",
          dryRun,
          records: removedRecords,
        });
      }

      if (scope === "global") {
        for (const globalRootDir of [
          path.join(os.homedir(), ".cbx"),
          path.join(os.homedir(), ".agents"),
        ]) {
          await removeEmptyDirectoryRecord({
            dirPath: globalRootDir,
            category: "global/root-dir-empty",
            dryRun,
            records: removedRecords,
          });
        }
      }
    }

    if (await checkDockerAvailable({ cwd })) {
      const containerName = DEFAULT_MCP_DOCKER_CONTAINER_NAME;
      const existing = await inspectDockerContainerByName({
        name: containerName,
        cwd,
      });
      if (existing) {
        if (!dryRun) {
          await execFile("docker", ["rm", "-f", containerName], { cwd });
        }
        removedRecords.push({
          path: containerName,
          category: "docker/runtime-container",
          action: dryRun ? "would-remove" : "removed",
        });
      }
    } else {
      warnings.push(
        "Docker is unavailable; runtime container cleanup was skipped.",
      );
    }

    console.log("Remove-all summary:");
    console.log(`- Target root: ${cwd}`);
    console.log(`- Platforms: ${platforms.join(", ")}`);
    console.log(`- Scopes: ${scopes.join(", ")}`);
    console.log(
      `- Files/dirs ${dryRun ? "to remove" : "removed"}: ${removedRecords.length}`,
    );
    console.log(`- Rule files processed: ${ruleRecords.length}`);
    console.log(`- MCP runtime targets processed: ${mcpRuntimeRecords.length}`);

    if (removedRecords.length > 0) {
      console.log(`\n${dryRun ? "Would remove" : "Removed"} paths:`);
      for (const item of removedRecords) {
        console.log(`- [${item.category}] ${item.path}`);
      }
    }

    if (ruleRecords.length > 0) {
      console.log("\nRule file cleanup:");
      for (const item of ruleRecords) {
        console.log(`- [${item.platform}/${item.scope}] ${item.filePath}: ${item.action}`);
      }
    }

    if (mcpRuntimeRecords.length > 0) {
      console.log("\nMCP runtime target cleanup:");
      for (const item of mcpRuntimeRecords) {
        console.log(
          `- [${item.platform}/${item.scope}] ${item.path || "n/a"}: ${item.action}`,
        );
      }
    }

    if (warnings.length > 0) {
      console.log("\nWarnings:");
      for (const warning of warnings) {
        console.log(`- ${warning}`);
      }
    }

    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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
    const platform = await resolvePlatform(
      options.platform,
      scope,
      process.cwd(),
    );
    const syncResult = await syncRulesForPlatform({
      platform,
      scope,
      dryRun,
      cwd: process.cwd(),
    });

    if (options.json) {
      console.log(JSON.stringify(syncResult, null, 2));
      return;
    }

    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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
    const platform = await resolvePlatform(
      platformArg || options.platform,
      scope,
      process.cwd(),
    );
    const report = await createDoctorReport({
      platform,
      scope,
      cwd: process.cwd(),
    });

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

function cloneJsonObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value));
}

function resolveActionOptions(options) {
  if (!options) return {};
  if (typeof options.optsWithGlobals === "function") {
    const resolved = options.optsWithGlobals();
    return resolved && typeof resolved === "object" ? resolved : {};
  }
  if (typeof options.opts === "function") {
    const resolved = options.opts();
    return resolved && typeof resolved === "object" ? resolved : {};
  }
  return options;
}

function readCliOptionFromArgv(optionName) {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === optionName) {
      return argv[i + 1] ?? null;
    }
    if (token.startsWith(`${optionName}=`)) {
      return token.slice(optionName.length + 1);
    }
  }
  return null;
}

function hasCliFlag(optionName) {
  const argv = process.argv.slice(2);
  return argv.includes(optionName);
}

function prepareConfigDocument(existingValue, { scope, generatedBy }) {
  const next = cloneJsonObject(existingValue);
  if (!next.schemaVersion || typeof next.schemaVersion !== "number")
    next.schemaVersion = 1;
  next.generatedBy = generatedBy;
  next.generatedAt = new Date().toISOString();
  if (!next.mcp || typeof next.mcp !== "object" || Array.isArray(next.mcp))
    next.mcp = {};
  next.mcp.scope = scope;
  if (!next.mcp.server) next.mcp.server = POSTMAN_SKILL_ID;
  return next;
}

function ensureCredentialServiceState(configValue, service) {
  if (service === "postman") {
    return (
      parseStoredPostmanConfig(configValue) ||
      parseStoredCredentialServiceConfig({ service, rawService: {} })
    );
  }
  return (
    parseStoredStitchConfig(configValue) ||
    parseStoredCredentialServiceConfig({ service: "stitch", rawService: {} })
  );
}

function upsertCredentialServiceConfig(configValue, service, serviceState) {
  if (service === "postman") {
    return upsertNormalizedPostmanConfig(configValue, serviceState);
  }
  return upsertNormalizedStitchConfig(configValue, serviceState);
}

function buildConfigShowPayload(rawConfig) {
  const payload = cloneJsonObject(rawConfig);
  const postmanState = ensureCredentialServiceState(payload, "postman");
  upsertNormalizedPostmanConfig(payload, postmanState);

  const stitchState = parseStoredStitchConfig(payload);
  if (stitchState) {
    upsertNormalizedStitchConfig(payload, stitchState);
  }

  payload.status = {
    postman: resolveCredentialEffectiveStatus({
      service: "postman",
      serviceConfig: postmanState,
    }),
  };
  if (stitchState) {
    payload.status.stitch = resolveCredentialEffectiveStatus({
      service: "stitch",
      serviceConfig: stitchState,
    });
  }

  return payload;
}

function normalizeProfileNameOrThrow(name) {
  const normalizedName = normalizeCredentialProfileName(name);
  if (!normalizedName) {
    throw new Error("Missing required profile name. Use --name <profile>.");
  }
  if (
    RESERVED_CREDENTIAL_PROFILE_NAMES.has(
      credentialProfileNameKey(normalizedName),
    )
  ) {
    throw new Error(`Profile name '${normalizedName}' is reserved.`);
  }
  return normalizedName;
}

function findProfileByName(profiles, profileName) {
  const key = credentialProfileNameKey(profileName);
  return (
    profiles.find(
      (profile) => credentialProfileNameKey(profile.name) === key,
    ) || null
  );
}

async function loadConfigForScope({ scope, cwd = process.cwd() }) {
  const configPath = resolveCbxConfigPath({ scope, cwd });
  await assertNoLegacyOnlyPostmanConfig({ scope, cwd });
  const existing = await readJsonFileIfExists(configPath);
  const existingValue =
    existing.value &&
    typeof existing.value === "object" &&
    !Array.isArray(existing.value)
      ? existing.value
      : null;
  if (existing.exists && !existingValue) {
    throw new Error(
      `Existing config at ${configPath} is not valid JSON object.`,
    );
  }
  return { configPath, existing, existingValue };
}

async function writeConfigFile({
  configPath,
  nextConfig,
  existingExists,
  dryRun,
}) {
  const content = `${JSON.stringify(nextConfig, null, 2)}\n`;
  if (!dryRun) {
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, content, "utf8");
  }
  return dryRun
    ? existingExists
      ? "would-update"
      : "would-create"
    : existingExists
      ? "updated"
      : "created";
}

async function persistMcpRuntimePreference({
  scope,
  runtime,
  fallback = null,
  cwd = process.cwd(),
  generatedBy = "cbx mcp runtime up",
}) {
  const { configPath, existing, existingValue } = await loadConfigForScope({
    scope,
    cwd,
  });
  if (!existing.exists || !existingValue) {
    return {
      action: "skipped",
      configPath,
      reason: "config-missing",
    };
  }
  const next = prepareConfigDocument(existingValue, {
    scope,
    generatedBy,
  });
  if (!next.mcp || typeof next.mcp !== "object" || Array.isArray(next.mcp)) {
    next.mcp = {};
  }
  next.mcp.runtime = runtime;
  next.mcp.effectiveRuntime = runtime;
  if (fallback) {
    next.mcp.fallback = fallback;
  }
  const action = await writeConfigFile({
    configPath,
    nextConfig: next,
    existingExists: existing.exists,
    dryRun: false,
  });
  return {
    action,
    configPath,
    reason: null,
  };
}

function toProfileEnvSuffix(profileName) {
  const normalized =
    normalizeCredentialProfileName(profileName) ||
    DEFAULT_CREDENTIAL_PROFILE_NAME;
  const suffix = normalized
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return suffix || "DEFAULT";
}

function profileEnvVarAlias(service, profileName) {
  const prefix = service === "stitch" ? "STITCH_API_KEY_" : "POSTMAN_API_KEY_";
  return `${prefix}${toProfileEnvSuffix(profileName)}`;
}

function collectInlineCredentialFindings(configValue) {
  const findings = [];
  const record =
    configValue &&
    typeof configValue === "object" &&
    !Array.isArray(configValue)
      ? configValue
      : {};

  const scanService = (serviceId) => {
    const section = record[serviceId];
    if (!section || typeof section !== "object" || Array.isArray(section))
      return;

    if (normalizePostmanApiKey(section.apiKey)) {
      findings.push({
        service: serviceId,
        path: `${serviceId}.apiKey`,
      });
    }

    if (Array.isArray(section.profiles)) {
      section.profiles.forEach((profile, index) => {
        if (!profile || typeof profile !== "object" || Array.isArray(profile))
          return;
        if (normalizePostmanApiKey(profile.apiKey)) {
          findings.push({
            service: serviceId,
            profileName: normalizeCredentialProfileName(profile.name) || null,
            path: `${serviceId}.profiles[${index}].apiKey`,
          });
        }
      });
      return;
    }

    if (
      serviceId === "stitch" &&
      section.profiles &&
      typeof section.profiles === "object" &&
      !Array.isArray(section.profiles)
    ) {
      for (const [profileName, profile] of Object.entries(section.profiles)) {
        if (!profile || typeof profile !== "object" || Array.isArray(profile))
          continue;
        if (normalizePostmanApiKey(profile.apiKey)) {
          findings.push({
            service: serviceId,
            profileName,
            path: `${serviceId}.profiles.${profileName}.apiKey`,
          });
        }
      }
    }
  };

  scanService("postman");
  scanService("stitch");
  return findings;
}

function migrateInlineCredentialsInConfig(configValue) {
  const next =
    configValue &&
    typeof configValue === "object" &&
    !Array.isArray(configValue)
      ? cloneJsonObject(configValue)
      : {};
  const findings = collectInlineCredentialFindings(next);
  const requiredEnvVars = new Set();

  const normalizeSection = (serviceId) => {
    const serviceState = ensureCredentialServiceState(next, serviceId);
    const profiles = serviceState.profiles.map((profile) => {
      const envVar = isCredentialServiceEnvVar(profile.apiKeyEnvVar)
        ? profile.apiKeyEnvVar
        : profileEnvVarAlias(serviceId, profile.name);
      requiredEnvVars.add(envVar);
      return {
        ...profile,
        apiKey: null,
        apiKeyEnvVar: envVar,
      };
    });

    const updatedServiceState = {
      ...serviceState,
      profiles,
      activeProfileName:
        findProfileByName(profiles, serviceState.activeProfileName)?.name ||
        profiles[0]?.name ||
        DEFAULT_CREDENTIAL_PROFILE_NAME,
    };
    upsertCredentialServiceConfig(next, serviceId, updatedServiceState);
  };

  const hasPostmanSection =
    next.postman &&
    typeof next.postman === "object" &&
    !Array.isArray(next.postman);
  const hasStitchSection =
    next.stitch &&
    typeof next.stitch === "object" &&
    !Array.isArray(next.stitch);

  if (hasPostmanSection) normalizeSection("postman");
  if (hasStitchSection) normalizeSection("stitch");

  return {
    next,
    findings,
    requiredEnvVars: [...requiredEnvVars].sort(),
    changed: JSON.stringify(next) !== JSON.stringify(configValue || {}),
  };
}

async function collectInlineHeaderFindings({ scope, cwd = process.cwd() }) {
  const findings = [];
  const stitchDefinitionPath = resolveStitchMcpDefinitionPath({ scope, cwd });
  const geminiSettingsPath =
    scope === "global"
      ? path.join(os.homedir(), ".gemini", "settings.json")
      : path.join(findWorkspaceRoot(cwd), ".gemini", "settings.json");

  const scanFile = async (filePath) => {
    if (!(await pathExists(filePath))) return;
    const raw = await readFile(filePath, "utf8");
    const unsafeStitchHeader =
      /X-Goog-Api-Key:(?!\s*\$\{[A-Za-z_][A-Za-z0-9_]*\})\s*[^"\n]+/i;
    const unsafeBearerHeader = /"Authorization"\s*:\s*"Bearer\s+(?!\$\{)[^"]+/i;
    if (unsafeStitchHeader.test(raw) || unsafeBearerHeader.test(raw)) {
      findings.push(filePath);
    }
  };

  await scanFile(stitchDefinitionPath);
  await scanFile(geminiSettingsPath);
  return findings;
}

async function runWorkflowConfigKeysList(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const service = normalizeCredentialService(opts.service, {
      allowAll: true,
    });
    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });

    console.log(`Config file: ${configPath}`);
    if (!existing.exists) {
      console.log("Status: missing");
      return;
    }

    const services = service === "all" ? ["postman", "stitch"] : [service];
    for (const serviceId of services) {
      const serviceState = ensureCredentialServiceState(
        existingValue,
        serviceId,
      );
      if (serviceId === "stitch" && !parseStoredStitchConfig(existingValue)) {
        console.log(`\n${serviceId}: not configured`);
        continue;
      }
      const effective = resolveCredentialEffectiveStatus({
        service: serviceId,
        serviceConfig: serviceState,
      });
      console.log(
        `\n${serviceId}: active=${serviceState.activeProfileName} profiles=${serviceState.profiles.length}`,
      );
      console.log(`- Stored source: ${effective.storedSource}`);
      console.log(`- Effective source: ${effective.effectiveSource}`);
      console.log(`- Effective env var: ${effective.effectiveEnvVar}`);
      for (const profile of serviceState.profiles) {
        const marker =
          credentialProfileNameKey(profile.name) ===
          credentialProfileNameKey(serviceState.activeProfileName)
            ? "*"
            : " ";
        const workspaceSuffix =
          serviceId === "postman"
            ? ` workspace=${normalizePostmanWorkspaceId(profile.workspaceId) ?? "null"}`
            : "";
        console.log(
          `  ${marker} ${profile.name} env=${profile.apiKeyEnvVar}${workspaceSuffix}`,
        );
      }
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

async function runWorkflowConfigKeysAdd(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = hasCliFlag("--dry-run") || Boolean(opts.dryRun);
    const service = normalizeCredentialService(opts.service);
    const profileName = normalizeProfileNameOrThrow(opts.name);
    const envVar = normalizePostmanApiKey(opts.envVar);
    if (!envVar || !isCredentialServiceEnvVar(envVar)) {
      throw new Error(
        "Missing or invalid --env-var. Example: --env-var POSTMAN_API_KEY",
      );
    }

    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    const next = prepareConfigDocument(existingValue, {
      scope,
      generatedBy: "cbx workflows config keys add",
    });

    const serviceState = ensureCredentialServiceState(next, service);
    if (findProfileByName(serviceState.profiles, profileName)) {
      throw new Error(
        `Profile '${profileName}' already exists for ${service}.`,
      );
    }

    const newProfile = normalizeCredentialProfileRecord(service, {
      name: profileName,
      apiKey: null,
      apiKeyEnvVar: envVar,
      workspaceId:
        service === "postman"
          ? normalizePostmanWorkspaceId(opts.workspaceId)
          : undefined,
    });
    const updatedServiceState = {
      ...serviceState,
      profiles: dedupeCredentialProfiles([
        ...serviceState.profiles,
        newProfile,
      ]),
    };
    upsertCredentialServiceConfig(next, service, updatedServiceState);

    const action = await writeConfigFile({
      configPath,
      nextConfig: next,
      existingExists: existing.exists,
      dryRun,
    });
    console.log(`Config file: ${configPath}`);
    console.log(`Action: ${action}`);
    console.log(
      `Added profile '${profileName}' for ${service} (env var ${envVar}).`,
    );
    console.log(
      `Active profile remains '${updatedServiceState.activeProfileName}'.`,
    );
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowConfigKeysUse(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = hasCliFlag("--dry-run") || Boolean(opts.dryRun);
    const service = normalizeCredentialService(opts.service);
    const profileName = normalizeProfileNameOrThrow(opts.name);

    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    if (!existing.exists) {
      throw new Error(`Config file is missing at ${configPath}.`);
    }

    const next = prepareConfigDocument(existingValue, {
      scope,
      generatedBy: "cbx workflows config keys use",
    });
    const serviceState = ensureCredentialServiceState(next, service);
    const selectedProfile = findProfileByName(
      serviceState.profiles,
      profileName,
    );
    if (!selectedProfile) {
      throw new Error(
        `Profile '${profileName}' does not exist for ${service}.`,
      );
    }

    const updatedServiceState = {
      ...serviceState,
      activeProfileName: selectedProfile.name,
    };
    upsertCredentialServiceConfig(next, service, updatedServiceState);

    const action = await writeConfigFile({
      configPath,
      nextConfig: next,
      existingExists: existing.exists,
      dryRun,
    });
    console.log(`Config file: ${configPath}`);
    console.log(`Action: ${action}`);
    console.log(`Active ${service} profile: ${selectedProfile.name}`);
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowConfigKeysRemove(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = hasCliFlag("--dry-run") || Boolean(opts.dryRun);
    const service = normalizeCredentialService(opts.service);
    const profileName = normalizeProfileNameOrThrow(opts.name);

    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    if (!existing.exists) {
      throw new Error(`Config file is missing at ${configPath}.`);
    }

    const next = prepareConfigDocument(existingValue, {
      scope,
      generatedBy: "cbx workflows config keys remove",
    });
    const serviceState = ensureCredentialServiceState(next, service);
    const selectedProfile = findProfileByName(
      serviceState.profiles,
      profileName,
    );
    if (!selectedProfile) {
      throw new Error(
        `Profile '${profileName}' does not exist for ${service}.`,
      );
    }
    if (
      credentialProfileNameKey(serviceState.activeProfileName) ===
      credentialProfileNameKey(selectedProfile.name)
    ) {
      throw new Error(
        `Cannot remove active profile '${selectedProfile.name}'. Switch active profile first.`,
      );
    }

    const updatedProfiles = serviceState.profiles.filter(
      (profile) =>
        credentialProfileNameKey(profile.name) !==
        credentialProfileNameKey(selectedProfile.name),
    );
    const updatedServiceState = {
      ...serviceState,
      profiles: updatedProfiles,
    };
    upsertCredentialServiceConfig(next, service, updatedServiceState);

    const action = await writeConfigFile({
      configPath,
      nextConfig: next,
      existingExists: existing.exists,
      dryRun,
    });
    console.log(`Config file: ${configPath}`);
    console.log(`Action: ${action}`);
    console.log(`Removed profile '${selectedProfile.name}' from ${service}.`);
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowConfigKeysMigrateInline(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = hasCliFlag("--dry-run") || Boolean(opts.dryRun);

    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    if (!existing.exists) {
      throw new Error(`Config file is missing at ${configPath}.`);
    }

    const result = migrateInlineCredentialsInConfig(existingValue);
    const action = await writeConfigFile({
      configPath,
      nextConfig: result.next,
      existingExists: existing.exists,
      dryRun,
    });

    console.log(`Config file: ${configPath}`);
    console.log(`Action: ${action}`);
    console.log(`Inline key fields found: ${result.findings.length}`);
    if (result.findings.length > 0) {
      for (const finding of result.findings) {
        console.log(`- migrated ${finding.path}`);
      }
    }
    if (result.requiredEnvVars.length > 0) {
      console.log("Required env vars:");
      for (const envVar of result.requiredEnvVars) {
        console.log(`- ${envVar}`);
      }
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

async function runWorkflowConfigKeysDoctor(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });

    console.log(`Config file: ${configPath}`);
    if (!existing.exists) {
      console.log("Status: missing");
      return;
    }

    const configFindings = collectInlineCredentialFindings(existingValue);
    const artifactFindings = await collectInlineHeaderFindings({ scope, cwd });
    const migrationPreview = migrateInlineCredentialsInConfig(existingValue);

    console.log(`Inline key findings: ${configFindings.length}`);
    for (const finding of configFindings) {
      console.log(`- ${finding.path}`);
    }

    console.log(`Unsafe header findings: ${artifactFindings.length}`);
    for (const filePath of artifactFindings) {
      console.log(`- ${filePath}`);
    }

    if (migrationPreview.requiredEnvVars.length > 0) {
      console.log("Expected env vars:");
      for (const envVar of migrationPreview.requiredEnvVars) {
        console.log(`- ${envVar}`);
      }
    }

    if (configFindings.length === 0 && artifactFindings.length === 0) {
      console.log("Doctor result: clean");
    } else {
      console.log(
        "Doctor result: issues detected. Run `cbx workflows config keys migrate-inline --scope " +
          scope +
          "` and reinstall with `--overwrite`.",
      );
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

async function runWorkflowConfigKeysPersistEnv(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = hasCliFlag("--dry-run") || Boolean(opts.dryRun);
    const service = normalizeCredentialService(opts.service || "all", {
      allowAll: true,
    });
    const requestedProfileName = normalizeCredentialProfileName(opts.profile);
    const allProfiles = Boolean(opts.allProfiles);

    if (requestedProfileName && allProfiles) {
      throw new Error(
        "Use either --profile <name> or --all-profiles, not both.",
      );
    }

    await loadManagedCredentialsEnv();
    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    if (!existing.exists || !existingValue) {
      throw new Error(`Config file is missing at ${configPath}.`);
    }

    const services = service === "all" ? ["postman", "stitch"] : [service];
    const envVarNames = [];
    const warnings = [];

    for (const serviceId of services) {
      const state = ensureCredentialServiceState(existingValue, serviceId);
      let selectedProfiles = [];

      if (requestedProfileName) {
        const selected = findProfileByName(state.profiles, requestedProfileName);
        if (!selected) {
          warnings.push(
            `${serviceId}: profile '${requestedProfileName}' was not found`,
          );
          continue;
        }
        selectedProfiles = [selected];
      } else if (allProfiles) {
        selectedProfiles = [...state.profiles];
      } else if (state.activeProfile) {
        selectedProfiles = [state.activeProfile];
      }

      if (selectedProfiles.length === 0) {
        warnings.push(
          `${serviceId}: no profile selected (service has no configured profiles)`,
        );
        continue;
      }

      for (const profile of selectedProfiles) {
        const envVar = normalizePostmanApiKey(profile?.apiKeyEnvVar);
        if (!envVar || !isCredentialServiceEnvVar(envVar)) {
          warnings.push(
            `${serviceId}: profile '${profile?.name || "(unknown)"}' has invalid env var alias`,
          );
          continue;
        }
        envVarNames.push(envVar);
      }
    }

    const uniqueEnvVarNames = unique(envVarNames);
    if (uniqueEnvVarNames.length === 0) {
      throw new Error(
        "No env var aliases were selected. Add profiles first or adjust --service/--profile.",
      );
    }

    const persisted = await persistManagedCredentialsEnv({
      envVarNames: uniqueEnvVarNames,
      dryRun,
    });

    console.log(`Config file: ${configPath}`);
    console.log(`Credentials env file: ${persisted.envPath}`);
    console.log(`Action: ${persisted.action}`);
    console.log(`Requested env vars: ${uniqueEnvVarNames.length}`);
    console.log(
      `Persisted env vars: ${persisted.persisted.length > 0 ? persisted.persisted.join(", ") : "(none)"}`,
    );
    if (persisted.missing.length > 0) {
      console.log(`Missing in current shell: ${persisted.missing.join(", ")}`);
    }
    if (warnings.length > 0) {
      console.log("Warnings:");
      for (const warning of warnings) {
        console.log(`- ${warning}`);
      }
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

async function runWorkflowConfig(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scopeArg = readCliOptionFromArgv("--scope");
    await loadManagedCredentialsEnv();
    const scope = normalizeMcpScope(scopeArg ?? opts.scope, "global");
    const dryRun = Boolean(opts.dryRun);
    const hasWorkspaceIdOption = opts.workspaceId !== undefined;
    const wantsClearWorkspaceId = Boolean(opts.clearWorkspaceId);
    const wantsInteractiveEdit = Boolean(opts.edit);
    const hasMcpRuntimeOption = opts.mcpRuntime !== undefined;
    const hasMcpFallbackOption = opts.mcpFallback !== undefined;
    const hasPostmanModeOption = opts.postmanMode !== undefined;

    if (hasWorkspaceIdOption && wantsClearWorkspaceId) {
      throw new Error(
        "Use either --workspace-id or --clear-workspace-id, not both.",
      );
    }

    const wantsMutation =
      hasWorkspaceIdOption ||
      wantsClearWorkspaceId ||
      wantsInteractiveEdit ||
      hasMcpRuntimeOption ||
      hasMcpFallbackOption ||
      hasPostmanModeOption;
    const showOnly = Boolean(opts.show) || !wantsMutation;
    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });

    if (showOnly) {
      console.log(`Config file: ${configPath}`);
      if (!existing.exists) {
        console.log("Status: missing");
        return;
      }
      console.log(`Status: ${existing.exists ? "exists" : "missing"}`);
      const payload = buildConfigShowPayload(existingValue);
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    const next = prepareConfigDocument(existingValue, {
      scope,
      generatedBy: "cbx workflows config",
    });

    const postmanState = ensureCredentialServiceState(next, "postman");
    const activeProfile = { ...postmanState.activeProfile };
    const currentPostmanMode = resolvePostmanModeFromUrl(
      postmanState.mcpUrl,
      DEFAULT_POSTMAN_CONFIG_MODE,
    );
    let workspaceId = normalizePostmanWorkspaceId(activeProfile.workspaceId);

    if (wantsInteractiveEdit) {
      const promptedWorkspaceId = await input({
        message:
          "Postman default workspace ID (optional, leave blank or 'null' to clear):",
        default: workspaceId || "",
      });
      workspaceId = normalizePostmanWorkspaceId(promptedWorkspaceId);
    }
    if (hasWorkspaceIdOption) {
      workspaceId = normalizePostmanWorkspaceId(opts.workspaceId);
    }
    if (wantsClearWorkspaceId) {
      workspaceId = null;
    }
    const mcpRuntime = hasMcpRuntimeOption
      ? normalizeMcpRuntime(
          opts.mcpRuntime,
          normalizeMcpRuntime(next.mcp?.runtime, DEFAULT_MCP_RUNTIME),
        )
      : null;
    const mcpFallback = hasMcpFallbackOption
      ? normalizeMcpFallback(
          opts.mcpFallback,
          normalizeMcpFallback(next.mcp?.fallback, DEFAULT_MCP_FALLBACK),
        )
      : null;
    const requestedPostmanMode = hasPostmanModeOption
      ? normalizePostmanMode(opts.postmanMode, currentPostmanMode)
      : currentPostmanMode;
    const requestedPostmanMcpUrl =
      resolvePostmanMcpUrlForMode(requestedPostmanMode);

    activeProfile.workspaceId = workspaceId;
    const updatedProfiles = postmanState.profiles.map((profile) =>
      credentialProfileNameKey(profile.name) ===
      credentialProfileNameKey(postmanState.activeProfileName)
        ? activeProfile
        : profile,
    );
    const updatedPostmanState = parseStoredCredentialServiceConfig({
      service: "postman",
      rawService: {
        ...(next.postman && typeof next.postman === "object"
          ? next.postman
          : {}),
        profiles: updatedProfiles,
        activeProfileName: postmanState.activeProfileName,
        mcpUrl: requestedPostmanMcpUrl,
      },
    });
    upsertNormalizedPostmanConfig(next, updatedPostmanState);

    if (!next.mcp || typeof next.mcp !== "object" || Array.isArray(next.mcp)) {
      next.mcp = {};
    }
    if (hasMcpRuntimeOption) {
      next.mcp.runtime = mcpRuntime;
      next.mcp.effectiveRuntime = mcpRuntime;
    }
    if (hasMcpFallbackOption) {
      next.mcp.fallback = mcpFallback;
    }

    if (parseStoredStitchConfig(next)) {
      upsertNormalizedStitchConfig(next, parseStoredStitchConfig(next));
    }

    const action = await writeConfigFile({
      configPath,
      nextConfig: next,
      existingExists: existing.exists,
      dryRun,
    });
    const effectivePostmanState = ensureCredentialServiceState(next, "postman");
    const effectivePostmanMode = resolvePostmanModeFromUrl(
      effectivePostmanState.mcpUrl,
      DEFAULT_POSTMAN_CONFIG_MODE,
    );

    let postmanArtifacts = null;
    if (hasPostmanModeOption) {
      const mcpScope = resolveMcpScopeFromConfigDocument(next, scope);
      let platform = null;
      const explicitPlatform = normalizePlatform(opts.platform);
      const configuredPlatform = normalizePlatform(next?.mcp?.platform);
      if (
        explicitPlatform &&
        WORKFLOW_PROFILES[explicitPlatform]
      ) {
        platform = explicitPlatform;
      } else if (
        configuredPlatform &&
        WORKFLOW_PROFILES[configuredPlatform]
      ) {
        platform = configuredPlatform;
      } else {
        try {
          platform = await resolvePlatform(opts.platform, scope, cwd);
        } catch (error) {
          // Keep config mutation successful; surface patch guidance.
          if (!dryRun) {
            console.log(
              `Warning: platform could not be resolved for runtime patch (${error.message})`,
            );
          }
        }
      }
      postmanArtifacts = await applyPostmanConfigArtifacts({
        platform,
        mcpScope,
        configValue: next,
        dryRun,
        cwd,
      });
    }

    console.log(`Config file: ${configPath}`);
    console.log(`Action: ${action}`);
    console.log(
      `postman.defaultWorkspaceId: ${workspaceId === null ? "null" : workspaceId}`,
    );
    if (hasMcpRuntimeOption) {
      console.log(`mcp.runtime: ${mcpRuntime}`);
      console.log(`mcp.effectiveRuntime: ${mcpRuntime}`);
    }
    if (hasMcpFallbackOption) {
      console.log(`mcp.fallback: ${mcpFallback}`);
    }
    if (hasPostmanModeOption) {
      console.log(`postman.mode: ${effectivePostmanMode}`);
      console.log(`postman.mcpUrl: ${effectivePostmanState.mcpUrl}`);
      if (postmanArtifacts) {
        console.log(
          `postman.definition: ${postmanArtifacts.mcpDefinitionResult.action} (${postmanArtifacts.mcpDefinitionPath})`,
        );
        if (
          postmanArtifacts.stitchMcpDefinitionPath &&
          postmanArtifacts.stitchMcpDefinitionResult
        ) {
          console.log(
            `stitch.definition: ${postmanArtifacts.stitchMcpDefinitionResult.action} (${postmanArtifacts.stitchMcpDefinitionPath})`,
          );
        }
        if (postmanArtifacts.mcpRuntimeResult) {
          console.log(
            `platform.mcp.target: ${postmanArtifacts.mcpRuntimeResult.action} (${postmanArtifacts.mcpRuntimeResult.path || "n/a"})`,
          );
        }
        for (const warning of postmanArtifacts.warnings) {
          console.log(`Warning: ${warning}`);
        }
      }
    }
    if (Boolean(opts.showAfter)) {
      const payload = buildConfigShowPayload(next);
      console.log(JSON.stringify(payload, null, 2));
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

function resolveMcpCatalogDir({ scope, cwd = process.cwd() }) {
  return path.join(resolveMcpRootPath({ scope, cwd }), "catalog");
}

function resolveMcpCatalogPath({ service, scope, cwd = process.cwd() }) {
  return path.join(resolveMcpCatalogDir({ scope, cwd }), `${service}.json`);
}

function parseMcpJsonRpcResponse(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const lines = trimmed.split(/\r?\n/);
    const dataLines = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .filter((line) => line !== "[DONE]");
    for (let i = dataLines.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(dataLines[i]);
      } catch {
        // continue
      }
    }
  }
  return null;
}

async function sendMcpJsonRpcRequest({
  url,
  method,
  params = undefined,
  id = null,
  headers = {},
  sessionId = null,
}) {
  const requestHeaders = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    ...headers,
  };
  if (sessionId) {
    requestHeaders["mcp-session-id"] = sessionId;
  }
  const payload =
    id === null
      ? { jsonrpc: "2.0", method, params }
      : { jsonrpc: "2.0", id, method, params };
  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    const parsedError = parseMcpJsonRpcResponse(text);
    const serverMessage =
      normalizePostmanApiKey(parsedError?.error?.message) ||
      normalizePostmanApiKey(parsedError?.message);
    const detail = serverMessage ? ` (${serverMessage})` : "";
    throw new Error(
      `MCP request failed (${method}): HTTP ${response.status} ${response.statusText}${detail}`,
    );
  }
  const parsed = parseMcpJsonRpcResponse(text);
  return {
    parsed,
    sessionId:
      response.headers.get("mcp-session-id") ||
      response.headers.get("Mcp-Session-Id") ||
      sessionId,
  };
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMcpHandshakeRelatedError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("server not initialized") ||
    message.includes("already initialized") ||
    message.includes("mcp-session-id header is required") ||
    message.includes("missing mcp-session-id") ||
    message.includes("unknown mcp-session-id") ||
    message.includes("invalid mcp-session-id") ||
    message.includes("unknown session")
  );
}

async function probeMcpEndpointReady({ url, headers = {} }) {
  let sessionId = null;
  let initError = null;

  try {
    const init = await sendMcpJsonRpcRequest({
      url,
      method: "initialize",
      id: `cbx-ready-init-${Date.now()}`,
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "cbx-cli", version: CLI_VERSION },
      },
      headers,
    });
    sessionId = init.sessionId || null;
    if (sessionId) {
      // Best effort notification. Some servers ignore this safely.
      await sendMcpJsonRpcRequest({
        url,
        method: "notifications/initialized",
        id: null,
        params: {},
        headers,
        sessionId,
      }).catch(() => {});
    }
  } catch (error) {
    initError = error;
  }

  try {
    await sendMcpJsonRpcRequest({
      url,
      method: "tools/list",
      id: `cbx-runtime-ready-${Date.now()}`,
      params: {},
      headers,
      sessionId,
    });
    return;
  } catch (toolsError) {
    if (isMcpHandshakeRelatedError(toolsError)) {
      return;
    }
    if (initError && !isMcpHandshakeRelatedError(initError)) {
      throw initError;
    }
    throw toolsError;
  }
}

async function waitForMcpEndpointReady({
  url,
  headers = {},
  timeoutMs = 15000,
  intervalMs = 500,
}) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await probeMcpEndpointReady({ url, headers });
      return true;
    } catch (error) {
      if (isMcpHandshakeRelatedError(error)) {
        return true;
      }
      lastError = error;
    }
    await sleepMs(intervalMs);
  }

  const suffix = lastError ? ` (${lastError.message})` : "";
  throw new Error(
    `MCP endpoint readiness check timed out after ${timeoutMs}ms${suffix}`,
  );
}

async function discoverUpstreamTools({ service, url, headers }) {
  let sessionId = null;
  const init = await sendMcpJsonRpcRequest({
    url,
    method: "initialize",
    id: `cbx-init-${Date.now()}`,
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "cbx",
        version: CLI_VERSION,
      },
    },
    headers,
    sessionId,
  });
  sessionId = init.sessionId;

  await sendMcpJsonRpcRequest({
    url,
    method: "notifications/initialized",
    params: {},
    headers,
    sessionId,
  });

  const listed = await sendMcpJsonRpcRequest({
    url,
    method: "tools/list",
    id: `cbx-tools-${Date.now()}`,
    params: {},
    headers,
    sessionId,
  });
  const tools = Array.isArray(listed.parsed?.result?.tools)
    ? listed.parsed.result.tools
    : [];
  const meta = {};

  if (service === "postman") {
    const toolNames = new Set(tools.map((tool) => tool?.name).filter(Boolean));
    if (toolNames.has("getEnabledTools")) {
      const enabled = await sendMcpJsonRpcRequest({
        url,
        method: "tools/call",
        id: `cbx-enabled-tools-${Date.now()}`,
        params: {
          name: "getEnabledTools",
          arguments: {},
        },
        headers,
        sessionId,
      });
      meta.getEnabledTools = enabled.parsed?.result ?? null;
    }
    if (toolNames.has("listTools")) {
      const listedTools = await sendMcpJsonRpcRequest({
        url,
        method: "tools/call",
        id: `cbx-list-tools-${Date.now()}`,
        params: {
          name: "listTools",
          arguments: {},
        },
        headers,
        sessionId,
      });
      meta.listTools = listedTools.parsed?.result ?? null;
    }
  } else if (service === "stitch") {
    const hasListTools = tools.some((tool) => tool?.name === "list_tools");
    if (hasListTools) {
      const listedTools = await sendMcpJsonRpcRequest({
        url,
        method: "tools/call",
        id: `cbx-stitch-list-tools-${Date.now()}`,
        params: {
          name: "list_tools",
          arguments: {},
        },
        headers,
        sessionId,
      });
      meta.list_tools = listedTools.parsed?.result ?? null;
    }
  }

  if (sessionId) {
    try {
      await fetch(url, {
        method: "DELETE",
        headers: {
          ...headers,
          "mcp-session-id": sessionId,
        },
      });
    } catch {
      // best effort
    }
  }

  return { tools, meta };
}

function resolveServiceDiscoveryConfig({ service, configValue, scope }) {
  const normalized = normalizeCredentialService(service);
  const serviceState = ensureCredentialServiceState(configValue, normalized);
  const activeProfile =
    serviceState.activeProfile ||
    findProfileByName(serviceState.profiles, serviceState.activeProfileName) ||
    serviceState.profiles[0] ||
    null;
  const envVar =
    normalizePostmanApiKey(activeProfile?.apiKeyEnvVar) ||
    defaultEnvVarForCredentialService(normalized);
  const token = normalizePostmanApiKey(process.env[envVar]);
  const url =
    normalized === "postman"
      ? serviceState.mcpUrl || POSTMAN_MCP_URL
      : serviceState.mcpUrl || STITCH_MCP_URL;

  if (!token) {
    throw new Error(
      `${normalized} API key env var is missing. Set ${envVar} and retry.`,
    );
  }

  const headers =
    normalized === "postman"
      ? { Authorization: `Bearer ${token}` }
      : { "X-Goog-Api-Key": token };

  return {
    service: normalized,
    url,
    envVar,
    activeProfileName: serviceState.activeProfileName,
    headers,
    scope,
  };
}

async function syncMcpToolCatalogs({
  scope,
  services,
  configValue,
  cwd = process.cwd(),
  dryRun = false,
}) {
  const syncResults = [];
  for (const serviceId of services) {
    if (
      serviceId === "stitch" &&
      (!configValue?.stitch ||
        typeof configValue.stitch !== "object" ||
        Array.isArray(configValue.stitch))
    ) {
      syncResults.push({
        service: serviceId,
        action: "skipped",
        reason: "stitch is not configured",
      });
      continue;
    }
    const discoveryConfig = resolveServiceDiscoveryConfig({
      service: serviceId,
      configValue,
      scope,
    });
    const discovered = await discoverUpstreamTools({
      service: serviceId,
      url: discoveryConfig.url,
      headers: discoveryConfig.headers,
    });
    const catalogPath = resolveMcpCatalogPath({
      service: serviceId,
      scope,
      cwd,
    });
    const catalog = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      generatedBy: "cbx mcp tools sync",
      scope,
      service: serviceId,
      mcpUrl: discoveryConfig.url,
      activeProfileName: discoveryConfig.activeProfileName,
      envVar: discoveryConfig.envVar,
      toolCount: discovered.tools.length,
      tools: discovered.tools,
      discoveryMeta: discovered.meta,
    };
    if (!dryRun) {
      await mkdir(path.dirname(catalogPath), { recursive: true });
      await writeFile(
        catalogPath,
        `${JSON.stringify(catalog, null, 2)}\n`,
        "utf8",
      );
    }
    syncResults.push({
      service: serviceId,
      action: dryRun ? "would-sync" : "synced",
      toolCount: discovered.tools.length,
      catalogPath,
    });
  }
  return syncResults;
}

async function runMcpToolsSync(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    await loadManagedCredentialsEnv();
    const scope = normalizeMcpScope(opts.scope, "global");
    const service = normalizeCredentialService(opts.service || "all", {
      allowAll: true,
    });
    const services = service === "all" ? ["postman", "stitch"] : [service];
    const { configPath, existing, existingValue } = await loadConfigForScope({
      scope,
      cwd,
    });
    if (!existing.exists) {
      throw new Error(`Config file is missing at ${configPath}.`);
    }

    const syncResults = await syncMcpToolCatalogs({
      scope,
      services,
      configValue: existingValue,
      cwd,
      dryRun: Boolean(opts.dryRun),
    });

    for (const item of syncResults) {
      if (item.action === "skipped") {
        console.log(`${item.service}: skipped (${item.reason})`);
      } else {
        console.log(
          `${item.service}: ${item.action} (${item.toolCount} tools) -> ${item.catalogPath}`,
        );
      }
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runMcpToolsList(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const scope = normalizeMcpScope(opts.scope, "global");
    const service = normalizeCredentialService(opts.service);
    const catalogPath = resolveMcpCatalogPath({ service, scope, cwd });
    const catalog = await readJsonFileIfExists(catalogPath);
    if (!catalog.exists || !catalog.value) {
      throw new Error(
        `Catalog not found at ${catalogPath}. Run 'cbx mcp tools sync --service ${service} --scope ${scope}' first.`,
      );
    }
    const tools = Array.isArray(catalog.value.tools) ? catalog.value.tools : [];
    console.log(`Service: ${service}`);
    console.log(`Scope: ${scope}`);
    console.log(`Catalog: ${catalogPath}`);
    console.log(`Generated: ${catalog.value.generatedAt || "(unknown)"}`);
    console.log(`Tools: ${tools.length}`);
    for (const tool of tools) {
      if (!tool || typeof tool !== "object") continue;
      const name = normalizePostmanApiKey(tool.name);
      if (!name) continue;
      console.log(`- ${name}`);
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function normalizeMcpServeTransport(value, fallback = "stdio") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (normalized === "stdio") return "stdio";
  if (normalized === "http" || normalized === "streamable-http") return "http";
  throw new Error(`Unknown MCP transport '${value}'. Use stdio|http.`);
}

function normalizeMcpServeScope(value, fallback = "auto") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (
    normalized === "auto" ||
    normalized === "global" ||
    normalized === "project"
  ) {
    return normalized;
  }
  throw new Error(`Unknown MCP scope '${value}'. Use auto|global|project.`);
}

function resolveBundledMcpEntryPath() {
  return path.join(packageRoot(), "mcp", "dist", "index.js");
}

async function runMcpServe(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    await loadManagedCredentialsEnv();
    const entryPath = resolveBundledMcpEntryPath();
    if (!(await pathExists(entryPath))) {
      throw new Error(
        `Bundled MCP server not found at ${entryPath}. Install @cubis/foundry with bundled mcp/dist assets.`,
      );
    }

    const transport = normalizeMcpServeTransport(opts.transport, "stdio");
    const scope = normalizeMcpServeScope(opts.scope, "auto");
    const args = [entryPath, "--transport", transport, "--scope", scope];

    if (opts.host) {
      args.push("--host", String(opts.host));
    }
    if (opts.port !== undefined && opts.port !== null && opts.port !== "") {
      args.push("--port", String(normalizePortNumber(opts.port, 3100)));
    }
    if (opts.scanOnly) {
      args.push("--scan-only");
    }
    if (opts.config) {
      args.push("--config", expandPath(String(opts.config), cwd));
    }
    if (opts.debug) {
      args.push("--debug");
    }

    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd,
        stdio: "inherit",
        env: process.env,
      });

      const forwardSignal = (signal) => {
        if (!child.killed) {
          child.kill(signal);
        }
      };
      const onSigInt = () => forwardSignal("SIGINT");
      const onSigTerm = () => forwardSignal("SIGTERM");
      process.on("SIGINT", onSigInt);
      process.on("SIGTERM", onSigTerm);

      child.once("error", (error) => {
        process.off("SIGINT", onSigInt);
        process.off("SIGTERM", onSigTerm);
        reject(error);
      });

      child.once("exit", (code, signal) => {
        process.off("SIGINT", onSigInt);
        process.off("SIGTERM", onSigTerm);
        if (signal) {
          reject(new Error(`MCP server terminated by signal ${signal}.`));
          return;
        }
        if (code && code !== 0) {
          reject(new Error(`MCP server exited with status ${code}.`));
          return;
        }
        resolve(null);
      });
    });
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function resolveCbxRootPath({ scope, cwd = process.cwd() }) {
  if (scope === "global") {
    return path.join(os.homedir(), ".cbx");
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return path.join(workspaceRoot, ".cbx");
}

function dedupePaths(paths) {
  const seen = new Set();
  const out = [];
  for (const value of paths) {
    const normalized = path.resolve(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function resolveMcpSkillRootCandidates({
  scope,
  cwd = process.cwd(),
  explicitSkillsRoot = null,
}) {
  if (explicitSkillsRoot) {
    return dedupePaths([path.resolve(cwd, explicitSkillsRoot)]);
  }

  const workspaceRoot = findWorkspaceRoot(cwd);
  const workspaceCandidates = [
    path.join(workspaceRoot, ".agents", "skills"),
    path.join(workspaceRoot, ".github", "skills"),
    path.join(workspaceRoot, ".agent", "skills"),
  ];
  const homeCandidates = [
    path.join(os.homedir(), ".agents", "skills"),
    path.join(os.homedir(), ".copilot", "skills"),
    path.join(os.homedir(), ".gemini", "antigravity", "skills"),
  ];

  return dedupePaths(
    scope === "global"
      ? [...homeCandidates, ...workspaceCandidates]
      : [...workspaceCandidates, ...homeCandidates],
  );
}

async function resolveMcpSkillRoot({
  scope,
  cwd = process.cwd(),
  explicitSkillsRoot = null,
}) {
  const candidates = resolveMcpSkillRootCandidates({
    scope,
    cwd,
    explicitSkillsRoot,
  });
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return { resolvedPath: candidate, candidates };
    }
  }
  return { resolvedPath: null, candidates };
}

function resolveMcpRuntimeDefaultsFromConfig(configValue) {
  const mcp =
    configValue &&
    typeof configValue.mcp === "object" &&
    !Array.isArray(configValue.mcp)
      ? configValue.mcp
      : {};
  const docker =
    mcp && typeof mcp.docker === "object" && !Array.isArray(mcp.docker)
      ? mcp.docker
      : {};

  const runtime = normalizeMcpRuntime(mcp.runtime, DEFAULT_MCP_RUNTIME);
  const fallback = normalizeMcpFallback(mcp.fallback, DEFAULT_MCP_FALLBACK);
  const image =
    normalizePostmanApiKey(docker.image) || DEFAULT_MCP_DOCKER_IMAGE;
  const updatePolicy = normalizeMcpUpdatePolicy(
    docker.updatePolicy,
    DEFAULT_MCP_UPDATE_POLICY,
  );
  const buildLocal = Boolean(docker.buildLocal);

  return {
    runtime,
    fallback,
    image,
    updatePolicy,
    buildLocal,
  };
}

async function loadMcpRuntimeDefaults({ scope, cwd = process.cwd() }) {
  const configPath = resolveCbxConfigPath({ scope, cwd });
  const existing = await readJsonFileIfExists(configPath);
  const configValue =
    existing.value &&
    typeof existing.value === "object" &&
    !Array.isArray(existing.value)
      ? existing.value
      : {};
  return {
    configPath,
    defaults: resolveMcpRuntimeDefaultsFromConfig(configValue),
    hasConfig: existing.exists,
  };
}

async function runMcpRuntimeStatus(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    await loadManagedCredentialsEnv();
    const scope = normalizeMcpScope(opts.scope, "global");
    const explicitSkillsRoot = normalizePostmanApiKey(opts.skillsRoot);
    const defaults = await loadMcpRuntimeDefaults({ scope, cwd });
    const containerName =
      normalizePostmanApiKey(opts.name) || DEFAULT_MCP_DOCKER_CONTAINER_NAME;
    const dockerAvailable = await checkDockerAvailable({ cwd });
    const { resolvedPath: skillsRoot, candidates: skillRootCandidates } =
      await resolveMcpSkillRoot({
        scope,
        cwd,
        explicitSkillsRoot,
      });
    const container = dockerAvailable
      ? await inspectDockerContainerByName({ name: containerName, cwd })
      : null;
    const skillsRootExists = Boolean(skillsRoot);

    console.log(`Scope: ${scope}`);
    console.log(`Config file: ${defaults.configPath}`);
    console.log(`Config present: ${defaults.hasConfig ? "yes" : "no"}`);
    console.log(`Configured runtime: ${defaults.defaults.runtime}`);
    console.log(`Configured fallback: ${defaults.defaults.fallback}`);
    console.log(`Configured image: ${defaults.defaults.image}`);
    console.log(`Configured update policy: ${defaults.defaults.updatePolicy}`);
    console.log(
      `Configured build local: ${defaults.defaults.buildLocal ? "yes" : "no"}`,
    );
    console.log(`Requested skills root: ${explicitSkillsRoot || "(auto)"}`);
    if (skillsRootExists) {
      console.log(`Resolved host skills root: ${skillsRoot} (present)`);
    } else {
      console.log("Resolved host skills root: not found");
      console.log(`Skill root candidates: ${skillRootCandidates.join(", ")}`);
    }
    console.log(`Docker available: ${dockerAvailable ? "yes" : "no"}`);
    console.log(`Container name: ${containerName}`);
    if (!dockerAvailable) {
      console.log("Container status: unavailable (docker not reachable)");
      return;
    }
    if (!container) {
      console.log("Container status: not found");
      if (!skillsRootExists) {
        console.log(
          "Hint: no host skill directory was found from auto-detect candidates. Pass --skills-root <path> to force a mount source.",
        );
      }
      return;
    }
    const isRunning = container.status.toLowerCase().startsWith("up ");
    console.log(`Container status: ${container.status}`);
    console.log(`Container image: ${container.image}`);
    const mounts = await inspectDockerContainerMounts({
      name: containerName,
      cwd,
    });
    const skillsMount = mounts.find(
      (mount) => String(mount.Destination || "") === "/workflows/skills",
    );
    if (skillsMount) {
      const source = String(skillsMount.Source || "(unknown)");
      console.log(`Skills mount: ${source} -> /workflows/skills`);
      if (!(await pathExists(source))) {
        console.log(
          "Hint: mounted skill source path is missing on host; vault discovery may return zero skills.",
        );
      }
    } else {
      console.log("Skills mount: missing");
      console.log(
        "Hint: recreate runtime with a skills mount (for example: cbx mcp runtime up --replace --skills-root <path>).",
      );
    }
    if (isRunning) {
      const hostPort =
        (await resolveDockerContainerHostPort({
          name: containerName,
          containerPort: MCP_DOCKER_CONTAINER_PORT,
          cwd,
        })) || DEFAULT_MCP_DOCKER_HOST_PORT;
      const endpoint = `http://127.0.0.1:${hostPort}/mcp`;
      console.log(`Endpoint: ${endpoint}`);
      try {
        await waitForMcpEndpointReady({
          url: endpoint,
          timeoutMs: 5000,
          intervalMs: 500,
        });
        console.log("Endpoint health: ready");
      } catch (error) {
        console.log(`Endpoint health: unreachable (${error.message})`);
        if (defaults.defaults.fallback === "local") {
          console.log(
            `Hint: switch config to local runtime: cbx workflows config --scope ${scope} --mcp-runtime local`,
          );
        }
      }
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runMcpRuntimeUp(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    await loadManagedCredentialsEnv();
    const scope = normalizeMcpScope(opts.scope, "global");
    const explicitSkillsRoot = normalizePostmanApiKey(opts.skillsRoot);
    const defaults = await loadMcpRuntimeDefaults({ scope, cwd });
    const containerName =
      normalizePostmanApiKey(opts.name) || DEFAULT_MCP_DOCKER_CONTAINER_NAME;
    const image = normalizePostmanApiKey(opts.image) || defaults.defaults.image;
    const updatePolicy = normalizeMcpUpdatePolicy(
      opts.updatePolicy,
      defaults.defaults.updatePolicy,
    );
    const fallback = normalizeMcpFallback(
      opts.fallback,
      defaults.defaults.fallback,
    );
    const buildLocal = hasCliFlag("--build-local")
      ? true
      : defaults.defaults.buildLocal;
    const hostPort = normalizePortNumber(
      opts.port,
      DEFAULT_MCP_DOCKER_HOST_PORT,
    );
    const replace = Boolean(opts.replace);
    const dockerAvailable = await checkDockerAvailable({ cwd });
    if (!dockerAvailable) {
      throw new Error(
        "Docker is unavailable. Start OrbStack/Docker and retry.",
      );
    }

    const prepared = await ensureMcpDockerImage({
      image,
      updatePolicy,
      buildLocal,
      cwd,
    });

    const existing = await inspectDockerContainerByName({
      name: containerName,
      cwd,
    });
    if (existing && !replace) {
      throw new Error(
        `Container '${containerName}' already exists (${existing.status}). Use --replace to recreate it.`,
      );
    }
    if (existing && replace) {
      await execFile("docker", ["rm", "-f", containerName], { cwd });
    }

    const cbxRoot = resolveCbxRootPath({ scope, cwd });
    const { resolvedPath: skillsRoot, candidates: skillRootCandidates } =
      await resolveMcpSkillRoot({
        scope,
        cwd,
        explicitSkillsRoot,
      });
    const skillsRootExists = Boolean(skillsRoot);
    const runtimeWarnings = [];
    if (!skillsRootExists) {
      runtimeWarnings.push(
        `No skill mount source found from candidates (${skillRootCandidates.join(", ")}). Runtime will start without /workflows/skills and vault discovery can return zero skills.`,
      );
    }
    await mkdir(cbxRoot, { recursive: true });

    // Forward configured API key env vars to Docker container
    const envVarsToForward = [];
    try {
      const cfgPath = resolveCbxConfigPath({ scope, cwd });
      const cfgData = await readJsonFileIfExists(cfgPath);
      if (cfgData.value && typeof cfgData.value === "object") {
        const postmanEnv = cfgData.value.postman?.apiKeyEnvVar;
        const stitchProfiles = cfgData.value.stitch?.profiles;
        if (postmanEnv && process.env[postmanEnv]) {
          envVarsToForward.push({
            name: postmanEnv,
            value: process.env[postmanEnv],
          });
        }
        if (Array.isArray(stitchProfiles)) {
          for (const profile of stitchProfiles) {
            const envName = profile?.apiKeyEnvVar;
            if (
              envName &&
              process.env[envName] &&
              !envVarsToForward.some((e) => e.name === envName)
            ) {
              envVarsToForward.push({
                name: envName,
                value: process.env[envName],
              });
            }
          }
        }
        // Also check common env var patterns
        for (const envName of [
          "POSTMAN_API_KEY",
          "POSTMAN_API_KEY_DEFAULT",
          "STITCH_API_KEY",
          "STITCH_API_KEY_DEFAULT",
        ]) {
          if (
            process.env[envName] &&
            !envVarsToForward.some((e) => e.name === envName)
          ) {
            envVarsToForward.push({
              name: envName,
              value: process.env[envName],
            });
          }
        }
      }
    } catch {
      // Config read failure is non-fatal for env var forwarding
    }

    const dockerArgs = [
      "run",
      "-d",
      "--name",
      containerName,
      "-p",
      `${hostPort}:${MCP_DOCKER_CONTAINER_PORT}`,
      "-v",
      `${cbxRoot}:/root/.cbx`,
    ];
    if (skillsRootExists) {
      dockerArgs.push("-v", `${skillsRoot}:/workflows/skills:ro`);
    }
    for (const envEntry of envVarsToForward) {
      dockerArgs.push("-e", `${envEntry.name}=${envEntry.value}`);
    }
    dockerArgs.push(
      image,
      "--transport",
      "http",
      "--host",
      "0.0.0.0",
      "--port",
      String(MCP_DOCKER_CONTAINER_PORT),
      "--scope",
      scope,
    );
    await execFile("docker", dockerArgs, { cwd });

    const running = await inspectDockerContainerByName({
      name: containerName,
      cwd,
    });
    console.log(`Scope: ${scope}`);
    console.log(`Container: ${containerName}`);
    console.log(`Image: ${image}`);
    console.log(`Image prepare: ${prepared.action}`);
    console.log(`Update policy: ${updatePolicy}`);
    console.log(`Fallback: ${fallback}`);
    console.log(`Build local: ${buildLocal ? "yes" : "no"}`);
    console.log(`Mount: ${cbxRoot} -> /root/.cbx`);
    console.log(`Requested skills root: ${explicitSkillsRoot || "(auto)"}`);
    if (skillsRootExists) {
      console.log(`Mount: ${skillsRoot} -> /workflows/skills (ro)`);
    } else {
      console.log("Mount: /workflows/skills (not mounted - source missing)");
    }
    if (envVarsToForward.length > 0) {
      console.log(
        `Env vars forwarded: ${envVarsToForward.map((e) => e.name).join(", ")}`,
      );
    }
    console.log(`Port: ${hostPort}:${MCP_DOCKER_CONTAINER_PORT}`);
    console.log(`Status: ${running ? running.status : "started"}`);
    const endpoint = `http://127.0.0.1:${hostPort}/mcp`;
    console.log(`Endpoint: ${endpoint}`);
    try {
      await waitForMcpEndpointReady({
        url: endpoint,
        timeoutMs: 20000,
        intervalMs: 500,
      });
      console.log("Endpoint health: ready");
    } catch (error) {
      if (fallback === "skip") {
        runtimeWarnings.push(
          `Endpoint health check failed but continuing because --fallback=skip. (${error.message})`,
        );
      } else if (fallback === "local") {
        await execFile("docker", ["rm", "-f", containerName], { cwd }).catch(
          () => {},
        );
        runtimeWarnings.push(
          `Docker endpoint was unreachable and runtime fell back to local. (${error.message})`,
        );
        const persisted = await persistMcpRuntimePreference({
          scope,
          runtime: "local",
          fallback,
          cwd,
          generatedBy: "cbx mcp runtime up",
        });
        if (persisted.reason === "config-missing") {
          runtimeWarnings.push(
            `No cbx config found at ${persisted.configPath}; runtime preference was not persisted.`,
          );
        } else {
          runtimeWarnings.push(
            `Updated runtime preference in ${persisted.configPath} (${persisted.action}).`,
          );
        }
        console.log("Endpoint health: fallback-to-local");
        console.log(
          "Local command: cbx mcp serve --transport stdio --scope auto",
        );
      } else {
        throw new Error(
          `MCP endpoint is unreachable at ${endpoint}. ${error.message}`,
        );
      }
    }
    if (runtimeWarnings.length > 0) {
      console.log("Warnings:");
      for (const warning of runtimeWarnings) {
        console.log(`- ${warning}`);
      }
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runMcpRuntimeDown(options) {
  try {
    const opts = resolveActionOptions(options);
    const cwd = process.cwd();
    const containerName =
      normalizePostmanApiKey(opts.name) || DEFAULT_MCP_DOCKER_CONTAINER_NAME;
    const dockerAvailable = await checkDockerAvailable({ cwd });
    if (!dockerAvailable) {
      throw new Error(
        "Docker is unavailable. Start OrbStack/Docker and retry.",
      );
    }
    const existing = await inspectDockerContainerByName({
      name: containerName,
      cwd,
    });
    if (!existing) {
      console.log(`Container '${containerName}' is not present.`);
      return;
    }
    await execFile("docker", ["rm", "-f", containerName], { cwd });
    console.log(`Removed container '${containerName}'.`);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function printRulesInitSummary({
  platform,
  scope,
  dryRun,
  engineeringResults,
  techResult,
}) {
  console.log(`Platform: ${platform}`);
  console.log(`Scope: ${scope}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  console.log("\nEngineering rules:");
  for (const item of engineeringResults) {
    console.log(`- Rule file: ${item.ruleFilePath}`);
    console.log(
      `  - ENGINEERING_RULES.md: ${item.rulesFileResult.action} (${item.rulesFilePath})`,
    );
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
    console.log(
      `- ENGINEERING_RULES.md: ${item.rulesFileResult.action} (${item.rulesFilePath})`,
    );
    console.log(
      `- Managed engineering block (${item.ruleFilePath}): ${item.blockResult.action}`,
    );
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
  cwd = process.cwd(),
}) {
  const ruleFilePath = await resolveRuleFilePath(platform, scope, cwd);
  if (!ruleFilePath)
    throw new Error(`No rule file configured for platform '${platform}'.`);

  const workspaceRoot = findWorkspaceRoot(cwd);
  const techMdPath = path.join(workspaceRoot, "TECH.md");
  const targets = [{ ruleFilePath }];

  if (scope === "global") {
    const workspaceRuleFile = await resolveWorkspaceRuleFileForGlobalScope(
      platform,
      cwd,
    );
    const globalRuleFile = expandPath(
      WORKFLOW_PROFILES[platform].global.ruleFilesByPriority[0],
      cwd,
    );
    if (
      workspaceRuleFile &&
      path.resolve(workspaceRuleFile) !== path.resolve(globalRuleFile)
    ) {
      targets.push({ ruleFilePath: workspaceRuleFile });
    }
  }

  const template = buildEngineeringRulesTemplate();
  const engineeringResults = [];
  for (const target of targets) {
    const rulesFilePath = path.join(
      path.dirname(target.ruleFilePath),
      "ENGINEERING_RULES.md",
    );
    const rulesFileResult = await upsertEngineeringRulesFile({
      targetPath: rulesFilePath,
      template,
      overwrite,
      dryRun,
    });
    const blockResult = await upsertEngineeringRulesBlock({
      ruleFilePath: target.ruleFilePath,
      platform,
      engineeringRulesFilePath: rulesFilePath,
      techMdFilePath: techMdPath,
      dryRun,
    });
    engineeringResults.push({
      ruleFilePath: target.ruleFilePath,
      rulesFilePath,
      rulesFileResult,
      blockResult,
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
      dryRun,
    });
    techResult = {
      ...fileResult,
      snapshot,
    };
  }

  return {
    engineeringResults,
    techResult,
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
      cwd,
    });

    printRulesInitSummary({
      platform,
      scope,
      dryRun,
      engineeringResults: initResult.engineeringResults,
      techResult: initResult.techResult,
    });

    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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
    const compact = Boolean(options.compact);
    const cwd = process.cwd();
    const workspaceRoot = findWorkspaceRoot(cwd);
    const outputPath = options.output
      ? expandPath(options.output, cwd)
      : path.join(workspaceRoot, "TECH.md");
    const snapshot = await collectTechSnapshot(workspaceRoot);
    const content = buildTechMd(snapshot, { compact });
    const result = await writeTextFile({
      targetPath: outputPath,
      content: `${content}\n`,
      overwrite,
      dryRun,
    });

    console.log(`TECH.md action: ${result.action}`);
    console.log(`File: ${result.filePath}`);
    console.log(`Root scanned: ${toPosixPath(workspaceRoot)}`);
    console.log(`Files scanned: ${snapshot.scannedFiles}`);
    console.log(`Mode: ${compact ? "compact" : "full"}`);
    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function parseCsvOption(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeInitPlatforms(value) {
  const items = Array.isArray(value) ? value : parseCsvOption(value);
  const normalized = [];
  for (const item of items) {
    const platform = normalizePlatform(item);
    if (!platform) continue;
    if (!normalized.includes(platform)) normalized.push(platform);
  }
  return normalized;
}

function normalizeInitMcpSelections(value) {
  const allowed = new Set(["cubis-foundry", "postman", "stitch"]);
  const items = Array.isArray(value) ? value : parseCsvOption(value);
  const normalized = [];
  for (const item of items) {
    const key = String(item || "").trim().toLowerCase();
    if (!allowed.has(key)) continue;
    if (!normalized.includes(key)) normalized.push(key);
  }
  return normalized;
}

async function runInitWizard(options) {
  try {
    const dryRun = Boolean(options.dryRun);
    const emitJson = Boolean(options.json);
    const hideBanner = options.banner === false || Boolean(options.noBanner);
    const cwd = options.target ? path.resolve(options.target) : process.cwd();

    await loadManagedCredentialsEnv();

    if (options.target) {
      const targetExists = await pathExists(cwd);
      if (!targetExists) {
        throw new Error(`Target directory does not exist: ${cwd}`);
      }
    }

    const isInteractive = process.stdin.isTTY && !options.yes;
    if (!process.stdin.isTTY && !options.yes) {
      throw new Error(
        "cbx init requires interactive TTY. Use `cbx init --yes` for default non-interactive mode, or use `cbx workflows install`.",
      );
    }

    if (!hideBanner) {
      console.log(renderInitWelcome({ version: CLI_VERSION }));
    }

    const bundleIds = await listBundleIds();
    if (bundleIds.length === 0) {
      throw new Error("No workflow bundles found in local catalog.");
    }
    const requestedBundleId = String(options.bundle || "").trim();
    if (requestedBundleId && !bundleIds.includes(requestedBundleId)) {
      throw new Error(
        `Unknown workflow bundle '${requestedBundleId}'. Available bundles: ${bundleIds.join(", ")}`,
      );
    }
    const defaultBundle = requestedBundleId
      ? requestedBundleId
      : bundleIds.includes("agent-environment-setup")
        ? "agent-environment-setup"
        : bundleIds[0];

    const defaultSkillProfile = normalizeSkillProfile(
      options.skillProfile,
      DEFAULT_SKILL_PROFILE,
    );
    const defaultSkillsScope = normalizeScope(options.skillsScope || options.scope);
    const defaultMcpScope =
      normalizeMcpScope(options.mcpScope, defaultSkillsScope) === "global"
        ? "global"
        : "project";
    const defaultPostmanWorkspaceId =
      options.postmanWorkspaceId !== undefined
        ? normalizePostmanWorkspaceId(options.postmanWorkspaceId)
        : null;
    const defaultMcpSelections = normalizeInitMcpSelections(options.mcps);
    const defaultPlatforms = normalizeInitPlatforms(options.platforms);
    const defaultMcpRuntime = normalizeMcpRuntime(
      options.mcpRuntime,
      defaultMcpSelections.some((item) => item === "postman" || item === "stitch")
        ? "docker"
        : "local",
    );
    const defaultMcpBuildLocal = Boolean(options.mcpBuildLocal);

    const selections = {
      bundleId: isInteractive
        ? await promptInitBundle({ bundleIds, defaultBundle })
        : defaultBundle,
      platforms: isInteractive
        ? await promptInitPlatforms({
            defaultPlatforms:
              defaultPlatforms.length > 0 ? defaultPlatforms : ["codex"],
          })
        : defaultPlatforms.length > 0
          ? defaultPlatforms
          : ["codex"],
      skillProfile: isInteractive
        ? await promptInitSkillProfile(defaultSkillProfile)
        : defaultSkillProfile,
      selectedMcps: isInteractive
        ? await promptInitMcpSelection(defaultMcpSelections)
        : defaultMcpSelections.length > 0
          ? defaultMcpSelections
          : ["cubis-foundry"],
      skillsScope: isInteractive
        ? await promptInitScope({
            message: "Select scope for Skills installation:",
            defaultScope: defaultSkillsScope,
          })
        : defaultSkillsScope,
      mcpScope: isInteractive
        ? await promptInitScope({
            message: "Select scope for MCP configuration:",
            defaultScope: defaultMcpScope,
          })
        : defaultMcpScope,
      mcpRuntime: defaultMcpRuntime,
      mcpBuildLocal: defaultMcpBuildLocal,
      postmanMode:
        options.postmanMode && normalizePostmanMode(options.postmanMode)
          ? normalizePostmanMode(options.postmanMode)
          : "full",
      postmanWorkspaceId: defaultPostmanWorkspaceId,
      postmanApiKey: null,
      stitchApiKey: null,
    };
    const initWarnings = [];

    if (selections.platforms.length === 0) {
      throw new Error("No platforms selected.");
    }

    const remoteMcpSelected =
      selections.selectedMcps.includes("postman") ||
      selections.selectedMcps.includes("stitch");

    if (remoteMcpSelected && isInteractive) {
      const runtimeSelection = await promptInitMcpRuntime({
        defaultRuntime: selections.mcpRuntime,
        defaultBuildLocal: selections.mcpBuildLocal,
      });
      selections.mcpRuntime = runtimeSelection.mcpRuntime;
      selections.mcpBuildLocal = runtimeSelection.mcpBuildLocal;
    } else if (!remoteMcpSelected) {
      selections.mcpRuntime = "local";
      selections.mcpBuildLocal = false;
    }

    if (selections.selectedMcps.includes("postman") && isInteractive) {
      selections.postmanMode = await promptInitPostmanMode(
        selections.postmanMode,
      );
      selections.postmanApiKey = await promptOptionalSecret(
        "Postman API key (optional, leave blank to keep existing env/profile state):",
      );
      const postmanLookupApiKey =
        normalizePostmanApiKey(selections.postmanApiKey) ||
        normalizePostmanApiKey(
          process.env[
            profileEnvVarAlias("postman", DEFAULT_CREDENTIAL_PROFILE_NAME)
          ],
        ) ||
        normalizePostmanApiKey(process.env[POSTMAN_API_KEY_ENV_VAR]);
      const postmanWorkspaceSelection = await promptPostmanWorkspaceSelection({
        apiKey: postmanLookupApiKey,
        defaultWorkspaceId: selections.postmanWorkspaceId,
      });
      selections.postmanWorkspaceId = postmanWorkspaceSelection.workspaceId;
      initWarnings.push(...postmanWorkspaceSelection.warnings);
    }

    if (selections.selectedMcps.includes("stitch") && isInteractive) {
      selections.stitchApiKey = await promptOptionalSecret(
        "Stitch API key (optional, leave blank to keep existing env/profile state):",
      );
    }

    if (selections.postmanApiKey) {
      process.env[profileEnvVarAlias("postman", DEFAULT_CREDENTIAL_PROFILE_NAME)] =
        selections.postmanApiKey;
    }
    if (selections.stitchApiKey) {
      process.env[profileEnvVarAlias("stitch", DEFAULT_CREDENTIAL_PROFILE_NAME)] =
        selections.stitchApiKey;
    }

    const plan = buildInitExecutionPlan({
      selections,
      dryRun,
      target: options.target,
    });

    const initSummary = formatInitSummary(selections);
    if (initWarnings.length > 0) {
      console.log("\nInit warnings:");
      for (const warning of initWarnings) {
        console.log(`- ${warning}`);
      }
    }
    if (!options.yes && isInteractive) {
      const proceed = await promptInitApplyConfirmation(initSummary);
      if (!proceed) {
        console.log("Cancelled.");
        process.exit(0);
      }
    } else {
      console.log(initSummary);
    }

    const results = [];
    for (const item of plan.items) {
      try {
        const installOutcome = await performWorkflowInstall(item.installOptions);
        if (installOutcome.cancelled) {
          console.log("Cancelled.");
          process.exit(0);
        }
        printInstallSummary({
          platform: installOutcome.platform,
          scope: installOutcome.scope,
          bundleId: installOutcome.bundleId,
          installed: installOutcome.installResult.installed,
          skipped: installOutcome.installResult.skipped,
          generatedWrapperSkills: installOutcome.installResult.generatedWrapperSkills,
          duplicateSkillCleanup: installOutcome.installResult.duplicateSkillCleanup,
          sanitizedSkills: installOutcome.installResult.sanitizedSkills,
          sanitizedAgents: installOutcome.installResult.sanitizedAgents,
          terminalIntegration: installOutcome.installResult.terminalIntegration,
          terminalIntegrationRules: installOutcome.terminalVerificationRuleResult,
          dryRun: installOutcome.dryRun,
        });
        printRuleSyncResult(installOutcome.syncResult);
        printInstallEngineeringSummary({
          engineeringResults: installOutcome.engineeringArtifactsResult.engineeringResults,
          techResult: installOutcome.engineeringArtifactsResult.techResult,
        });
        printPostmanSetupSummary({
          postmanSetup: installOutcome.postmanSetupResult,
        });
        if (item.warnings.length > 0) {
          console.log("Init warnings:");
          for (const warning of item.warnings) {
            console.log(`- ${warning}`);
          }
        }
        results.push({
          platform: item.platform,
          status: "success",
          warnings: item.warnings,
        });
      } catch (error) {
        const failure = {
          platform: item.platform,
          status: "failed",
          warnings: item.warnings,
          error: error?.message || String(error),
        };
        results.push(failure);
        console.error(`\nInit failed on platform '${item.platform}': ${failure.error}`);
        if (emitJson) {
          console.log(JSON.stringify({ dryRun, results }, null, 2));
        }
        process.exit(1);
      }
    }

    const envPersistTargets = [];
    if (selections.selectedMcps.includes("postman")) {
      envPersistTargets.push(
        profileEnvVarAlias("postman", DEFAULT_CREDENTIAL_PROFILE_NAME),
      );
    }
    if (selections.selectedMcps.includes("stitch")) {
      envPersistTargets.push(
        profileEnvVarAlias("stitch", DEFAULT_CREDENTIAL_PROFILE_NAME),
      );
    }
    let persistedCredentials = null;
    if (envPersistTargets.length > 0) {
      persistedCredentials = await persistManagedCredentialsEnv({
        envVarNames: envPersistTargets,
        dryRun,
      });
      console.log("\nCredential persistence:");
      console.log(`- File: ${persistedCredentials.envPath}`);
      console.log(`- Action: ${persistedCredentials.action}`);
      console.log(
        `- Persisted: ${persistedCredentials.persisted.length > 0 ? persistedCredentials.persisted.join(", ") : "(none)"}`,
      );
      if (persistedCredentials.missing.length > 0) {
        console.log(`- Missing: ${persistedCredentials.missing.join(", ")}`);
      }
    }

    if (emitJson) {
      console.log(
        JSON.stringify(
          {
            dryRun,
            selections,
            results,
            persistedCredentials,
          },
          null,
          2,
        ),
      );
    }

    if (dryRun) {
      console.log(
        "\nDry-run complete. Re-run without `--dry-run` to apply changes.",
      );
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

export function buildCliProgram() {
  return registerCommands({
    cliVersion: CLI_VERSION,
    printPlatforms,
    withInstallOptions,
    withWorkflowBaseOptions,
    registerConfigKeysSubcommands,
    runWorkflowInstall,
    runWorkflowRemove,
    runWorkflowRemoveAll,
    runWorkflowPruneSkills,
    runWorkflowSyncRules,
    runWorkflowDoctor,
    runWorkflowConfig,
    runInitWizard,
    defaultSkillProfile: DEFAULT_SKILL_PROFILE,
    runMcpServe,
    runMcpToolsSync,
    runMcpToolsList,
    runMcpRuntimeStatus,
    runMcpRuntimeUp,
    runMcpRuntimeDown,
    defaultMcpDockerContainerName: DEFAULT_MCP_DOCKER_CONTAINER_NAME,
    runRulesInit,
    runRulesTechMd,
  });
}

export async function runCli(argv = process.argv) {
  const program = buildCliProgram();
  const removedTopLevelAlias = String(argv[2] || "").trim().toLowerCase();
  if (["skills", "install", "platforms"].includes(removedTopLevelAlias)) {
    console.error(
      `\nError: '${removedTopLevelAlias}' has been removed. Use 'cbx workflows' commands instead.`,
    );
    console.error("Migration:");
    console.error("- cbx skills ... -> cbx workflows ...");
    if (removedTopLevelAlias === "platforms") {
      console.error("- cbx platforms -> cbx workflows platforms");
    } else {
      console.error("- cbx install -> cbx workflows install");
    }
    process.exit(1);
  }

  if (
    removedTopLevelAlias === "workflows" &&
    String(argv[3] || "").trim().toLowerCase() === "init"
  ) {
    console.error("\nError: 'cbx workflows init' has been removed.");
    console.error("Use: cbx workflows install");
    process.exit(1);
  }

  if (argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }

  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}
