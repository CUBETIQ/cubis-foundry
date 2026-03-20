import path from "node:path";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

export const WORKSPACE_MANIFEST_FILE = "cbx_manifest.json";
export const WORKSPACE_SUMMARY_FILE = "cbx_workspace.md";
export const WORKSPACE_RUNTIME_DIR = ".cbx";
export const HARNESS_RUNTIME_DIR = path.join(WORKSPACE_RUNTIME_DIR, "harness");
export const LOOP_RUNTIME_DIR = path.join(HARNESS_RUNTIME_DIR, "loops");
export const MEMORY_RUNTIME_DIR = path.join(WORKSPACE_RUNTIME_DIR, "memory");
export const MEMORY_INBOX_DIR = path.join(MEMORY_RUNTIME_DIR, "inbox");
export const MEMORY_APPLIED_DIR = path.join(MEMORY_RUNTIME_DIR, "applied");
export const MEMORY_REJECTED_DIR = path.join(MEMORY_RUNTIME_DIR, "rejected");
export const AUDIT_RUNTIME_DIR = path.join(HARNESS_RUNTIME_DIR, "audit");

export const WORKSPACE_PROFILES = ["core", "developer", "security", "research", "full"] as const;
export const HOOK_PROFILES = ["minimal", "standard", "strict", "autonomous"] as const;
export const AUTHORING_AI_IDS = ["codex", "claude", "gemini", "copilot"] as const;
export const STACK_IDS = [
  "web",
  "api",
  "cli",
  "mobile",
  "ml",
  "fullstack",
  "monorepo",
] as const;
export const CAPABILITY_PACK_IDS = [
  "frontend",
  "backend",
  "database",
  "devops",
  "security",
  "playwright",
  "research",
  "agentic",
] as const;

export const DEFAULT_PROFILE = "developer";
export const DEFAULT_HOOK_PROFILE = "standard";
export const DEFAULT_LEARNING_MODE = "observe-stage";

type StackId = (typeof STACK_IDS)[number];
type ProfileId = (typeof WORKSPACE_PROFILES)[number];
type HookProfileId = (typeof HOOK_PROFILES)[number];
type AuthoringAiId = (typeof AUTHORING_AI_IDS)[number];

type StackDetectionResult = {
  stack: StackId;
  confidence: "low" | "medium" | "high";
  evidence: string[];
};

type HarnessAuditFinding = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  file: string;
  detail: string;
};

const STACK_SIGNAL_GROUPS: Array<{
  stack: StackId;
  confidence: StackDetectionResult["confidence"];
  signals: string[];
}> = [
  {
    stack: "monorepo",
    confidence: "high",
    signals: ["pnpm-workspace.yaml", "turbo.json", "nx.json", "lerna.json"],
  },
  {
    stack: "mobile",
    confidence: "high",
    signals: ["android", "ios", "app.json", "app.config.ts", "expo-env.d.ts"],
  },
  {
    stack: "ml",
    confidence: "high",
    signals: ["requirements.txt", "environment.yml", "notebooks", "models"],
  },
  {
    stack: "fullstack",
    confidence: "medium",
    signals: ["next.config.js", "next.config.mjs", "next.config.ts", "prisma/schema.prisma"],
  },
  {
    stack: "web",
    confidence: "medium",
    signals: ["vite.config.ts", "vite.config.js", "src/app", "src/components"],
  },
  {
    stack: "api",
    confidence: "medium",
    signals: ["openapi.yaml", "openapi.yml", "go.mod", "pyproject.toml", "Cargo.toml"],
  },
  {
    stack: "cli",
    confidence: "low",
    signals: ["bin", "src/cli", "cli.ts", "cli.js"],
  },
];

const PLATFORM_SIGNAL_MAP = {
  claude: ["CLAUDE.md", ".claude"],
  codex: ["AGENTS.md", ".codex"],
  copilot: [".github/copilot-instructions.md", ".github/agents", ".github/prompts"],
  gemini: ["GEMINI.md", ".gemini"],
  antigravity: [".agents/rules/GEMINI.md", ".agents/skills"],
} as const;

async function pathExists(targetPath: string) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

function normalizeOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return (allowed as readonly string[]).includes(normalized)
    ? (normalized as T[number])
    : fallback;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readFileIfExists(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function collectPresentSignals(cwd: string, signals: readonly string[]) {
  const present: string[] = [];
  for (const signal of signals) {
    if (await pathExists(path.join(cwd, signal))) present.push(signal);
  }
  return present;
}

export async function detectWorkspaceStack(
  cwd: string,
  explicitStack?: string | null,
): Promise<StackDetectionResult> {
  const override = String(explicitStack || "").trim().toLowerCase();
  if ((STACK_IDS as readonly string[]).includes(override)) {
    return {
      stack: override as StackId,
      confidence: "high",
      evidence: [`explicit override: ${override}`],
    };
  }

  const packageJsonPath = path.join(cwd, "package.json");
  const pyprojectPath = path.join(cwd, "pyproject.toml");
  const cargoPath = path.join(cwd, "Cargo.toml");
  const goModPath = path.join(cwd, "go.mod");
  const packageJson = await readJsonFile<Record<string, any>>(packageJsonPath, {});
  const pyprojectRaw = await readFileIfExists(pyprojectPath);
  const cargoRaw = await readFileIfExists(cargoPath);
  const goModRaw = await readFileIfExists(goModPath);

  for (const group of STACK_SIGNAL_GROUPS) {
    const presentSignals = await collectPresentSignals(cwd, group.signals);
    if (presentSignals.length === 0) continue;

    if (group.stack === "ml") {
      const mlHints = [pyprojectRaw, await readFileIfExists(path.join(cwd, "requirements.txt"))]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();
      if (!/(torch|transformers|langchain|llama-index|scikit-learn|xgboost|pandas)/.test(mlHints)) {
        continue;
      }
    }

    if (group.stack === "fullstack") {
      const deps = JSON.stringify({
        deps: packageJson.dependencies || {},
        devDeps: packageJson.devDependencies || {},
      }).toLowerCase();
      if (!/(next|react|express|nestjs|fastify|prisma)/.test(deps)) {
        continue;
      }
    }

    if (group.stack === "web") {
      const deps = JSON.stringify({
        deps: packageJson.dependencies || {},
        devDeps: packageJson.devDependencies || {},
      }).toLowerCase();
      if (!/(react|vue|svelte|vite|next)/.test(deps)) continue;
    }

    if (group.stack === "api") {
      const apiHints = [pyprojectRaw, cargoRaw, goModRaw, JSON.stringify(packageJson)].join("\n").toLowerCase();
      if (!/(fastapi|django|flask|nestjs|express|hono|actix|axum|echo|gin|fiber|spring|api)/.test(apiHints)) {
        continue;
      }
    }

    if (group.stack === "cli") {
      const cliHints = JSON.stringify(packageJson).toLowerCase();
      const hasBin = typeof packageJson.bin === "string" || typeof packageJson.bin === "object";
      if (!hasBin && !/(commander|yargs|oclif|click|cobra)/.test(cliHints)) {
        continue;
      }
    }

    return {
      stack: group.stack,
      confidence: group.confidence,
      evidence: presentSignals,
    };
  }

  if (await pathExists(packageJsonPath)) {
    return {
      stack: "web",
      confidence: "low",
      evidence: ["package.json"],
    };
  }

  return {
    stack: "api",
    confidence: "low",
    evidence: ["fallback"],
  };
}

export async function detectRecommendedPlatforms(cwd: string) {
  const recommended: string[] = [];
  for (const [platform, signals] of Object.entries(PLATFORM_SIGNAL_MAP)) {
    const present = await collectPresentSignals(cwd, signals);
    if (present.length > 0) recommended.push(platform);
  }
  if (recommended.length === 0) recommended.push("codex");
  return recommended;
}

export function normalizeWorkspaceProfile(value?: string | null) {
  return normalizeOneOf(value, WORKSPACE_PROFILES, DEFAULT_PROFILE);
}

export function normalizeHookProfile(value?: string | null) {
  return normalizeOneOf(value, HOOK_PROFILES, DEFAULT_HOOK_PROFILE);
}

export function normalizeAuthoringAi(value?: string | null) {
  return normalizeOneOf(value, AUTHORING_AI_IDS, "codex");
}

export function normalizeCapabilityPacks(value: unknown) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  const unique = new Set<string>();
  for (const item of items) {
    const normalized = String(item).trim().toLowerCase();
    if ((CAPABILITY_PACK_IDS as readonly string[]).includes(normalized)) {
      unique.add(normalized);
    }
  }
  return [...unique];
}

export async function loadCatalogVersion(cwd: string) {
  const manifestPath = path.join(
    cwd,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "manifest.json",
  );
  const manifest = await readJsonFile<Record<string, any>>(manifestPath, {});
  return String(manifest.version || "unknown");
}

export async function ensureWorkspaceRuntimeDirs(
  cwd: string,
  { dryRun = false }: { dryRun?: boolean } = {},
) {
  const dirs = [
    path.join(cwd, WORKSPACE_RUNTIME_DIR),
    path.join(cwd, HARNESS_RUNTIME_DIR),
    path.join(cwd, LOOP_RUNTIME_DIR),
    path.join(cwd, AUDIT_RUNTIME_DIR),
    path.join(cwd, MEMORY_RUNTIME_DIR),
    path.join(cwd, MEMORY_INBOX_DIR),
    path.join(cwd, MEMORY_APPLIED_DIR),
    path.join(cwd, MEMORY_REJECTED_DIR),
  ];
  if (!dryRun) {
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  return dirs.map((dir) => toPosixPath(path.relative(cwd, dir)));
}

export async function readWorkspaceManifest(cwd: string) {
  return readJsonFile<Record<string, any>>(
    path.join(cwd, WORKSPACE_MANIFEST_FILE),
    {},
  );
}

export async function writeWorkspaceManifest(
  cwd: string,
  manifest: Record<string, any>,
  { dryRun = false }: { dryRun?: boolean } = {},
) {
  const manifestPath = path.join(cwd, WORKSPACE_MANIFEST_FILE);
  if (dryRun) return manifestPath;
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifestPath;
}

export async function writeWorkspaceSummary(
  cwd: string,
  manifest: Record<string, any>,
  { dryRun = false }: { dryRun?: boolean } = {},
) {
  const summaryPath = path.join(cwd, WORKSPACE_SUMMARY_FILE);
  const stackEvidence = Array.isArray(manifest.stackEvidence)
    ? manifest.stackEvidence
    : [];
  const parityStates = manifest.parityStates && typeof manifest.parityStates === "object"
    ? manifest.parityStates
    : {};
  const lines = [
    "# CBX Workspace Summary",
    "",
    `- Profile: ${manifest.profile || DEFAULT_PROFILE}`,
    `- Stack: ${manifest.detectedStack || "unknown"}`,
    `- Stack evidence: ${stackEvidence.length > 0 ? stackEvidence.join(", ") : "(none)"}`,
    `- Authoring AI: ${manifest.selectedAuthoringAI || "unset"}`,
    `- Hook profile: ${manifest.hookProfile || DEFAULT_HOOK_PROFILE}`,
    `- Learning mode: ${manifest.learningMode || DEFAULT_LEARNING_MODE}`,
    `- Platforms: ${Array.isArray(manifest.installedPlatforms) && manifest.installedPlatforms.length > 0 ? manifest.installedPlatforms.join(", ") : "(none)"}`,
    `- Packs: ${Array.isArray(manifest.installedPacks) && manifest.installedPacks.length > 0 ? manifest.installedPacks.join(", ") : "(none)"}`,
    `- MCP servers: ${Array.isArray(manifest.mcpServers) && manifest.mcpServers.length > 0 ? manifest.mcpServers.join(", ") : "(none)"}`,
    "",
    "## Workspace Files",
    "",
    "- `.claude/` / `.codex/` / `.gemini/` / `.github/` projections as installed",
    "- `docs/foundation/*` context docs when generated",
    "- `.cbx/harness/*` runtime state",
    "- `.cbx/memory/inbox/*` learning review queue",
    "",
    "## Parity",
    "",
  ];

  for (const [platform, summary] of Object.entries(parityStates)) {
    if (!summary || typeof summary !== "object") continue;
    const stats = summary as Record<string, number | string | undefined>;
    lines.push(
      `- ${platform}: native=${stats.native ?? 0}, degraded=${stats.degraded ?? 0}, blocked=${stats.blocked ?? 0}`,
    );
  }

  lines.push(
    "",
    "## Refresh Commands",
    "",
    "- `cbx sync`",
    "- `cbx context generate`",
    "- `cbx doctor`",
    "- `cbx harness audit`",
    "",
  );

  if (!dryRun) {
    await fs.writeFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
  }
  return summaryPath;
}

async function hashFiles(cwd: string, relativePaths: string[]) {
  const hash = createHash("sha256");
  for (const relativePath of relativePaths) {
    const fullPath = path.join(cwd, relativePath);
    const raw = await readFileIfExists(fullPath);
    if (!raw) continue;
    hash.update(relativePath);
    hash.update("\n");
    hash.update(raw);
    hash.update("\n");
  }
  return hash.digest("hex");
}

export async function collectFoundationDocState(cwd: string) {
  const docs = [
    "docs/foundation/ARCHITECTURE.md",
    "docs/foundation/TECH.md",
    "docs/foundation/MEMORY.md",
    "docs/foundation/PRODUCT.md",
    "CLAUDE.md",
    "AGENTS.md",
    "GEMINI.md",
    WORKSPACE_SUMMARY_FILE,
  ];
  const present: string[] = [];
  for (const doc of docs) {
    if (await pathExists(path.join(cwd, doc))) present.push(doc);
  }
  return {
    docs: present,
    hash: await hashFiles(cwd, present),
  };
}

export async function buildWorkspaceManifest({
  cwd,
  profile,
  stackDetection,
  authoringAi,
  platforms,
  packs,
  mcpServers,
  hookProfile,
  learningMode,
  parityStates,
  installedAssets,
  generatedDocs,
}: {
  cwd: string;
  profile: ProfileId;
  stackDetection: StackDetectionResult;
  authoringAi: AuthoringAiId;
  platforms: string[];
  packs: string[];
  mcpServers: string[];
  hookProfile: HookProfileId;
  learningMode: string;
  parityStates: Record<string, any>;
  installedAssets: Record<string, any>;
  generatedDocs: string[];
}) {
  const existing = await readWorkspaceManifest(cwd);
  const docState = await collectFoundationDocState(cwd);
  const catalogVersion = await loadCatalogVersion(cwd);
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    foundryVersion: existing.foundryVersion || existing.version || "workspace-managed",
    catalogVersion,
    profile,
    detectedStack: stackDetection.stack,
    stackEvidence: stackDetection.evidence,
    stackConfidence: stackDetection.confidence,
    selectedAuthoringAI: authoringAi,
    installedPlatforms: platforms,
    installedPacks: packs,
    installedModules: existing.installedModules || [
      "rules-core",
      "agents-core",
      "workflows-core",
      "skills-core",
      "contexts-core",
      "platform-configs",
    ],
    installedAssets,
    parityStates,
    mcpServers,
    hookProfile,
    learningMode,
    generatedDocs,
    docHash: docState.hash,
    docsPresent: docState.docs,
    updatedAt: now,
    harnessRuntimeDir: toPosixPath(HARNESS_RUNTIME_DIR),
    memoryInboxDir: toPosixPath(MEMORY_INBOX_DIR),
  };
}

function buildFinding(
  findings: HarnessAuditFinding[],
  finding: HarnessAuditFinding,
) {
  findings.push(finding);
}

async function scanFileForPatterns(
  cwd: string,
  relativePath: string,
  findings: HarnessAuditFinding[],
) {
  const content = await readFileIfExists(path.join(cwd, relativePath));
  if (!content) return;

  const secretPattern =
    /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["'][^"']{8,}["']/i;

  if (/approval_policy\s*=\s*["']never["']/i.test(content)) {
    buildFinding(findings, {
      id: "approval-never",
      severity: "high",
      title: "Write-capable no-approval profile detected",
      file: relativePath,
      detail: "Avoid default write-capable approval_policy=never profiles for orchestration or loops.",
    });
  }
  if (/\bnpx\s+-y\b/i.test(content) || /@latest\b/i.test(content)) {
    buildFinding(findings, {
      id: "unpinned-mcp-or-tooling",
      severity: "medium",
      title: "Unpinned install/runtime command detected",
      file: relativePath,
      detail: "Baseline defaults should avoid npx -y and @latest because they widen supply-chain risk.",
    });
  }
  if (/replace\s+\$arguments|replace the user'?s request/i.test(content)) {
    buildFinding(findings, {
      id: "prompt-replacement",
      severity: "high",
      title: "Prompt replacement pattern detected",
      file: relativePath,
      detail: "Do not replace the user prompt with MCP/model-enhanced text.",
    });
  }
  if (/ignore previous instructions|system:\s*override/i.test(content)) {
    buildFinding(findings, {
      id: "prompt-injection-surface",
      severity: "medium",
      title: "Prompt-injection phrase detected",
      file: relativePath,
      detail: "Instruction-like text in managed files should be treated as untrusted unless intentionally authored.",
    });
  }
  if (/transcript|session summary|user messages/i.test(content) && /memory|learn/i.test(relativePath)) {
    buildFinding(findings, {
      id: "transcript-replay-risk",
      severity: "medium",
      title: "Potential transcript replay surface",
      file: relativePath,
      detail: "Do not auto-promote raw transcript text into future system context.",
    });
  }
  if (secretPattern.test(content)) {
    buildFinding(findings, {
      id: "inline-secret",
      severity: "high",
      title: "Inline secret-like value detected",
      file: relativePath,
      detail: "Project files must not contain inline secrets. Use ~/.cbx/credentials.env indirection only.",
    });
  }
}

export async function runWorkspaceHarnessAudit({
  cwd,
  scope = "repo",
}: {
  cwd: string;
  scope?: string;
}) {
  const findings: HarnessAuditFinding[] = [];
  const candidateFiles = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    "cbx_manifest.json",
    ".mcp.json",
    ".vscode/mcp.json",
    ".codex/config.toml",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".gemini/settings.json",
    ".github/copilot-instructions.md",
  ];
  for (const candidate of candidateFiles) {
    await scanFileForPatterns(cwd, candidate, findings);
  }

  const hookDirs = [".claude/hooks", ".cbx/harness"];
  for (const relativeDir of hookDirs) {
    const fullDir = path.join(cwd, relativeDir);
    if (!(await pathExists(fullDir))) continue;
    const stack = [fullDir];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        if (!entry.isFile()) continue;
        const relativePath = toPosixPath(path.relative(cwd, fullPath));
        await scanFileForPatterns(cwd, relativePath, findings);
      }
    }
  }

  const summary = {
    scope,
    overall: findings.some((finding) => finding.severity === "high")
      ? "fail"
      : findings.some((finding) => finding.severity === "medium")
        ? "warn"
        : "pass",
    findings,
    generatedAt: new Date().toISOString(),
  };

  return summary;
}
