/**
 * Cubis Foundry MCP Server – server factory.
 *
 * Creates and configures the McpServer instance with all 10 tools registered.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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

export interface CreateServerOptions {
  config: ServerConfig;
  manifest: VaultManifest;
}

export function createServer({
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

  return server;
}
