/**
 * Cubis Foundry MCP Server – stitch_get_status tool.
 *
 * Returns full Stitch configuration status.
 * Never exposes apiKey values.
 */

import { z } from "zod";
import { parseStitchState, readEffectiveConfig } from "../cbxConfig/index.js";
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

  const stitch = parseStitchState(effective.config);
  const activeProfileName = stitch.activeProfileName;
  const profileSummaries = stitch.profiles.map((profile) => ({
    name: profile.name,
    url: profile.url ?? null,
    apiKeyEnvVar: profile.apiKeyEnvVar,
    hasApiKey: profile.hasInlineApiKey,
    hasInlineApiKey: profile.hasInlineApiKey,
    isActive: profile.name === activeProfileName,
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
            mcpUrl: stitch.mcpUrl,
            useSystemGcloud: Boolean(stitch.useSystemGcloud),
            scope: effective.scope,
            configPath: effective.path,
            note: "API keys are never exposed. Env-var aliases are reported for runtime configuration.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
