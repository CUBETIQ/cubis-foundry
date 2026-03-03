/**
 * Cubis Foundry MCP Server – stitch_set_profile tool.
 *
 * Sets the active Stitch profile in cbx_config.json.
 * Only mutates `stitch.activeProfileName`, never touches apiKey.
 */

import { z } from "zod";
import {
  parseStitchState,
  readEffectiveConfig,
  writeConfigField,
} from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound, invalidInput } from "../utils/errors.js";

export const stitchSetProfileName = "stitch_set_profile";

export const stitchSetProfileDescription =
  "Set the active Stitch profile in cbx_config.json. The profile must already exist in the config.";

export const stitchSetProfileSchema = z.object({
  profileName: z
    .string()
    .min(1)
    .describe("Name of the Stitch profile to activate"),
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to write. Default: auto (project if exists, else global)",
    ),
});

export function handleStitchSetProfile(
  args: z.infer<typeof stitchSetProfileSchema>,
) {
  const { profileName } = args;
  const scope = args.scope ?? "auto";

  // Verify profile exists in config
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");
  if (!effective) {
    configNotFound();
  }

  const stitch = parseStitchState(effective.config);
  const profileNames = stitch.profiles.map((profile) => profile.name);
  const targetProfile =
    stitch.profiles.find((profile) => profile.name === profileName) ?? null;

  if (!targetProfile) {
    invalidInput(
      `Stitch profile "${profileName}" not found. Available profiles: ${profileNames.join(", ") || "(none)"}`,
    );
  }

  const result = writeConfigField(
    "stitch.activeProfileName",
    profileName,
    scope as ConfigScope | "auto",
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            activeProfileName: profileName,
            url: targetProfile.url ?? null,
            scope: result.scope,
            writtenPath: result.writtenPath,
            note: "Stitch active profile updated. Restart your MCP client to pick up the change.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
