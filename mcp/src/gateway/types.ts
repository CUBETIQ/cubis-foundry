/**
 * Cubis Foundry MCP Server – upstream gateway types.
 */

import type { ConfigScope } from "../cbxConfig/types.js";

export type UpstreamProvider = "postman" | "stitch" | "playwright";

export interface UpstreamTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface UpstreamConfig {
  provider: UpstreamProvider;
  mcpUrl: string | null;
  authHeader: Record<string, string> | null;
  authEnvVar: string | null;
  scope: ConfigScope | null;
  configPath: string | null;
  warnings: string[];
}

export interface UpstreamState {
  provider: UpstreamProvider;
  mcpUrl: string | null;
  authEnvVar: string | null;
  authConfigured: boolean;
  available: boolean;
  warnings: string[];
  lastError: string | null;
  syncedAt: string | null;
  tools: UpstreamTool[];
}

export interface GatewayStatus {
  scope: ConfigScope | null;
  configPath: string | null;
  catalogDir: string;
  generatedAt: string;
  providers: Record<UpstreamProvider, UpstreamState>;
}

export interface CatalogPayload {
  provider: UpstreamProvider;
  mcpUrl: string;
  syncedAt: string;
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }>;
}
