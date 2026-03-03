/**
 * Cubis Foundry MCP Server – server factory.
 *
 * Creates and configures the McpServer instance with built-in tools plus
 * dynamic Postman/Stitch passthrough namespaces.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "./config/schema.js";
import type { VaultManifest } from "./vault/types.js";
import {
  // Skill tools
  skillListCategoriesName,
  skillListCategoriesDescription,
  skillListCategoriesSchema,
  handleSkillListCategories,
  skillBrowseCategoryName,
  skillBrowseCategoryDescription,
  skillBrowseCategorySchema,
  handleSkillBrowseCategory,
  skillSearchName,
  skillSearchDescription,
  skillSearchSchema,
  handleSkillSearch,
  skillGetName,
  skillGetDescription,
  skillGetSchema,
  handleSkillGet,
  // Postman tools
  postmanGetModeName,
  postmanGetModeDescription,
  postmanGetModeSchema,
  handlePostmanGetMode,
  postmanSetModeName,
  postmanSetModeDescription,
  postmanSetModeSchema,
  handlePostmanSetMode,
  postmanGetStatusName,
  postmanGetStatusDescription,
  postmanGetStatusSchema,
  handlePostmanGetStatus,
  // Stitch tools
  stitchGetModeName,
  stitchGetModeDescription,
  stitchGetModeSchema,
  handleStitchGetMode,
  stitchSetProfileName,
  stitchSetProfileDescription,
  stitchSetProfileSchema,
  handleStitchSetProfile,
  stitchGetStatusName,
  stitchGetStatusDescription,
  stitchGetStatusSchema,
  handleStitchGetStatus,
} from "./tools/index.js";
import {
  callUpstreamTool,
  discoverUpstreamCatalogs,
} from "./upstream/passthrough.js";

export interface CreateServerOptions {
  config: ServerConfig;
  manifest: VaultManifest;
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
}: CreateServerOptions): McpServer {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  const maxLen = config.vault.summaryMaxLength;

  // ─── Skill vault tools ───────────────────────────────────────

  server.tool(
    skillListCategoriesName,
    skillListCategoriesDescription,
    skillListCategoriesSchema.shape,
    async () => handleSkillListCategories(manifest),
  );

  server.tool(
    skillBrowseCategoryName,
    skillBrowseCategoryDescription,
    skillBrowseCategorySchema.shape,
    async (args) => handleSkillBrowseCategory(args, manifest, maxLen),
  );

  server.tool(
    skillSearchName,
    skillSearchDescription,
    skillSearchSchema.shape,
    async (args) => handleSkillSearch(args, manifest, maxLen),
  );

  server.tool(
    skillGetName,
    skillGetDescription,
    skillGetSchema.shape,
    async (args) => handleSkillGet(args, manifest),
  );

  // ─── Postman tools ──────────────────────────────────────────

  server.tool(
    postmanGetModeName,
    postmanGetModeDescription,
    postmanGetModeSchema.shape,
    async (args) => handlePostmanGetMode(args),
  );

  server.tool(
    postmanSetModeName,
    postmanSetModeDescription,
    postmanSetModeSchema.shape,
    async (args) => handlePostmanSetMode(args),
  );

  server.tool(
    postmanGetStatusName,
    postmanGetStatusDescription,
    postmanGetStatusSchema.shape,
    async (args) => handlePostmanGetStatus(args),
  );

  // ─── Stitch tools ──────────────────────────────────────────

  server.tool(
    stitchGetModeName,
    stitchGetModeDescription,
    stitchGetModeSchema.shape,
    async (args) => handleStitchGetMode(args),
  );

  server.tool(
    stitchSetProfileName,
    stitchSetProfileDescription,
    stitchSetProfileSchema.shape,
    async (args) => handleStitchSetProfile(args),
  );

  server.tool(
    stitchGetStatusName,
    stitchGetStatusDescription,
    stitchGetStatusSchema.shape,
    async (args) => handleStitchGetStatus(args),
  );

  // ─── Dynamic upstream passthrough tools ────────────────────
  const upstreamCatalogs = await discoverUpstreamCatalogs();
  const dynamicArgsShape = z.object({}).passthrough().shape;

  for (const catalog of [upstreamCatalogs.postman, upstreamCatalogs.stitch]) {
    for (const tool of catalog.tools) {
      const namespaced = tool.namespacedName;
      server.tool(
        namespaced,
        `[${catalog.service} passthrough] ${tool.description || tool.name}`,
        dynamicArgsShape,
        async (args) => {
          try {
            const result = await callUpstreamTool({
              service: catalog.service,
              name: tool.name,
              argumentsValue:
                args && typeof args === "object" ? args : ({} as Record<string, unknown>),
            });
            return {
              content: result.content ?? [],
              structuredContent: result.structuredContent,
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
