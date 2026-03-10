#!/usr/bin/env node

/**
 * generate-mcp-manifest.mjs
 *
 * Build-time script that scans SKILL.md files and generates a deterministic
 * MCP-compatible manifest JSON. This manifest:
 *
 * 1. Provides a build-time snapshot of all skills available to the MCP server.
 * 2. Includes metadata for documentation generation (managed blocks in rule files).
 * 3. Enables drift detection between SKILL.md source and MCP runtime.
 * 4. Catalogs the built-in MCP tool registry for cross-referencing.
 *
 * Usage:
 *   node scripts/generate-mcp-manifest.mjs                # generate
 *   node scripts/generate-mcp-manifest.mjs --check        # CI mode: fail if stale
 *   node scripts/generate-mcp-manifest.mjs --dry-run      # preview without writing
 *
 * Output: mcp/generated/mcp-manifest.json
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
const OUT_DIR = path.join(ROOT, "mcp", "generated");
const OUT_FILE = path.join(OUT_DIR, "mcp-manifest.json");

// ─── Arg parsing ────────────────────────────────────────────

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    check: args.has("--check"),
    dryRun: args.has("--dry-run"),
    verbose: args.has("--verbose"),
  };
}

// ─── Frontmatter parsing (shared with generate-skills-index.mjs) ───

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { raw: "", body: markdown };
  return { raw: match[1], body: markdown.slice(match[0].length) };
}

function normalizeLineEndings(text) {
  return String(text || "").replace(/\r\n/g, "\n");
}

function getScalar(frontmatterRaw, key) {
  const match = frontmatterRaw.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"),
  );
  if (!match) return null;
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function normalizeNullableString(value) {
  if (value == null) return null;
  const normalized = String(value)
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const lower = normalized.toLowerCase();
  if (!normalized || lower === "null" || lower === "~") return null;
  return normalized;
}

function parseInlineList(text) {
  return String(text || "")
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseValue(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return parseInlineList(trimmed.slice(1, -1));
  }
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "");
  const normalized = unquoted.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "null" || normalized === "~") return null;
  return unquoted;
}

function getListField(frontmatterRaw, key) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const values = [];
  let inField = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fieldMatch = line.match(new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`));

    if (fieldMatch) {
      inField = true;
      const rest = fieldMatch[1].trim();

      // Inline array: keywords: [a, b, c]
      if (rest.startsWith("[") && rest.endsWith("]")) {
        const inner = rest.slice(1, -1);
        values.push(
          ...inner
            .split(",")
            .map((v) => v.trim().replace(/^['\"]|['\"]$/g, ""))
            .filter(Boolean),
        );
        break;
      }
      // Inline value
      if (rest) {
        values.push(rest.replace(/^['\"]|['\"]$/g, ""));
        break;
      }
      continue;
    }

    if (!inField) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line) && !/^\s*-/.test(line)) break;

    const bullet = line.match(/^\s*-\s*(.+)$/);
    if (bullet) {
      values.push(bullet[1].trim().replace(/^['\"]|['\"]$/g, ""));
    }
  }

  return [...new Set(values.filter(Boolean))];
}

function getMetadataBlock(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inMetadata) {
      if (/^metadata\s*:\s*$/.test(line)) {
        inMetadata = true;
      }
      continue;
    }

    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;

    const keyMatch = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const rest = keyMatch[2];
    if (rest.trim()) {
      metadata[key] = parseValue(rest);
      continue;
    }

    const values = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (!/^\s+/.test(next) || /^\s+[A-Za-z0-9_-]+\s*:/.test(next)) {
        i = j - 1;
        break;
      }

      const bullet = next.match(/^\s+-\s*(.+)$/);
      if (bullet) {
        values.push(parseValue(bullet[1]));
      }

      if (j === lines.length - 1) {
        i = j;
      }
    }

    if (values.length > 0) {
      metadata[key] = values;
    }
  }
  return metadata;
}

function getMetadataAliases(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  let inMetadata = false;
  const aliases = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inMetadata) {
      if (/^metadata\s*:\s*$/.test(line)) {
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

      const bullet = next.match(/^\s*-\s*(.+)$/);
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

const SIGNAL_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "architect",
  "architecture",
  "best",
  "builder",
  "code",
  "contract",
  "design",
  "designer",
  "developer",
  "engineering",
  "engineer",
  "expert",
  "experts",
  "for",
  "guide",
  "guidance",
  "in",
  "language",
  "of",
  "on",
  "or",
  "patterns",
  "practices",
  "pro",
  "review",
  "skill",
  "skills",
  "specialist",
  "strategies",
  "strategy",
  "system",
  "systems",
  "the",
  "tooling",
  "use",
  "when",
  "with",
  "workflow",
]);

function normalizeSignalValue(value, { allowSingleCharacter = false } = {}) {
  const normalized = normalizeNullableString(value)?.toLowerCase();
  if (!normalized) return null;
  if (!allowSingleCharacter && normalized.length < 2) return null;
  return normalized.replace(/\s+/g, " ").trim();
}

function normalizeSignalList(values, options) {
  if (!Array.isArray(values)) return [];

  const normalized = [];
  for (const value of values) {
    const signal = normalizeSignalValue(value, options);
    if (signal) normalized.push(signal);
  }
  return [...new Set(normalized)];
}

function collectMetadataSignals(metadata, key) {
  const raw = metadata[key];
  if (Array.isArray(raw)) {
    return raw;
  }
  const single = normalizeNullableString(raw);
  return single ? [single] : [];
}

function deriveIdSignals(skillId) {
  const normalizedId = String(skillId || "").trim().toLowerCase();
  if (!normalizedId) return [];

  const variants = new Set([normalizedId]);
  const phrase = normalizedId.replace(/[-_/]+/g, " ").trim();
  if (phrase) variants.add(phrase);

  for (const token of phrase.split(/\s+/)) {
    const allowSingleCharacter = token.length === 1;
    const normalized = normalizeSignalValue(token, { allowSingleCharacter });
    if (!normalized || SIGNAL_STOP_WORDS.has(normalized)) continue;
    variants.add(normalized);
  }

  return [...variants];
}

function deriveKeywords(skillId, metadata, explicitKeywords, aliases) {
  const orderedSignals = [
    ...normalizeSignalList(explicitKeywords, { allowSingleCharacter: true }),
    ...normalizeSignalList(collectMetadataSignals(metadata, "tags"), {
      allowSingleCharacter: true,
    }),
    ...normalizeSignalList(collectMetadataSignals(metadata, "stack"), {
      allowSingleCharacter: true,
    }),
    ...normalizeSignalList(collectMetadataSignals(metadata, "domain"), {
      allowSingleCharacter: true,
    }),
    ...normalizeSignalList(aliases, { allowSingleCharacter: true }),
    ...deriveIdSignals(skillId),
  ];

  return [...new Set(orderedSignals)];
}

function deriveTriggers(skillId, metadata, explicitTriggers, aliases, keywords) {
  const orderedSignals = [
    ...normalizeSignalList(explicitTriggers, { allowSingleCharacter: true }),
    ...normalizeSignalList(aliases, { allowSingleCharacter: true }),
    ...normalizeSignalList(collectMetadataSignals(metadata, "tags"), {
      allowSingleCharacter: true,
    }),
    ...normalizeSignalList(collectMetadataSignals(metadata, "stack"), {
      allowSingleCharacter: true,
    }),
    ...deriveIdSignals(skillId),
    ...keywords,
  ];

  const ranked = [];
  for (const signal of orderedSignals) {
    if (!signal) continue;
    if (SIGNAL_STOP_WORDS.has(signal)) continue;
    if (signal.length < 2 && !["c", "r"].includes(signal)) continue;
    ranked.push(signal);
  }

  return [...new Set(ranked)].slice(0, 12);
}

// ─── Category derivation (mirrors mcp/src/vault/scanner.ts) ───

const CATEGORY_MAP = {
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

function deriveCategory(skillId) {
  const lower = skillId.toLowerCase();
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.startsWith(prefix)) return category;
  }
  return "general";
}

// ─── Wrapper detection ──────────────────────────────────────

function isWrapperSkill(skillId, metadata) {
  const lower = skillId.toLowerCase();
  if (lower.startsWith("workflow-") || lower.startsWith("agent-")) return true;
  const wrapper = String(metadata.wrapper || "")
    .trim()
    .toLowerCase();
  return wrapper === "workflow" || wrapper === "agent";
}

// ─── Built-in tool catalog ──────────────────────────────────

const BUILTIN_TOOLS = [
  {
    name: "route_resolve",
    description:
      "Resolve an explicit workflow command, explicit custom agent, compatibility alias, or free-text intent into one workflow/agent route before skill loading.",
    category: "route",
  },
  {
    name: "skill_list_categories",
    description:
      "List all skill categories available in the vault. Returns category names and skill counts.",
    category: "skill",
  },
  {
    name: "skill_browse_category",
    description:
      "Browse skills within a specific category. Returns skill IDs and short descriptions.",
    category: "skill",
  },
  {
    name: "skill_search",
    description:
      "Search skills by keyword. Matches against skill IDs and descriptions.",
    category: "skill",
  },
  {
    name: "skill_validate",
    description:
      "Validate an exact skill ID before loading it. Returns alias metadata and discoverable reference markdown paths.",
    category: "skill",
  },
  {
    name: "skill_get",
    description:
      "Get full content of a specific skill by ID. Returns SKILL.md content and optionally direct referenced markdown files.",
    category: "skill",
  },
  {
    name: "skill_get_reference",
    description:
      "Get one validated markdown reference file for a skill by exact relative path.",
    category: "skill",
  },
  {
    name: "skill_budget_report",
    description:
      "Report estimated context/token budget for selected and loaded skills.",
    category: "skill",
  },
  {
    name: "postman_get_mode",
    description: "Get current Postman MCP mode from cbx_config.",
    category: "postman",
  },
  {
    name: "postman_set_mode",
    description: "Set Postman MCP mode in cbx_config.",
    category: "postman",
  },
  {
    name: "postman_get_status",
    description: "Get Postman integration status and active profile.",
    category: "postman",
  },
  {
    name: "stitch_get_mode",
    description: "Get Stitch MCP mode from cbx_config.",
    category: "stitch",
  },
  {
    name: "stitch_set_profile",
    description: "Switch active Stitch profile in cbx_config.",
    category: "stitch",
  },
  {
    name: "stitch_get_status",
    description: "Get Stitch integration status and active profile.",
    category: "stitch",
  },
];

// ─── Scan and generate ──────────────────────────────────────

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function scanSkills(verbose) {
  const skills = [];
  const errors = [];
  const skillsById = new Map();

  if (!(await pathExists(SKILLS_ROOT))) {
    throw new Error(`Skills root not found: ${SKILLS_ROOT}`);
  }

  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillId = entry.name;
    const skillFile = path.join(SKILLS_ROOT, skillId, "SKILL.md");

    if (!(await pathExists(skillFile))) {
      if (verbose) console.log(`  skip: ${skillId} (no SKILL.md)`);
      continue;
    }

    try {
      const raw = normalizeLineEndings(await fs.readFile(skillFile, "utf8"));
      const fm = parseFrontmatter(raw);
      const metadata = getMetadataBlock(fm.raw);

      if (isWrapperSkill(skillId, metadata)) {
        if (verbose) console.log(`  skip: ${skillId} (wrapper)`);
        continue;
      }

      const name = getScalar(fm.raw, "name") || skillId;
      const displayName = getScalar(fm.raw, "displayName") || null;
      const description = getScalar(fm.raw, "description") || "";
      const explicitKeywords = getListField(fm.raw, "keywords");
      const explicitTriggers = getListField(fm.raw, "triggers");
      const aliases = getMetadataAliases(fm.raw);
      const keywords = deriveKeywords(
        skillId,
        metadata,
        explicitKeywords,
        aliases,
      );
      const triggers = deriveTriggers(
        skillId,
        metadata,
        explicitTriggers,
        aliases,
        keywords,
      );
      const category = deriveCategory(skillId);
      const relativePath = path.relative(ROOT, skillFile).replaceAll("\\", "/");
      const normalizedBytes = Buffer.byteLength(raw, "utf8");

      // Validation warnings
      const warnings = [];
      if (!description) warnings.push("missing description");
      if (description.length > 200)
        warnings.push(`description too long (${description.length} chars)`);
      if (keywords.length === 0 && triggers.length === 0)
        warnings.push("no keywords or triggers");

      skillsById.set(skillId.toLowerCase(), {
        id: skillId,
        name,
        displayName,
        description,
        category,
        keywords,
        triggers,
        path: relativePath,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        fileBytes: normalizedBytes,
        warnings: warnings.length > 0 ? warnings : undefined,
      });

      for (const aliasId of aliases) {
        if (!aliasId || aliasId.toLowerCase() === skillId.toLowerCase()) continue;
        if (skillsById.has(aliasId.toLowerCase())) {
          errors.push({
            skillId: aliasId,
            error: `synthetic alias collides with existing skill id (${skillId})`,
          });
          continue;
        }

        skillsById.set(aliasId.toLowerCase(), {
          id: aliasId,
          name: aliasId,
          displayName: aliasId,
          description,
          category,
          keywords: [],
          triggers: [],
          path: relativePath,
          metadata: {
            alias_of: skillId,
          },
          fileBytes: normalizedBytes,
        });
      }
    } catch (err) {
      errors.push({ skillId, error: String(err.message || err) });
    }
  }

  const scannedSkills = [...skillsById.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  return { skills: scannedSkills, errors };
}

function buildManifest(skills, errors) {
  // Category summary
  const categoryCounts = {};
  let totalBytes = 0;

  for (const skill of skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    totalBytes += skill.fileBytes;
  }

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, skillCount: count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Content hash for drift detection
  const contentHash = createHash("sha256")
    .update(JSON.stringify(skills))
    .digest("hex")
    .slice(0, 16);

  return {
    $schema: "cubis-foundry-mcp-manifest-v1",
    generatedAt: new Date().toISOString(),
    contentHash,
    summary: {
      totalSkills: skills.length,
      totalCategories: categories.length,
      totalBytes,
      estimatedTokens: Math.ceil(totalBytes / 4),
    },
    categories,
    skills,
    builtinTools: BUILTIN_TOOLS,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const { check, dryRun, verbose } = parseArgs(process.argv);

  console.log("Scanning skill vault...");
  const { skills, errors } = await scanSkills(verbose);

  if (errors.length > 0) {
    console.warn(`\n⚠ ${errors.length} scan error(s):`);
    for (const err of errors) {
      console.warn(`  ${err.skillId}: ${err.error}`);
    }
  }

  // Count warnings
  const warningCount = skills.reduce(
    (sum, s) => sum + (s.warnings?.length || 0),
    0,
  );

  const manifest = buildManifest(skills, errors);
  const content = JSON.stringify(manifest, null, 2) + "\n";

  console.log(
    `\nManifest: ${manifest.summary.totalSkills} skills, ${manifest.summary.totalCategories} categories, ~${manifest.summary.estimatedTokens} estimated tokens`,
  );
  if (warningCount > 0) {
    console.log(`Warnings: ${warningCount} (run with --verbose for details)`);
  }
  console.log(`Content hash: ${manifest.contentHash}`);

  if (verbose) {
    const withWarnings = skills.filter((s) => s.warnings?.length);
    if (withWarnings.length > 0) {
      console.log("\nSkill warnings:");
      for (const s of withWarnings) {
        for (const w of s.warnings) {
          console.log(`  ${s.id}: ${w}`);
        }
      }
    }
  }

  if (check) {
    // CI mode: compare with existing file
    let existing = null;
    try {
      existing = await fs.readFile(OUT_FILE, "utf8");
    } catch {
      console.error(
        `\n✗ Manifest file not found: ${OUT_FILE}\n  Run: node scripts/generate-mcp-manifest.mjs`,
      );
      process.exit(1);
    }

    const existingManifest = JSON.parse(existing);
    if (existingManifest.contentHash !== manifest.contentHash) {
      console.error(
        `\n✗ Manifest is stale (hash: ${existingManifest.contentHash} vs ${manifest.contentHash})\n  Run: node scripts/generate-mcp-manifest.mjs`,
      );
      process.exit(1);
    }

    console.log("\n✓ Manifest is up-to-date.");
    return;
  }

  if (dryRun) {
    console.log(`\n[dry-run] Would write: ${OUT_FILE}`);
    return;
  }

  // Write manifest
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, content, "utf8");
  console.log(`\n✓ Written: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
