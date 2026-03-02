/**
 * Cubis Foundry MCP Server – stitch_get_status tool.
 *
 * Returns full Stitch configuration status.
 * Never exposes apiKey values.
 */

import { z } from "zod";
import { readEffectiveConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";

export const stitchGetStatusName = "stitch_get_status";

export const stitchGetStatusDescription =
  "Get full Stitch configuration status including active profile, all profile names, and URLs. Never exposes API keys.";

export const stitchGetStatusSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handleStitchGetStatus(
  args: z.infer<typeof stitchGetStatusSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const stitch = effective.config.stitch;
  const activeProfileName = stitch?.activeProfileName ?? null;
  const profiles = stitch?.profiles ?? {};

  // Build profile summaries (redact apiKey)
  const profileSummaries = Object.entries(profiles).map(([name, profile]) => ({
    name,
    url: profile.url ?? null,
    hasApiKey: !!profile.apiKey,
    isActive: name === activeProfileName,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            configured: profileSummaries.length > 0,
            activeProfileName,
            profiles: profileSummaries,
            totalProfiles: profileSummaries.length,
            scope: effective.scope,
            configPath: effective.path,
            note: "API keys are never exposed. 'hasApiKey' indicates if one is configured.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
