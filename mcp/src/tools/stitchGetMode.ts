/**
 * Cubis Foundry MCP Server – stitch_get_mode tool.
 *
 * Reads the active Stitch profile and its URL from cbx_config.json.
 * Never exposes apiKey.
 */

import { z } from "zod";
import { readEffectiveConfig, redactConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";

export const stitchGetModeName = "stitch_get_mode";

export const stitchGetModeDescription =
  "Get the active Stitch profile name and URL from cbx_config.json. Never exposes API keys.";

export const stitchGetModeSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handleStitchGetMode(args: z.infer<typeof stitchGetModeSchema>) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const stitch = effective.config.stitch;
  const activeProfileName = stitch?.activeProfileName ?? null;
  const profiles = stitch?.profiles ?? {};
  const profileNames = Object.keys(profiles);

  let activeUrl: string | null = null;
  if (activeProfileName && profiles[activeProfileName]) {
    activeUrl = profiles[activeProfileName].url ?? null;
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            activeProfileName,
            activeUrl,
            availableProfiles: profileNames,
            scope: effective.scope,
            note: "API keys are never exposed through this tool.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
