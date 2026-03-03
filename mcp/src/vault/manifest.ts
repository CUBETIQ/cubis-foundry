/**
 * Cubis Foundry MCP Server – vault manifest.
 *
 * Browse/search operations extract frontmatter description only (truncated).
 * Full SKILL.md content (and direct referenced markdown files) is read by skill_get.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { SkillPointer, VaultManifest } from "./types.js";
import { logger } from "../utils/logger.js";
import { estimateTokensFromBytes } from "../telemetry/tokenBudget.js";

/**
 * Build a VaultManifest from scanned skill pointers.
 * Categories are derived from the pointers.
 */
export function buildManifest(
  skills: SkillPointer[],
  charsPerToken: number,
): VaultManifest {
  const categorySet = new Set<string>();
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

/**
 * Extract the frontmatter `description` from a SKILL.md file.
 * Reads only the YAML frontmatter block (between `---` delimiters).
 * Returns the description truncated to maxLength, or undefined if not found.
 */
export async function extractDescription(
  skillPath: string,
  maxLength: number,
): Promise<string | undefined> {
  try {
    const content = await readFile(skillPath, "utf8");
    return parseDescriptionFromFrontmatter(content, maxLength);
  } catch (err) {
    logger.debug(`Failed to read description from ${skillPath}: ${err}`);
    return undefined;
  }
}

/**
 * Parse the description field from YAML frontmatter.
 */
export function parseDescriptionFromFrontmatter(
  content: string,
  maxLength: number,
): string | undefined {
  // Match YAML frontmatter block
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return undefined;

  const frontmatter = fmMatch[1];

  // Extract description field (handles both single-line and multi-line)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (!descMatch) return undefined;

  let desc = descMatch[1].trim();
  // Remove surrounding quotes if present
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

/**
 * Read the full content of a SKILL.md file.
 */
export async function readFullSkillContent(skillPath: string): Promise<string> {
  return readFile(skillPath, "utf8");
}

const MARKDOWN_LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const MAX_REFERENCED_FILES = 25;

export interface ReferencedSkillFile {
  relativePath: string;
  content: string;
}

function normalizeLinkTarget(rawTarget: string): string | null {
  let target = String(rawTarget || "").trim();
  if (!target) return null;

  // Support links wrapped in angle brackets: [x](<references/doc.md>)
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  // Strip optional title segment: [x](path "title")
  const firstSpace = target.search(/\s/);
  if (firstSpace > 0) {
    target = target.slice(0, firstSpace).trim();
  }

  // Ignore anchors/query fragments for file loading
  target = target.split("#")[0].split("?")[0].trim();
  if (!target) return null;

  // Skip URLs/protocol links and absolute paths
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return null;
  if (/^[a-zA-Z]:[\\/]/.test(target)) return null; // Windows absolute path
  if (path.isAbsolute(target)) return null;

  return target;
}

function collectReferencedMarkdownTargets(skillContent: string): string[] {
  const targets: string[] = [];
  const seen = new Set<string>();

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

async function readReferencedMarkdownFiles(
  skillPath: string,
  skillContent: string,
): Promise<ReferencedSkillFile[]> {
  const skillDir = path.dirname(skillPath);
  let targets = collectReferencedMarkdownTargets(skillContent);
  if (targets.length === 0) {
    targets = await collectSiblingMarkdownTargets(skillDir);
  }
  const references: ReferencedSkillFile[] = [];

  for (const target of targets) {
    const resolved = path.resolve(skillDir, target);
    const relative = path.relative(skillDir, resolved);

    // Prevent path traversal outside the skill directory.
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      continue;
    }

    if (path.basename(resolved).toLowerCase() === "skill.md") continue;

    try {
      const content = await readFile(resolved, "utf8");
      references.push({
        relativePath: relative.split(path.sep).join("/"),
        content,
      });
    } catch (err) {
      logger.debug(`Failed to read referenced markdown ${resolved}: ${err}`);
    }
  }

  return references;
}

async function collectSiblingMarkdownTargets(skillDir: string): Promise<string[]> {
  const entries = await readdir(skillDir, { withFileTypes: true }).catch(
    () => [],
  );
  const targets: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    if (entry.name.toLowerCase() === "skill.md") continue;
    targets.push(entry.name);
    if (targets.length >= MAX_REFERENCED_FILES) break;
  }

  targets.sort((a, b) => a.localeCompare(b));
  return targets;
}

/**
 * Read full SKILL.md content and any direct local markdown references declared
 * in the skill document. Reference discovery is one-hop (no recursive crawling).
 */
export async function readSkillContentWithReferences(
  skillPath: string,
  includeReferences = true,
): Promise<{ skillContent: string; references: ReferencedSkillFile[] }> {
  const skillContent = await readFullSkillContent(skillPath);
  if (!includeReferences) {
    return { skillContent, references: [] };
  }

  const references = await readReferencedMarkdownFiles(skillPath, skillContent);
  return { skillContent, references };
}

/**
 * Enrich skill pointers with descriptions (for browse/search results).
 */
export async function enrichWithDescriptions(
  skills: SkillPointer[],
  maxLength: number,
): Promise<SkillPointer[]> {
  return Promise.all(
    skills.map(async (skill) => {
      if (skill.description) return skill;
      const description = await extractDescription(skill.path, maxLength);
      return { ...skill, description };
    }),
  );
}
