/**
 * Cubis Foundry MCP Server – skill_budget_report tool.
 *
 * Aggregates selected/loaded skill IDs into a deterministic context budget
 * summary using estimated token counts.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import {
  TOKEN_ESTIMATOR_VERSION,
  estimateSavings,
  estimateTokensFromBytes,
} from "../telemetry/tokenBudget.js";

export const skillBudgetReportName = "skill_budget_report";

export const skillBudgetReportDescription =
  "Report estimated context/token budget for selected and loaded skills compared to the full skill catalog.";

export const skillBudgetReportSchema = z.object({
  selectedSkillIds: z
    .array(z.string())
    .default([])
    .describe("Skill IDs selected after search/browse."),
  loadedSkillIds: z
    .array(z.string())
    .default([])
    .describe("Skill IDs loaded via skill_get."),
});

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => String(value)))];
}

export function handleSkillBudgetReport(
  args: z.infer<typeof skillBudgetReportSchema>,
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const selectedSkillIds = uniqueStrings(args.selectedSkillIds ?? []);
  const loadedSkillIds = uniqueStrings(args.loadedSkillIds ?? []);
  const skillById = new Map(manifest.skills.map((skill) => [skill.id, skill]));

  const selectedSkills = selectedSkillIds
    .map((id) => {
      const skill = skillById.get(id);
      if (!skill) return null;
      return {
        id: skill.id,
        category: skill.category,
        estimatedTokens: estimateTokensFromBytes(skill.fileBytes, charsPerToken),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const loadedSkills = loadedSkillIds
    .map((id) => {
      const skill = skillById.get(id);
      if (!skill) return null;
      return {
        id: skill.id,
        category: skill.category,
        estimatedTokens: estimateTokensFromBytes(skill.fileBytes, charsPerToken),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const unknownSelectedSkillIds = selectedSkillIds.filter(
    (id) => !skillById.has(id),
  );
  const unknownLoadedSkillIds = loadedSkillIds.filter((id) => !skillById.has(id));

  const selectedSkillsEstimatedTokens = selectedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0,
  );
  const loadedSkillsEstimatedTokens = loadedSkills.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0,
  );

  const usedEstimatedTokens =
    loadedSkills.length > 0
      ? loadedSkillsEstimatedTokens
      : selectedSkillsEstimatedTokens;
  const savings = estimateSavings(
    manifest.fullCatalogEstimatedTokens,
    usedEstimatedTokens,
  );

  const selectedIdSet = new Set(selectedSkills.map((skill) => skill.id));
  const loadedIdSet = new Set(loadedSkills.map((skill) => skill.id));
  const skippedSkills = manifest.skills
    .filter((skill) => !selectedIdSet.has(skill.id) && !loadedIdSet.has(skill.id))
    .map((skill) => skill.id)
    .sort((a, b) => a.localeCompare(b));

  const payload = {
    skillLog: {
      selectedSkills,
      loadedSkills,
      skippedSkills,
      unknownSelectedSkillIds,
      unknownLoadedSkillIds,
    },
    contextBudget: {
      estimatorVersion: TOKEN_ESTIMATOR_VERSION,
      charsPerToken,
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      selectedSkillsEstimatedTokens,
      loadedSkillsEstimatedTokens,
      estimatedSavingsTokens: savings.estimatedSavingsTokens,
      estimatedSavingsPercent: savings.estimatedSavingsPercent,
      estimated: true,
    },
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}
