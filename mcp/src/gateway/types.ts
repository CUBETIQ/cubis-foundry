/**
 * Cubis Foundry MCP Server – upstream gateway types.
 */

import type { ConfigScope } from "../cbxConfig/types.js";

export type UpstreamProvider = "postman" | "stitch" | "playwright" | "android";
export type GatewayScope = ConfigScope | "auto";
export type UpstreamTransport = "http" | "stdio";

export interface UpstreamTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface UpstreamConfig {
  provider: UpstreamProvider;
  transport: UpstreamTransport;
  mcpUrl: string | null;
  authHeader: Record<string, string> | null;
  authEnvVar: string | null;
  command?: string | null;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string | null;
  scope: ConfigScope | null;
  configPath: string | null;
  warnings: string[];
}

export interface UpstreamState {
  provider: UpstreamProvider;
  transport: UpstreamTransport;
  mcpUrl: string | null;
  authEnvVar: string | null;
  authConfigured: boolean;
  command?: string | null;
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
