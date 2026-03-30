/**
 * Cubis Foundry MCP Server – mobile_get_status tool.
 *
 * Returns Mobile MCP configuration status without exposing env values.
 */

import { z } from "zod";
import { parseMobileState, readEffectiveConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";

export const mobileGetStatusName = "mobile_get_status";

export const mobileGetStatusDescription =
  "Get full Mobile MCP configuration status including the active profile and connection details without exposing env values.";

export const mobileGetStatusSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handleMobileGetStatus(
  args: z.infer<typeof mobileGetStatusSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const mobile = parseMobileState(effective.config);
  const profileSummaries = mobile.profiles.map((profile) => ({
    name: profile.name,
    url: profile.url,
    command: profile.command,
    args: profile.args,
    cwd: profile.cwd,
    hasEnv: profile.hasEnv,
    isActive: profile.name === mobile.activeProfileName,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            configured: mobile.enabled,
            activeProfileName: mobile.activeProfileName,
            profiles: profileSummaries,
            totalProfiles: profileSummaries.length,
            mcpUrl: mobile.mcpUrl,
            scope: effective.scope,
            configPath: effective.path,
            note: "Environment variable values are never exposed through this tool.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
