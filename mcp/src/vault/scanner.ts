/**
 * Cubis Foundry MCP Server – vault scanner.
 *
 * Startup scan: stores only category/name/path metadata (lazy – no full SKILL.md read).
 * Description extraction is deferred to browse/search operations.
 */

import { readdir, stat } from "node:fs/promises";
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
  const skills: SkillPointer[] = [];

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

      // Derive category from the skill's frontmatter or default to "general"
      // At scan time we only store the path; category is derived from directory structure
      skills.push({
        id: entry,
        category: deriveCategory(entry),
        path: skillFile,
        fileBytes: skillStat.size,
      });
    }
  }

  logger.info(`Vault scan complete: ${skills.length} skills discovered`);
  return skills;
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
