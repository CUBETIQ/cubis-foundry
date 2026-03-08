/**
 * Cubis Foundry MCP Server – vault scanner.
 *
 * Startup scan: stores only category/name/path metadata (lazy – no full SKILL.md read).
 * Description extraction is deferred to browse/search operations.
 */

import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import type { SkillPointer } from "./types.js";

/**
 * Scan vault root directories for SKILL.md files.
 * Returns metadata-only pointers; does NOT read file content.
 */
export async function scanVaultRoots(
  roots: string[],
  basePath: string,
): Promise<SkillPointer[]> {
  const skillsById = new Map<string, SkillPointer>();

  for (const rootRel of roots) {
    const rootAbs = path.resolve(basePath, rootRel);
    let entries: string[];
    try {
      entries = await readdir(rootAbs);
    } catch {
      logger.warn(`Vault root not found, skipping: ${rootAbs}`);
      continue;
    }

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = path.join(rootAbs, entry);
      const entryStat = await stat(entryPath).catch(() => null);
      if (!entryStat?.isDirectory()) continue;

      const skillFile = path.join(entryPath, "SKILL.md");
      const skillStat = await stat(skillFile).catch(() => null);
      if (!skillStat?.isFile()) continue;

      // Skip empty SKILL.md files — they provide no instructions
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

      const skillPointer: SkillPointer = {
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

  const skills = [...skillsById.values()].sort((a, b) => a.id.localeCompare(b.id));
  logger.info(`Vault scan complete: ${skills.length} skills discovered`);
  return skills;
}

const WRAPPER_PREFIXES = ["workflow-", "agent-"] as const;
const WRAPPER_KINDS = new Set(["workflow", "agent"]);
const FRONTMATTER_PREVIEW_BYTES = 8192;

function extractWrapperKindFromId(
  skillId: string,
): "workflow" | "agent" | null {
  const lower = skillId.toLowerCase();
  if (lower.startsWith(WRAPPER_PREFIXES[0])) return "workflow";
  if (lower.startsWith(WRAPPER_PREFIXES[1])) return "agent";
  return null;
}

async function readFrontmatterPreview(
  skillFile: string,
): Promise<string | null> {
  const handle = await open(skillFile, "r").catch(() => null);
  if (!handle) return null;

  try {
    // Read only a small head chunk; wrapper metadata lives in frontmatter.
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

function parseFrontmatter(rawPreview: string): string | null {
  const match = rawPreview.match(/^---\s*\n([\s\S]*?)\n---/);
  return match?.[1] ?? null;
}

function parseInlineList(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function extractMetadataWrapper(frontmatter: string): string | null {
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

function extractMetadataAliases(frontmatter: string | null): string[] {
  if (!frontmatter) return [];
  const lines = frontmatter.split(/\r?\n/);
  let inMetadata = false;
  const aliases: string[] = [];

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

function registerSkillPointer(
  skillsById: Map<string, SkillPointer>,
  pointer: SkillPointer,
) {
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

  // Prefer concrete canonical skills over synthetic aliases on collisions.
  if (existing.canonicalId && !pointer.canonicalId) {
    skillsById.set(key, pointer);
    return;
  }

  if (existing.path !== pointer.path || existing.canonicalId !== pointer.canonicalId) {
    logger.warn(
      `Duplicate skill id '${pointer.id}' discovered; keeping first registration at ${existing.path}`,
    );
  }
}

function detectWrapperKind(
  skillId: string,
  frontmatter: string | null,
): "workflow" | "agent" | null {
  const byId = extractWrapperKindFromId(skillId);
  if (byId) return byId;

  if (!frontmatter) return null;

  const byMetadata = extractMetadataWrapper(frontmatter);
  if (byMetadata === "workflow" || byMetadata === "agent") {
    return byMetadata;
  }

  return null;
}

/**
 * Simple category derivation from skill ID conventions.
 * Skills with common prefixes are grouped together.
 */
function deriveCategory(skillId: string): string {
  const categoryMap: Record<string, string> = {
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

  // Match longest prefix first
  const lower = skillId.toLowerCase();
  for (const [prefix, category] of Object.entries(categoryMap)) {
    if (lower.startsWith(prefix)) return category;
  }
  return "general";
}
