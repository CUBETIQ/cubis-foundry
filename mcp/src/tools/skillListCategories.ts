/**
 * Cubis Foundry MCP Server – skill_list_categories tool.
 *
 * Returns all discovered skill categories from the vault manifest.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";

export const skillListCategoriesName = "skill_list_categories";

export const skillListCategoriesDescription =
  "List all skill categories available in the vault. Returns category names and skill counts.";

export const skillListCategoriesSchema = z.object({});

export function handleSkillListCategories(
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const categoryCounts: Record<string, number> = {};
  for (const skill of manifest.skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] ?? 0) + 1;
  }

  const categories = manifest.categories.map((cat) => ({
    category: cat,
    skillCount: categoryCounts[cat] ?? 0,
  }));
  const payload = { categories, totalSkills: manifest.skills.length };
  const text = JSON.stringify(payload, null, 2);
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
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
  };
}
