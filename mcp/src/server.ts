/**
 * Cubis Foundry MCP Server – server factory.
 *
 * Creates and configures the McpServer instance with built-in tools
 * (via declarative registry) plus dynamic Postman/Stitch passthrough namespaces.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "./config/schema.js";
import type { ConfigScope } from "./cbxConfig/types.js";
import type { VaultManifest } from "./vault/types.js";
import { TOOL_REGISTRY, type ToolRuntimeContext } from "./tools/registry.js";
import {
  callUpstreamTool,
  discoverUpstreamCatalogs,
} from "./upstream/passthrough.js";
import { logger } from "./utils/logger.js";

export interface CreateServerOptions {
  config: ServerConfig;
  manifest: VaultManifest;
  defaultConfigScope?: ConfigScope | "auto";
}

function toolCallErrorResult({
  service,
  namespacedName,
  error,
}: {
  service: "postman" | "stitch";
  namespacedName: string;
  error: unknown;
}) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            service,
            tool: namespacedName,
            error: String(error),
          },
          null,
          2,
        ),
      },
    ],
  };
}

export async function createServer({
  config,
  manifest,
  defaultConfigScope = "auto",
}: CreateServerOptions): Promise<McpServer> {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  // ─── Built-in tools from declarative registry ─────────────

  const runtimeCtx: ToolRuntimeContext = {
    manifest,
    charsPerToken: config.telemetry?.charsPerToken ?? 4,
    summaryMaxLength: config.vault.summaryMaxLength,
    defaultConfigScope,
  };

  for (const entry of TOOL_REGISTRY) {
    const handler = entry.createHandler(runtimeCtx);
    // Cast is safe: registry handler signatures are compatible at runtime.
    // The overload ambiguity arises because an empty ZodRawShape `{}`
    // is structurally assignable to the annotations object overload.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server as any).tool(
      entry.name,
      entry.description,
      entry.schema.shape,
      handler,
    );
  }

  logger.debug(
    `Registered ${TOOL_REGISTRY.length} built-in tools from registry`,
  );

  // ─── Dynamic upstream passthrough tools ────────────────────
  const upstreamCatalogs = await discoverUpstreamCatalogs();
  const dynamicArgsShape = z.object({}).passthrough().shape;

  for (const catalog of [upstreamCatalogs.postman, upstreamCatalogs.stitch]) {
    for (const tool of catalog.tools) {
      const namespaced = tool.namespacedName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (server as any).tool(
        namespaced,
        `[${catalog.service} passthrough] ${tool.description || tool.name}`,
        dynamicArgsShape,
        async (args: Record<string, unknown>) => {
          try {
            const result = await callUpstreamTool({
              service: catalog.service,
              name: tool.name,
              argumentsValue:
                args && typeof args === "object"
                  ? args
                  : ({} as Record<string, unknown>),
            });
            return {
              // SDK content is typed broadly; cast to the expected array shape.
              content: (result.content ?? []) as Array<{
                type: string;
                [k: string]: unknown;
              }>,
              structuredContent: result.structuredContent as
                | Record<string, unknown>
                | undefined,
              isError: Boolean(result.isError),
            };
          } catch (error) {
            return toolCallErrorResult({
              service: catalog.service,
              namespacedName: namespaced,
              error,
            });
          }
        },
      );
    }
  }

  return server;
}
