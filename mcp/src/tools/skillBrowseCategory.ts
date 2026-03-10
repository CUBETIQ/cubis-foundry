/**
 * Cubis Foundry MCP Server – skill_browse_category tool.
 *
 * Returns all skills in a given category with truncated descriptions.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { notFound } from "../utils/errors.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromBytes,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";

export const skillBrowseCategoryName = "skill_browse_category";

export const skillBrowseCategoryDescription =
  "Browse skills within a specific category. Returns skill IDs and short descriptions.";

export const skillBrowseCategorySchema = z.object({
  category: z
    .string()
    .describe("The category name to browse (from skill_list_categories)"),
});

function summarizeDescription(
  description: string | undefined,
  maxLength: number,
): string {
  const text = String(description || "").trim();
  if (!text) return "(no description)";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export async function handleSkillBrowseCategory(
  args: z.infer<typeof skillBrowseCategorySchema>,
  manifest: VaultManifest,
  summaryMaxLength: number,
  charsPerToken: number,
) {
  const { category } = args;

  if (!manifest.categories.includes(category)) {
    notFound("Category", category);
  }

  const matching = manifest.skills.filter((s) => s.category === category);
  const skills = matching.map((s) => ({
    id: s.id,
    description: summarizeDescription(s.description, summaryMaxLength),
  }));
  const payload = { category, skills, count: skills.length };
  const text = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matching.reduce(
    (sum, skill) =>
      sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    selectedSkillsEstimatedTokens,
    responseCharacterCount: text.length,
  });

  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    structuredContent: {
      metrics,
    },
    _meta: {
      metrics,
    },
  };
}
