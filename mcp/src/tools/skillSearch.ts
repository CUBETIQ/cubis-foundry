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

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "api",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractQueryTokens(query: string): string[] {
  const seen = new Set<string>();
  const tokens = normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });

  return tokens;
}

function countMatchedTokens(haystack: string, tokens: string[]): number {
  if (!haystack) return 0;
  let matches = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matches += 1;
  }
  return matches;
}

function isWrapperSkillId(id: string): boolean {
  return id.startsWith("workflow-") || id.startsWith("agent-");
}

export async function handleSkillSearch(
  args: z.infer<typeof skillSearchSchema>,
  manifest: VaultManifest,
  summaryMaxLength: number,
  charsPerToken: number,
) {
  const { query } = args;
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = extractQueryTokens(query);
  const enriched = await enrichWithDescriptions(manifest.skills, summaryMaxLength);
  const rankedMatches = enriched
    .filter((skill) => !isWrapperSkillId(skill.id))
    .map((skill) => {
      const normalizedId = normalizeSearchText(skill.id);
      const normalizedCategory = normalizeSearchText(skill.category);
      const normalizedDescription = normalizeSearchText(skill.description ?? "");

      const idPhraseMatch = normalizedId.includes(normalizedQuery);
      const categoryPhraseMatch = normalizedCategory.includes(normalizedQuery);
      const descriptionPhraseMatch = normalizedDescription.includes(normalizedQuery);

      const idTokenMatches = countMatchedTokens(normalizedId, queryTokens);
      const categoryTokenMatches = countMatchedTokens(
        normalizedCategory,
        queryTokens,
      );
      const descriptionTokenMatches = countMatchedTokens(
        normalizedDescription,
        queryTokens,
      );

      const totalTokenMatches =
        idTokenMatches + categoryTokenMatches + descriptionTokenMatches;

      const score =
        (idPhraseMatch ? 500 : 0) +
        (descriptionPhraseMatch ? 250 : 0) +
        (categoryPhraseMatch ? 150 : 0) +
        idTokenMatches * 50 +
        categoryTokenMatches * 25 +
        descriptionTokenMatches * 15;

      return {
        skill,
        score,
        totalTokenMatches,
      };
    })
    .filter(
      ({ score, totalTokenMatches }) =>
        score > 0 &&
        (normalizedQuery.length > 0 || totalTokenMatches > 0),
    )
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id));

  const matches = rankedMatches.map(({ skill }) => skill);

  const results = matches.map((s) => ({
    id: s.id,
    category: s.category,
    description: s.description ?? "(no description)",
  }));
  const payload = { query, results, count: results.length };
  const text = JSON.stringify(payload, null, 2);
  const selectedSkillsEstimatedTokens = matches.reduce(
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
    structuredContent: payload,
    _meta: {
      metrics,
    },
  };
}
