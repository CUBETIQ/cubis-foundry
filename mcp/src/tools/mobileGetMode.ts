/**
 * Cubis Foundry MCP Server – mobile_get_mode tool.
 *
 * Reads the active Mobile MCP profile and connection mode from cbx_config.json.
 */

import { z } from "zod";
import { parseMobileState, readEffectiveConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";

export const mobileGetModeName = "mobile_get_mode";

export const mobileGetModeDescription =
  "Get the active Mobile MCP profile and connection mode from cbx_config.json.";

export const mobileGetModeSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handleMobileGetMode(args: z.infer<typeof mobileGetModeSchema>) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const mobile = parseMobileState(effective.config);
  const activeProfile = mobile.activeProfile;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            activeProfileName: mobile.activeProfileName,
            activeUrl: mobile.mcpUrl ?? activeProfile?.url ?? null,
            command: activeProfile?.command ?? null,
            args: activeProfile?.args ?? [],
            availableProfiles: mobile.profiles.map((profile) => profile.name),
            scope: effective.scope,
          },
          null,
          2,
        ),
      },
    ],
  };
}
