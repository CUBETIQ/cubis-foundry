/**
 * Cubis Foundry MCP Server – upstream passthrough gateway manager.
 */

import { logger } from "../utils/logger.js";
import { persistCatalog, resolveCatalogDir } from "./catalog.js";
import { resolveGatewayConfig } from "./config.js";
import { SdkUpstreamClientFactory } from "./upstreamClient.js";
import type {
  ConnectedUpstreamClient,
  UpstreamClientFactory,
  UpstreamCallResult,
} from "./upstreamClient.js";
import type {
  GatewayScope,
  GatewayStatus,
  UpstreamProvider,
  UpstreamState,
  UpstreamTool,
} from "./types.js";

export interface GatewayManagerOptions {
  clientFactory?: UpstreamClientFactory;
}

interface ProviderRuntime {
  mcpUrl: string | null;
  headers: Record<string, string> | null;
  authEnvVar: string | null;
}

function emptyProviderState(provider: UpstreamProvider): UpstreamState {
  return {
    provider,
    mcpUrl: null,
    authEnvVar: null,
    authConfigured: false,
    available: false,
    warnings: [],
    lastError: null,
    syncedAt: null,
    tools: [],
  };
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function errorResult(message: string): UpstreamCallResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

function normalizeCallResult(result: UpstreamCallResult): UpstreamCallResult {
  if (Array.isArray(result.content)) {
    return result;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
    isError: result.isError ?? false,
    structuredContent: result.structuredContent,
  };
}

function normalizeArgs(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {};
  }
  return args as Record<string, unknown>;
}

export class GatewayManager {
  private readonly clientFactory: UpstreamClientFactory;
  private readonly providerRuntime: Record<UpstreamProvider, ProviderRuntime> =
    {
      postman: { mcpUrl: null, headers: null, authEnvVar: null },
      stitch: { mcpUrl: null, headers: null, authEnvVar: null },
      playwright: { mcpUrl: null, headers: null, authEnvVar: null },
    };
  private readonly providerState: Record<UpstreamProvider, UpstreamState> = {
    postman: emptyProviderState("postman"),
    stitch: emptyProviderState("stitch"),
    playwright: emptyProviderState("playwright"),
  };

  private scope: GatewayStatus["scope"] = null;
  private configPath: string | null = null;
  private catalogDir = resolveCatalogDir(null, null);

  constructor(options?: GatewayManagerOptions) {
    this.clientFactory =
      options?.clientFactory ?? new SdkUpstreamClientFactory();
  }

  async initialize(scope: GatewayScope = "auto"): Promise<void> {
    const resolved = resolveGatewayConfig(scope);
    this.scope = resolved.scope;
    this.configPath = resolved.configPath;
    this.catalogDir = resolveCatalogDir(resolved.scope, resolved.configPath);

    await Promise.all([
      this.syncProvider("postman", resolved.providers.postman),
      this.syncProvider("stitch", resolved.providers.stitch),
      this.syncProvider("playwright", resolved.providers.playwright),
    ]);
  }

  getCatalogDir(): string {
    return this.catalogDir;
  }

  getStatus(): GatewayStatus {
    return {
      scope: this.scope,
      configPath: this.configPath,
      catalogDir: this.catalogDir,
      generatedAt: new Date().toISOString(),
      providers: {
        postman: this.providerState.postman,
        stitch: this.providerState.stitch,
        playwright: this.providerState.playwright,
      },
    };
  }

  listEnabledTools(provider: UpstreamProvider): Record<string, unknown> {
    const state = this.providerState[provider];
    return {
      provider,
      available: state.available,
      enabledCount: state.tools.length,
      enabledTools: state.tools.map((tool) => `${provider}.${tool.name}`),
      upstreamTools: state.tools,
      warnings: state.warnings,
      lastError: state.lastError,
      syncedAt: state.syncedAt,
      mcpUrl: state.mcpUrl,
      authEnvVar: state.authEnvVar,
      authConfigured: state.authConfigured,
      catalogDir: this.catalogDir,
    };
  }

  getDynamicTools(provider: UpstreamProvider): UpstreamTool[] {
    return [...this.providerState[provider].tools];
  }

  async callTool(
    provider: UpstreamProvider,
    upstreamToolName: string,
    args: unknown,
  ): Promise<UpstreamCallResult> {
    const runtime = this.providerRuntime[provider];

    if (!runtime.mcpUrl) {
      return errorResult(`${provider} upstream MCP URL is not configured.`);
    }
    if (!runtime.headers) {
      return errorResult(
        `${provider} upstream auth is not configured via env var alias (${runtime.authEnvVar ?? "missing alias"}).`,
      );
    }

    let client: ConnectedUpstreamClient | null = null;
    try {
      client = await this.clientFactory.connect({
        mcpUrl: runtime.mcpUrl,
        headers: runtime.headers,
      });

      const result = await client.callTool(
        upstreamToolName,
        normalizeArgs(args),
      );
      return normalizeCallResult(result);
    } catch (error) {
      const message = `${provider}.${upstreamToolName} failed: ${messageFromError(error)}`;
      logger.warn(message);
      return errorResult(message);
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {
          // best-effort close
        }
      }
    }
  }

  private async syncProvider(
    provider: UpstreamProvider,
    resolved: {
      mcpUrl: string | null;
      authHeader: Record<string, string> | null;
      authEnvVar: string | null;
      warnings: string[];
    },
  ): Promise<void> {
    const state = emptyProviderState(provider);
    state.mcpUrl = resolved.mcpUrl;
    state.authEnvVar = resolved.authEnvVar;
    state.authConfigured = !!resolved.authHeader;
    state.warnings = [...resolved.warnings];

    this.providerRuntime[provider] = {
      mcpUrl: resolved.mcpUrl,
      headers: resolved.authHeader,
      authEnvVar: resolved.authEnvVar,
    };

    if (!resolved.mcpUrl || !resolved.authHeader) {
      this.providerState[provider] = state;
      return;
    }

    let client: ConnectedUpstreamClient | null = null;
    try {
      client = await this.clientFactory.connect({
        mcpUrl: resolved.mcpUrl,
        headers: resolved.authHeader,
      });

      const tools = await client.listTools();
      const syncedAt = new Date().toISOString();
      state.tools = tools;
      state.available = true;
      state.syncedAt = syncedAt;

      persistCatalog(this.catalogDir, {
        provider,
        mcpUrl: resolved.mcpUrl,
        syncedAt,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    } catch (error) {
      state.lastError = messageFromError(error);
      state.warnings.push(
        `${provider} upstream unavailable: ${state.lastError}`,
      );
      state.available = false;
      state.tools = [];
      logger.warn(`${provider} gateway init failed: ${state.lastError}`);
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {
          // best-effort close
        }
      }
    }

    this.providerState[provider] = state;
  }
}
