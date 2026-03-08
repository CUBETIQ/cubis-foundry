/**
 * Cubis Foundry MCP Server – skill_validate tool.
 *
 * Validates an exact skill ID before skill_get and exposes alias/reference info.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import {
  listReferencedMarkdownPaths,
  readSkillFrontmatter,
} from "../vault/manifest.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";
import { invalidInput } from "../utils/errors.js";

export const skillValidateName = "skill_validate";

export const skillValidateDescription =
  "Validate an exact skill ID before loading it. Returns alias metadata and discoverable reference markdown paths.";

export const skillValidateSchema = z.object({
  id: z.string().describe("The exact skill ID (directory name) to validate"),
});

function assertConcreteSkillId(id: string) {
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use route_resolve with an explicit workflow command, @agent mention, or compatibility alias before loading concrete skills.`,
    );
  }
}

export async function handleSkillValidate(
  args: z.infer<typeof skillValidateSchema>,
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const { id } = args;
  assertConcreteSkillId(id);

  const skill = manifest.skills.find((entry) => entry.id === id);
  if (!skill) {
    const payload = {
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
    const text = JSON.stringify(payload, null, 2);
    const metrics = buildSkillToolMetrics({
      charsPerToken,
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
      responseCharacterCount: text.length,
    });

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: payload,
      _meta: { metrics },
    };
  }

  const frontmatter = await readSkillFrontmatter(skill.path);
  const frontmatterReplacementId =
    frontmatter.metadata.replaced_by || frontmatter.metadata.alias_of || null;
  const replacementId = skill.canonicalId || frontmatterReplacementId || null;
  const isAlias = Boolean(
    skill.canonicalId || frontmatterReplacementId || frontmatter.metadata.deprecated,
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
  const text = JSON.stringify(payload, null, 2);
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    responseCharacterCount: text.length,
  });

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: payload,
    _meta: { metrics },
  };
}
