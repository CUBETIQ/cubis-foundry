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
    description: z.string().optional()
  }),
  vault: z.object({
    roots: z.array(z.string()).min(1),
    summaryMaxLength: z.number().int().positive().default(200)
  }),
  telemetry: z.object({
    charsPerToken: z.number().positive().default(4)
  }).default({ charsPerToken: 4 }),
  transport: z.object({
    default: z.enum(["stdio", "streamable-http"]).default("stdio"),
    http: z.object({
      port: z.number().int().positive().default(3100),
      host: z.string().default("127.0.0.1")
    }).optional()
  })
});
var FORBIDDEN_KEYS = [
  "apiKey",
  "api_key",
  "secret",
  "token",
  "password",
  "credential"
];
function rejectCredentialFields(raw) {
  const json = JSON.stringify(raw);
  for (const key of FORBIDDEN_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(
        `Server config.json must not contain credential field "${key}". Store credentials in cbx_config.json instead.`
      );
    }
  }
}

// src/utils/logger.ts
var LEVEL_ORDER = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
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
  return (/* @__PURE__ */ new Date()).toISOString();
}
var logger = {
  debug(msg, data) {
    if (shouldLog("debug")) {
      process.stderr.write(
        `[${ts()}] DEBUG ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`
      );
    }
  },
  info(msg, data) {
    if (shouldLog("info")) {
      process.stderr.write(
        `[${ts()}] INFO  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`
      );
    }
  },
  warn(msg, data) {
    if (shouldLog("warn")) {
      process.stderr.write(
        `[${ts()}] WARN  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`
      );
    }
  },
  error(msg, data) {
    if (shouldLog("error")) {
      process.stderr.write(
        `[${ts()}] ERROR ${msg}${data ? ` ${JSON.stringify(data)}` : ""}
`
      );
    }
  },
  /** Raw line to stderr (no timestamp/level prefix). Used for startup banners. */
  raw(msg) {
    process.stderr.write(`${msg}
`);
  }
};

// src/config/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var PKG_ROOT = path.basename(__dirname) === "config" ? path.resolve(__dirname, "../..") : path.resolve(__dirname, "..");
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

// src/vault/scanner.ts
import { open, readdir, stat } from "fs/promises";
import path2 from "path";
async function scanVaultRoots(roots, basePath) {
  const skills = [];
  for (const rootRel of roots) {
    const rootAbs = path2.resolve(basePath, rootRel);
    let entries;
    try {
      entries = await readdir(rootAbs);
    } catch {
      logger.warn(`Vault root not found, skipping: ${rootAbs}`);
      continue;
    }
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = path2.join(rootAbs, entry);
      const entryStat = await stat(entryPath).catch(() => null);
      if (!entryStat?.isDirectory()) continue;
      const skillFile = path2.join(entryPath, "SKILL.md");
      const skillStat = await stat(skillFile).catch(() => null);
      if (!skillStat?.isFile()) continue;
      if (skillStat.size === 0) {
        logger.warn(`Skipping empty SKILL.md: ${skillFile}`);
        continue;
      }
      const wrapperKind = await detectWrapperKind(entry, skillFile);
      if (wrapperKind) {
        logger.debug(
          `Skipping wrapper skill ${entry} (${wrapperKind}) at ${skillFile}`
        );
        continue;
      }
      skills.push({
        id: entry,
        category: deriveCategory(entry),
        path: skillFile,
        fileBytes: skillStat.size
      });
    }
  }
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
      0
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
    const value = match[1].trim().replace(/^['"]|['"]$/g, "").toLowerCase();
    if (WRAPPER_KINDS.has(value)) {
      return value;
    }
  }
  return null;
}
async function detectWrapperKind(skillId, skillFile) {
  const byId = extractWrapperKindFromId(skillId);
  if (byId) return byId;
  const rawPreview = await readFrontmatterPreview(skillFile);
  if (!rawPreview) return null;
  const frontmatter = parseFrontmatter(rawPreview);
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
    saas: "saas"
  };
  const lower = skillId.toLowerCase();
  for (const [prefix, category] of Object.entries(categoryMap)) {
    if (lower.startsWith(prefix)) return category;
  }
  return "general";
}

// src/vault/manifest.ts
import { readdir as readdir2, readFile } from "fs/promises";
import path3 from "path";

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
function estimateTokensFromText(text, charsPerToken) {
  return estimateTokensFromCharCount(text.length, charsPerToken);
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
      estimatedSavingsPercent: 0
    };
  }
  const estimatedSavingsTokens = Math.max(0, full - used);
  const estimatedSavingsPercent = Number(
    (estimatedSavingsTokens / full * 100).toFixed(2)
  );
  return {
    estimatedSavingsTokens,
    estimatedSavingsPercent
  };
}
function buildSkillToolMetrics({
  charsPerToken,
  fullCatalogEstimatedTokens,
  responseEstimatedTokens,
  selectedSkillsEstimatedTokens = null,
  loadedSkillEstimatedTokens = null,
  responseCharacterCount = 0
}) {
  const usedEstimatedTokens = loadedSkillEstimatedTokens ?? selectedSkillsEstimatedTokens ?? responseEstimatedTokens;
  const savings = estimateSavings(
    fullCatalogEstimatedTokens,
    usedEstimatedTokens
  );
  return {
    estimatorVersion: TOKEN_ESTIMATOR_VERSION,
    charsPerToken: normalizeCharsPerToken(charsPerToken),
    fullCatalogEstimatedTokens: Math.max(0, fullCatalogEstimatedTokens),
    responseEstimatedTokens: Math.max(0, responseEstimatedTokens),
    responseCharacterCount: Math.max(0, responseCharacterCount),
    selectedSkillsEstimatedTokens: selectedSkillsEstimatedTokens === null ? null : Math.max(0, selectedSkillsEstimatedTokens),
    loadedSkillEstimatedTokens: loadedSkillEstimatedTokens === null ? null : Math.max(0, loadedSkillEstimatedTokens),
    estimatedSavingsVsFullCatalog: savings.estimatedSavingsTokens,
    estimatedSavingsVsFullCatalogPercent: savings.estimatedSavingsPercent,
    estimated: true
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
      charsPerToken
    )
  };
}
async function extractDescription(skillPath, maxLength) {
  try {
    const content = await readFile(skillPath, "utf8");
    return parseDescriptionFromFrontmatter(content, maxLength);
  } catch (err) {
    logger.debug(`Failed to read description from ${skillPath}: ${err}`);
    return void 0;
  }
}
function parseDescriptionFromFrontmatter(content, maxLength) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return void 0;
  const frontmatter = fmMatch[1];
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (!descMatch) return void 0;
  let desc = descMatch[1].trim();
  if (desc.startsWith('"') && desc.endsWith('"') || desc.startsWith("'") && desc.endsWith("'")) {
    desc = desc.slice(1, -1);
  }
  if (desc.length > maxLength) {
    return desc.slice(0, maxLength - 3) + "...";
  }
  return desc;
}
async function readFullSkillContent(skillPath) {
  return readFile(skillPath, "utf8");
}
var MARKDOWN_LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
var MAX_REFERENCED_FILES = 25;
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
  if (path3.isAbsolute(target)) return null;
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
async function readReferencedMarkdownFiles(skillPath, skillContent) {
  const skillDir = path3.dirname(skillPath);
  let targets = collectReferencedMarkdownTargets(skillContent);
  if (targets.length === 0) {
    targets = await collectSiblingMarkdownTargets(skillDir);
  }
  const references = [];
  for (const target of targets) {
    const resolved = path3.resolve(skillDir, target);
    const relative = path3.relative(skillDir, resolved);
    if (relative.startsWith("..") || path3.isAbsolute(relative)) {
      continue;
    }
    if (path3.basename(resolved).toLowerCase() === "skill.md") continue;
    try {
      const content = await readFile(resolved, "utf8");
      references.push({
        relativePath: relative.split(path3.sep).join("/"),
        content
      });
    } catch (err) {
      logger.debug(`Failed to read referenced markdown ${resolved}: ${err}`);
    }
  }
  return references;
}
async function collectSiblingMarkdownTargets(skillDir) {
  const entries = await readdir2(skillDir, { withFileTypes: true }).catch(
    () => []
  );
  const targets = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      const subEntries = await readdir2(path3.join(skillDir, entry.name), {
        withFileTypes: true
      }).catch(() => []);
      for (const sub of subEntries) {
        if (!sub.isFile()) continue;
        if (sub.name.startsWith(".")) continue;
        if (!sub.name.toLowerCase().endsWith(".md")) continue;
        targets.push(`${entry.name}/${sub.name}`);
        if (targets.length >= MAX_REFERENCED_FILES) break;
      }
    } else if (entry.isFile()) {
      if (!entry.name.toLowerCase().endsWith(".md")) continue;
      if (entry.name.toLowerCase() === "skill.md") continue;
      targets.push(entry.name);
    }
    if (targets.length >= MAX_REFERENCED_FILES) break;
  }
  targets.sort((a, b) => a.localeCompare(b));
  return targets;
}
async function readSkillContentWithReferences(skillPath, includeReferences = true) {
  const skillContent = await readFullSkillContent(skillPath);
  if (!includeReferences) {
    return { skillContent, references: [] };
  }
  const references = await readReferencedMarkdownFiles(skillPath, skillContent);
  return { skillContent, references };
}
async function enrichWithDescriptions(skills, maxLength) {
  return Promise.all(
    skills.map(async (skill) => {
      if (skill.description) return skill;
      const description = await extractDescription(skill.path, maxLength);
      return { ...skill, description };
    })
  );
}

// src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z as z13 } from "zod";

// src/tools/skillListCategories.ts
import { z as z2 } from "zod";
var skillListCategoriesName = "skill_list_categories";
var skillListCategoriesDescription = "List all skill categories available in the vault. Returns category names and skill counts.";
var skillListCategoriesSchema = z2.object({});
function handleSkillListCategories(manifest, charsPerToken) {
  const categoryCounts = {};
  for (const skill of manifest.skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] ?? 0) + 1;
  }
  const categories = manifest.categories.map((cat) => ({
    category: cat,
    skillCount: categoryCounts[cat] ?? 0
  }));
  const payload = { categories, totalSkills: manifest.skills.length };
  const text = JSON.stringify(payload, null, 2);
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    responseCharacterCount: text.length
  });
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    structuredContent: {
      metrics
    },
    _meta: {
      metrics
    }
  };
}

// src/tools/skillBrowseCategory.ts
import { z as z3 } from "zod";

// src/utils/errors.ts
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
function invalidInput(message) {
  throw new McpError(ErrorCode.InvalidParams, message);
}
function configNotFound() {
  throw new McpError(
    ErrorCode.InternalError,
    "cbx_config.json not found. Run cbx workflows config --scope global --show to diagnose."
  );
}
function unknownPostmanMode(url) {
  throw new McpError(
    ErrorCode.InvalidParams,
    `Unknown Postman MCP URL in config: "${url}". Expected one of: https://mcp.postman.com/minimal, https://mcp.postman.com/code, https://mcp.postman.com/mcp`
  );
}
function notFound(entity, id) {
  throw new McpError(ErrorCode.InvalidParams, `${entity} not found: "${id}"`);
}

// src/tools/skillBrowseCategory.ts
var skillBrowseCategoryName = "skill_browse_category";
var skillBrowseCategoryDescription = "Browse skills within a specific category. Returns skill IDs and short descriptions.";
var skillBrowseCategorySchema = z3.object({
  category: z3.string().describe("The category name to browse (from skill_list_categories)")
});
async function handleSkillBrowseCategory(args, manifest, summaryMaxLength, charsPerToken) {
  const { category } = args;
  if (!manifest.categories.includes(category)) {
    notFound("Category", category);
  }
  const matching = manifest.skills.filter((s) => s.category === category);
  const enriched = await enrichWithDescriptions(matching, summaryMaxLength);
  const skills = enriched.map((s) => ({
    id: s.id,
    description: s.description ?? "(no description)"
  }));
  const payload = { category, skills, count: skills.length };
  const text = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matching.reduce(
    (sum, skill) => sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    selectedSkillsEstimatedTokens,
    responseCharacterCount: text.length
  });
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    structuredContent: {
      metrics
    },
    _meta: {
      metrics
    }
  };
}

// src/tools/skillSearch.ts
import { z as z4 } from "zod";
var skillSearchName = "skill_search";
var skillSearchDescription = "Search skills by keyword. Matches against skill IDs and descriptions. Returns matching skills with short descriptions.";
var skillSearchSchema = z4.object({
  query: z4.string().min(1).describe(
    "Search keyword or phrase to match against skill IDs and descriptions"
  )
});
async function handleSkillSearch(args, manifest, summaryMaxLength, charsPerToken) {
  const { query } = args;
  const lower = query.toLowerCase();
  let matches = manifest.skills.filter(
    (s) => s.id.toLowerCase().includes(lower)
  );
  if (matches.length === 0) {
    const enriched = await enrichWithDescriptions(
      manifest.skills,
      summaryMaxLength
    );
    matches = enriched.filter(
      (s) => s.id.toLowerCase().includes(lower) || s.description && s.description.toLowerCase().includes(lower)
    );
  } else {
    matches = await enrichWithDescriptions(matches, summaryMaxLength);
  }
  const results = matches.map((s) => ({
    id: s.id,
    category: s.category,
    description: s.description ?? "(no description)"
  }));
  const payload = { query, results, count: results.length };
  const text = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matches.reduce(
    (sum, skill) => sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    selectedSkillsEstimatedTokens,
    responseCharacterCount: text.length
  });
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    structuredContent: {
      metrics
    },
    _meta: {
      metrics
    }
  };
}

// src/tools/skillGet.ts
import { z as z5 } from "zod";
var skillGetName = "skill_get";
var skillGetDescription = "Get full content of a specific skill by ID. Returns SKILL.md content and optionally direct referenced markdown files.";
var skillGetSchema = z5.object({
  id: z5.string().describe("The skill ID (directory name) to retrieve"),
  includeReferences: z5.boolean().optional().describe(
    "Whether to include direct local markdown references from SKILL.md (default: true)"
  )
});
async function handleSkillGet(args, manifest, charsPerToken) {
  const { id, includeReferences = true } = args;
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use workflow/agent routing (for example $workflow-implement-track or $agent-backend-specialist) and call skill_get only for concrete skill ids.`
    );
  }
  const skill = manifest.skills.find((s) => s.id === id);
  if (!skill) {
    notFound("Skill", id);
  }
  const { skillContent, references } = await readSkillContentWithReferences(
    skill.path,
    includeReferences
  );
  const referenceSection = references.length > 0 ? [
    "",
    "## Referenced Files",
    "",
    ...references.flatMap((ref) => [
      `### ${ref.relativePath}`,
      "",
      ref.content.trimEnd(),
      ""
    ])
  ].join("\n") : "";
  const content = `${skillContent}${referenceSection}`;
  if (content.trim().length === 0) {
    invalidInput(
      `Skill "${id}" has empty content (SKILL.md is empty or whitespace-only). This skill may be corrupt or incomplete.`
    );
  }
  const loadedSkillEstimatedTokens = estimateTokensFromText(
    content,
    charsPerToken
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: loadedSkillEstimatedTokens,
    loadedSkillEstimatedTokens,
    responseCharacterCount: content.length
  });
  return {
    content: [
      {
        type: "text",
        text: content
      }
    ],
    structuredContent: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics
    },
    _meta: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics
    }
  };
}

// src/tools/skillBudgetReport.ts
import { z as z6 } from "zod";
var skillBudgetReportName = "skill_budget_report";
var skillBudgetReportDescription = "Report estimated context/token budget for selected and loaded skills compared to the full skill catalog.";
var skillBudgetReportSchema = z6.object({
  selectedSkillIds: z6.array(z6.string()).default([]).describe("Skill IDs selected after search/browse."),
  loadedSkillIds: z6.array(z6.string()).default([]).describe("Skill IDs loaded via skill_get.")
});
function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value)))];
}
function handleSkillBudgetReport(args, manifest, charsPerToken) {
  const selectedSkillIds = uniqueStrings(args.selectedSkillIds ?? []);
  const loadedSkillIds = uniqueStrings(args.loadedSkillIds ?? []);
  const skillById = new Map(manifest.skills.map((skill) => [skill.id, skill]));
  const selectedSkills = selectedSkillIds.map((id) => {
    const skill = skillById.get(id);
    if (!skill) return null;
    return {
      id: skill.id,
      category: skill.category,
      estimatedTokens: estimateTokensFromBytes(
        skill.fileBytes,
        charsPerToken
      )
    };
  }).filter((item) => Boolean(item));
  const loadedSkills = loadedSkillIds.map((id) => {
    const skill = skillById.get(id);
    if (!skill) return null;
    return {
      id: skill.id,
      category: skill.category,
      estimatedTokens: estimateTokensFromBytes(
        skill.fileBytes,
        charsPerToken
      )
    };
  }).filter((item) => Boolean(item));
  const unknownSelectedSkillIds = selectedSkillIds.filter(
    (id) => !skillById.has(id)
  );
  const unknownLoadedSkillIds = loadedSkillIds.filter(
    (id) => !skillById.has(id)
  );
  const selectedSkillsEstimatedTokens = selectedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0
  );
  const loadedSkillsEstimatedTokens = loadedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0
  );
  const usedEstimatedTokens = loadedSkills.length > 0 ? loadedSkillsEstimatedTokens : selectedSkillsEstimatedTokens;
  const savings = estimateSavings(
    manifest.fullCatalogEstimatedTokens,
    usedEstimatedTokens
  );
  const selectedIdSet = new Set(selectedSkills.map((skill) => skill.id));
  const loadedIdSet = new Set(loadedSkills.map((skill) => skill.id));
  const skippedSkills = manifest.skills.filter(
    (skill) => !selectedIdSet.has(skill.id) && !loadedIdSet.has(skill.id)
  ).map((skill) => skill.id).sort((a, b) => a.localeCompare(b));
  const payload = {
    skillLog: {
      selectedSkills,
      loadedSkills,
      skippedSkills,
      unknownSelectedSkillIds,
      unknownLoadedSkillIds
    },
    contextBudget: {
      estimatorVersion: TOKEN_ESTIMATOR_VERSION,
      charsPerToken,
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      selectedSkillsEstimatedTokens,
      loadedSkillsEstimatedTokens,
      estimatedSavingsTokens: savings.estimatedSavingsTokens,
      estimatedSavingsPercent: savings.estimatedSavingsPercent,
      estimated: true
    }
  };
  const text = JSON.stringify(payload, null, 2);
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    structuredContent: payload,
    _meta: payload
  };
}

// src/tools/postmanGetMode.ts
import { z as z7 } from "zod";

// src/cbxConfig/paths.ts
import path4 from "path";
import os from "os";
import { existsSync } from "fs";
function globalConfigPath() {
  return path4.join(os.homedir(), ".cbx", "cbx_config.json");
}
function projectConfigPath(workspaceRoot) {
  const root = workspaceRoot ?? process.cwd();
  return path4.join(root, "cbx_config.json");
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
    if (value !== void 0 && value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = mergeConfigs(
        result[key] ?? {},
        value
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
function readScopedConfig(scope, workspaceRoot) {
  const configPath = scope === "global" ? globalConfigPath() : projectConfigPath(workspaceRoot);
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
    path: resolved.path
  };
}

// src/cbxConfig/writer.ts
import {
  readFileSync as readFileSync3,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync as existsSync3
} from "fs";
import path5 from "path";
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
        `Cannot parse existing config at ${configPath}, creating new`
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
  const dir = path5.dirname(configPath);
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
    DEFAULT_POSTMAN_ENV_VAR
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
        profile.workspaceId ?? profile.defaultWorkspaceId
      ),
      hasInlineApiKey: typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0
    });
  }
  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      workspaceId: normalizeOptionalString(section.defaultWorkspaceId),
      hasInlineApiKey: typeof section.apiKey === "string" && section.apiKey.trim().length > 0
    });
  }
  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile = profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];
  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles
  };
}
function parseStitchState(config) {
  const section = asRecord(config.stitch) ?? {};
  const mcpUrl = normalizeOptionalString(section.mcpUrl) ?? DEFAULT_STITCH_URL;
  const fallbackEnvVar = normalizeEnvVar(
    section.apiKeyEnvVar,
    DEFAULT_STITCH_ENV_VAR
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
        hasInlineApiKey: typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0
      });
    }
  } else if (asRecord(rawProfiles)) {
    for (const [profileName, rawProfile] of Object.entries(
      rawProfiles
    )) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push({
        name: normalizeName(profileName, DEFAULT_PROFILE_NAME),
        apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
        url: normalizeOptionalString(profile.url),
        hasInlineApiKey: typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0
      });
    }
  }
  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      url: normalizeOptionalString(section.url) ?? mcpUrl,
      hasInlineApiKey: typeof section.apiKey === "string" && section.apiKey.trim().length > 0
    });
  }
  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile = profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];
  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
    useSystemGcloud: Boolean(section.useSystemGcloud)
  };
}

// src/tools/postmanModes.ts
var POSTMAN_MODES = {
  minimal: "https://mcp.postman.com/minimal",
  code: "https://mcp.postman.com/code",
  full: "https://mcp.postman.com/mcp"
};
var URL_TO_MODE = new Map(
  Object.entries(POSTMAN_MODES).map(([mode, url]) => [
    url,
    mode
  ])
);
function urlToMode(url) {
  return URL_TO_MODE.get(url);
}
function isValidMode(mode) {
  return mode in POSTMAN_MODES;
}

// src/tools/postmanGetMode.ts
var postmanGetModeName = "postman_get_mode";
var postmanGetModeDescription = "Get the current Postman MCP mode from cbx_config.json. Returns the friendly mode name and URL.";
var postmanGetModeSchema = z7.object({
  scope: z7.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to read. Default: auto (project if exists, else global)"
  )
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
              message: "Postman mcpUrl not configured. Use postman_set_mode to set one."
            },
            null,
            2
          )
        }
      ]
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
            availableModes: Object.keys(POSTMAN_MODES)
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/postmanSetMode.ts
import { z as z8 } from "zod";
var postmanSetModeName = "postman_set_mode";
var postmanSetModeDescription = "Set the Postman MCP mode in cbx_config.json. Modes: minimal, code, full.";
var postmanSetModeSchema = z8.object({
  mode: z8.enum(["minimal", "code", "full"]).describe("Postman MCP mode to set: minimal, code, or full"),
  scope: z8.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to write. Default: auto (project if exists, else global)"
  )
});
function handlePostmanSetMode(args) {
  const { mode } = args;
  const scope = args.scope ?? "auto";
  if (!isValidMode(mode)) {
    invalidInput(
      `Invalid Postman mode: "${mode}". Valid modes: minimal, code, full`
    );
  }
  const url = POSTMAN_MODES[mode];
  const result = writeConfigField(
    "postman.mcpUrl",
    url,
    scope
  );
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
            note: "Postman MCP mode updated. Restart your MCP client to pick up the change."
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/postmanGetStatus.ts
import { z as z9 } from "zod";
var postmanGetStatusName = "postman_get_status";
var postmanGetStatusDescription = "Get full Postman configuration status including mode, URL, and workspace ID.";
var postmanGetStatusSchema = z9.object({
  scope: z9.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to read. Default: auto (project if exists, else global)"
  )
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
  const mode = url ? urlToMode(url) ?? "unknown" : null;
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
            availableModes: Object.keys(POSTMAN_MODES)
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/stitchGetMode.ts
import { z as z10 } from "zod";
var stitchGetModeName = "stitch_get_mode";
var stitchGetModeDescription = "Get the active Stitch profile name and URL from cbx_config.json. Never exposes API keys.";
var stitchGetModeSchema = z10.object({
  scope: z10.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to read. Default: auto (project if exists, else global)"
  )
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
            note: "API keys are never exposed through this tool."
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/stitchSetProfile.ts
import { z as z11 } from "zod";
var stitchSetProfileName = "stitch_set_profile";
var stitchSetProfileDescription = "Set the active Stitch profile in cbx_config.json. The profile must already exist in the config.";
var stitchSetProfileSchema = z11.object({
  profileName: z11.string().min(1).describe("Name of the Stitch profile to activate"),
  scope: z11.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to write. Default: auto (project if exists, else global)"
  )
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
  const targetProfile = stitch.profiles.find((profile) => profile.name === profileName) ?? null;
  if (!targetProfile) {
    invalidInput(
      `Stitch profile "${profileName}" not found. Available profiles: ${profileNames.join(", ") || "(none)"}`
    );
  }
  const result = writeConfigField(
    "stitch.activeProfileName",
    profileName,
    scope
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
            note: "Stitch active profile updated. Restart your MCP client to pick up the change."
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/stitchGetStatus.ts
import { z as z12 } from "zod";
var stitchGetStatusName = "stitch_get_status";
var stitchGetStatusDescription = "Get full Stitch configuration status including active profile, all profile names, and URLs. Never exposes API keys.";
var stitchGetStatusSchema = z12.object({
  scope: z12.enum(["global", "project", "auto"]).optional().describe(
    "Config scope to read. Default: auto (project if exists, else global)"
  )
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
    isActive: profile.name === activeProfileName
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
            note: "API keys are never exposed. Env-var aliases are reported for runtime configuration."
          },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/registry.ts
function withDefaultScope(args, defaultScope) {
  const safeArgs = args && typeof args === "object" ? args : {};
  return {
    ...safeArgs,
    scope: typeof safeArgs.scope === "string" ? safeArgs.scope : defaultScope
  };
}
var TOOL_REGISTRY = [
  // ── Skill vault tools ─────────────────────────────────────
  {
    name: skillListCategoriesName,
    description: skillListCategoriesDescription,
    schema: skillListCategoriesSchema,
    category: "skill",
    createHandler: (ctx) => async () => handleSkillListCategories(ctx.manifest, ctx.charsPerToken)
  },
  {
    name: skillBrowseCategoryName,
    description: skillBrowseCategoryDescription,
    schema: skillBrowseCategorySchema,
    category: "skill",
    createHandler: (ctx) => async (args) => handleSkillBrowseCategory(
      args,
      ctx.manifest,
      ctx.summaryMaxLength,
      ctx.charsPerToken
    )
  },
  {
    name: skillSearchName,
    description: skillSearchDescription,
    schema: skillSearchSchema,
    category: "skill",
    createHandler: (ctx) => async (args) => handleSkillSearch(
      args,
      ctx.manifest,
      ctx.summaryMaxLength,
      ctx.charsPerToken
    )
  },
  {
    name: skillGetName,
    description: skillGetDescription,
    schema: skillGetSchema,
    category: "skill",
    createHandler: (ctx) => async (args) => handleSkillGet(
      args,
      ctx.manifest,
      ctx.charsPerToken
    )
  },
  {
    name: skillBudgetReportName,
    description: skillBudgetReportDescription,
    schema: skillBudgetReportSchema,
    category: "skill",
    createHandler: (ctx) => async (args) => handleSkillBudgetReport(
      args,
      ctx.manifest,
      ctx.charsPerToken
    )
  },
  // ── Postman tools ─────────────────────────────────────────
  {
    name: postmanGetModeName,
    description: postmanGetModeDescription,
    schema: postmanGetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) => handlePostmanGetMode(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  },
  {
    name: postmanSetModeName,
    description: postmanSetModeDescription,
    schema: postmanSetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) => handlePostmanSetMode(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  },
  {
    name: postmanGetStatusName,
    description: postmanGetStatusDescription,
    schema: postmanGetStatusSchema,
    category: "postman",
    createHandler: (ctx) => async (args) => handlePostmanGetStatus(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  },
  // ── Stitch tools ──────────────────────────────────────────
  {
    name: stitchGetModeName,
    description: stitchGetModeDescription,
    schema: stitchGetModeSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) => handleStitchGetMode(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  },
  {
    name: stitchSetProfileName,
    description: stitchSetProfileDescription,
    schema: stitchSetProfileSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) => handleStitchSetProfile(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  },
  {
    name: stitchGetStatusName,
    description: stitchGetStatusDescription,
    schema: stitchGetStatusSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) => handleStitchGetStatus(
      withDefaultScope(args, ctx.defaultConfigScope)
    )
  }
];

// src/upstream/passthrough.ts
import { mkdir, readFile as readFile2, writeFile } from "fs/promises";
import path6 from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
function resolveCatalogDir(configPath) {
  const configDir = path6.dirname(configPath);
  if (path6.basename(configDir) === ".cbx") {
    return path6.join(configDir, "mcp", "catalog");
  }
  return path6.join(configDir, ".cbx", "mcp", "catalog");
}
function buildPassthroughAliasName(service, toolName) {
  const normalizedTool = String(toolName || "").trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_").toLowerCase();
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
    description: typeof tool?.description === "string" ? tool.description : void 0,
    inputSchema: tool?.inputSchema ?? void 0,
    outputSchema: tool?.outputSchema ?? void 0
  };
}
async function loadCachedCatalogTools({
  service,
  scope,
  configPath
}) {
  if (!configPath) return [];
  const catalogDir = resolveCatalogDir(configPath);
  const catalogPath = path6.join(catalogDir, `${service}.json`);
  try {
    const raw = await readFile2(catalogPath, "utf8");
    const parsed = JSON.parse(raw);
    if (scope && typeof parsed.scope === "string" && parsed.scope.trim() && parsed.scope !== scope) {
      return [];
    }
    const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
    return tools.map((tool) => buildUpstreamToolInfo(service, tool)).filter((tool) => Boolean(tool));
  } catch {
    return [];
  }
}
function getServiceAuth(config, service) {
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
        error: `Missing Postman key env var: ${envVar2}`
      };
    }
    return {
      mcpUrl: state2.mcpUrl,
      activeProfileName: state2.activeProfileName,
      envVar: envVar2,
      headers: { Authorization: `Bearer ${token2}` },
      configured: Boolean(state2.mcpUrl)
    };
  }
  const state = parseStitchState(config);
  const activeProfile = state.activeProfile;
  const envVar = activeProfile?.apiKeyEnvVar ?? "STITCH_API_KEY";
  const token = process.env[envVar]?.trim();
  if (!token && !state.useSystemGcloud) {
    return {
      mcpUrl: state.mcpUrl,
      activeProfileName: state.activeProfileName,
      envVar,
      headers: {},
      configured: false,
      error: `Missing Stitch key env var: ${envVar}`
    };
  }
  return {
    mcpUrl: state.mcpUrl,
    activeProfileName: state.activeProfileName,
    envVar,
    headers: token ? { "X-Goog-Api-Key": token } : {},
    configured: Boolean(state.mcpUrl)
  };
}
async function withUpstreamClient({
  url,
  headers,
  fn
}) {
  const client = new Client(
    {
      name: "cubis-foundry-mcp-passthrough",
      version: "0.1.0"
    },
    {
      capabilities: {}
    }
  );
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers }
  });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}
async function persistCatalog(catalog) {
  if (!catalog.configPath) return;
  const catalogDir = resolveCatalogDir(catalog.configPath);
  const catalogPath = path6.join(catalogDir, `${catalog.service}.json`);
  const payload = {
    schemaVersion: 1,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
      outputSchema: tool.outputSchema ?? null
    })),
    discoveryError: catalog.discoveryError ?? null
  };
  await mkdir(catalogDir, { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify(payload, null, 2)}
`, "utf8");
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
      discoveryError: "cbx_config.json not found"
    };
    const missingStitch = { ...missing, service: "stitch" };
    return {
      postman: missing,
      stitch: missingStitch
    };
  }
  const baseInfo = {
    scope: effective.scope,
    configPath: effective.path
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
      discoveryError: auth.error
    };
    if (!auth.configured || !auth.mcpUrl || auth.error) {
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = auth.error ? `${auth.error} (using cached tool catalog)` : "Upstream not configured; using cached tool catalog";
      }
      await persistCatalog(catalog);
      return catalog;
    }
    try {
      const listed = await withUpstreamClient({
        url: auth.mcpUrl,
        headers: auth.headers,
        fn: async (client) => client.listTools()
      });
      const rawTools = Array.isArray(listed.tools) ? listed.tools : [];
      catalog.tools = rawTools.map((tool) => buildUpstreamToolInfo(service, tool || {})).filter((tool) => Boolean(tool));
      catalog.toolCount = catalog.tools.length;
    } catch (error) {
      catalog.discoveryError = `Tool discovery failed: ${String(error)}`;
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = `${catalog.discoveryError} (using cached tool catalog)`;
      }
    }
    await persistCatalog(catalog);
    return catalog;
  };
  return {
    postman: await discoverOne("postman"),
    stitch: await discoverOne("stitch")
  };
}
async function callUpstreamTool({
  service,
  name,
  argumentsValue,
  scope = "auto"
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
    fn: async (client) => client.callTool({
      name,
      arguments: argumentsValue
    })
  });
}

// src/server.ts
function toolCallErrorResult({
  service,
  namespacedName,
  error
}) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            service,
            tool: namespacedName,
            error: String(error)
          },
          null,
          2
        )
      }
    ]
  };
}
async function createServer({
  config,
  manifest,
  defaultConfigScope = "auto"
}) {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version
  });
  const runtimeCtx = {
    manifest,
    charsPerToken: config.telemetry?.charsPerToken ?? 4,
    summaryMaxLength: config.vault.summaryMaxLength,
    defaultConfigScope
  };
  for (const entry of TOOL_REGISTRY) {
    const handler = entry.createHandler(runtimeCtx);
    server.registerTool(
      entry.name,
      {
        description: entry.description,
        inputSchema: entry.schema,
        annotations: {}
      },
      handler
    );
  }
  logger.debug(
    `Registered ${TOOL_REGISTRY.length} built-in tools from registry`
  );
  const upstreamCatalogs = await discoverUpstreamCatalogs(defaultConfigScope);
  const dynamicSchema = z13.object({}).passthrough();
  const registeredDynamicToolNames = /* @__PURE__ */ new Set();
  for (const catalog of [upstreamCatalogs.postman, upstreamCatalogs.stitch]) {
    for (const tool of catalog.tools) {
      const registrationNames = [tool.namespacedName, ...tool.aliasNames || []];
      const uniqueRegistrationNames = [...new Set(registrationNames)];
      for (const registrationName of uniqueRegistrationNames) {
        if (registeredDynamicToolNames.has(registrationName)) {
          logger.warn(
            `Skipping duplicate dynamic tool registration name '${registrationName}' from ${catalog.service}.${tool.name}`
          );
          continue;
        }
        registeredDynamicToolNames.add(registrationName);
        server.registerTool(
          registrationName,
          {
            description: `[${catalog.service} passthrough] ${tool.description || tool.name}`,
            inputSchema: dynamicSchema,
            annotations: {}
          },
          async (args) => {
            try {
              const result = await callUpstreamTool({
                service: catalog.service,
                name: tool.name,
                argumentsValue: args && typeof args === "object" ? args : {},
                scope: defaultConfigScope
              });
              return {
                // SDK content is typed broadly; cast to the expected array shape.
                content: result.content ?? [],
                structuredContent: result.structuredContent,
                isError: Boolean(result.isError)
              };
            } catch (error) {
              return toolCallErrorResult({
                service: catalog.service,
                namespacedName: registrationName,
                error
              });
            }
          }
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
import {
  createServer as createServer2
} from "http";
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
          `Session ${id.slice(0, 8)} expired after idle (active: ${sessions.size - 1})`
        );
        entry.transport.close().catch(() => {
        });
        entry.server.close().catch(() => {
        });
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();
  const httpServer = createServer2(
    async (req, res) => {
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
          await entry.transport.close().catch(() => {
          });
          await entry.server.close().catch(() => {
          });
          sessions.delete(sid);
          logger.info(
            `Session ${sid.slice(0, 8)} terminated (active: ${sessions.size})`
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
              id: null
            })
          );
          return;
        }
        const isInit = parsed && typeof parsed === "object" && "method" in parsed && parsed.method === "initialize";
        if (!isInit) {
          logger.warn(
            `POST without session: method=${parsed?.method ?? "unknown"}`
          );
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: missing or unknown mcp-session-id"
              },
              id: parsed?.id ?? null
            })
          );
          return;
        }
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID()
        });
        try {
          const server = await serverFactory(transport);
          await transport.handleRequest(req, res, parsed);
          const sessionId = transport.sessionId;
          if (sessionId) {
            sessions.set(sessionId, {
              transport,
              server,
              lastActivity: Date.now()
            });
            logger.info(
              `New session ${sessionId.slice(0, 8)} (active: ${sessions.size})`
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
                  message: "Internal error creating session"
                },
                id: parsed?.id ?? null
              })
            );
          }
        }
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    }
  );
  httpServer.listen(options.port, options.host, () => {
    logger.info(
      `Streamable HTTP transport listening on http://${options.host}:${options.port}/mcp (multi-session)`
    );
  });
  async function closeAll() {
    clearInterval(cleanupTimer);
    for (const [id, entry] of sessions) {
      await entry.transport.close().catch(() => {
      });
      await entry.server.close().catch(() => {
      });
      sessions.delete(id);
      logger.debug(`Closed session ${id} during shutdown`);
    }
    httpServer.close();
  }
  return { httpServer, closeAll };
}

// src/index.ts
import path7 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path7.dirname(fileURLToPath2(import.meta.url));
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
          `Unknown scope: ${val}. Use "auto", "global", or "project".`
        );
        process.exit(1);
      }
    } else if (arg === "--port" && argv[i + 1]) {
      const val = Number.parseInt(argv[++i], 10);
      if (!Number.isInteger(val) || val <= 0 || val > 65535) {
        logger.error(
          `Invalid port: ${argv[i]}. Use an integer from 1 to 65535.`
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
  logger.raw("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  logger.raw("\u2502  Cubis Foundry MCP Server                    \u2502");
  logger.raw("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
  logger.raw(`\u2502  Vault: 2004/35/~245/~80,160/99.7%           \u2502`);
  logger.raw(`\u2502  Skills loaded: ${String(skillCount).padEnd(29)}\u2502`);
  logger.raw(`\u2502  Categories: ${String(categoryCount).padEnd(32)}\u2502`);
  logger.raw(`\u2502  Transport: ${transportName.padEnd(33)}\u2502`);
  logger.raw("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518");
}
function printConfigStatus(scope) {
  try {
    const effective = readEffectiveConfig(scope);
    if (!effective) {
      logger.warn(
        "cbx_config.json not found. Postman/Stitch tools will return config-not-found errors."
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
    if (stitchProfile && stitchState.activeProfile?.url) {
      const url = stitchState.activeProfile.url ?? "(no URL)";
      logger.info(`Stitch profile: ${stitchProfile} (${url})`);
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
  const basePath = path7.resolve(__dirname2, "..");
  const skills = await scanVaultRoots(serverConfig.vault.roots, basePath);
  const charsPerToken = serverConfig.telemetry.charsPerToken;
  const manifest = buildManifest(skills, charsPerToken);
  await enrichWithDescriptions(
    manifest.skills,
    serverConfig.vault.summaryMaxLength
  );
  if (args.scanOnly) {
    logger.info(
      `Scan complete: ${manifest.skills.length} skills in ${manifest.categories.length} categories`
    );
    for (const cat of manifest.categories) {
      const count = manifest.skills.filter((s) => s.category === cat).length;
      logger.info(`  ${cat}: ${count} skills`);
    }
    process.exit(0);
  }
  const resolvedHttpPort = args.port ?? serverConfig.transport.http?.port ?? 3100;
  const transportName = args.transport === "http" ? `Streamable HTTP :${resolvedHttpPort}` : "stdio";
  printStartupBanner(
    manifest.skills.length,
    manifest.categories.length,
    transportName
  );
  printConfigStatus(args.scope);
  if (args.transport === "http") {
    const httpOpts = {
      port: resolvedHttpPort,
      host: args.host ?? serverConfig.transport.http?.host ?? "127.0.0.1"
    };
    const serverFactory = async (transport) => {
      const server = await createServer({
        config: serverConfig,
        manifest,
        defaultConfigScope: args.scope
      });
      await server.connect(transport);
      return server;
    };
    const { httpServer, closeAll } = createMultiSessionHttpServer(
      httpOpts,
      serverFactory
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
      defaultConfigScope: args.scope
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
