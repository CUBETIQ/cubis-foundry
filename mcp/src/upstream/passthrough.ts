/**
 * Cubis Foundry MCP Server – upstream Postman/Stitch passthrough support.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  parsePostmanState,
  parseStitchState,
  readEffectiveConfig,
} from "../cbxConfig/index.js";
import type { CbxConfig } from "../cbxConfig/types.js";

type ServiceId = "postman" | "stitch";

export interface UpstreamToolInfo {
  name: string;
  namespacedName: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
}

export interface UpstreamCatalog {
  service: ServiceId;
  configured: boolean;
  mcpUrl: string | null;
  activeProfileName: string | null;
  envVar: string | null;
  scope: "global" | "project" | null;
  configPath: string | null;
  toolCount: number;
  tools: UpstreamToolInfo[];
  discoveryError?: string;
}

function resolveCatalogDir(configPath: string): string {
  const configDir = path.dirname(configPath);
  if (path.basename(configDir) === ".cbx") {
    return path.join(configDir, "mcp", "catalog");
  }
  return path.join(configDir, ".cbx", "mcp", "catalog");
}

function getServiceAuth(config: CbxConfig, service: ServiceId): {
  mcpUrl: string | null;
  activeProfileName: string | null;
  envVar: string | null;
  headers: Record<string, string>;
  configured: boolean;
  error?: string;
} {
  if (service === "postman") {
    const state = parsePostmanState(config);
    const activeProfile = state.activeProfile;
    const envVar = activeProfile?.apiKeyEnvVar ?? "POSTMAN_API_KEY";
    const token = process.env[envVar]?.trim();
    if (!token) {
      return {
        mcpUrl: state.mcpUrl,
        activeProfileName: state.activeProfileName,
        envVar,
        headers: {},
        configured: false,
        error: `Missing Postman key env var: ${envVar}`,
      };
    }
    return {
      mcpUrl: state.mcpUrl,
      activeProfileName: state.activeProfileName,
      envVar,
      headers: { Authorization: `Bearer ${token}` },
      configured: Boolean(state.mcpUrl),
    };
  }

  const state = parseStitchState(config);
  const activeProfile = state.activeProfile;
  const envVar = activeProfile?.apiKeyEnvVar ?? "STITCH_API_KEY";
  const token = process.env[envVar]?.trim();
  if (!token && !state.useSystemGcloud) {
    return {
      mcpUrl: state.mcpUrl,
      activeProfileName: state.activeProfileName,
      envVar,
      headers: {},
      configured: false,
      error: `Missing Stitch key env var: ${envVar}`,
    };
  }
  return {
    mcpUrl: state.mcpUrl,
    activeProfileName: state.activeProfileName,
    envVar,
    headers: token ? { "X-Goog-Api-Key": token } : {},
    configured: Boolean(state.mcpUrl),
  };
}

async function withUpstreamClient<T>({
  url,
  headers,
  fn,
}: {
  url: string;
  headers: Record<string, string>;
  fn: (client: Client) => Promise<T>;
}): Promise<T> {
  const client = new Client(
    {
      name: "cubis-foundry-mcp-passthrough",
      version: "0.1.0",
    },
    {
      capabilities: {},
    },
  );
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers },
  });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

async function persistCatalog(catalog: UpstreamCatalog): Promise<void> {
  if (!catalog.configPath) return;
  const catalogDir = resolveCatalogDir(catalog.configPath);
  const catalogPath = path.join(catalogDir, `${catalog.service}.json`);
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: "cubis-foundry-mcp startup discovery",
    service: catalog.service,
    scope: catalog.scope,
    mcpUrl: catalog.mcpUrl,
    activeProfileName: catalog.activeProfileName,
    envVar: catalog.envVar,
    toolCount: catalog.toolCount,
    tools: catalog.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? null,
      inputSchema: tool.inputSchema ?? null,
      outputSchema: tool.outputSchema ?? null,
    })),
    discoveryError: catalog.discoveryError ?? null,
  };
  await mkdir(catalogDir, { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function discoverUpstreamCatalogs(): Promise<{
  postman: UpstreamCatalog;
  stitch: UpstreamCatalog;
}> {
  const effective = readEffectiveConfig("auto");
  if (!effective) {
    const missing: UpstreamCatalog = {
      service: "postman",
      configured: false,
      mcpUrl: null,
      activeProfileName: null,
      envVar: null,
      scope: null,
      configPath: null,
      toolCount: 0,
      tools: [],
      discoveryError: "cbx_config.json not found",
    };
    const missingStitch: UpstreamCatalog = { ...missing, service: "stitch" };
    return {
      postman: missing,
      stitch: missingStitch,
    };
  }

  const baseInfo = {
    scope: effective.scope,
    configPath: effective.path,
  } as const;

  const discoverOne = async (service: ServiceId): Promise<UpstreamCatalog> => {
    const auth = getServiceAuth(effective.config, service);
    const catalog: UpstreamCatalog = {
      service,
      configured: auth.configured,
      mcpUrl: auth.mcpUrl,
      activeProfileName: auth.activeProfileName,
      envVar: auth.envVar,
      scope: baseInfo.scope,
      configPath: baseInfo.configPath,
      toolCount: 0,
      tools: [],
      discoveryError: auth.error,
    };

    if (!auth.configured || !auth.mcpUrl || auth.error) {
      await persistCatalog(catalog);
      return catalog;
    }

    try {
      const listed = await withUpstreamClient({
        url: auth.mcpUrl,
        headers: auth.headers,
        fn: async (client) => client.listTools(),
      });
      const rawTools = Array.isArray(listed.tools) ? listed.tools : [];
      catalog.tools = rawTools
        .map((tool) => {
          const name = typeof tool?.name === "string" ? tool.name.trim() : "";
          if (!name) return null;
          return {
            name,
            namespacedName: `${service}.${name}`,
            description:
              typeof tool?.description === "string" ? tool.description : undefined,
            inputSchema: tool?.inputSchema ?? undefined,
            outputSchema: tool?.outputSchema ?? undefined,
          } satisfies UpstreamToolInfo;
        })
        .filter((tool): tool is UpstreamToolInfo => Boolean(tool));
      catalog.toolCount = catalog.tools.length;
    } catch (error) {
      catalog.discoveryError = `Tool discovery failed: ${String(error)}`;
    }

    await persistCatalog(catalog);
    return catalog;
  };

  return {
    postman: await discoverOne("postman"),
    stitch: await discoverOne("stitch"),
  };
}

export async function callUpstreamTool({
  service,
  name,
  argumentsValue,
}: {
  service: ServiceId;
  name: string;
  argumentsValue: Record<string, unknown>;
}) {
  const effective = readEffectiveConfig("auto");
  if (!effective) {
    throw new Error("cbx_config.json not found");
  }
  const auth = getServiceAuth(effective.config, service);
  if (!auth.configured || !auth.mcpUrl) {
    throw new Error(auth.error || `${service} is not configured`);
  }
  if (auth.error) {
    throw new Error(auth.error);
  }

  return withUpstreamClient({
    url: auth.mcpUrl,
    headers: auth.headers,
    fn: async (client) =>
      client.callTool({
        name,
        arguments: argumentsValue,
      }),
  });
}
