/**
 * Cubis Foundry MCP Server – skill_browse_category tool.
 *
 * Returns all skills in a given category with truncated descriptions.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { enrichWithDescriptions } from "../vault/manifest.js";
import { notFound } from "../utils/errors.js";

export const skillBrowseCategoryName = "skill_browse_category";

export const skillBrowseCategoryDescription =
  "Browse skills within a specific category. Returns skill IDs and short descriptions.";

export const skillBrowseCategorySchema = z.object({
  category: z
    .string()
    .describe("The category name to browse (from skill_list_categories)"),
});

export async function handleSkillBrowseCategory(
  args: z.infer<typeof skillBrowseCategorySchema>,
  manifest: VaultManifest,
  summaryMaxLength: number,
) {
  const { category } = args;

  if (!manifest.categories.includes(category)) {
    notFound("Category", category);
  }

  const matching = manifest.skills.filter((s) => s.category === category);
  const enriched = await enrichWithDescriptions(matching, summaryMaxLength);

  const skills = enriched.map((s) => ({
    id: s.id,
    description: s.description ?? "(no description)",
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { category, skills, count: skills.length },
          null,
          2,
        ),
      },
    ],
  };
}
