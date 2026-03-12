/**
 * Cubis Foundry MCP Server – playwright_get_status tool.
 *
 * Returns the Playwright MCP upstream configuration status.
 */

import { z } from "zod";
import {
  parsePlaywrightState,
  readEffectiveConfig,
} from "../cbxConfig/index.js";
import type { ConfigScope } from "../cbxConfig/types.js";
import { configNotFound } from "../utils/errors.js";

export const playwrightGetStatusName = "playwright_get_status";

export const playwrightGetStatusDescription =
  "Get Playwright MCP upstream configuration status including URL and port.";

export const playwrightGetStatusSchema = z.object({
  scope: z
    .enum(["global", "project", "auto"])
    .optional()
    .describe(
      "Config scope to read. Default: auto (project if exists, else global)",
    ),
});

export function handlePlaywrightGetStatus(
  args: z.infer<typeof playwrightGetStatusSchema>,
) {
  const scope = args.scope ?? "auto";
  const effective = readEffectiveConfig(scope as ConfigScope | "auto");

  if (!effective) {
    configNotFound();
  }

  const playwright = parsePlaywrightState(effective.config);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            configured: Boolean(playwright.mcpUrl),
            mcpUrl: playwright.mcpUrl,
            port: playwright.port,
            scope: effective.scope,
            configPath: effective.path,
            note: "Playwright MCP runs locally — no authentication required. Start with: npx @playwright/mcp --port <port>",
          },
          null,
          2,
        ),
      },
    ],
  };
}
