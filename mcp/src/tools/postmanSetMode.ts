/**
 * Cubis Foundry MCP Server – postman_set_mode tool.
 *
 * Sets the Postman MCP mode in cbx_config.json.
 */

import { z } from "zod";
import { writeConfigField } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { invalidInput } from "../utils/errors.js";
import {
  isValidMode,
  POSTMAN_MODES,
  type PostmanMode,
} from "./postmanModes.js";

export const postmanSetModeName = "postman_set_mode";

export const postmanSetModeDescription =
  "Set the Postman MCP mode in cbx_config.json. Modes: minimal, code, full.";

export const postmanSetModeSchema = z.object({
  mode: z
    .enum(["minimal", "code", "full"])
    .describe("Postman MCP mode to set: minimal, code, or full"),
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to write. Default: auto (project if exists, else global)",
    ),
});

export function handlePostmanSetMode(
  args: z.infer<typeof postmanSetModeSchema>,
) {
  const { mode } = args;
  const scope = args.scope ?? "auto";

  if (!isValidMode(mode)) {
    invalidInput(
      `Invalid Postman mode: "${mode}". Valid modes: minimal, code, full`,
    );
  }

  const url = POSTMAN_MODES[mode as PostmanMode];
  const result = writeConfigField(
    "postman.mcpUrl",
    url,
    scope as ConfigScope | "auto",
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            mode,
            url,
            scope: result.scope,
            writtenPath: result.writtenPath,
            note: "Postman MCP mode updated. Restart your MCP client to pick up the change.",
          },
          null,
          2,
        ),
      },
    ],
  };
}
