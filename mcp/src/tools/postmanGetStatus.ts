/**
 * Cubis Foundry MCP Server – postman_get_status tool.
 *
 * Returns the full Postman configuration status (mode, URL, workspace ID).
 */

import { z } from "zod";
import { readEffectiveConfig, redactConfig } from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";
import { urlToMode, POSTMAN_MODES } from "./postmanModes.js";

export const postmanGetStatusName = "postman_get_status";

export const postmanGetStatusDescription =
  "Get full Postman configuration status including mode, URL, and workspace ID.";

export const postmanGetStatusSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handlePostmanGetStatus(
  args: z.infer<typeof postmanGetStatusSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const postman = effective.config.postman;
  const url = postman?.mcpUrl ?? null;
  const mode = url ? (urlToMode(url) ?? "unknown") : null;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            configured: !!url,
            mode,
            url,
            defaultWorkspaceId: postman?.defaultWorkspaceId ?? null,
            scope: effective.scope,
            configPath: effective.path,
            availableModes: Object.keys(POSTMAN_MODES),
          },
          null,
          2,
        ),
      },
    ],
  };
}
