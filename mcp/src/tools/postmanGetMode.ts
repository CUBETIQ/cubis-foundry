/**
 * Cubis Foundry MCP Server – postman_get_mode tool.
 *
 * Reads the current Postman mode from cbx_config.json.
 */

import { z } from "zod";
import { parsePostmanState, readEffectiveConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound, unknownPostmanMode } from "../utils/errors.js";
import { urlToMode, POSTMAN_MODES } from "./postmanModes.js";

export const postmanGetModeName = "postman_get_mode";

export const postmanGetModeDescription =
  "Get the current Postman MCP mode from cbx_config.json. Returns the friendly mode name and URL.";

export const postmanGetModeSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handlePostmanGetMode(
  args: z.infer<typeof postmanGetModeSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const postmanState = parsePostmanState(effective.config);
  const url = postmanState.mcpUrl;
  if (!url) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              mode: null,
              url: null,
              scope: effective.scope,
              message:
                "Postman mcpUrl not configured. Use postman_set_mode to set one.",
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const mode = urlToMode(url);
  if (!mode) {
    unknownPostmanMode(url);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            mode,
            url,
            scope: effective.scope,
            availableModes: Object.keys(POSTMAN_MODES),
          },
          null,
          2,
        ),
      },
    ],
  };
}
