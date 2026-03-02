/**
 * Cubis Foundry MCP Server – vault types.
 */

export interface SkillPointer {
  /** Skill identifier (directory name). */
  id: string;
  /** Category derived from parent directory or frontmatter. */
  category: string;
  /** Absolute path to the SKILL.md file. */
  path: string;
  /** Short description extracted from frontmatter (truncated). */
  description?: string;
}

export interface VaultManifest {
  /** All categories discovered. */
  categories: string[];
  /** All skill pointers (metadata only – no full content). */
  skills: SkillPointer[];
}
