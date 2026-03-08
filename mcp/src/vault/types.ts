/**
 * Cubis Foundry MCP Server – vault types.
 */

export interface SkillPointer {
  /** Skill identifier (directory name). */
  id: string;
  /** Canonical skill identifier when this pointer is a compatibility alias. */
  canonicalId?: string;
  /** Category derived from parent directory or frontmatter. */
  category: string;
  /** Absolute path to the SKILL.md file. */
  path: string;
  /** Skill file size in bytes. */
  fileBytes: number;
  /** Short description extracted from frontmatter (truncated). */
  description?: string;
}

export interface VaultManifest {
  /** All categories discovered. */
  categories: string[];
  /** All skill pointers (metadata only – no full content). */
  skills: SkillPointer[];
  /** Total bytes across all discovered SKILL.md files. */
  fullCatalogBytes: number;
  /** Estimated full-catalog token usage (deterministic estimator). */
  fullCatalogEstimatedTokens: number;
}
