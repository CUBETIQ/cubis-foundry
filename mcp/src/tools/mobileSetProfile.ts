/**
 * Cubis Foundry MCP Server – mobile_set_profile tool.
 *
 * Sets the active Mobile MCP profile in cbx_config.json.
 */

import { z } from "zod";
import {
  parseMobileState,
  readEffectiveConfig,
  writeConfigField,
} from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound, invalidInput } from "../utils/errors.js";

export const mobileSetProfileName = "mobile_set_profile";

export const mobileSetProfileDescription =
  "Set the active Mobile MCP profile in cbx_config.json. The profile must already exist in the config.";

export const mobileSetProfileSchema = z.object({
  profileName: z.string().min(1).describe("Name of the Mobile MCP profile to activate"),
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to write. Default: auto (project if exists, else global)",
    ),
});

export function handleMobileSetProfile(
  args: z.infer<typeof mobileSetProfileSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const mobile = parseMobileState(effective.config);
  const profileNames = mobile.profiles.map((profile) => profile.name);
  const targetProfile =
    mobile.profiles.find((profile) => profile.name === args.profileName) ?? null;

  if (!targetProfile) {
    invalidInput(
      `Mobile profile "${args.profileName}" not found. Available profiles: ${profileNames.join(", ") || "(none)"}`,
    );
  }

  const result = writeConfigField(
    "mobile.activeProfileName",
    args.profileName,
    scope as ConfigScope | "auto",
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            activeProfileName: args.profileName,
            url: targetProfile?.url ?? null,
            command: targetProfile?.command ?? null,
            args: targetProfile?.args ?? [],
            scope: result.scope,
            writtenPath: result.writtenPath,
            note: "Mobile MCP active profile updated. Restart your MCP client to pick up the change.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
