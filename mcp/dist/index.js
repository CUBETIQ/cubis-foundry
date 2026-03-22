#!/usr/bin/env node

// src/config/index.ts
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/config/schema.ts
import { z } from "zod";
var ServerConfigSchema = z.object({
  server: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  vault: z.object({
    roots: z.array(z.string()).min(1),
    summaryMaxLength: z.number().int().positive().default(200),
  }),
  telemetry: z
    .object({
      charsPerToken: z.number().positive().default(4),
    })
    .default({ charsPerToken: 4 }),
  transport: z.object({
    default: z.enum(["stdio", "streamable-http"]).default("stdio"),
    http: z
      .object({
        port: z.number().int().positive().default(3100),
        host: z.string().default("127.0.0.1"),
      })
      .optional(),
  }),
});
var FORBIDDEN_KEYS = [
  "apiKey",
  "api_key",
  "secret",
  "token",
  "password",
  "credential",
];
function rejectCredentialFields(raw) {
  const json = JSON.stringify(raw);
  for (const key of FORBIDDEN_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(
        `Server config.json must not contain credential field "${key}". Store credentials in cbx_config.json instead.`,
      );
    }
  }
}

// src/utils/logger.ts
var LEVEL_ORDER = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
var currentLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
if (!LEVEL_ORDER[currentLevel]) {
  currentLevel = "info";
}
function setLogLevel(level) {
  currentLevel = level;
}
function shouldLog(level) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}
function ts() {
  return /* @__PURE__ */ new Date().toISOString();
}
var logger = {
  debug(msg, data) {
    if (shouldLog("debug")) {
      process.stderr.write(
        `[${ts()}] DEBUG ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`,
      );
    }
  },
  info(msg, data) {
    if (shouldLog("info")) {
      process.stderr.write(
        `[${ts()}] INFO  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`,
      );
    }
  },
  warn(msg, data) {
    if (shouldLog("warn")) {
      process.stderr.write(
        `[${ts()}] WARN  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`,
      );
    }
  },
  error(msg, data) {
    if (shouldLog("error")) {
      process.stderr.write(
        `[${ts()}] ERROR ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`,
      );
    }
  },
  /** Raw line to stderr (no timestamp/level prefix). Used for startup banners. */
  raw(msg) {
    process.stderr.write(`${msg}
`);
  },
};

// src/config/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var PKG_ROOT =
  path.basename(__dirname) === "config"
    ? path.resolve(__dirname, "../..")
    : path.resolve(__dirname, "..");
var DEFAULT_CONFIG_PATH = path.resolve(PKG_ROOT, "config.json");
function loadServerConfig(configPath) {
  const resolved = configPath ?? DEFAULT_CONFIG_PATH;
  logger.debug(`Loading server config from ${resolved}`);
  let raw;
  try {
    raw = readFileSync(resolved, "utf8");
  } catch {
    throw new Error(`Cannot read server config: ${resolved}`);
  }
  const parsed = JSON.parse(raw);
  rejectCredentialFields(parsed);
  const result = ServerConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid server config: ${result.error.message}`);
  }
  return result.data;
}

// src/routes/loadGeneratedRouteManifest.ts
import { readFile } from "fs/promises";
import path2 from "path";
function createEmptyRouteManifest() {
  return {
    $schema: "cubis-foundry-route-manifest-v1",
    generatedAt: /* @__PURE__ */ new Date(0).toISOString(),
    contentHash: "missing",
    summary: {
      totalRoutes: 0,
      workflows: 0,
      agents: 0,
    },
    routes: [],
  };
}
async function loadGeneratedRouteManifest(mcpPackageRoot) {
  const filePath = path2.resolve(
    mcpPackageRoot,
    "../workflows/workflows/agent-environment-setup/generated/route-manifest.json",
  );
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.routes)) {
      throw new Error("missing routes array");
    }
    return parsed;
  } catch (error) {
    logger.warn(
      `Generated route manifest unavailable at ${filePath}: ${String(error)}`,
    );
    return createEmptyRouteManifest();
  }
}

// src/vault/scanner.ts
import { open, readdir, stat } from "fs/promises";
import path3 from "path";
async function scanVaultRoots(roots, basePath) {
  const skillsById = /* @__PURE__ */ new Map();
  for (const rootRel of roots) {
    const rootAbs = path3.resolve(basePath, rootRel);
    let entries;
    try {
      entries = await readdir(rootAbs);
    } catch {
      logger.warn(`Vault root not found, skipping: ${rootAbs}`);
      continue;
    }
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = path3.join(rootAbs, entry);
      const entryStat = await stat(entryPath).catch(() => null);
      if (!entryStat?.isDirectory()) continue;
      const skillFile = path3.join(entryPath, "SKILL.md");
      const skillStat = await stat(skillFile).catch(() => null);
      if (!skillStat?.isFile()) continue;
      if (skillStat.size === 0) {
        logger.warn(`Skipping empty SKILL.md: ${skillFile}`);
        continue;
      }
      const rawPreview = await readFrontmatterPreview(skillFile);
      const frontmatter = rawPreview ? parseFrontmatter(rawPreview) : null;
      const wrapperKind = detectWrapperKind(entry, frontmatter);
      if (wrapperKind) {
        logger.debug(
          `Skipping wrapper skill ${entry} (${wrapperKind}) at ${skillFile}`,
        );
        continue;
      }
      const skillPointer = {
        id: entry,
        category: deriveCategory(entry),
        path: skillFile,
        fileBytes: skillStat.size,
      };
      registerSkillPointer(skillsById, skillPointer);
      for (const aliasId of extractMetadataAliases(frontmatter)) {
        if (aliasId === entry) continue;
        registerSkillPointer(skillsById, {
          id: aliasId,
          canonicalId: entry,
          category: skillPointer.category,
          path: skillFile,
          fileBytes: skillStat.size,
        });
      }
    }
  }
  const skills = [...skillsById.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  logger.info(`Vault scan complete: ${skills.length} skills discovered`);
  return skills;
}
var WRAPPER_PREFIXES = ["workflow-", "agent-"];
var WRAPPER_KINDS = /* @__PURE__ */ new Set(["workflow", "agent"]);
var FRONTMATTER_PREVIEW_BYTES = 8192;
function extractWrapperKindFromId(skillId) {
  const lower = skillId.toLowerCase();
  if (lower.startsWith(WRAPPER_PREFIXES[0])) return "workflow";
  if (lower.startsWith(WRAPPER_PREFIXES[1])) return "agent";
  return null;
}
async function readFrontmatterPreview(skillFile) {
  const handle = await open(skillFile, "r").catch(() => null);
  if (!handle) return null;
  try {
    const buffer = Buffer.alloc(FRONTMATTER_PREVIEW_BYTES);
    const { bytesRead } = await handle.read(
      buffer,
      0,
      FRONTMATTER_PREVIEW_BYTES,
      0,
    );
    return buffer.toString("utf8", 0, bytesRead);
  } finally {
    await handle.close();
  }
}
function parseFrontmatter(rawPreview) {
  const match = rawPreview.match(/^---\s*\n([\s\S]*?)\n---/);
  return match?.[1] ?? null;
}
function parseInlineList(raw) {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}
function extractMetadataWrapper(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  let inMetadata = false;
  for (const line of lines) {
    if (!inMetadata) {
      if (/^\s*metadata\s*:\s*$/.test(line)) {
        inMetadata = true;
      }
      continue;
    }
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const match = line.match(/^\s+wrapper\s*:\s*(.+)\s*$/);
    if (!match) continue;
    const value = match[1]
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .toLowerCase();
    if (WRAPPER_KINDS.has(value)) {
      return value;
    }
  }
  return null;
}
function extractMetadataAliases(frontmatter) {
  if (!frontmatter) return [];
  const lines = frontmatter.split(/\r?\n/);
  let inMetadata = false;
  const aliases = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inMetadata) {
      if (/^\s*metadata\s*:\s*$/.test(line)) {
        inMetadata = true;
      }
      continue;
    }
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const inlineMatch = line.match(/^\s+aliases\s*:\s*(.+)\s*$/);
    if (!inlineMatch) continue;
    const rest = inlineMatch[1].trim();
    if (rest.startsWith("[") && rest.endsWith("]")) {
      aliases.push(...parseInlineList(rest.slice(1, -1)));
      break;
    }
    if (rest) {
      aliases.push(...parseInlineList(rest));
      break;
    }
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (/^\s+[A-Za-z0-9_-]+\s*:/.test(next)) {
        i = j - 1;
        break;
      }
      const bullet = next.match(/^\s+-\s*(.+)$/);
      if (bullet) {
        aliases.push(bullet[1].trim().replace(/^['"]|['"]$/g, ""));
      }
      if (j === lines.length - 1) {
        i = j;
      }
    }
  }
  return [...new Set(aliases.filter(Boolean))];
}
function registerSkillPointer(skillsById, pointer) {
  const key = pointer.id.toLowerCase();
  if (!skillsById.has(key)) {
    skillsById.set(key, pointer);
    return;
  }
  const existing = skillsById.get(key);
  if (!existing) {
    skillsById.set(key, pointer);
    return;
  }
  if (existing.canonicalId && !pointer.canonicalId) {
    skillsById.set(key, pointer);
    return;
  }
  if (
    existing.path !== pointer.path ||
    existing.canonicalId !== pointer.canonicalId
  ) {
    logger.warn(
      `Duplicate skill id '${pointer.id}' discovered; keeping first registration at ${existing.path}`,
    );
  }
}
function detectWrapperKind(skillId, frontmatter) {
  const byId = extractWrapperKindFromId(skillId);
  if (byId) return byId;
  if (!frontmatter) return null;
  const byMetadata = extractMetadataWrapper(frontmatter);
  if (byMetadata === "workflow" || byMetadata === "agent") {
    return byMetadata;
  }
  return null;
}
function deriveCategory(skillId) {
  const categoryMap = {
    flutter: "mobile",
    drift: "mobile",
    gorouter: "mobile",
    riverpod: "mobile",
    react: "frontend",
    next: "frontend",
    nextjs: "frontend",
    tailwind: "frontend",
    vue: "frontend",
    frontend: "frontend",
    nestjs: "backend",
    fastapi: "backend",
    fastify: "backend",
    nodejs: "backend",
    golang: "backend",
    rust: "backend",
    python: "backend",
    javascript: "backend",
    typescript: "backend",
    java: "backend",
    kotlin: "backend",
    csharp: "backend",
    database: "data",
    graphql: "data",
    api: "api",
    openapi: "api",
    devops: "devops",
    terraform: "devops",
    deployment: "devops",
    vercel: "devops",
    security: "security",
    penetration: "security",
    "red-team": "security",
    vulnerability: "security",
    secure: "security",
    test: "testing",
    playwright: "testing",
    qa: "testing",
    tdd: "testing",
    "find-bugs": "testing",
    "fix-review": "testing",
    monitoring: "observability",
    sentry: "observability",
    datadog: "observability",
    performance: "performance",
    "web-perf": "performance",
    git: "tooling",
    lint: "tooling",
    cli: "tooling",
    "clean-code": "practices",
    plan: "practices",
    brainstorm: "practices",
    behavioral: "practices",
    refactor: "practices",
    architecture: "architecture",
    microservices: "architecture",
    "design-system": "design",
    "mobile-design": "design",
    "ui-ux": "design",
    "web-design": "design",
    "ux-ui": "design",
    accessibility: "design",
    documentation: "documentation",
    "code-documenter": "documentation",
    changelog: "documentation",
    game: "game-dev",
    seo: "marketing",
    geo: "marketing",
    i18n: "localization",
    mcp: "mcp",
    prompt: "ai",
    "vercel-ai": "ai",
    stripe: "payments",
    saas: "saas",
  };
  const lower = skillId.toLowerCase();
  for (const [prefix, category] of Object.entries(categoryMap)) {
    if (lower.startsWith(prefix)) return category;
  }
  return "general";
}

// src/vault/manifest.ts
import { readFile as readFile2 } from "fs/promises";
import path4 from "path";

// src/telemetry/tokenBudget.ts
var TOKEN_ESTIMATOR_VERSION = "char-estimator-v1";
function normalizeCharsPerToken(value) {
  if (!Number.isFinite(value) || value <= 0) return 4;
  return value;
}
function estimateTokensFromCharCount(charCount, charsPerToken) {
  const safeChars = Math.max(0, Math.ceil(charCount));
  const ratio = normalizeCharsPerToken(charsPerToken);
  return Math.ceil(safeChars / ratio);
}
function estimateTokensFromText(text2, charsPerToken) {
  return estimateTokensFromCharCount(text2.length, charsPerToken);
}
function estimateTokensFromBytes(byteCount, charsPerToken) {
  return estimateTokensFromCharCount(byteCount, charsPerToken);
}
function estimateSavings(fullCatalogEstimatedTokens, usedEstimatedTokens) {
  const full = Math.max(0, Math.ceil(fullCatalogEstimatedTokens));
  const used = Math.max(0, Math.ceil(usedEstimatedTokens));
  if (full <= 0) {
    return {
      estimatedSavingsTokens: 0,
      estimatedSavingsPercent: 0,
    };
  }
  const estimatedSavingsTokens = Math.max(0, full - used);
  const estimatedSavingsPercent = Number(
    ((estimatedSavingsTokens / full) * 100).toFixed(2),
  );
  return {
    estimatedSavingsTokens,
    estimatedSavingsPercent,
  };
}
function buildSkillToolMetrics({
  charsPerToken,
  fullCatalogEstimatedTokens,
  responseEstimatedTokens,
  selectedSkillsEstimatedTokens = null,
  loadedSkillEstimatedTokens = null,
  responseCharacterCount = 0,
}) {
  const usedEstimatedTokens =
    loadedSkillEstimatedTokens ??
    selectedSkillsEstimatedTokens ??
    responseEstimatedTokens;
  const savings = estimateSavings(
    fullCatalogEstimatedTokens,
    usedEstimatedTokens,
  );
  return {
    estimatorVersion: TOKEN_ESTIMATOR_VERSION,
    charsPerToken: normalizeCharsPerToken(charsPerToken),
    fullCatalogEstimatedTokens: Math.max(0, fullCatalogEstimatedTokens),
    responseEstimatedTokens: Math.max(0, responseEstimatedTokens),
    responseCharacterCount: Math.max(0, responseCharacterCount),
    selectedSkillsEstimatedTokens:
      selectedSkillsEstimatedTokens === null
        ? null
        : Math.max(0, selectedSkillsEstimatedTokens),
    loadedSkillEstimatedTokens:
      loadedSkillEstimatedTokens === null
        ? null
        : Math.max(0, loadedSkillEstimatedTokens),
    estimatedSavingsVsFullCatalog: savings.estimatedSavingsTokens,
    estimatedSavingsVsFullCatalogPercent: savings.estimatedSavingsPercent,
    estimated: true,
  };
}

// src/vault/manifest.ts
function buildManifest(skills, charsPerToken) {
  const categorySet = /* @__PURE__ */ new Set();
  let fullCatalogBytes = 0;
  for (const skill of skills) {
    categorySet.add(skill.category);
    fullCatalogBytes += skill.fileBytes;
  }
  return {
    categories: [...categorySet].sort(),
    skills,
    fullCatalogBytes,
    fullCatalogEstimatedTokens: estimateTokensFromBytes(
      fullCatalogBytes,
      charsPerToken,
    ),
  };
}
function parseDescriptionFromFrontmatter(content, maxLength) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return void 0;
  const frontmatter = fmMatch[1];
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (!descMatch) return void 0;
  let desc = descMatch[1].trim();
  if (
    (desc.startsWith('"') && desc.endsWith('"')) ||
    (desc.startsWith("'") && desc.endsWith("'"))
  ) {
    desc = desc.slice(1, -1);
  }
  if (desc.length > maxLength) {
    return desc.slice(0, maxLength - 3) + "...";
  }
  return desc;
}
async function readFullSkillContent(skillPath) {
  return readFile2(skillPath, "utf8");
}
var MARKDOWN_LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
var MAX_REFERENCED_FILES = 25;
function parseFrontmatter2(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { raw: "", body: content };
  return { raw: match[1], body: content.slice(match[0].length) };
}
function parseMetadataFromFrontmatter(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;
  for (const line of lines) {
    if (/^metadata\s*:\s*$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!kv) continue;
    metadata[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return metadata;
}
function parseSkillFrontmatter(content) {
  const { raw } = parseFrontmatter2(content);
  return {
    description: parseDescriptionFromFrontmatter(
      content,
      Number.MAX_SAFE_INTEGER,
    ),
    metadata: parseMetadataFromFrontmatter(raw),
  };
}
function normalizeLinkTarget(rawTarget) {
  let target = String(rawTarget || "").trim();
  if (!target) return null;
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }
  const firstSpace = target.search(/\s/);
  if (firstSpace > 0) {
    target = target.slice(0, firstSpace).trim();
  }
  target = target.split("#")[0].split("?")[0].trim();
  if (!target) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return null;
  if (/^[a-zA-Z]:[\\/]/.test(target)) return null;
  if (path4.isAbsolute(target)) return null;
  return target;
}
function collectReferencedMarkdownTargets(skillContent) {
  const targets = [];
  const seen = /* @__PURE__ */ new Set();
  for (const match of skillContent.matchAll(MARKDOWN_LINK_RE)) {
    const raw = match[1];
    const normalized = normalizeLinkTarget(raw);
    if (!normalized) continue;
    if (!normalized.toLowerCase().endsWith(".md")) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    targets.push(normalized);
    if (targets.length >= MAX_REFERENCED_FILES) break;
  }
  return targets;
}
function normalizeInSkillMarkdownTarget(skillDir, target) {
  const resolved = path4.resolve(skillDir, target);
  const relative = path4.relative(skillDir, resolved);
  if (relative.startsWith("..") || path4.isAbsolute(relative)) {
    return null;
  }
  if (path4.basename(resolved).toLowerCase() === "skill.md") {
    return null;
  }
  return relative.split(path4.sep).join("/");
}
async function readReferencedMarkdownFiles(skillPath, skillContent) {
  const skillDir = path4.dirname(skillPath);
  const targets = collectReferencedMarkdownTargets(skillContent);
  const references = [];
  for (const target of targets) {
    const resolved = path4.resolve(skillDir, target);
    const relative = path4.relative(skillDir, resolved);
    if (relative.startsWith("..") || path4.isAbsolute(relative)) {
      continue;
    }
    if (path4.basename(resolved).toLowerCase() === "skill.md") continue;
    try {
      const content = await readFile2(resolved, "utf8");
      references.push({
        relativePath: relative.split(path4.sep).join("/"),
        content,
      });
    } catch (err) {
      logger.debug(`Failed to read referenced markdown ${resolved}: ${err}`);
    }
  }
  return references;
}
async function listReferencedMarkdownPaths(skillPath, skillContent) {
  const source = skillContent ?? (await readFullSkillContent(skillPath));
  const skillDir = path4.dirname(skillPath);
  return collectReferencedMarkdownTargets(source)
    .map((target) => normalizeInSkillMarkdownTarget(skillDir, target))
    .filter((target) => Boolean(target))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_REFERENCED_FILES);
}
async function readSkillReferenceFile(skillPath, relativePath) {
  const normalized = String(relativePath || "").trim();
  if (!normalized || !normalized.toLowerCase().endsWith(".md")) {
    throw new Error(
      "Reference path must be a non-empty relative markdown file.",
    );
  }
  const available = await listReferencedMarkdownPaths(skillPath);
  if (!available.includes(normalized)) {
    throw new Error(
      `Reference path "${normalized}" is not available for this skill.`,
    );
  }
  const skillDir = path4.dirname(skillPath);
  const resolved = path4.resolve(skillDir, normalized);
  const relative = path4.relative(skillDir, resolved);
  if (relative.startsWith("..") || path4.isAbsolute(relative)) {
    throw new Error(
      `Reference path "${normalized}" escapes the skill directory.`,
    );
  }
  return {
    relativePath: relative.split(path4.sep).join("/"),
    content: await readFile2(resolved, "utf8"),
  };
}
async function readSkillContentWithReferences(
  skillPath,
  includeReferences = true,
) {
  const skillContent = await readFullSkillContent(skillPath);
  if (!includeReferences) {
    return { skillContent, references: [] };
  }
  const references = await readReferencedMarkdownFiles(skillPath, skillContent);
  return { skillContent, references };
}
async function readSkillFrontmatter(skillPath) {
  const content = await readFullSkillContent(skillPath);
  return parseSkillFrontmatter(content);
}

// src/vault/generatedManifest.ts
import { readFile as readFile3 } from "fs/promises";
import path5 from "path";
function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values.map((value) => String(value || "").trim()).filter(Boolean),
    ),
  ];
}
async function loadGeneratedSkillManifest(mcpPackageRoot) {
  const filePath = path5.resolve(
    mcpPackageRoot,
    "generated",
    "mcp-manifest.json",
  );
  try {
    const raw = await readFile3(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.skills)) {
      throw new Error("missing skills array");
    }
    return parsed;
  } catch (error) {
    logger.warn(
      `Generated skill manifest unavailable at ${filePath}: ${String(error)}`,
    );
    return null;
  }
}
function mergeGeneratedSkillMetadata(scannedSkills, generatedManifest) {
  if (!generatedManifest?.skills?.length) {
    return scannedSkills;
  }
  const generatedById = new Map(
    generatedManifest.skills.map((entry) => [entry.id.toLowerCase(), entry]),
  );
  const missingIds = scannedSkills
    .filter((skill) => !generatedById.has(skill.id.toLowerCase()))
    .map((skill) => skill.id)
    .sort((a, b) => a.localeCompare(b));
  if (missingIds.length > 0) {
    logger.warn(
      `Generated skill manifest is missing ${missingIds.length} scanned skill(s): ${missingIds.slice(0, 8).join(", ")}${missingIds.length > 8 ? ", ..." : ""}. Run node scripts/generate-mcp-manifest.mjs to refresh the runtime index.`,
    );
  }
  return scannedSkills.map((skill) => {
    const generated = generatedById.get(skill.id.toLowerCase());
    if (!generated) return skill;
    return {
      ...skill,
      category: generated.category || skill.category,
      description: generated.description || skill.description,
      keywords: normalizeStringArray(generated.keywords),
      triggers: normalizeStringArray(generated.triggers),
    };
  });
}

// src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z as z18 } from "zod";

// src/tools/routeResolve.ts
import path6 from "path";
import process2 from "process";
import { promises as fs } from "fs";
import { z as z2 } from "zod";
var routeResolveName = "route_resolve";
var routeResolveDescription =
  "Resolve an explicit workflow command, explicit custom agent, compatibility alias, or free-text intent into one workflow/agent route before skill loading.";
var routeResolveSchema = z2.object({
  intent: z2
    .string()
    .min(1)
    .describe(
      "Explicit workflow command (/implement), explicit agent (@reviewer), compatibility alias ($workflow-implement / $agent-reviewer), or free-text user intent",
    ),
});
var ROUTE_STOP_WORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "app",
  "for",
  "help",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "please",
  "the",
  "to",
  "with",
]);
var SKILL_CREATOR_OBJECT_SIGNALS = [
  "skill",
  "skills",
  "skill authoring",
  "skill-authoring",
  "skill creator",
  "skill-creator",
  "skill.md",
  "power.md",
  "frontmatter",
  "metadata",
  "reference",
  "references",
  "sidecar",
  "sidecars",
  "mirror",
  "mirrors",
];
var SKILL_CREATOR_ACTION_SIGNALS = [
  "adapt",
  "author",
  "build",
  "check",
  "create",
  "design",
  "fix",
  "maintain",
  "migrate",
  "normalize",
  "plan",
  "repair",
  "review",
  "scaffold",
  "spec",
  "update",
  "validate",
  "wire",
];
var SKILL_CREATOR_PLAN_SIGNALS = ["design", "plan", "spec"];
var SKILL_CREATOR_REVIEW_SIGNALS = ["audit", "check", "review", "validate"];
var SKILL_CREATOR_ORCHESTRATE_SIGNALS = [
  "all platform",
  "all platforms",
  "cross platform",
  "cross-platform",
  "every platform",
  "generator",
  "mirror",
  "mirrors",
];
var LANGUAGE_SIGNAL_FILES = [
  {
    skillId: "typescript-pro",
    files: ["tsconfig.json", "tsconfig.base.json", "deno.json"],
  },
  { skillId: "javascript-pro", files: ["package.json"] },
  {
    skillId: "python-pro",
    files: ["pyproject.toml", "requirements.txt", "requirements-dev.txt"],
  },
  { skillId: "golang-pro", files: ["go.mod"] },
  { skillId: "rust-pro", files: ["Cargo.toml"] },
  { skillId: "csharp-pro", files: [".sln", ".csproj"] },
  { skillId: "java-pro", files: ["pom.xml", "build.gradle"] },
  { skillId: "kotlin-pro", files: ["build.gradle.kts", "settings.gradle.kts"] },
  { skillId: "dart-pro", files: ["pubspec.yaml"] },
  { skillId: "php-pro", files: ["composer.json"] },
  { skillId: "ruby-pro", files: ["Gemfile"] },
  { skillId: "swift-pro", files: ["Package.swift"] },
];
var LEGACY_WORKFLOW_ALIASES = {
  brainstorm: "plan",
  qa: "test",
  incident: "devops",
  postman: "backend",
};
var LEGACY_AGENT_ALIASES = {
  "penetration-tester": "security-auditor",
  "qa-automation-engineer": "test-engineer",
  "product-owner": "product-manager",
  "explorer-agent": "code-archaeologist",
};
var STITCH_REQUIRED_SIGNALS = ["stitch"];
var DESIGN_SYSTEM_SIGNALS = [
  "design system",
  "design-system",
  "design tokens",
  "theme system",
  "token system",
];
var DESIGN_AUDIT_SIGNALS = [
  "design audit",
  "ui audit",
  "ux audit",
  "visual audit",
  "design review",
];
var DESIGN_REFRESH_SIGNALS = [
  "design refresh",
  "refresh design",
  "refresh tokens",
  "design drift",
];
var DESIGN_SCREEN_SIGNALS = [
  "design screen",
  "screen design",
  "ui design",
  "ux design",
  "landing page",
  "redesign",
  "mobile screen",
];
var STITCH_UI_SUPPORTING_SKILLS = [
  "frontend-design-core",
  "frontend-design-style-selector",
  "frontend-design-system",
  "frontend-design-screen-brief",
  "stitch-prompt-enhancement",
  "stitch-design-orchestrator",
  "stitch-design-system",
  "stitch-implementation-handoff",
];
var MOBILE_DESIGN_SUPPORTING_SKILLS = [
  "frontend-design-mobile-patterns",
  "frontend-design-implementation-handoff",
];
function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9@/$+-]+/g, " ")
    .trim();
}
function tokenize(value) {
  const seen = /* @__PURE__ */ new Set();
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !ROUTE_STOP_WORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
}
function countTokenMatches(haystack, tokens) {
  let matches = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matches += 1;
  }
  return matches;
}
function includesAnyPhrase(normalizedIntent, phrases) {
  return phrases.some((phrase) => normalizedIntent.includes(phrase));
}
function isSkillCreatorIntent(intent) {
  const normalizedIntent = normalize(intent);
  const hasObjectSignal = includesAnyPhrase(
    normalizedIntent,
    SKILL_CREATOR_OBJECT_SIGNALS,
  );
  if (!hasObjectSignal) return false;
  return includesAnyPhrase(normalizedIntent, SKILL_CREATOR_ACTION_SIGNALS);
}
function isStitchUiIntent(intent) {
  const normalizedIntent = normalize(intent);
  return includesAnyPhrase(normalizedIntent, STITCH_REQUIRED_SIGNALS);
}
function isDesignIntent(intent) {
  const normalizedIntent = normalize(intent);
  return (
    includesAnyPhrase(normalizedIntent, DESIGN_SYSTEM_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_AUDIT_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_REFRESH_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_SCREEN_SIGNALS)
  );
}
function chooseSkillCreatorRoute(intent, manifest) {
  if (!isSkillCreatorIntent(intent)) return null;
  const normalizedIntent = normalize(intent);
  let preferredRouteId = "create";
  if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_REVIEW_SIGNALS)) {
    preferredRouteId = "review";
  } else if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_PLAN_SIGNALS)) {
    preferredRouteId = "plan";
  } else if (
    includesAnyPhrase(normalizedIntent, SKILL_CREATOR_ORCHESTRATE_SIGNALS)
  ) {
    preferredRouteId = "orchestrate";
  }
  return (
    manifest.routes.find(
      (entry) => entry.kind === "workflow" && entry.id === preferredRouteId,
    ) || null
  );
}
function buildSearchText(route) {
  return normalize(
    [
      route.kind,
      route.id,
      route.command || "",
      route.displayName,
      route.description,
      route.primaryAgent,
      ...route.supportingAgents,
      ...route.triggers,
      ...route.primarySkills,
      ...route.supportingSkills,
      route.artifacts.codex?.compatibilityAlias || "",
      route.artifacts.antigravity?.commandFile || "",
      route.artifacts.copilot?.promptFile || "",
      route.artifacts.claude?.workflowFile || "",
      route.artifacts.claude?.agentFile || "",
    ].join(" "),
  );
}
function findExplicitRoute(intent, manifest) {
  const trimmed = intent.trim();
  if (trimmed.startsWith("/")) {
    const route = manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        entry.command?.toLowerCase() === trimmed.toLowerCase(),
    );
    if (route) return { route, matchedBy: "explicit-workflow-command" };
    const legacyWorkflowId =
      LEGACY_WORKFLOW_ALIASES[trimmed.slice(1).toLowerCase()];
    if (legacyWorkflowId) {
      const legacyRoute = manifest.routes.find(
        (entry) => entry.kind === "workflow" && entry.id === legacyWorkflowId,
      );
      if (legacyRoute)
        return { route: legacyRoute, matchedBy: "legacy-workflow-alias" };
    }
  }
  if (trimmed.startsWith("@")) {
    const normalizedAgent = trimmed.slice(1).toLowerCase();
    const route = manifest.routes.find(
      (entry) =>
        entry.kind === "agent" && entry.id.toLowerCase() === normalizedAgent,
    );
    if (route) return { route, matchedBy: "explicit-agent" };
    const legacyAgentId = LEGACY_AGENT_ALIASES[normalizedAgent];
    if (legacyAgentId) {
      const legacyRoute = manifest.routes.find(
        (entry) =>
          entry.kind === "agent" && entry.id.toLowerCase() === legacyAgentId,
      );
      if (legacyRoute)
        return { route: legacyRoute, matchedBy: "legacy-agent-alias" };
    }
  }
  if (trimmed.startsWith("$")) {
    const normalizedAlias = trimmed.toLowerCase();
    const route = manifest.routes.find(
      (entry) =>
        entry.artifacts.codex?.compatibilityAlias?.toLowerCase() ===
        normalizedAlias,
    );
    if (route) return { route, matchedBy: "compatibility-alias" };
  }
  return null;
}
function resolveByIntent(intent, manifest) {
  const normalizedIntent = normalize(intent);
  const tokens = tokenize(intent);
  let best = null;
  for (const route of manifest.routes) {
    const searchText = buildSearchText(route);
    const phraseMatch =
      normalizedIntent.length > 0 && searchText.includes(normalizedIntent);
    const tokenMatches = countTokenMatches(searchText, tokens);
    const triggerMatches = route.triggers.reduce((sum, trigger) => {
      return sum + (normalizedIntent.includes(normalize(trigger)) ? 1 : 0);
    }, 0);
    const score =
      (phraseMatch ? 500 : 0) +
      triggerMatches * 120 +
      tokenMatches * 40 +
      (route.kind === "workflow" ? 10 : 0);
    if (score <= 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && route.id.localeCompare(best.route.id) < 0)
    ) {
      best = {
        route,
        matchedBy: triggerMatches > 0 ? "trigger-match" : "intent-match",
        score,
        tokenMatches,
      };
    }
  }
  if (!best) return null;
  if (best.score < 80 && best.tokenMatches < 2) return null;
  return best;
}
function buildResolvedPayload(
  input,
  route,
  matchedBy,
  detectedLanguageSkill,
  overrides = {},
) {
  const primarySkills = overrides.primarySkills || route.primarySkills;
  const supportingSkills = overrides.supportingSkills || route.supportingSkills;
  const primarySkillHint =
    overrides.primarySkillHint !== void 0
      ? overrides.primarySkillHint
      : isSkillCreatorIntent(input)
        ? "skill-creator"
        : primarySkills[0] || null;
  return {
    input,
    resolved: true,
    kind: route.kind,
    id: route.id,
    command: route.command,
    agent: route.primaryAgent,
    primarySkillHint,
    primarySkills,
    supportingSkills,
    detectedLanguageSkill,
    fallbackSkillSearchRecommended: false,
    matchedBy,
    explanation:
      overrides.explanation ??
      (matchedBy === "explicit-workflow-command"
        ? `Matched explicit workflow command ${route.command}.`
        : matchedBy === "explicit-agent"
          ? `Matched explicit agent @${route.id}.`
          : matchedBy === "legacy-workflow-alias"
            ? `Matched legacy workflow alias and routed to canonical workflow '${route.id}'.`
            : matchedBy === "legacy-agent-alias"
              ? `Matched legacy agent alias and routed to canonical agent @${route.id}.`
              : matchedBy === "compatibility-alias"
                ? `Matched compatibility alias ${route.artifacts.codex?.compatibilityAlias}.`
                : matchedBy === "skill-creator-intent"
                  ? `Matched workflow '${route.id}' and selected skill-creator as the primary skill hint for skill package work.`
                  : `Matched ${route.kind} '${route.id}' from installed route metadata.`),
    artifacts: route.artifacts,
  };
}
function chooseStitchUiRoute(manifest) {
  return (
    manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        (entry.id === "design-screen" || entry.command === "/design-screen"),
    ) || null
  );
}
function chooseDesignRoute(intent, manifest) {
  const normalizedIntent = normalize(intent);
  let preferredWorkflowId = "design-screen";
  if (includesAnyPhrase(normalizedIntent, DESIGN_SYSTEM_SIGNALS)) {
    preferredWorkflowId = "design-system";
  } else if (includesAnyPhrase(normalizedIntent, DESIGN_AUDIT_SIGNALS)) {
    preferredWorkflowId = "design-audit";
  } else if (includesAnyPhrase(normalizedIntent, DESIGN_REFRESH_SIGNALS)) {
    preferredWorkflowId = "design-refresh";
  }
  return (
    manifest.routes.find(
      (entry) => entry.kind === "workflow" && entry.id === preferredWorkflowId,
    ) || null
  );
}
async function fileExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}
async function detectLanguageSkillHint() {
  const cwd = process2.cwd();
  const candidates = await fs.readdir(cwd).catch(() => []);
  const has = (fileName) => candidates.includes(fileName);
  for (const entry of LANGUAGE_SIGNAL_FILES) {
    for (const fileName of entry.files) {
      if (fileName === ".sln" || fileName === ".csproj") {
        if (candidates.some((item) => item.endsWith(fileName))) {
          return "csharp-pro";
        }
        continue;
      }
      if (has(fileName) || (await fileExists(path6.join(cwd, fileName)))) {
        if (entry.skillId === "javascript-pro") {
          const tsSignals = [
            "tsconfig.json",
            "tsconfig.base.json",
            "deno.json",
          ];
          if (tsSignals.some((signal) => has(signal))) {
            return "typescript-pro";
          }
        }
        return entry.skillId;
      }
    }
  }
  return null;
}
async function handleRouteResolve(args, routeManifest) {
  const { intent } = args;
  const detectedLanguageSkill = await detectLanguageSkillHint();
  const explicit = findExplicitRoute(intent, routeManifest);
  if (explicit) {
    const payload2 = buildResolvedPayload(
      intent,
      explicit.route,
      explicit.matchedBy,
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(payload2, null, 2) }],
      structuredContent: payload2,
    };
  }
  const skillCreatorRoute = chooseSkillCreatorRoute(intent, routeManifest);
  if (skillCreatorRoute) {
    const payload2 = buildResolvedPayload(
      intent,
      skillCreatorRoute,
      "skill-creator-intent",
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(payload2, null, 2) }],
      structuredContent: payload2,
    };
  }
  if (isStitchUiIntent(intent)) {
    const stitchRoute = chooseStitchUiRoute(routeManifest);
    if (stitchRoute) {
      const needsMobilePatterns = /\b(mobile|flutter|android|ios)\b/i.test(
        intent,
      );
      const payload2 = buildResolvedPayload(
        intent,
        stitchRoute,
        "stitch-ui-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "frontend-design",
          primarySkills: [
            "frontend-design",
            ...(needsMobilePatterns ? MOBILE_DESIGN_SUPPORTING_SKILLS : []),
            ...STITCH_UI_SUPPORTING_SKILLS,
          ],
          supportingSkills: stitchRoute.supportingSkills,
          explanation:
            "Matched Stitch UI intent and routed to /design-screen so the design engine resolves canonical design state, builds the screen brief, and only then runs the Stitch sequence.",
        },
      );
      return {
        content: [{ type: "text", text: JSON.stringify(payload2, null, 2) }],
        structuredContent: payload2,
      };
    }
  }
  if (isDesignIntent(intent)) {
    const designRoute = chooseDesignRoute(intent, routeManifest);
    if (designRoute) {
      const needsMobilePatterns = /\b(mobile|flutter|android|ios)\b/i.test(
        intent,
      );
      const primarySkills = ["frontend-design", "frontend-design-core"];
      if (designRoute.id === "design-system") {
        primarySkills.push(
          "frontend-design-style-selector",
          "frontend-design-system",
        );
      } else if (designRoute.id === "design-audit") {
        primarySkills.push("frontend-design-style-selector");
      } else if (designRoute.id === "design-refresh") {
        primarySkills.push(
          "frontend-design-style-selector",
          "frontend-design-system",
          "frontend-design-screen-brief",
        );
      } else {
        primarySkills.push(
          "frontend-design-style-selector",
          "frontend-design-screen-brief",
        );
      }
      if (needsMobilePatterns) {
        primarySkills.push(...MOBILE_DESIGN_SUPPORTING_SKILLS);
      }
      const payload2 = buildResolvedPayload(
        intent,
        designRoute,
        "design-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "frontend-design",
          primarySkills,
          supportingSkills: designRoute.supportingSkills,
          explanation:
            "Matched design intent and routed through the design engine so canonical design state, overlays, and screen briefs resolve before implementation or generation.",
        },
      );
      return {
        content: [{ type: "text", text: JSON.stringify(payload2, null, 2) }],
        structuredContent: payload2,
      };
    }
  }
  const inferred = resolveByIntent(intent, routeManifest);
  if (inferred) {
    const payload2 = buildResolvedPayload(
      intent,
      inferred.route,
      inferred.matchedBy,
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(payload2, null, 2) }],
      structuredContent: payload2,
    };
  }
  const payload = {
    input: intent,
    resolved: false,
    kind: null,
    id: null,
    command: null,
    agent: null,
    primarySkillHint: null,
    primarySkills: [],
    supportingSkills: [],
    detectedLanguageSkill,
    fallbackSkillSearchRecommended: true,
    matchedBy: "none",
    explanation:
      "No workflow or custom agent matched the current intent. Inspect locally first, then use one narrow skill_search only if the domain is still unclear.",
    artifacts: null,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

// src/tools/skillListCategories.ts
import { z as z3 } from "zod";
var skillListCategoriesName = "skill_list_categories";
var skillListCategoriesDescription =
  "List all skill categories available in the vault. Returns category names and skill counts.";
var skillListCategoriesSchema = z3.object({});
function handleSkillListCategories(manifest, charsPerToken) {
  const categoryCounts = {};
  for (const skill of manifest.skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] ?? 0) + 1;
  }
  const categories = manifest.categories.map((cat) => ({
    category: cat,
    skillCount: categoryCounts[cat] ?? 0,
  }));
  const payload = { categories, totalSkills: manifest.skills.length };
  const text2 = JSON.stringify(payload, null, 2);
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text2, charsPerToken),
    responseCharacterCount: text2.length,
  });
  return {
    content: [
      {
        type: "text",
        text: text2,
      },
    ],
    structuredContent: {
      metrics,
    },
    _meta: {
      metrics,
    },
  };
}

// src/tools/skillBrowseCategory.ts
import { z as z4 } from "zod";

// src/utils/errors.ts
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
function invalidInput(message) {
  throw new McpError(ErrorCode.InvalidParams, message);
}
function configNotFound() {
  throw new McpError(
    ErrorCode.InternalError,
    "cbx_config.json not found. Run cbx workflows config --scope global --show to diagnose.",
  );
}
function unknownPostmanMode(url) {
  throw new McpError(
    ErrorCode.InvalidParams,
    `Unknown Postman MCP URL in config: "${url}". Expected one of: https://mcp.postman.com/minimal, https://mcp.postman.com/code, https://mcp.postman.com/mcp`,
  );
}
function notFound(entity, id) {
  throw new McpError(ErrorCode.InvalidParams, `${entity} not found: "${id}"`);
}

// src/tools/skillBrowseCategory.ts
var skillBrowseCategoryName = "skill_browse_category";
var skillBrowseCategoryDescription =
  "Browse skills within a specific category. Returns skill IDs and short descriptions.";
var skillBrowseCategorySchema = z4.object({
  category: z4
    .string()
    .describe("The category name to browse (from skill_list_categories)"),
});
function summarizeDescription(description, maxLength) {
  const text2 = String(description || "").trim();
  if (!text2) return "(no description)";
  if (text2.length <= maxLength) return text2;
  return `${text2.slice(0, Math.max(0, maxLength - 3))}...`;
}
async function handleSkillBrowseCategory(
  args,
  manifest,
  summaryMaxLength,
  charsPerToken,
) {
  const { category } = args;
  if (!manifest.categories.includes(category)) {
    notFound("Category", category);
  }
  const matching = manifest.skills.filter((s) => s.category === category);
  const skills = matching.map((s) => ({
    id: s.id,
    description: summarizeDescription(s.description, summaryMaxLength),
  }));
  const payload = { category, skills, count: skills.length };
  const text2 = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matching.reduce(
    (sum, skill) =>
      sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text2, charsPerToken),
    selectedSkillsEstimatedTokens,
    responseCharacterCount: text2.length,
  });
  return {
    content: [
      {
        type: "text",
        text: text2,
      },
    ],
    structuredContent: {
      metrics,
    },
    _meta: {
      metrics,
    },
  };
}

// src/tools/skillSearch.ts
import { z as z5 } from "zod";
var skillSearchName = "skill_search";
var skillSearchDescription =
  "Search skills by keyword. Matches against skill IDs and descriptions. Returns matching skills with short descriptions.";
var skillSearchSchema = z5.object({
  query: z5
    .string()
    .min(1)
    .describe(
      "Search keyword or phrase to match against skill IDs and descriptions",
    ),
});
var SEARCH_STOP_WORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "api",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);
function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function extractQueryTokens(query) {
  const seen = /* @__PURE__ */ new Set();
  const tokens = normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
  return tokens;
}
function countMatchedTokens(haystack, tokens) {
  if (!haystack) return 0;
  let matches = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matches += 1;
  }
  return matches;
}
function isWrapperSkillId(id) {
  return id.startsWith("workflow-") || id.startsWith("agent-");
}
function normalizeSignalList(values) {
  return normalizeSearchText((values || []).join(" "));
}
function summarizeDescription2(description, maxLength) {
  const text2 = String(description || "").trim();
  if (!text2) return "(no description)";
  if (text2.length <= maxLength) return text2;
  return `${text2.slice(0, Math.max(0, maxLength - 3))}...`;
}
async function handleSkillSearch(
  args,
  manifest,
  summaryMaxLength,
  charsPerToken,
) {
  const { query } = args;
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = extractQueryTokens(query);
  const rankedMatches = manifest.skills
    .filter((skill) => !isWrapperSkillId(skill.id))
    .map((skill) => {
      const normalizedId = normalizeSearchText(skill.id);
      const normalizedCategory = normalizeSearchText(skill.category);
      const normalizedDescription = normalizeSearchText(
        skill.description ?? "",
      );
      const normalizedKeywords = normalizeSignalList(skill.keywords);
      const normalizedTriggers = normalizeSignalList(skill.triggers);
      const idPhraseMatch = normalizedId.includes(normalizedQuery);
      const categoryPhraseMatch = normalizedCategory.includes(normalizedQuery);
      const descriptionPhraseMatch =
        normalizedDescription.includes(normalizedQuery);
      const keywordPhraseMatch = normalizedKeywords.includes(normalizedQuery);
      const triggerPhraseMatch = normalizedTriggers.includes(normalizedQuery);
      const idTokenMatches = countMatchedTokens(normalizedId, queryTokens);
      const categoryTokenMatches = countMatchedTokens(
        normalizedCategory,
        queryTokens,
      );
      const descriptionTokenMatches = countMatchedTokens(
        normalizedDescription,
        queryTokens,
      );
      const keywordTokenMatches = countMatchedTokens(
        normalizedKeywords,
        queryTokens,
      );
      const triggerTokenMatches = countMatchedTokens(
        normalizedTriggers,
        queryTokens,
      );
      const totalTokenMatches =
        idTokenMatches +
        categoryTokenMatches +
        descriptionTokenMatches +
        keywordTokenMatches +
        triggerTokenMatches;
      const score =
        (idPhraseMatch ? 500 : 0) +
        (triggerPhraseMatch ? 425 : 0) +
        (keywordPhraseMatch ? 350 : 0) +
        (descriptionPhraseMatch ? 225 : 0) +
        (categoryPhraseMatch ? 150 : 0) +
        idTokenMatches * 50 +
        triggerTokenMatches * 45 +
        keywordTokenMatches * 35 +
        categoryTokenMatches * 25 +
        descriptionTokenMatches * 15;
      return {
        skill,
        score,
        totalTokenMatches,
      };
    })
    .filter(
      ({ score, totalTokenMatches }) =>
        score > 0 && (normalizedQuery.length > 0 || totalTokenMatches > 0),
    )
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id));
  const matches = rankedMatches.map(({ skill }) => skill);
  const results = matches.map((s) => ({
    id: s.id,
    category: s.category,
    description: summarizeDescription2(s.description, summaryMaxLength),
  }));
  const payload = { query, results, count: results.length };
  const text2 = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matches.reduce(
    (sum, skill) =>
      sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text2, charsPerToken),
    selectedSkillsEstimatedTokens,
    responseCharacterCount: text2.length,
  });
  return {
    content: [
      {
        type: "text",
        text: text2,
      },
    ],
    structuredContent: payload,
    _meta: {
      metrics,
    },
  };
}

// src/tools/skillValidate.ts
import { z as z6 } from "zod";
var skillValidateName = "skill_validate";
var skillValidateDescription =
  "Validate an exact skill ID before loading it. Returns alias metadata and discoverable reference markdown paths.";
var skillValidateSchema = z6.object({
  id: z6.string().describe("The exact skill ID (directory name) to validate"),
});
function assertConcreteSkillId(id) {
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use route_resolve with an explicit workflow command, @agent mention, or compatibility alias before loading concrete skills.`,
    );
  }
}
async function handleSkillValidate(args, manifest, charsPerToken) {
  const { id } = args;
  assertConcreteSkillId(id);
  const skill = manifest.skills.find((entry) => entry.id === id);
  if (!skill) {
    const payload2 = {
      id,
      exists: false,
      canonicalId: null,
      category: null,
      description: null,
      isWrapper: false,
      isAlias: false,
      replacementId: null,
      availableReferences: [],
    };
    const text3 = JSON.stringify(payload2, null, 2);
    const metrics2 = buildSkillToolMetrics({
      charsPerToken,
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      responseEstimatedTokens: estimateTokensFromText(text3, charsPerToken),
      responseCharacterCount: text3.length,
    });
    return {
      content: [{ type: "text", text: text3 }],
      structuredContent: payload2,
      _meta: { metrics: metrics2 },
    };
  }
  const frontmatter = await readSkillFrontmatter(skill.path);
  const frontmatterReplacementId =
    frontmatter.metadata.replaced_by || frontmatter.metadata.alias_of || null;
  const replacementId = skill.canonicalId || frontmatterReplacementId || null;
  const isAlias = Boolean(
    skill.canonicalId ||
    frontmatterReplacementId ||
    frontmatter.metadata.deprecated,
  );
  const availableReferences = await listReferencedMarkdownPaths(skill.path);
  const payload = {
    id,
    exists: true,
    canonicalId: replacementId || skill.id,
    category: skill.category,
    description: frontmatter.description || skill.description || null,
    isWrapper: false,
    isAlias,
    replacementId,
    availableReferences,
  };
  const text2 = JSON.stringify(payload, null, 2);
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text2, charsPerToken),
    responseCharacterCount: text2.length,
  });
  return {
    content: [{ type: "text", text: text2 }],
    structuredContent: payload,
    _meta: { metrics },
  };
}

// src/tools/skillGet.ts
import { z as z7 } from "zod";
var skillGetName = "skill_get";
var skillGetDescription =
  "Get full content of a specific skill by ID. Returns SKILL.md content and optionally direct referenced markdown files.";
var skillGetSchema = z7.object({
  id: z7.string().describe("The skill ID (directory name) to retrieve"),
  includeReferences: z7
    .boolean()
    .optional()
    .describe(
      "Whether to include direct local markdown references from SKILL.md (default: false)",
    ),
});
async function handleSkillGet(args, manifest, charsPerToken) {
  const { id, includeReferences = false } = args;
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use route_resolve with an explicit workflow command, @agent mention, or compatibility alias before loading concrete skills.`,
    );
  }
  const skill = manifest.skills.find((s) => s.id === id);
  if (!skill) {
    notFound("Skill", id);
  }
  const { skillContent, references } = await readSkillContentWithReferences(
    skill.path,
    includeReferences,
  );
  const referenceSection =
    references.length > 0
      ? [
          "",
          "## Referenced Files",
          "",
          ...references.flatMap((ref) => [
            `### ${ref.relativePath}`,
            "",
            ref.content.trimEnd(),
            "",
          ]),
        ].join("\n")
      : "";
  const content = `${skillContent}${referenceSection}`;
  if (content.trim().length === 0) {
    invalidInput(
      `Skill "${id}" has empty content (SKILL.md is empty or whitespace-only). This skill may be corrupt or incomplete.`,
    );
  }
  const loadedSkillEstimatedTokens = estimateTokensFromText(
    content,
    charsPerToken,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: loadedSkillEstimatedTokens,
    loadedSkillEstimatedTokens,
    responseCharacterCount: content.length,
  });
  return {
    content: [
      {
        type: "text",
        text: content,
      },
    ],
    structuredContent: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics,
    },
    _meta: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics,
    },
  };
}

// src/tools/skillGetReference.ts
import { z as z8 } from "zod";
var skillGetReferenceName = "skill_get_reference";
var skillGetReferenceDescription =
  "Get one validated markdown reference file for a skill by exact relative path.";
var skillGetReferenceSchema = z8.object({
  id: z8.string().describe("The exact skill ID (directory name)"),
  path: z8
    .string()
    .describe(
      "Exact relative markdown reference path exposed by skill_validate",
    ),
});
function assertConcreteSkillId2(id) {
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use route_resolve with an explicit workflow command, @agent mention, or compatibility alias before loading concrete skills.`,
    );
  }
}
async function handleSkillGetReference(args, manifest, charsPerToken) {
  const { id, path: path12 } = args;
  assertConcreteSkillId2(id);
  const skill = manifest.skills.find((entry) => entry.id === id);
  if (!skill) {
    notFound("Skill", id);
  }
  let reference;
  try {
    reference = await readSkillReferenceFile(skill.path, path12);
  } catch (error) {
    invalidInput(error instanceof Error ? error.message : String(error));
  }
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(
      reference.content,
      charsPerToken,
    ),
    responseCharacterCount: reference.content.length,
  });
  return {
    content: [{ type: "text", text: reference.content }],
    structuredContent: {
      skillId: id,
      path: reference.relativePath,
    },
    _meta: {
      metrics,
    },
  };
}

// src/tools/skillBudgetReport.ts
import { z as z9 } from "zod";
var skillBudgetReportName = "skill_budget_report";
var skillBudgetReportDescription =
  "Report estimated context/token budget for selected and loaded skills compared to the full skill catalog.";
var skillBudgetReportSchema = z9.object({
  selectedSkillIds: z9
    .array(z9.string())
    .default([])
    .describe("Skill IDs selected after search/browse."),
  loadedSkillIds: z9
    .array(z9.string())
    .default([])
    .describe("Skill IDs loaded via skill_get."),
});
function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value)))];
}
function handleSkillBudgetReport(args, manifest, charsPerToken) {
  const selectedSkillIds = uniqueStrings(args.selectedSkillIds ?? []);
  const loadedSkillIds = uniqueStrings(args.loadedSkillIds ?? []);
  const skillById = new Map(manifest.skills.map((skill) => [skill.id, skill]));
  const selectedSkills = selectedSkillIds
    .map((id) => {
      const skill = skillById.get(id);
      if (!skill) return null;
      return {
        id: skill.id,
        category: skill.category,
        estimatedTokens: estimateTokensFromBytes(
          skill.fileBytes,
          charsPerToken,
        ),
      };
    })
    .filter((item) => Boolean(item));
  const loadedSkills = loadedSkillIds
    .map((id) => {
      const skill = skillById.get(id);
      if (!skill) return null;
      return {
        id: skill.id,
        category: skill.category,
        estimatedTokens: estimateTokensFromBytes(
          skill.fileBytes,
          charsPerToken,
        ),
      };
    })
    .filter((item) => Boolean(item));
  const unknownSelectedSkillIds = selectedSkillIds.filter(
    (id) => !skillById.has(id),
  );
  const unknownLoadedSkillIds = loadedSkillIds.filter(
    (id) => !skillById.has(id),
  );
  const selectedSkillsEstimatedTokens = selectedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0,
  );
  const loadedSkillsEstimatedTokens = loadedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0,
  );
  const usedEstimatedTokens =
    loadedSkills.length > 0
      ? loadedSkillsEstimatedTokens
      : selectedSkillsEstimatedTokens;
  const savings = estimateSavings(
    manifest.fullCatalogEstimatedTokens,
    usedEstimatedTokens,
  );
  const selectedIdSet = new Set(selectedSkills.map((skill) => skill.id));
  const loadedIdSet = new Set(loadedSkills.map((skill) => skill.id));
  const skippedSkills = manifest.skills
    .filter(
      (skill) => !selectedIdSet.has(skill.id) && !loadedIdSet.has(skill.id),
    )
    .map((skill) => skill.id)
    .sort((a, b) => a.localeCompare(b));
  const payload = {
    skillLog: {
      selectedSkills,
      loadedSkills,
      skippedSkills,
      unknownSelectedSkillIds,
      unknownLoadedSkillIds,
    },
    contextBudget: {
      estimatorVersion: TOKEN_ESTIMATOR_VERSION,
      charsPerToken,
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      selectedSkillsEstimatedTokens,
      loadedSkillsEstimatedTokens,
      estimatedSavingsTokens: savings.estimatedSavingsTokens,
      estimatedSavingsPercent: savings.estimatedSavingsPercent,
      estimated: true,
    },
  };
  const text2 = JSON.stringify(payload, null, 2);
  return {
    content: [
      {
        type: "text",
        text: text2,
      },
    ],
    structuredContent: payload,
    _meta: payload,
  };
}

// src/tools/postmanGetMode.ts
import { z as z10 } from "zod";

// src/cbxConfig/paths.ts
import path7 from "path";
import os from "os";
import { existsSync } from "fs";
function resolveHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}
function globalConfigPath() {
  return path7.join(resolveHomeDir(), ".cbx", "cbx_config.json");
}
function projectConfigPath(workspaceRoot) {
  const root = workspaceRoot ?? process.cwd();
  return path7.join(root, "cbx_config.json");
}
function resolveConfigPath(scope, workspaceRoot) {
  if (scope === "global") {
    return { path: globalConfigPath(), scope: "global" };
  }
  if (scope === "project") {
    return { path: projectConfigPath(workspaceRoot), scope: "project" };
  }
  const projectPath = projectConfigPath(workspaceRoot);
  if (existsSync(projectPath)) {
    return { path: projectPath, scope: "project" };
  }
  return { path: globalConfigPath(), scope: "global" };
}

// src/cbxConfig/reader.ts
import { readFileSync as readFileSync2, existsSync as existsSync2 } from "fs";
import { parse as parseJsonc } from "jsonc-parser";
function readConfigFile(filePath) {
  if (!existsSync2(filePath)) return null;
  try {
    const raw = readFileSync2(filePath, "utf8");
    return parseJsonc(raw);
  } catch (err) {
    logger.warn(`Failed to parse config at ${filePath}: ${err}`);
    return null;
  }
}
function mergeConfigs(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value !== void 0 &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = mergeConfigs(result[key] ?? {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
function readScopedConfig(scope, workspaceRoot) {
  const configPath =
    scope === "global" ? globalConfigPath() : projectConfigPath(workspaceRoot);
  const config = readConfigFile(configPath);
  if (!config) return null;
  return { config, scope, path: configPath };
}
function readEffectiveConfig(scope, workspaceRoot) {
  if (scope === "global" || scope === "project") {
    return readScopedConfig(scope, workspaceRoot);
  }
  const globalConf = readConfigFile(globalConfigPath());
  const projectPath = projectConfigPath(workspaceRoot);
  const projectConf = readConfigFile(projectPath);
  if (!globalConf && !projectConf) return null;
  const base = globalConf ?? {};
  const override = projectConf ?? {};
  const config = mergeConfigs(base, override);
  const resolved = resolveConfigPath("auto", workspaceRoot);
  return {
    config,
    scope: resolved.scope,
    path: resolved.path,
  };
}

// src/cbxConfig/writer.ts
import {
  readFileSync as readFileSync3,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync as existsSync3,
} from "fs";
import path8 from "path";
import { parse as parseJsonc2 } from "jsonc-parser";
function writeConfigField(fieldPath, value, scope, workspaceRoot) {
  const resolved = resolveConfigPath(scope, workspaceRoot);
  const configPath = resolved.path;
  let config = {};
  if (existsSync3(configPath)) {
    try {
      const raw = readFileSync3(configPath, "utf8");
      config = parseJsonc2(raw);
    } catch {
      logger.warn(
        `Cannot parse existing config at ${configPath}, creating new`,
      );
    }
  }
  const parts = fieldPath.split(".");
  let current = config;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
  const dir = path8.dirname(configPath);
  if (!existsSync3(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${configPath}.tmp.${Date.now()}`;
  writeFileSync(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  renameSync(tmpPath, configPath);
  logger.debug(`Config field "${fieldPath}" written to ${configPath}`);
  return { writtenPath: configPath, scope: resolved.scope };
}

// src/cbxConfig/serviceConfig.ts
var DEFAULT_POSTMAN_URL = "https://mcp.postman.com/minimal";
var DEFAULT_STITCH_URL = "https://stitch.googleapis.com/mcp";
var DEFAULT_PLAYWRIGHT_PORT = 8931;
var DEFAULT_PLAYWRIGHT_URL = `http://localhost:${DEFAULT_PLAYWRIGHT_PORT}/mcp`;
var DEFAULT_PROFILE_NAME = "default";
var DEFAULT_POSTMAN_ENV_VAR = "POSTMAN_API_KEY";
var DEFAULT_STITCH_ENV_VAR = "STITCH_API_KEY";
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}
function normalizeName(value, fallback = DEFAULT_PROFILE_NAME) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}
function normalizeEnvVar(value, fallback) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}
function normalizeOptionalString(value) {
  if (value === null || value === void 0) return null;
  const normalized = String(value).trim();
  return normalized || null;
}
function parsePostmanState(config) {
  const section = asRecord(config.postman) ?? {};
  const mcpUrl = normalizeOptionalString(section.mcpUrl) ?? DEFAULT_POSTMAN_URL;
  const fallbackEnvVar = normalizeEnvVar(
    section.apiKeyEnvVar,
    DEFAULT_POSTMAN_ENV_VAR,
  );
  const rawProfiles = Array.isArray(section.profiles) ? section.profiles : [];
  const profiles = [];
  for (const rawProfile of rawProfiles) {
    const profile = asRecord(rawProfile);
    if (!profile) continue;
    profiles.push({
      name: normalizeName(profile.name, DEFAULT_PROFILE_NAME),
      apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
      workspaceId: normalizeOptionalString(
        profile.workspaceId ?? profile.defaultWorkspaceId,
      ),
      hasInlineApiKey:
        typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0,
    });
  }
  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      workspaceId: normalizeOptionalString(section.defaultWorkspaceId),
      hasInlineApiKey:
        typeof section.apiKey === "string" && section.apiKey.trim().length > 0,
    });
  }
  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile =
    profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];
  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
  };
}
function parseStitchState(config) {
  const section = asRecord(config.stitch) ?? {};
  const mcpUrl = normalizeOptionalString(section.mcpUrl) ?? DEFAULT_STITCH_URL;
  const fallbackEnvVar = normalizeEnvVar(
    section.apiKeyEnvVar,
    DEFAULT_STITCH_ENV_VAR,
  );
  const rawProfiles = section.profiles;
  const profiles = [];
  if (Array.isArray(rawProfiles)) {
    for (const rawProfile of rawProfiles) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push({
        name: normalizeName(profile.name, DEFAULT_PROFILE_NAME),
        apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
        url: normalizeOptionalString(profile.url),
        hasInlineApiKey:
          typeof profile.apiKey === "string" &&
          profile.apiKey.trim().length > 0,
      });
    }
  } else if (asRecord(rawProfiles)) {
    for (const [profileName, rawProfile] of Object.entries(rawProfiles)) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push({
        name: normalizeName(profileName, DEFAULT_PROFILE_NAME),
        apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
        url: normalizeOptionalString(profile.url),
        hasInlineApiKey:
          typeof profile.apiKey === "string" &&
          profile.apiKey.trim().length > 0,
      });
    }
  }
  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      url: normalizeOptionalString(section.url) ?? mcpUrl,
      hasInlineApiKey:
        typeof section.apiKey === "string" && section.apiKey.trim().length > 0,
    });
  }
  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile =
    profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];
  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
    useSystemGcloud: Boolean(section.useSystemGcloud),
  };
}
function parsePlaywrightState(config) {
  const section = asRecord(config.playwright) ?? {};
  const portRaw =
    typeof section.port === "number" ? section.port : DEFAULT_PLAYWRIGHT_PORT;
  const port =
    Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536
      ? portRaw
      : DEFAULT_PLAYWRIGHT_PORT;
  const envPort = process.env.PLAYWRIGHT_MCP_PORT
    ? Number(process.env.PLAYWRIGHT_MCP_PORT)
    : void 0;
  const effectivePort =
    envPort && Number.isFinite(envPort) && envPort > 0 && envPort < 65536
      ? envPort
      : port;
  const mcpUrl =
    normalizeOptionalString(section.mcpUrl) ??
    `http://localhost:${effectivePort}/mcp`;
  return { mcpUrl, port: effectivePort };
}

// src/tools/postmanModes.ts
var POSTMAN_MODES = {
  minimal: "https://mcp.postman.com/minimal",
  code: "https://mcp.postman.com/code",
  full: "https://mcp.postman.com/mcp",
};
var URL_TO_MODE = new Map(
  Object.entries(POSTMAN_MODES).map(([mode, url]) => [url, mode]),
);
function urlToMode(url) {
  return URL_TO_MODE.get(url);
}
function isValidMode(mode) {
  return mode in POSTMAN_MODES;
}

// src/tools/postmanGetMode.ts
var postmanGetModeName = "postman_get_mode";
var postmanGetModeDescription =
  "Get the current Postman MCP mode from cbx_config.json. Returns the friendly mode name and URL.";
var postmanGetModeSchema = z10.object({
  scope: z10
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});
function handlePostmanGetMode(args) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const postmanState = parsePostmanState(effective.config);
  const url = postmanState.mcpUrl;
  if (!url) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: null,
              url: null,
              scope: effective.scope,
              message:
                "Postman mcpUrl not configured. Use postman_set_mode to set one.",
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  const mode = urlToMode(url);
  if (!mode) {
    unknownPostmanMode(url);
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            mode,
            url,
            scope: effective.scope,
            availableModes: Object.keys(POSTMAN_MODES),
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/postmanSetMode.ts
import { z as z11 } from "zod";
var postmanSetModeName = "postman_set_mode";
var postmanSetModeDescription =
  "Set the Postman MCP mode in cbx_config.json. Modes: minimal, code, full.";
var postmanSetModeSchema = z11.object({
  mode: z11
    .enum(["minimal", "code", "full"])
    .describe("Postman MCP mode to set: minimal, code, or full"),
  scope: z11
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to write. Default: auto (project if exists, else global)",
    ),
});
function handlePostmanSetMode(args) {
  const { mode } = args;
  const scope = args.scope ?? "auto";
  if (!isValidMode(mode)) {
    invalidInput(
      `Invalid Postman mode: "${mode}". Valid modes: minimal, code, full`,
    );
  }
  const url = POSTMAN_MODES[mode];
  const result = writeConfigField("postman.mcpUrl", url, scope);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            mode,
            url,
            scope: result.scope,
            writtenPath: result.writtenPath,
            note: "Postman MCP mode updated. Restart your MCP client to pick up the change.",
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/postmanGetStatus.ts
import { z as z12 } from "zod";
var postmanGetStatusName = "postman_get_status";
var postmanGetStatusDescription =
  "Get full Postman configuration status including mode, URL, and workspace ID.";
var postmanGetStatusSchema = z12.object({
  scope: z12
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});
function handlePostmanGetStatus(args) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const postman = parsePostmanState(effective.config);
  const activeProfile = postman.activeProfile;
  const url = postman.mcpUrl ?? null;
  const mode = url ? (urlToMode(url) ?? "unknown") : null;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            configured: !!url,
            mode,
            url,
            defaultWorkspaceId: activeProfile?.workspaceId ?? null,
            activeProfileName: postman.activeProfileName,
            profileCount: postman.profiles.length,
            apiKeyEnvVar: activeProfile?.apiKeyEnvVar ?? null,
            scope: effective.scope,
            configPath: effective.path,
            availableModes: Object.keys(POSTMAN_MODES),
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/stitchGetMode.ts
import { z as z13 } from "zod";
var stitchGetModeName = "stitch_get_mode";
var stitchGetModeDescription =
  "Get the active Stitch profile name and URL from cbx_config.json. Never exposes API keys.";
var stitchGetModeSchema = z13.object({
  scope: z13
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});
function handleStitchGetMode(args) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const stitch = parseStitchState(effective.config);
  const activeProfileName = stitch.activeProfileName;
  const profileNames = stitch.profiles.map((profile) => profile.name);
  const activeUrl = stitch.activeProfile?.url ?? null;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            activeProfileName,
            activeUrl,
            availableProfiles: profileNames,
            scope: effective.scope,
            note: "API keys are never exposed through this tool.",
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/stitchSetProfile.ts
import { z as z14 } from "zod";
var stitchSetProfileName = "stitch_set_profile";
var stitchSetProfileDescription =
  "Set the active Stitch profile in cbx_config.json. The profile must already exist in the config.";
var stitchSetProfileSchema = z14.object({
  profileName: z14
    .string()
    .min(1)
    .describe("Name of the Stitch profile to activate"),
  scope: z14
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to write. Default: auto (project if exists, else global)",
    ),
});
function handleStitchSetProfile(args) {
  const { profileName } = args;
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const stitch = parseStitchState(effective.config);
  const profileNames = stitch.profiles.map((profile) => profile.name);
  const targetProfile =
    stitch.profiles.find((profile) => profile.name === profileName) ?? null;
  if (!targetProfile) {
    invalidInput(
      `Stitch profile "${profileName}" not found. Available profiles: ${profileNames.join(", ") || "(none)"}`,
    );
  }
  const result = writeConfigField(
    "stitch.activeProfileName",
    profileName,
    scope,
  );
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            activeProfileName: profileName,
            url: targetProfile.url ?? null,
            scope: result.scope,
            writtenPath: result.writtenPath,
            note: "Stitch active profile updated. Restart your MCP client to pick up the change.",
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/stitchGetStatus.ts
import { z as z15 } from "zod";
var stitchGetStatusName = "stitch_get_status";
var stitchGetStatusDescription =
  "Get full Stitch configuration status including active profile, all profile names, and URLs. Never exposes API keys.";
var stitchGetStatusSchema = z15.object({
  scope: z15
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});
function handleStitchGetStatus(args) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const stitch = parseStitchState(effective.config);
  const activeProfileName = stitch.activeProfileName;
  const profileSummaries = stitch.profiles.map((profile) => ({
    name: profile.name,
    url: profile.url ?? null,
    apiKeyEnvVar: profile.apiKeyEnvVar,
    hasApiKey: profile.hasInlineApiKey,
    hasInlineApiKey: profile.hasInlineApiKey,
    isActive: profile.name === activeProfileName,
  }));
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            configured: profileSummaries.length > 0,
            activeProfileName,
            profiles: profileSummaries,
            totalProfiles: profileSummaries.length,
            mcpUrl: stitch.mcpUrl,
            useSystemGcloud: Boolean(stitch.useSystemGcloud),
            scope: effective.scope,
            configPath: effective.path,
            note: "API keys are never exposed. Env-var aliases are reported for runtime configuration.",
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/playwrightGetStatus.ts
import { z as z16 } from "zod";
var playwrightGetStatusName = "playwright_get_status";
var playwrightGetStatusDescription =
  "Get Playwright MCP upstream configuration status including URL and port.";
var playwrightGetStatusSchema = z16.object({
  scope: z16
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});
function handlePlaywrightGetStatus(args) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    configNotFound();
  }
  const playwright = parsePlaywrightState(effective.config);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            configured: Boolean(playwright.mcpUrl),
            mcpUrl: playwright.mcpUrl,
            port: playwright.port,
            scope: effective.scope,
            configPath: effective.path,
            note: "Playwright MCP runs locally \u2014 no authentication required. Start with: npx @playwright/mcp --port <port>",
          },
          null,
          2,
        ),
      },
    ],
  };
}

// src/tools/mcpGateway.ts
import { z as z17 } from "zod";
var postmanListEnabledToolsName = "postman_list_enabled_tools";
var postmanListEnabledToolsDescription =
  "List currently enabled Postman upstream passthrough tools and gateway warnings.";
var postmanListEnabledToolsSchema = z17.object({});
var stitchListEnabledToolsName = "stitch_list_enabled_tools";
var stitchListEnabledToolsDescription =
  "List currently enabled Stitch upstream passthrough tools and gateway warnings.";
var stitchListEnabledToolsSchema = z17.object({});
var mcpGatewayStatusName = "mcp_gateway_status";
var mcpGatewayStatusDescription =
  "Get passthrough gateway status for Postman and Stitch, including warnings and catalog location.";
var mcpGatewayStatusSchema = z17.object({});
function text(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
function handlePostmanListEnabledTools(gateway) {
  return text(gateway.listEnabledTools("postman"));
}
function handleStitchListEnabledTools(gateway) {
  return text(gateway.listEnabledTools("stitch"));
}
function handleMcpGatewayStatus(gateway) {
  return text(gateway.getStatus());
}

// src/tools/registry.ts
function withDefaultScope(args, defaultScope) {
  const safeArgs = args && typeof args === "object" ? args : {};
  return {
    ...safeArgs,
    scope: typeof safeArgs.scope === "string" ? safeArgs.scope : defaultScope,
  };
}
var TOOL_REGISTRY = [
  // ── Route tools ───────────────────────────────────────────
  {
    name: routeResolveName,
    description: routeResolveDescription,
    schema: routeResolveSchema,
    category: "route",
    createHandler: (ctx) => async (args) =>
      handleRouteResolve(args, ctx.routeManifest),
  },
  // ── Gateway helper tools ──────────────────────────────────
  {
    name: mcpGatewayStatusName,
    description: mcpGatewayStatusDescription,
    schema: mcpGatewayStatusSchema,
    category: "gateway",
    createHandler: (ctx) => async () =>
      handleMcpGatewayStatus(ctx.gatewayManager),
  },
  {
    name: postmanListEnabledToolsName,
    description: postmanListEnabledToolsDescription,
    schema: postmanListEnabledToolsSchema,
    category: "gateway",
    createHandler: (ctx) => async () =>
      handlePostmanListEnabledTools(ctx.gatewayManager),
  },
  {
    name: stitchListEnabledToolsName,
    description: stitchListEnabledToolsDescription,
    schema: stitchListEnabledToolsSchema,
    category: "gateway",
    createHandler: (ctx) => async () =>
      handleStitchListEnabledTools(ctx.gatewayManager),
  },
  // ── Skill vault tools ─────────────────────────────────────
  {
    name: skillListCategoriesName,
    description: skillListCategoriesDescription,
    schema: skillListCategoriesSchema,
    category: "skill",
    createHandler: (ctx) => async () =>
      handleSkillListCategories(ctx.manifest, ctx.charsPerToken),
  },
  {
    name: skillBrowseCategoryName,
    description: skillBrowseCategoryDescription,
    schema: skillBrowseCategorySchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillBrowseCategory(
        args,
        ctx.manifest,
        ctx.summaryMaxLength,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillSearchName,
    description: skillSearchDescription,
    schema: skillSearchSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillSearch(
        args,
        ctx.manifest,
        ctx.summaryMaxLength,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillValidateName,
    description: skillValidateDescription,
    schema: skillValidateSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillValidate(args, ctx.manifest, ctx.charsPerToken),
  },
  {
    name: skillGetName,
    description: skillGetDescription,
    schema: skillGetSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillGet(args, ctx.manifest, ctx.charsPerToken),
  },
  {
    name: skillGetReferenceName,
    description: skillGetReferenceDescription,
    schema: skillGetReferenceSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillGetReference(args, ctx.manifest, ctx.charsPerToken),
  },
  {
    name: skillBudgetReportName,
    description: skillBudgetReportDescription,
    schema: skillBudgetReportSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillBudgetReport(args, ctx.manifest, ctx.charsPerToken),
  },
  // ── Postman tools ─────────────────────────────────────────
  {
    name: postmanGetModeName,
    description: postmanGetModeDescription,
    schema: postmanGetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanGetMode(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  {
    name: postmanSetModeName,
    description: postmanSetModeDescription,
    schema: postmanSetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanSetMode(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  {
    name: postmanGetStatusName,
    description: postmanGetStatusDescription,
    schema: postmanGetStatusSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanGetStatus(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  // ── Stitch tools ──────────────────────────────────────────
  {
    name: stitchGetModeName,
    description: stitchGetModeDescription,
    schema: stitchGetModeSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchGetMode(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  {
    name: stitchSetProfileName,
    description: stitchSetProfileDescription,
    schema: stitchSetProfileSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchSetProfile(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  {
    name: stitchGetStatusName,
    description: stitchGetStatusDescription,
    schema: stitchGetStatusSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchGetStatus(withDefaultScope(args, ctx.defaultConfigScope)),
  },
  // ── Playwright tools ──────────────────────────────────────
  {
    name: playwrightGetStatusName,
    description: playwrightGetStatusDescription,
    schema: playwrightGetStatusSchema,
    category: "playwright",
    createHandler: (ctx) => async (args) =>
      handlePlaywrightGetStatus(withDefaultScope(args, ctx.defaultConfigScope)),
  },
];

// src/gateway/catalog.ts
import { mkdirSync as mkdirSync2, writeFileSync as writeFileSync2 } from "fs";
import os2 from "os";
import path9 from "path";
function resolveCatalogDir(scope, configPath) {
  if (scope === "project" && configPath) {
    return path9.join(path9.dirname(configPath), ".cbx", "mcp", "catalog");
  }
  return path9.join(os2.homedir(), ".cbx", "mcp", "catalog");
}
function catalogFilePath(catalogDir, provider) {
  return path9.join(catalogDir, `${provider}.tools.json`);
}
function persistCatalog(catalogDir, payload) {
  mkdirSync2(catalogDir, { recursive: true });
  const filePath = catalogFilePath(catalogDir, payload.provider);
  writeFileSync2(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return filePath;
}

// src/gateway/config.ts
var STITCH_DEFAULT_MCP_URL = "https://stitch.googleapis.com/mcp";
var PLAYWRIGHT_DEFAULT_PORT = 8931;
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function firstString(...values) {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }
  return null;
}
function normalizeProfiles(profiles) {
  if (!profiles) {
    return [];
  }
  if (Array.isArray(profiles)) {
    return profiles
      .map((profile, index) => ({
        name: firstString(profile.name) ?? `profile_${index + 1}`,
        profile,
      }))
      .filter((entry) => !!entry.profile);
  }
  return Object.entries(profiles).map(([name, profile]) => ({
    name,
    profile,
  }));
}
function selectActiveProfile(profiles, activeProfileName) {
  if (profiles.length === 0) {
    return null;
  }
  const active = firstString(activeProfileName);
  if (active) {
    const hit = profiles.find((profile) => profile.name === active);
    if (hit) {
      return hit;
    }
  }
  return profiles[0];
}
function buildPostmanConfig(postman, scope, configPath) {
  const warnings = [];
  const profiles = normalizeProfiles(postman?.profiles);
  const active = selectActiveProfile(profiles, postman?.activeProfileName);
  const mcpUrl = firstString(
    postman?.mcpUrl,
    active?.profile.mcpUrl,
    active?.profile.url,
  );
  if (!mcpUrl) {
    warnings.push("Postman MCP URL is not configured (postman.mcpUrl).");
  }
  const authEnvVar = firstString(
    active?.profile.tokenEnvVar,
    active?.profile.apiKeyEnvVar,
    postman?.tokenEnvVar,
    postman?.apiKeyEnvVar,
  );
  const rawApiKeySet = !!firstString(active?.profile.apiKey);
  if (rawApiKeySet) {
    warnings.push(
      "Postman profile apiKey is ignored; configure apiKeyEnvVar/tokenEnvVar alias instead.",
    );
  }
  if (!authEnvVar) {
    warnings.push(
      "Postman auth env var alias is missing (active profile apiKeyEnvVar/tokenEnvVar).",
    );
    return {
      provider: "postman",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      scope,
      configPath,
      warnings,
    };
  }
  const token = process.env[authEnvVar];
  if (!isNonEmptyString(token)) {
    warnings.push(`Postman auth env var "${authEnvVar}" is not set.`);
    return {
      provider: "postman",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      scope,
      configPath,
      warnings,
    };
  }
  return {
    provider: "postman",
    mcpUrl,
    authHeader: { Authorization: `Bearer ${token}` },
    authEnvVar,
    scope,
    configPath,
    warnings,
  };
}
function buildStitchConfig(stitch, scope, configPath) {
  const warnings = [];
  const profiles = normalizeProfiles(stitch?.profiles);
  const active = selectActiveProfile(profiles, stitch?.activeProfileName);
  const mcpUrl =
    firstString(stitch?.mcpUrl, active?.profile.mcpUrl, active?.profile.url) ??
    STITCH_DEFAULT_MCP_URL;
  const authEnvVar = firstString(
    active?.profile.apiKeyEnvVar,
    stitch?.apiKeyEnvVar,
  );
  const rawApiKeySet = !!firstString(active?.profile.apiKey);
  if (rawApiKeySet) {
    warnings.push(
      "Stitch profile apiKey is ignored; configure apiKeyEnvVar alias instead.",
    );
  }
  if (!authEnvVar) {
    warnings.push(
      "Stitch auth env var alias is missing (active profile apiKeyEnvVar).",
    );
    return {
      provider: "stitch",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      scope,
      configPath,
      warnings,
    };
  }
  const apiKey = process.env[authEnvVar];
  if (!isNonEmptyString(apiKey)) {
    warnings.push(`Stitch auth env var "${authEnvVar}" is not set.`);
    return {
      provider: "stitch",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      scope,
      configPath,
      warnings,
    };
  }
  return {
    provider: "stitch",
    mcpUrl,
    authHeader: { "X-Goog-Api-Key": apiKey },
    authEnvVar,
    scope,
    configPath,
    warnings,
  };
}
function buildPlaywrightConfig(playwright, scope, configPath) {
  const warnings = [];
  const portRaw = playwright?.port ?? PLAYWRIGHT_DEFAULT_PORT;
  const envPort = process.env.PLAYWRIGHT_MCP_PORT
    ? Number(process.env.PLAYWRIGHT_MCP_PORT)
    : void 0;
  const effectivePort =
    envPort && Number.isFinite(envPort) && envPort > 0 && envPort < 65536
      ? envPort
      : Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536
        ? portRaw
        : PLAYWRIGHT_DEFAULT_PORT;
  const mcpUrl =
    firstString(playwright?.mcpUrl) ?? `http://localhost:${effectivePort}/mcp`;
  return {
    provider: "playwright",
    mcpUrl,
    authHeader: {},
    authEnvVar: null,
    scope,
    configPath,
    warnings,
  };
}
function resolveGatewayConfig(scope = "auto") {
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    const warning =
      "cbx_config.json not found. Configure Postman/Stitch profiles to enable upstream passthrough.";
    return {
      scope: null,
      configPath: null,
      providers: {
        postman: {
          provider: "postman",
          mcpUrl: null,
          authHeader: null,
          authEnvVar: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
        stitch: {
          provider: "stitch",
          mcpUrl: STITCH_DEFAULT_MCP_URL,
          authHeader: null,
          authEnvVar: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
        playwright: buildPlaywrightConfig(void 0, null, null),
      },
    };
  }
  return {
    scope: effective.scope,
    configPath: effective.path,
    providers: {
      postman: buildPostmanConfig(
        effective.config.postman,
        effective.scope,
        effective.path,
      ),
      stitch: buildStitchConfig(
        effective.config.stitch,
        effective.scope,
        effective.path,
      ),
      playwright: buildPlaywrightConfig(
        effective.config.playwright,
        effective.scope,
        effective.path,
      ),
    },
  };
}

// src/gateway/upstreamClient.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
function toObjectSchema(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  return value;
}
var SdkUpstreamClientFactory = class {
  async connect(params) {
    const client = new Client(
      {
        name: "cubis-foundry-mcp-gateway",
        version: "0.1.0",
      },
      { capabilities: {} },
    );
    const transport = new StreamableHTTPClientTransport(
      new URL(params.mcpUrl),
      {
        requestInit: {
          headers: params.headers,
        },
      },
    );
    await client.connect(transport);
    return {
      async listTools() {
        const listed = await client.listTools();
        return listed.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: toObjectSchema(tool.inputSchema),
        }));
      },
      async callTool(toolName, args) {
        return await client.callTool({
          name: toolName,
          arguments: args,
        });
      },
      async close() {
        await client.close();
      },
    };
  }
};

// src/gateway/manager.ts
function emptyProviderState(provider) {
  return {
    provider,
    mcpUrl: null,
    authEnvVar: null,
    authConfigured: false,
    available: false,
    warnings: [],
    lastError: null,
    syncedAt: null,
    tools: [],
  };
}
function messageFromError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
function errorResult(message) {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
function normalizeCallResult(result) {
  if (Array.isArray(result.content)) {
    return result;
  }
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
    isError: result.isError ?? false,
    structuredContent: result.structuredContent,
  };
}
function normalizeArgs(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {};
  }
  return args;
}
var GatewayManager = class {
  clientFactory;
  providerRuntime = {
    postman: { mcpUrl: null, headers: null, authEnvVar: null },
    stitch: { mcpUrl: null, headers: null, authEnvVar: null },
    playwright: { mcpUrl: null, headers: null, authEnvVar: null },
  };
  providerState = {
    postman: emptyProviderState("postman"),
    stitch: emptyProviderState("stitch"),
    playwright: emptyProviderState("playwright"),
  };
  scope = null;
  configPath = null;
  catalogDir = resolveCatalogDir(null, null);
  constructor(options) {
    this.clientFactory =
      options?.clientFactory ?? new SdkUpstreamClientFactory();
  }
  async initialize(scope = "auto") {
    const resolved = resolveGatewayConfig(scope);
    this.scope = resolved.scope;
    this.configPath = resolved.configPath;
    this.catalogDir = resolveCatalogDir(resolved.scope, resolved.configPath);
    await Promise.all([
      this.syncProvider("postman", resolved.providers.postman),
      this.syncProvider("stitch", resolved.providers.stitch),
      this.syncProvider("playwright", resolved.providers.playwright),
    ]);
  }
  getCatalogDir() {
    return this.catalogDir;
  }
  getStatus() {
    return {
      scope: this.scope,
      configPath: this.configPath,
      catalogDir: this.catalogDir,
      generatedAt: /* @__PURE__ */ new Date().toISOString(),
      providers: {
        postman: this.providerState.postman,
        stitch: this.providerState.stitch,
        playwright: this.providerState.playwright,
      },
    };
  }
  listEnabledTools(provider) {
    const state = this.providerState[provider];
    return {
      provider,
      available: state.available,
      enabledCount: state.tools.length,
      enabledTools: state.tools.map((tool) => `${provider}.${tool.name}`),
      upstreamTools: state.tools,
      warnings: state.warnings,
      lastError: state.lastError,
      syncedAt: state.syncedAt,
      mcpUrl: state.mcpUrl,
      authEnvVar: state.authEnvVar,
      authConfigured: state.authConfigured,
      catalogDir: this.catalogDir,
    };
  }
  getDynamicTools(provider) {
    return [...this.providerState[provider].tools];
  }
  async callTool(provider, upstreamToolName, args) {
    const runtime = this.providerRuntime[provider];
    if (!runtime.mcpUrl) {
      return errorResult(`${provider} upstream MCP URL is not configured.`);
    }
    if (!runtime.headers) {
      return errorResult(
        `${provider} upstream auth is not configured via env var alias (${runtime.authEnvVar ?? "missing alias"}).`,
      );
    }
    let client = null;
    try {
      client = await this.clientFactory.connect({
        mcpUrl: runtime.mcpUrl,
        headers: runtime.headers,
      });
      const result = await client.callTool(
        upstreamToolName,
        normalizeArgs(args),
      );
      return normalizeCallResult(result);
    } catch (error) {
      const message = `${provider}.${upstreamToolName} failed: ${messageFromError(error)}`;
      logger.warn(message);
      return errorResult(message);
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
  }
  async syncProvider(provider, resolved) {
    const state = emptyProviderState(provider);
    state.mcpUrl = resolved.mcpUrl;
    state.authEnvVar = resolved.authEnvVar;
    state.authConfigured = !!resolved.authHeader;
    state.warnings = [...resolved.warnings];
    this.providerRuntime[provider] = {
      mcpUrl: resolved.mcpUrl,
      headers: resolved.authHeader,
      authEnvVar: resolved.authEnvVar,
    };
    if (!resolved.mcpUrl || !resolved.authHeader) {
      this.providerState[provider] = state;
      return;
    }
    let client = null;
    try {
      client = await this.clientFactory.connect({
        mcpUrl: resolved.mcpUrl,
        headers: resolved.authHeader,
      });
      const tools = await client.listTools();
      const syncedAt = /* @__PURE__ */ new Date().toISOString();
      state.tools = tools;
      state.available = true;
      state.syncedAt = syncedAt;
      persistCatalog(this.catalogDir, {
        provider,
        mcpUrl: resolved.mcpUrl,
        syncedAt,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    } catch (error) {
      state.lastError = messageFromError(error);
      state.warnings.push(
        `${provider} upstream unavailable: ${state.lastError}`,
      );
      state.available = false;
      state.tools = [];
      logger.warn(`${provider} gateway init failed: ${state.lastError}`);
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
    this.providerState[provider] = state;
  }
};

// src/upstream/passthrough.ts
import { mkdir, readFile as readFile4, writeFile } from "fs/promises";
import path10 from "path";
import { Client as Client2 } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport as StreamableHTTPClientTransport2 } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
var STITCH_ENV_FALLBACKS = ["STITCH_API_KEY_DEFAULT", "STITCH_API_KEY"];
var STITCH_LONG_RUNNING_TIMEOUT_MS = 8 * 60 * 1e3;
var STITCH_DISCOVERY_TIMEOUT_MS = 30 * 1e3;
var STITCH_DEFAULT_COMPLEX_MODEL = "GEMINI_3_1_PRO";
var STITCH_MUTATION_TOOLS = /* @__PURE__ */ new Set([
  "generate_screen_from_text",
  "edit_screens",
  "generate_variants",
]);
var STITCH_TIMEOUT_RECOVERY_TOOLS = /* @__PURE__ */ new Set([
  "generate_screen_from_text",
  "generate_variants",
]);
function resolveCatalogDir2(configPath) {
  const configDir = path10.dirname(configPath);
  if (path10.basename(configDir) === ".cbx") {
    return path10.join(configDir, "mcp", "catalog");
  }
  return path10.join(configDir, ".cbx", "mcp", "catalog");
}
function buildPassthroughAliasName(service, toolName) {
  const normalizedTool = String(toolName || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
  if (!normalizedTool) return `${service}_tool`;
  return `${service}_${normalizedTool}`;
}
function buildUpstreamToolInfo(service, tool) {
  const name = typeof tool?.name === "string" ? tool.name.trim() : "";
  if (!name) return null;
  const namespacedName = `${service}.${name}`;
  const aliasNames = [buildPassthroughAliasName(service, name)];
  return {
    name,
    namespacedName,
    aliasNames,
    description:
      typeof tool?.description === "string" ? tool.description : void 0,
    inputSchema: tool?.inputSchema ?? void 0,
    outputSchema: tool?.outputSchema ?? void 0,
  };
}
async function loadCachedCatalogTools({ service, scope, configPath }) {
  if (!configPath) return [];
  const catalogDir = resolveCatalogDir2(configPath);
  const catalogPath = path10.join(catalogDir, `${service}.json`);
  try {
    const raw = await readFile4(catalogPath, "utf8");
    const parsed = JSON.parse(raw);
    if (
      scope &&
      typeof parsed.scope === "string" &&
      parsed.scope.trim() &&
      parsed.scope !== scope
    ) {
      return [];
    }
    const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
    return tools
      .map((tool) => buildUpstreamToolInfo(service, tool))
      .filter((tool) => Boolean(tool));
  } catch {
    return [];
  }
}
function getServiceAuth(config, service) {
  if (service === "playwright") {
    const state2 = parsePlaywrightState(config);
    return {
      mcpUrl: state2.mcpUrl,
      activeProfileName: null,
      envVar: null,
      headers: {},
      configured: Boolean(state2.mcpUrl),
    };
  }
  if (service === "postman") {
    const state2 = parsePostmanState(config);
    const activeProfile2 = state2.activeProfile;
    const envVar2 = activeProfile2?.apiKeyEnvVar ?? "POSTMAN_API_KEY";
    const token2 = process.env[envVar2]?.trim();
    if (!token2) {
      return {
        mcpUrl: state2.mcpUrl,
        activeProfileName: state2.activeProfileName,
        envVar: envVar2,
        headers: {},
        configured: false,
        error: `Missing Postman key env var: ${envVar2}`,
      };
    }
    return {
      mcpUrl: state2.mcpUrl,
      activeProfileName: state2.activeProfileName,
      envVar: envVar2,
      headers: { Authorization: `Bearer ${token2}` },
      configured: Boolean(state2.mcpUrl),
    };
  }
  const state = parseStitchState(config);
  const activeProfile = state.activeProfile;
  const envVar = activeProfile?.apiKeyEnvVar ?? "STITCH_API_KEY";
  const tokenInfo = resolveStitchToken(envVar);
  const token = tokenInfo?.token;
  if (!token && !state.useSystemGcloud) {
    return {
      mcpUrl: state.mcpUrl,
      activeProfileName: state.activeProfileName,
      envVar: tokenInfo?.envVar || envVar,
      headers: {},
      configured: false,
      error: `Missing Stitch key env var: ${envVar}`,
    };
  }
  return {
    mcpUrl: state.mcpUrl,
    activeProfileName: state.activeProfileName,
    envVar: tokenInfo?.envVar || envVar,
    headers: token ? { "X-Goog-Api-Key": token } : {},
    configured: Boolean(state.mcpUrl),
  };
}
function resolveStitchToken(preferredEnvVar, env = process.env) {
  const candidates = [preferredEnvVar, ...STITCH_ENV_FALLBACKS].filter(Boolean);
  const seen = /* @__PURE__ */ new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const token = env[candidate]?.trim();
    if (token) {
      return { envVar: candidate, token };
    }
  }
  return null;
}
async function withUpstreamClient({ url, headers, fn }) {
  const client = new Client2(
    {
      name: "cubis-foundry-mcp-passthrough",
      version: "0.1.0",
    },
    {
      capabilities: {},
    },
  );
  const transport = new StreamableHTTPClientTransport2(new URL(url), {
    requestInit: { headers },
  });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}
function isCallToolResult(result) {
  return Array.isArray(result.content);
}
function normalizeUpstreamToolResult(result) {
  if (isCallToolResult(result)) {
    return result;
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            toolResult: result.toolResult,
          },
          null,
          2,
        ),
      },
    ],
    _meta: result._meta,
  };
}
function isStitchLongRunningTool(name) {
  return STITCH_MUTATION_TOOLS.has(String(name || "").trim());
}
function getUpstreamRequestOptions(service, name) {
  if (service !== "stitch" || !isStitchLongRunningTool(name)) {
    return void 0;
  }
  return {
    timeout: STITCH_LONG_RUNNING_TIMEOUT_MS,
    maxTotalTimeout: STITCH_LONG_RUNNING_TIMEOUT_MS,
    resetTimeoutOnProgress: true,
  };
}
function applyStitchDefaultArguments(name, argumentsValue) {
  if (name !== "generate_screen_from_text" && name !== "edit_screens") {
    return argumentsValue;
  }
  const next = { ...argumentsValue };
  if (typeof next.modelId !== "string" || !next.modelId.trim()) {
    next.modelId = STITCH_DEFAULT_COMPLEX_MODEL;
  }
  return next;
}
async function listStitchScreens(client, projectId) {
  const response = normalizeUpstreamToolResult(
    await client.callTool(
      {
        name: "list_screens",
        arguments: { projectId },
      },
      void 0,
      {
        timeout: STITCH_DISCOVERY_TIMEOUT_MS,
      },
    ),
  );
  const text2 = response.content.find((item) => item.type === "text")?.text;
  if (!text2) return [];
  try {
    const parsed = JSON.parse(text2);
    return Array.isArray(parsed.screens) ? parsed.screens : [];
  } catch {
    return [];
  }
}
async function listStitchProjects(client) {
  const response = normalizeUpstreamToolResult(
    await client.callTool(
      {
        name: "list_projects",
        arguments: {},
      },
      void 0,
      {
        timeout: STITCH_DISCOVERY_TIMEOUT_MS,
      },
    ),
  );
  const text2 = response.content.find((item) => item.type === "text")?.text;
  if (!text2) return [];
  try {
    const parsed = JSON.parse(text2);
    return Array.isArray(parsed.projects) ? parsed.projects : [];
  } catch {
    return [];
  }
}
function findMatchingStitchProject(projects, title) {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) return null;
  return (
    projects.find(
      (project) =>
        typeof project.title === "string" &&
        project.title.trim().toLowerCase() === normalizedTitle,
    ) || null
  );
}
function isTimeoutError(error) {
  const text2 = String(error || "");
  return (
    text2.includes("Request timed out") || text2.includes("RequestTimeout")
  );
}
function buildStitchTimeoutRecoveryResult({ toolName, projectId, screens }) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            service: "stitch",
            tool: `stitch.${toolName}`,
            projectId,
            recoveredAfterTimeout: true,
            message:
              "The Stitch request timed out locally, but new screens were detected in the project. Treat these as recovered results and prefer edit_screens for follow-up changes.",
            outputComponents: screens.map((screen) => ({
              text: `Recovered screen ${screen.title || screen.name || "unknown"} after timeout.`,
              design: {
                screens: [screen],
              },
            })),
          },
          null,
          2,
        ),
      },
    ],
  };
}
async function persistCatalog2(catalog) {
  if (!catalog.configPath) return;
  const catalogDir = resolveCatalogDir2(catalog.configPath);
  const catalogPath = path10.join(catalogDir, `${catalog.service}.json`);
  const payload = {
    schemaVersion: 1,
    generatedAt: /* @__PURE__ */ new Date().toISOString(),
    generatedBy: "cubis-foundry-mcp startup discovery",
    service: catalog.service,
    scope: catalog.scope,
    mcpUrl: catalog.mcpUrl,
    activeProfileName: catalog.activeProfileName,
    envVar: catalog.envVar,
    toolCount: catalog.toolCount,
    tools: catalog.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? null,
      inputSchema: tool.inputSchema ?? null,
      outputSchema: tool.outputSchema ?? null,
    })),
    discoveryError: catalog.discoveryError ?? null,
  };
  await mkdir(catalogDir, { recursive: true });
  await writeFile(
    catalogPath,
    `${JSON.stringify(payload, null, 2)}
`,
    "utf8",
  );
}
async function discoverUpstreamCatalogs(scope = "auto") {
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    const missing = {
      service: "postman",
      configured: false,
      mcpUrl: null,
      activeProfileName: null,
      envVar: null,
      scope: null,
      configPath: null,
      toolCount: 0,
      tools: [],
      discoveryError: "cbx_config.json not found",
    };
    const missingStitch = { ...missing, service: "stitch" };
    const missingPlaywright = {
      ...missing,
      service: "playwright",
    };
    return {
      postman: missing,
      stitch: missingStitch,
      playwright: missingPlaywright,
    };
  }
  const baseInfo = {
    scope: effective.scope,
    configPath: effective.path,
  };
  const discoverOne = async (service) => {
    const auth = getServiceAuth(effective.config, service);
    const catalog = {
      service,
      configured: auth.configured,
      mcpUrl: auth.mcpUrl,
      activeProfileName: auth.activeProfileName,
      envVar: auth.envVar,
      scope: baseInfo.scope,
      configPath: baseInfo.configPath,
      toolCount: 0,
      tools: [],
      discoveryError: auth.error,
    };
    if (!auth.configured || !auth.mcpUrl || auth.error) {
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath,
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = auth.error
          ? `${auth.error} (using cached tool catalog)`
          : "Upstream not configured; using cached tool catalog";
      }
      await persistCatalog2(catalog);
      return catalog;
    }
    try {
      const listed = await withUpstreamClient({
        url: auth.mcpUrl,
        headers: auth.headers,
        fn: async (client) => client.listTools(),
      });
      const rawTools = Array.isArray(listed.tools) ? listed.tools : [];
      catalog.tools = rawTools
        .map((tool) => buildUpstreamToolInfo(service, tool || {}))
        .filter((tool) => Boolean(tool));
      catalog.toolCount = catalog.tools.length;
    } catch (error) {
      catalog.discoveryError = `Tool discovery failed: ${String(error)}`;
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath,
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = `${catalog.discoveryError} (using cached tool catalog)`;
      }
    }
    await persistCatalog2(catalog);
    return catalog;
  };
  return {
    postman: await discoverOne("postman"),
    stitch: await discoverOne("stitch"),
    playwright: await discoverOne("playwright"),
  };
}
async function callUpstreamTool({
  service,
  name,
  argumentsValue,
  scope = "auto",
}) {
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    throw new Error("cbx_config.json not found");
  }
  const auth = getServiceAuth(effective.config, service);
  if (!auth.configured || !auth.mcpUrl) {
    throw new Error(auth.error || `${service} is not configured`);
  }
  if (auth.error) {
    throw new Error(auth.error);
  }
  return withUpstreamClient({
    url: auth.mcpUrl,
    headers: auth.headers,
    fn: async (client) => {
      const effectiveArguments =
        service === "stitch"
          ? applyStitchDefaultArguments(name, argumentsValue)
          : argumentsValue;
      const requestOptions = getUpstreamRequestOptions(service, name);
      const projectId =
        service === "stitch" && typeof effectiveArguments.projectId === "string"
          ? effectiveArguments.projectId.trim()
          : "";
      const shouldRecoverAfterTimeout =
        service === "stitch" &&
        STITCH_TIMEOUT_RECOVERY_TOOLS.has(name) &&
        projectId.length > 0;
      if (
        service === "stitch" &&
        name === "create_project" &&
        typeof effectiveArguments.title === "string"
      ) {
        const existingProject = findMatchingStitchProject(
          await listStitchProjects(client),
          effectiveArguments.title,
        );
        if (existingProject) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    ...existingProject,
                    reusedExistingProject: true,
                    message:
                      "Reused an existing Stitch project with the same title instead of creating a duplicate.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      }
      const beforeScreens =
        shouldRecoverAfterTimeout && projectId
          ? await listStitchScreens(client, projectId)
          : [];
      try {
        return normalizeUpstreamToolResult(
          await client.callTool(
            {
              name,
              arguments: effectiveArguments,
            },
            void 0,
            requestOptions,
          ),
        );
      } catch (error) {
        if (shouldRecoverAfterTimeout && projectId && isTimeoutError(error)) {
          const knownNames = new Set(
            beforeScreens.map((screen) => screen.name).filter(Boolean),
          );
          const afterScreens = await listStitchScreens(client, projectId);
          const recoveredScreens = afterScreens.filter(
            (screen) => screen.name && !knownNames.has(screen.name),
          );
          if (recoveredScreens.length > 0) {
            return buildStitchTimeoutRecoveryResult({
              toolName: name,
              projectId,
              screens: recoveredScreens,
            });
          }
        }
        throw error;
      }
    },
  });
}

// src/server.ts
function toolCallErrorResult({ service, namespacedName, error }) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            service,
            tool: namespacedName,
            error: String(error),
          },
          null,
          2,
        ),
      },
    ],
  };
}
async function createServer({
  config,
  manifest,
  routeManifest,
  defaultConfigScope = "auto",
}) {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });
  const gatewayManager = new GatewayManager();
  await gatewayManager.initialize(defaultConfigScope);
  const runtimeCtx = {
    manifest,
    routeManifest,
    gatewayManager,
    charsPerToken: config.telemetry?.charsPerToken ?? 4,
    summaryMaxLength: config.vault.summaryMaxLength,
    defaultConfigScope,
  };
  for (const entry of TOOL_REGISTRY) {
    const handler = entry.createHandler(runtimeCtx);
    server.registerTool(
      entry.name,
      {
        description: entry.description,
        inputSchema: entry.schema,
        annotations: {},
      },
      handler,
    );
  }
  logger.debug(
    `Registered ${TOOL_REGISTRY.length} built-in tools from registry`,
  );
  const upstreamCatalogs = await discoverUpstreamCatalogs(defaultConfigScope);
  const dynamicSchema = z18.object({}).passthrough();
  const registeredDynamicToolNames = /* @__PURE__ */ new Set();
  for (const catalog of [
    upstreamCatalogs.postman,
    upstreamCatalogs.stitch,
    upstreamCatalogs.playwright,
  ]) {
    for (const tool of catalog.tools) {
      const registrationNames = [
        tool.namespacedName,
        ...(tool.aliasNames || []),
      ];
      const uniqueRegistrationNames = [...new Set(registrationNames)];
      for (const registrationName of uniqueRegistrationNames) {
        if (registeredDynamicToolNames.has(registrationName)) {
          logger.warn(
            `Skipping duplicate dynamic tool registration name '${registrationName}' from ${catalog.service}.${tool.name}`,
          );
          continue;
        }
        registeredDynamicToolNames.add(registrationName);
        server.registerTool(
          registrationName,
          {
            description: `[${catalog.service} passthrough] ${tool.description || tool.name}`,
            inputSchema: dynamicSchema,
            annotations: {},
          },
          async (args, _extra) => {
            try {
              const result = await callUpstreamTool({
                service: catalog.service,
                name: tool.name,
                argumentsValue: args && typeof args === "object" ? args : {},
                scope: defaultConfigScope,
              });
              return {
                ...result,
                content: result.content ?? [],
                isError: Boolean(result.isError),
              };
            } catch (error) {
              return toolCallErrorResult({
                service: catalog.service,
                namespacedName: registrationName,
                error,
              });
            }
          },
        );
      }
    }
  }
  return server;
}

// src/transports/stdio.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
function createStdioTransport() {
  return new StdioServerTransport();
}

// src/transports/streamableHttp.ts
import { createServer as createServer2 } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
var SESSION_TTL_MS = 30 * 60 * 1e3;
var CLEANUP_INTERVAL_MS = 5 * 60 * 1e3;
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
function createMultiSessionHttpServer(options, serverFactory) {
  const sessions = /* @__PURE__ */ new Map();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > SESSION_TTL_MS) {
        logger.info(
          `Session ${id.slice(0, 8)} expired after idle (active: ${sessions.size - 1})`,
        );
        entry.transport.close().catch(() => {});
        entry.server.close().catch(() => {});
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();
  const httpServer = createServer2(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    if (req.method === "DELETE") {
      const sid = req.headers["mcp-session-id"];
      if (sid && sessions.has(sid)) {
        const entry = sessions.get(sid);
        await entry.transport.close().catch(() => {});
        await entry.server.close().catch(() => {});
        sessions.delete(sid);
        logger.info(
          `Session ${sid.slice(0, 8)} terminated (active: ${sessions.size})`,
        );
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Session closed");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Session not found");
      }
      return;
    }
    if (req.method === "GET") {
      const sid = req.headers["mcp-session-id"];
      if (sid && sessions.has(sid)) {
        const entry = sessions.get(sid);
        entry.lastActivity = Date.now();
        await entry.transport.handleRequest(req, res);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing or invalid mcp-session-id");
      }
      return;
    }
    if (req.method === "POST") {
      const sid = req.headers["mcp-session-id"];
      if (sid && sessions.has(sid)) {
        const entry = sessions.get(sid);
        entry.lastActivity = Date.now();
        await entry.transport.handleRequest(req, res);
        return;
      }
      const rawBody = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        logger.warn(`Bad JSON in POST from ${req.socket.remoteAddress}`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error" },
            id: null,
          }),
        );
        return;
      }
      const isInit =
        parsed &&
        typeof parsed === "object" &&
        "method" in parsed &&
        parsed.method === "initialize";
      if (!isInit) {
        logger.warn(
          `POST without session: method=${parsed?.method ?? "unknown"}`,
        );
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request: missing or unknown mcp-session-id",
            },
            id: parsed?.id ?? null,
          }),
        );
        return;
      }
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
      });
      try {
        const server = await serverFactory(transport);
        await transport.handleRequest(req, res, parsed);
        const sessionId = transport.sessionId;
        if (sessionId) {
          sessions.set(sessionId, {
            transport,
            server,
            lastActivity: Date.now(),
          });
          logger.info(
            `New session ${sessionId.slice(0, 8)} (active: ${sessions.size})`,
          );
        }
      } catch (error) {
        logger.error(`Failed to create MCP session: ${error}`);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "Internal error creating session",
              },
              id: parsed?.id ?? null,
            }),
          );
        }
      }
      return;
    }
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  });
  httpServer.listen(options.port, options.host, () => {
    logger.info(
      `Streamable HTTP transport listening on http://${options.host}:${options.port}/mcp (multi-session)`,
    );
  });
  async function closeAll() {
    clearInterval(cleanupTimer);
    for (const [id, entry] of sessions) {
      await entry.transport.close().catch(() => {});
      await entry.server.close().catch(() => {});
      sessions.delete(id);
      logger.debug(`Closed session ${id} during shutdown`);
    }
    httpServer.close();
  }
  return { httpServer, closeAll };
}

// src/index.ts
import path11 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path11.dirname(fileURLToPath2(import.meta.url));
function parseArgs(argv) {
  let transport = "stdio";
  let scope = "auto";
  let scanOnly = false;
  let debug = false;
  let port;
  let host;
  let configPath;
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--transport" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "http" || val === "streamable-http") {
        transport = "http";
      } else if (val === "stdio") {
        transport = "stdio";
      } else {
        logger.error(`Unknown transport: ${val}. Use "stdio" or "http".`);
        process.exit(1);
      }
    } else if (arg === "--scope" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "auto" || val === "global" || val === "project") {
        scope = val;
      } else {
        logger.error(
          `Unknown scope: ${val}. Use "auto", "global", or "project".`,
        );
        process.exit(1);
      }
    } else if (arg === "--port" && argv[i + 1]) {
      const val = Number.parseInt(argv[++i], 10);
      if (!Number.isInteger(val) || val <= 0 || val > 65535) {
        logger.error(
          `Invalid port: ${argv[i]}. Use an integer from 1 to 65535.`,
        );
        process.exit(1);
      }
      port = val;
    } else if (arg === "--host" && argv[i + 1]) {
      host = argv[++i];
    } else if (arg === "--scan-only") {
      scanOnly = true;
    } else if (arg === "--debug") {
      debug = true;
    } else if (arg === "--config" && argv[i + 1]) {
      configPath = argv[++i];
    }
  }
  return { transport, scope, scanOnly, debug, port, host, configPath };
}
function printStartupBanner(skillCount, categoryCount, transportName) {
  logger.raw(
    "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
  );
  logger.raw("\u2502  Cubis Foundry MCP Server                    \u2502");
  logger.raw(
    "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524",
  );
  logger.raw(`\u2502  Vault: 2004/35/~245/~80,160/99.7%           \u2502`);
  logger.raw(`\u2502  Skills loaded: ${String(skillCount).padEnd(29)}\u2502`);
  logger.raw(`\u2502  Categories: ${String(categoryCount).padEnd(32)}\u2502`);
  logger.raw(`\u2502  Transport: ${transportName.padEnd(33)}\u2502`);
  logger.raw(
    "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
  );
}
function printConfigStatus(scope) {
  try {
    const effective = readEffectiveConfig(scope);
    if (!effective) {
      logger.warn(
        "cbx_config.json not found. Postman/Stitch tools will return config-not-found errors.",
      );
      return;
    }
    const config = effective.config;
    const postmanState = parsePostmanState(config);
    const postmanUrl = postmanState.mcpUrl;
    if (postmanUrl) {
      const mode = urlToMode(postmanUrl) ?? "unknown";
      logger.info(`Postman mode: ${mode} (${postmanUrl})`);
    } else {
      logger.info("Postman: not configured");
    }
    const stitchState = parseStitchState(config);
    const stitchProfile = stitchState.activeProfileName;
    const stitchUrl = stitchState.mcpUrl ?? stitchState.activeProfile?.url;
    if (stitchProfile && stitchUrl) {
      logger.info(`Stitch profile: ${stitchProfile} (${stitchUrl})`);
    } else if (stitchUrl) {
      logger.info(`Stitch: configured (${stitchUrl})`);
    } else {
      logger.info("Stitch: not configured");
    }
    logger.info(`Config scope: ${effective.scope} (${effective.path})`);
  } catch {
    logger.warn("Failed to read cbx_config.json status");
  }
}
async function main() {
  const args = parseArgs(process.argv);
  if (args.debug) {
    setLogLevel("debug");
  }
  const serverConfig = loadServerConfig(args.configPath);
  const basePath = path11.resolve(__dirname2, "..");
  const scannedSkills = await scanVaultRoots(
    serverConfig.vault.roots,
    basePath,
  );
  const generatedSkillManifest = await loadGeneratedSkillManifest(basePath);
  const skills = mergeGeneratedSkillMetadata(
    scannedSkills,
    generatedSkillManifest,
  );
  const charsPerToken = serverConfig.telemetry.charsPerToken;
  const manifest = buildManifest(skills, charsPerToken);
  const routeManifest = await loadGeneratedRouteManifest(basePath);
  if (args.scanOnly) {
    logger.info(
      `Scan complete: ${manifest.skills.length} skills in ${manifest.categories.length} categories`,
    );
    for (const cat of manifest.categories) {
      const count = manifest.skills.filter((s) => s.category === cat).length;
      logger.info(`  ${cat}: ${count} skills`);
    }
    process.exit(0);
  }
  const resolvedHttpPort =
    args.port ?? serverConfig.transport.http?.port ?? 3100;
  const transportName =
    args.transport === "http"
      ? `Streamable HTTP :${resolvedHttpPort}`
      : "stdio";
  printStartupBanner(
    manifest.skills.length,
    manifest.categories.length,
    transportName,
  );
  printConfigStatus(args.scope);
  if (args.transport === "http") {
    const httpOpts = {
      port: resolvedHttpPort,
      host: args.host ?? serverConfig.transport.http?.host ?? "127.0.0.1",
    };
    const serverFactory = async (transport) => {
      const server = await createServer({
        config: serverConfig,
        manifest,
        routeManifest,
        defaultConfigScope: args.scope,
      });
      await server.connect(transport);
      return server;
    };
    const { httpServer, closeAll } = createMultiSessionHttpServer(
      httpOpts,
      serverFactory,
    );
    const shutdown = async () => {
      logger.info("Shutting down HTTP transport...");
      await closeAll();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    const mcpServer = await createServer({
      config: serverConfig,
      manifest,
      routeManifest,
      defaultConfigScope: args.scope,
    });
    const transport = createStdioTransport();
    await mcpServer.connect(transport);
    const shutdown = async () => {
      logger.info("Shutting down stdio transport...");
      await mcpServer.close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
  logger.info("MCP server ready. Waiting for connections...");
}
main().catch((err) => {
  logger.error(`Fatal startup error: ${err}`);
  process.exit(1);
});
