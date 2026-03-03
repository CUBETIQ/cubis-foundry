/**
 * Cubis Foundry MCP Server – skill_search tool.
 *
 * Full-text search across skill IDs and descriptions.
 * Returns matching skills with truncated descriptions.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { enrichWithDescriptions } from "../vault/manifest.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromBytes,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";

export const skillSearchName = "skill_search";

export const skillSearchDescription =
  "Search skills by keyword. Matches against skill IDs and descriptions. Returns matching skills with short descriptions.";

export const skillSearchSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Search keyword or phrase to match against skill IDs and descriptions",
    ),
});

export async function handleSkillSearch(
  args: z.infer<typeof skillSearchSchema>,
  manifest: VaultManifest,
  summaryMaxLength: number,
  charsPerToken: number,
) {
  const { query } = args;
  const lower = query.toLowerCase();

  // First pass: match by ID
  let matches = manifest.skills.filter((s) =>
    s.id.toLowerCase().includes(lower),
  );

  // Second pass: also search descriptions if needed (enrich all, then filter)
  if (matches.length === 0) {
    const enriched = await enrichWithDescriptions(
      manifest.skills,
      summaryMaxLength,
    );
    matches = enriched.filter(
      (s) =>
        s.id.toLowerCase().includes(lower) ||
        (s.description && s.description.toLowerCase().includes(lower)),
    );
  } else {
    matches = await enrichWithDescriptions(matches, summaryMaxLength);
  }

  const results = matches.map((s) => ({
    id: s.id,
    category: s.category,
    description: s.description ?? "(no description)",
  }));
  const payload = { query, results, count: results.length };
  const text = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matches.reduce(
    (sum, skill) => sum + estimateTokensFromBytes(skill.fileBytes, charsPerToken),
    0,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(text, charsPerToken),
    selectedSkillsEstimatedTokens,
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
