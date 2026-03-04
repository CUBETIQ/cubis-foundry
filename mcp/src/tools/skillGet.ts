/**
 * Cubis Foundry MCP Server – skill_get tool.
 *
 * Returns the FULL content of a specific skill's SKILL.md file.
 * This is the ONLY tool that reads full file content (lazy model).
 */

import { z } from "zod";
import type { VaultManifest } from "../vault/types.js";
import { readSkillContentWithReferences } from "../vault/manifest.js";
import { invalidInput, notFound } from "../utils/errors.js";
import {
  buildSkillToolMetrics,
  estimateTokensFromText,
} from "../telemetry/tokenBudget.js";

export const skillGetName = "skill_get";

export const skillGetDescription =
  "Get full content of a specific skill by ID. Returns SKILL.md content and optionally direct referenced markdown files.";

export const skillGetSchema = z.object({
  id: z.string().describe("The skill ID (directory name) to retrieve"),
  includeReferences: z
    .boolean()
    .optional()
    .describe(
      "Whether to include direct local markdown references from SKILL.md (default: true)",
    ),
});

export async function handleSkillGet(
  args: z.infer<typeof skillGetSchema>,
  manifest: VaultManifest,
  charsPerToken: number,
) {
  const { id, includeReferences = true } = args;

  if (id.startsWith("workflow-") || id.startsWith("agent-")) {
    invalidInput(
      `Skill id "${id}" appears to be a wrapper id. Use workflow/agent routing (for example $workflow-implement-track or $agent-backend-specialist) and call skill_get only for concrete skill ids.`,
    );
  }

  const skill = manifest.skills.find((s) => s.id === id);
  if (!skill) {
    notFound("Skill", id);
  }

  const { skillContent, references } = await readSkillContentWithReferences(
    skill.path,
    includeReferences,
  );
  const referenceSection =
    references.length > 0
      ? [
          "",
          "## Referenced Files",
          "",
          ...references.flatMap((ref) => [
            `### ${ref.relativePath}`,
            "",
            ref.content.trimEnd(),
            "",
          ]),
        ].join("\n")
      : "";
  const content = `${skillContent}${referenceSection}`;

  if (content.trim().length === 0) {
    invalidInput(
      `Skill "${id}" has empty content (SKILL.md is empty or whitespace-only). This skill may be corrupt or incomplete.`,
    );
  }

  const loadedSkillEstimatedTokens = estimateTokensFromText(
    content,
    charsPerToken,
  );
  const metrics = buildSkillToolMetrics({
    charsPerToken,
    fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
    responseEstimatedTokens: loadedSkillEstimatedTokens,
    loadedSkillEstimatedTokens,
    responseCharacterCount: content.length,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: content,
      },
    ],
    structuredContent: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics,
    },
    _meta: {
      references: references.map((ref) => ({ path: ref.relativePath })),
      metrics,
    },
  };
}
