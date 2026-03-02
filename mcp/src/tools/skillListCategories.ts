/**
 * Cubis Foundry MCP Server – skill_list_categories tool.
 *
 * Returns all discovered skill categories from the vault manifest.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";

export const skillListCategoriesName = "skill_list_categories";

export const skillListCategoriesDescription =
  "List all skill categories available in the vault. Returns category names and skill counts.";

export const skillListCategoriesSchema = z.object({});

export function handleSkillListCategories(manifest: VaultManifest) {
  const categoryCounts: Record<string, number> = {};
  for (const skill of manifest.skills) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] ?? 0) + 1;
  }

  const categories = manifest.categories.map((cat) => ({
    category: cat,
    skillCount: categoryCounts[cat] ?? 0,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { categories, totalSkills: manifest.skills.length },
          null,
          2,
        ),
      },
    ],
  };
}
