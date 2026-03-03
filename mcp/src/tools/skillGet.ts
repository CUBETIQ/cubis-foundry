/**
 * Cubis Foundry MCP Server – skill_get tool.
 *
 * Returns the FULL content of a specific skill's SKILL.md file.
 * This is the ONLY tool that reads full file content (lazy model).
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { readFullSkillContent } from "../vault/manifest.js";
import { notFound } from "../utils/errors.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";

export const skillGetName = "skill_get";

export const skillGetDescription =
  "Get the full content of a specific skill by ID. Returns the complete SKILL.md file content.";

export const skillGetSchema = z.object({
  id: z.string().describe("The skill ID (directory name) to retrieve"),
});

export async function handleSkillGet(
  args: z.infer<typeof skillGetSchema>,
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const { id } = args;

  const skill = manifest.skills.find((s) => s.id === id);
  if (!skill) {
    notFound("Skill", id);
  }

  const content = await readFullSkillContent(skill.path);
  const loadedSkillEstimatedTokens = estimateTokensFromText(
    content,
    charsPerToken,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: loadedSkillEstimatedTokens,
    loadedSkillEstimatedTokens,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: content,
      },
    ],
    structuredContent: {
      metrics,
    },
  };
}
