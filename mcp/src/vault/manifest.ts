/**
 * Cubis Foundry MCP Server – vault manifest.
 *
 * Browse/search operations extract frontmatter description only (truncated).
 * Full SKILL.md content is read only by skill_get.
 */

import { readFile } from "node:fs/promises";
import type { SkillPointer, VaultManifest } from "./types.js";
import { logger } from "../utils/logger.js";

/**
 * Build a VaultManifest from scanned skill pointers.
 * Categories are derived from the pointers.
 */
export function buildManifest(skills: SkillPointer[]): VaultManifest {
  const categorySet = new Set<string>();
  for (const skill of skills) {
    categorySet.add(skill.category);
  }
  return {
    categories: [...categorySet].sort(),
    skills,
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
 * This is the ONLY function that reads full file content (lazy model).
 */
export async function readFullSkillContent(skillPath: string): Promise<string> {
  return readFile(skillPath, "utf8");
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
