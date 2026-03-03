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
var currentLevel = "info";
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
import { readdir, stat } from "fs/promises";
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
      skills.push({
        id: entry,
        category: deriveCategory(entry),
        path: skillFile
      });
    }
  }
  logger.info(`Vault scan complete: ${skills.length} skills discovered`);
  return skills;
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
import { readFile } from "fs/promises";
function buildManifest(skills) {
  const categorySet = /* @__PURE__ */ new Set();
  for (const skill of skills) {
    categorySet.add(skill.category);
  }
  return {
    categories: [...categorySet].sort(),
    skills
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
import { z as z12 } from "zod";

// src/tools/skillListCategories.ts
import { z as z2 } from "zod";
var skillListCategoriesName = "skill_list_categories";
var skillListCategoriesDescription = "List all skill categories available in the vault. Returns category names and skill counts.";
var skillListCategoriesSchema = z2.object({});
function handleSkillListCategories(manifest) {
  const categoryCounts = {};
  for (const skill of manifest.skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] ?? 0) + 1;
  }
  const categories = manifest.categories.map((cat) => ({
    category: cat,
    skillCount: categoryCounts[cat] ?? 0
  }));
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { categories, totalSkills: manifest.skills.length },
          null,
          2
        )
      }
    ]
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
async function handleSkillBrowseCategory(args, manifest, summaryMaxLength) {
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
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { category, skills, count: skills.length },
          null,
          2
        )
      }
    ]
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
async function handleSkillSearch(args, manifest, summaryMaxLength) {
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
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { query, results, count: results.length },
          null,
          2
        )
      }
    ]
  };
}

// src/tools/skillGet.ts
import { z as z5 } from "zod";
var skillGetName = "skill_get";
var skillGetDescription = "Get the full content of a specific skill by ID. Returns the complete SKILL.md file content.";
var skillGetSchema = z5.object({
  id: z5.string().describe("The skill ID (directory name) to retrieve")
});
async function handleSkillGet(args, manifest) {
  const { id } = args;
  const skill = manifest.skills.find((s) => s.id === id);
  if (!skill) {
    notFound("Skill", id);
  }
  const content = await readFullSkillContent(skill.path);
  return {
    content: [
      {
        type: "text",
        text: content
      }
    ]
  };
}

// src/tools/postmanGetMode.ts
import { z as z6 } from "zod";

// src/cbxConfig/paths.ts
import path3 from "path";
import os from "os";
import { existsSync } from "fs";
function globalConfigPath() {
  return path3.join(os.homedir(), ".cbx", "cbx_config.json");
}
function projectConfigPath(workspaceRoot) {
  const root = workspaceRoot ?? process.cwd();
  return path3.join(root, "cbx_config.json");
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
import path4 from "path";
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
  const dir = path4.dirname(configPath);
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
var postmanGetModeSchema = z6.object({
  scope: z6.enum(["global", "project", "auto"]).optional().describe(
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
import { z as z7 } from "zod";
var postmanSetModeName = "postman_set_mode";
var postmanSetModeDescription = "Set the Postman MCP mode in cbx_config.json. Modes: minimal, code, full.";
var postmanSetModeSchema = z7.object({
  mode: z7.enum(["minimal", "code", "full"]).describe("Postman MCP mode to set: minimal, code, or full"),
  scope: z7.enum(["global", "project", "auto"]).optional().describe(
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
import { z as z8 } from "zod";
var postmanGetStatusName = "postman_get_status";
var postmanGetStatusDescription = "Get full Postman configuration status including mode, URL, and workspace ID.";
var postmanGetStatusSchema = z8.object({
  scope: z8.enum(["global", "project", "auto"]).optional().describe(
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
import { z as z9 } from "zod";
var stitchGetModeName = "stitch_get_mode";
var stitchGetModeDescription = "Get the active Stitch profile name and URL from cbx_config.json. Never exposes API keys.";
var stitchGetModeSchema = z9.object({
  scope: z9.enum(["global", "project", "auto"]).optional().describe(
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
import { z as z10 } from "zod";
var stitchSetProfileName = "stitch_set_profile";
var stitchSetProfileDescription = "Set the active Stitch profile in cbx_config.json. The profile must already exist in the config.";
var stitchSetProfileSchema = z10.object({
  profileName: z10.string().min(1).describe("Name of the Stitch profile to activate"),
  scope: z10.enum(["global", "project", "auto"]).optional().describe(
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
import { z as z11 } from "zod";
var stitchGetStatusName = "stitch_get_status";
var stitchGetStatusDescription = "Get full Stitch configuration status including active profile, all profile names, and URLs. Never exposes API keys.";
var stitchGetStatusSchema = z11.object({
  scope: z11.enum(["global", "project", "auto"]).optional().describe(
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

// src/upstream/passthrough.ts
import { mkdir, writeFile } from "fs/promises";
import path5 from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
function resolveCatalogDir(configPath) {
  const configDir = path5.dirname(configPath);
  if (path5.basename(configDir) === ".cbx") {
    return path5.join(configDir, "mcp", "catalog");
  }
  return path5.join(configDir, ".cbx", "mcp", "catalog");
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
  const catalogPath = path5.join(catalogDir, `${catalog.service}.json`);
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
async function discoverUpstreamCatalogs() {
  const effective = readEffectiveConfig("auto");
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
      catalog.tools = rawTools.map((tool) => {
        const name = typeof tool?.name === "string" ? tool.name.trim() : "";
        if (!name) return null;
        return {
          name,
          namespacedName: `${service}.${name}`,
          description: typeof tool?.description === "string" ? tool.description : void 0,
          inputSchema: tool?.inputSchema ?? void 0,
          outputSchema: tool?.outputSchema ?? void 0
        };
      }).filter((tool) => Boolean(tool));
      catalog.toolCount = catalog.tools.length;
    } catch (error) {
      catalog.discoveryError = `Tool discovery failed: ${String(error)}`;
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
  argumentsValue
}) {
  const effective = readEffectiveConfig("auto");
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
  manifest
}) {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version
  });
  const maxLen = config.vault.summaryMaxLength;
  server.tool(
    skillListCategoriesName,
    skillListCategoriesDescription,
    skillListCategoriesSchema.shape,
    async () => handleSkillListCategories(manifest)
  );
  server.tool(
    skillBrowseCategoryName,
    skillBrowseCategoryDescription,
    skillBrowseCategorySchema.shape,
    async (args) => handleSkillBrowseCategory(args, manifest, maxLen)
  );
  server.tool(
    skillSearchName,
    skillSearchDescription,
    skillSearchSchema.shape,
    async (args) => handleSkillSearch(args, manifest, maxLen)
  );
  server.tool(
    skillGetName,
    skillGetDescription,
    skillGetSchema.shape,
    async (args) => handleSkillGet(args, manifest)
  );
  server.tool(
    postmanGetModeName,
    postmanGetModeDescription,
    postmanGetModeSchema.shape,
    async (args) => handlePostmanGetMode(args)
  );
  server.tool(
    postmanSetModeName,
    postmanSetModeDescription,
    postmanSetModeSchema.shape,
    async (args) => handlePostmanSetMode(args)
  );
  server.tool(
    postmanGetStatusName,
    postmanGetStatusDescription,
    postmanGetStatusSchema.shape,
    async (args) => handlePostmanGetStatus(args)
  );
  server.tool(
    stitchGetModeName,
    stitchGetModeDescription,
    stitchGetModeSchema.shape,
    async (args) => handleStitchGetMode(args)
  );
  server.tool(
    stitchSetProfileName,
    stitchSetProfileDescription,
    stitchSetProfileSchema.shape,
    async (args) => handleStitchSetProfile(args)
  );
  server.tool(
    stitchGetStatusName,
    stitchGetStatusDescription,
    stitchGetStatusSchema.shape,
    async (args) => handleStitchGetStatus(args)
  );
  const upstreamCatalogs = await discoverUpstreamCatalogs();
  const dynamicArgsShape = z12.object({}).passthrough().shape;
  for (const catalog of [upstreamCatalogs.postman, upstreamCatalogs.stitch]) {
    for (const tool of catalog.tools) {
      const namespaced = tool.namespacedName;
      server.tool(
        namespaced,
        `[${catalog.service} passthrough] ${tool.description || tool.name}`,
        dynamicArgsShape,
        async (args) => {
          try {
            const result = await callUpstreamTool({
              service: catalog.service,
              name: tool.name,
              argumentsValue: args && typeof args === "object" ? args : {}
            });
            return {
              content: result.content ?? [],
              structuredContent: result.structuredContent,
              isError: Boolean(result.isError)
            };
          } catch (error) {
            return toolCallErrorResult({
              service: catalog.service,
              namespacedName: namespaced,
              error
            });
          }
        }
      );
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
function createStreamableHttpTransport(options) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID()
  });
  const httpServer = createServer2(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    await transport.handleRequest(req, res);
  });
  httpServer.listen(options.port, options.host, () => {
    logger.info(
      `Streamable HTTP transport listening on http://${options.host}:${options.port}/mcp`
    );
  });
  return { transport, httpServer };
}

// src/index.ts
import path6 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path6.dirname(fileURLToPath2(import.meta.url));
function parseArgs(argv) {
  let transport = "stdio";
  let scanOnly = false;
  let debug = false;
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
    } else if (arg === "--scan-only") {
      scanOnly = true;
    } else if (arg === "--debug") {
      debug = true;
    } else if (arg === "--config" && argv[i + 1]) {
      configPath = argv[++i];
    }
  }
  return { transport, scanOnly, debug, configPath };
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
function printConfigStatus() {
  try {
    const effective = readEffectiveConfig("auto");
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
  const basePath = path6.resolve(__dirname2, "..");
  const skills = await scanVaultRoots(serverConfig.vault.roots, basePath);
  const manifest = buildManifest(skills);
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
  const transportName = args.transport === "http" ? `Streamable HTTP :${serverConfig.transport.http?.port ?? 3100}` : "stdio";
  printStartupBanner(
    manifest.skills.length,
    manifest.categories.length,
    transportName
  );
  printConfigStatus();
  const mcpServer = await createServer({ config: serverConfig, manifest });
  if (args.transport === "http") {
    const httpOpts = {
      port: serverConfig.transport.http?.port ?? 3100,
      host: serverConfig.transport.http?.host ?? "127.0.0.1"
    };
    const { transport, httpServer } = createStreamableHttpTransport(httpOpts);
    await mcpServer.connect(transport);
    const shutdown = async () => {
      logger.info("Shutting down HTTP transport...");
      httpServer.close();
      await mcpServer.close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
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
