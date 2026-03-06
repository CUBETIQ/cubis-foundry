/**
 * Cubis Foundry MCP Server – skill_get_reference tool.
 *
 * Returns a single validated markdown sidecar file for a skill.
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { readSkillReferenceFile } from "../vault/manifest.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";
import { invalidInput, notFound } from "../utils/errors.js";

export const skillGetReferenceName = "skill_get_reference";

export const skillGetReferenceDescription =
  "Get one validated markdown reference file for a skill by exact relative path.";

export const skillGetReferenceSchema = z.object({
  id: z.string().describe("The exact skill ID (directory name)"),
  path: z
    .string()
    .describe("Exact relative markdown reference path exposed by skill_validate"),
});

function assertConcreteSkillId(id: string) {
  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use route_resolve with an explicit workflow command, @agent mention, or compatibility alias before loading concrete skills.`,
    );
  }
}

export async function handleSkillGetReference(
  args: z.infer<typeof skillGetReferenceSchema>,
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const { id, path } = args;
  assertConcreteSkillId(id);

  const skill = manifest.skills.find((entry) => entry.id === id);
  if (!skill) {
    notFound("Skill", id);
  }

  let reference;
  try {
    reference = await readSkillReferenceFile(skill.path, path);
  } catch (error) {
    invalidInput(error instanceof Error ? error.message : String(error));
  }

  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: estimateTokensFromText(
      reference.content,
      charsPerToken,
    ),
    responseCharacterCount: reference.content.length,
  });

  return {
    content: [{ type: "text" as const, text: reference.content }],
    structuredContent: {
      skillId: id,
      path: reference.relativePath,
    },
    _meta: {
      metrics,
    },
  };
}
