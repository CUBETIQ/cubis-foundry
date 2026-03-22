/**
 * Cubis Foundry MCP Server – server factory.
 *
 * Creates and configures the McpServer instance with built-in tools
 * (via declarative registry) plus dynamic Postman/Stitch/Playwright/Android passthrough namespaces.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { ServerConfig } from "./config/schema.js";
import type { ConfigScope } from "./cbxConfig/types.js";
import type { VaultManifest } from "./vault/types.js";
import type { RouteManifest } from "./routes/types.js";
import { TOOL_REGISTRY, type ToolRuntimeContext } from "./tools/registry.js";
import { GatewayManager } from "./gateway/manager.js";
import {
  callUpstreamTool,
  discoverUpstreamCatalogs,
} from "./upstream/passthrough.js";
import { logger } from "./utils/logger.js";

export interface CreateServerOptions {
  config: ServerConfig;
  manifest: VaultManifest;
  routeManifest: RouteManifest;
  defaultConfigScope?: ConfigScope | "auto";
}

function toolCallErrorResult({
  service,
  namespacedName,
  error,
}: {
  service: "postman" | "stitch" | "playwright" | "android";
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
  routeManifest,
  defaultConfigScope = "auto",
}: CreateServerOptions): Promise<McpServer> {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  const gatewayManager = new GatewayManager();
  await gatewayManager.initialize(defaultConfigScope);

  // ─── Built-in tools from declarative registry ─────────────

  const runtimeCtx: ToolRuntimeContext = {
    manifest,
    routeManifest,
    gatewayManager,
    charsPerToken: config.telemetry?.charsPerToken ?? 4,
    summaryMaxLength: config.vault.summaryMaxLength,
    defaultConfigScope,
  };

  for (const entry of TOOL_REGISTRY) {
    const handler = entry.createHandler(runtimeCtx);
    // Use registerTool() with explicit config object — avoids the
    // overload ambiguity in the deprecated tool() where empty `{}`
    // schemas can be misinterpreted as annotations, causing tools
    // to appear "not exposed" on some clients (e.g. Codex, Gemini).
    server.registerTool(
      entry.name,
      {
        description: entry.description,
        inputSchema: entry.schema,
        annotations: {},
      },
      handler,
    );
  }

  logger.debug(
    `Registered ${TOOL_REGISTRY.length} built-in tools from registry`,
  );

  // ─── Dynamic upstream passthrough tools ────────────────────
  const upstreamCatalogs = await discoverUpstreamCatalogs(defaultConfigScope);
  const dynamicSchema = z.object({}).passthrough();
  const registeredDynamicToolNames = new Set<string>();

  for (const catalog of [
    upstreamCatalogs.postman,
    upstreamCatalogs.stitch,
    upstreamCatalogs.playwright,
    upstreamCatalogs.android,
  ]) {
    for (const tool of catalog.tools) {
      const registrationNames = [
        tool.namespacedName,
        ...(tool.aliasNames || []),
      ];
      const uniqueRegistrationNames = [...new Set(registrationNames)];
      for (const registrationName of uniqueRegistrationNames) {
        if (registeredDynamicToolNames.has(registrationName)) {
          logger.warn(
            `Skipping duplicate dynamic tool registration name '${registrationName}' from ${catalog.service}.${tool.name}`,
          );
          continue;
        }
        registeredDynamicToolNames.add(registrationName);
        server.registerTool(
          registrationName,
          {
            description: `[${catalog.service} passthrough] ${tool.description || tool.name}`,
            inputSchema: dynamicSchema,
            annotations: {},
          },
          async (
            args: Record<string, unknown>,
            _extra,
          ): Promise<CallToolResult> => {
            try {
              const result = await callUpstreamTool({
                service: catalog.service,
                name: tool.name,
                argumentsValue:
                  args && typeof args === "object"
                    ? args
                    : ({} as Record<string, unknown>),
                scope: defaultConfigScope,
              });
              return {
                ...result,
                content: result.content ?? [],
                isError: Boolean(result.isError),
              };
            } catch (error) {
              return toolCallErrorResult({
                service: catalog.service,
                namespacedName: registrationName,
                error,
              });
            }
          },
        );
      }
    }
  }

  return server;
}
