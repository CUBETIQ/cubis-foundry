/**
 * Cubis Foundry MCP Server – upstream Postman/Stitch passthrough support.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  parsePostmanState,
  parseStitchState,
  parsePlaywrightState,
  parseAndroidState,
  readEffectiveConfig,
} from "../cbxConfig/index.js";
import type { CbxConfig, ConfigScope } from "../cbxConfig/types.js";

type ServiceId = "postman" | "stitch" | "playwright" | "android";

const STITCH_ENV_FALLBACKS = ["STITCH_API_KEY_DEFAULT", "STITCH_API_KEY"];
const STITCH_LONG_RUNNING_TIMEOUT_MS = 8 * 60 * 1000;
const STITCH_DISCOVERY_TIMEOUT_MS = 30 * 1000;
const STITCH_DEFAULT_COMPLEX_MODEL = "GEMINI_3_1_PRO";
const STITCH_SPEED_MODEL = "GEMINI_3_FLASH";
const STITCH_MUTATION_TOOLS = new Set([
  "generate_screen_from_text",
  "edit_screens",
  "generate_variants",
]);
const STITCH_TIMEOUT_RECOVERY_TOOLS = new Set([
  "generate_screen_from_text",
  "generate_variants",
]);

export interface UpstreamToolInfo {
  name: string;
  namespacedName: string;
  aliasNames: string[];
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

interface StitchScreenSummary {
  name?: string;
  title?: string;
  screenshot?: { downloadUrl?: string };
  htmlCode?: { downloadUrl?: string; mimeType?: string };
  width?: string;
  height?: string;
  deviceType?: string;
}

interface StitchProjectSummary {
  name?: string;
  title?: string;
  visibility?: string;
  projectType?: string;
  origin?: string;
}

function resolveCatalogDir(configPath: string): string {
  const configDir = path.dirname(configPath);
  if (path.basename(configDir) === ".cbx") {
    return path.join(configDir, "mcp", "catalog");
  }
  return path.join(configDir, ".cbx", "mcp", "catalog");
}

export function buildPassthroughAliasName(
  service: ServiceId,
  toolName: string,
): string {
  const normalizedTool = String(toolName || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
  if (!normalizedTool) return `${service}_tool`;
  return `${service}_${normalizedTool}`;
}

export function buildUpstreamToolInfo(
  service: ServiceId,
  tool: {
    name?: unknown;
    description?: unknown;
    inputSchema?: unknown;
    outputSchema?: unknown;
  },
): UpstreamToolInfo | null {
  const name = typeof tool?.name === "string" ? tool.name.trim() : "";
  if (!name) return null;
  const namespacedName = `${service}.${name}`;
  const aliasNames = [buildPassthroughAliasName(service, name)];
  return {
    name,
    namespacedName,
    aliasNames,
    description:
      typeof tool?.description === "string" ? tool.description : undefined,
    inputSchema: tool?.inputSchema ?? undefined,
    outputSchema: tool?.outputSchema ?? undefined,
  };
}

async function loadCachedCatalogTools({
  service,
  scope,
  configPath,
}: {
  service: ServiceId;
  scope: ConfigScope | null;
  configPath: string | null;
}): Promise<UpstreamToolInfo[]> {
  if (!configPath) return [];
  const catalogDir = resolveCatalogDir(configPath);
  const catalogPath = path.join(catalogDir, `${service}.json`);
  try {
    const raw = await readFile(catalogPath, "utf8");
    const parsed = JSON.parse(raw) as {
      scope?: string;
      tools?: Array<{
        name?: unknown;
        description?: unknown;
        inputSchema?: unknown;
        outputSchema?: unknown;
      }>;
    };
    if (
      scope &&
      typeof parsed.scope === "string" &&
      parsed.scope.trim() &&
      parsed.scope !== scope
    ) {
      // Cross-scope catalogs can be stale for the active config.
      return [];
    }
    const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
    return tools
      .map((tool) => buildUpstreamToolInfo(service, tool))
      .filter((tool): tool is UpstreamToolInfo => Boolean(tool));
  } catch {
    return [];
  }
}

function getServiceAuth(
  config: CbxConfig,
  service: ServiceId,
): {
  transport: "http" | "stdio";
  mcpUrl: string | null;
  activeProfileName: string | null;
  envVar: string | null;
  headers: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string | null;
  configured: boolean;
  error?: string;
} {
  if (service === "android") {
    const state = parseAndroidState(config);
    return {
      transport: "stdio",
      mcpUrl: null,
      activeProfileName: null,
      envVar: null,
      headers: {},
      command: state.command,
      args: state.args,
      env: state.env,
      cwd: state.cwd,
      configured: Boolean(state.enabled && state.command),
      error:
        state.enabled && state.command
          ? undefined
          : "Android MCP is not enabled in cbx_config.json",
    };
  }

  if (service === "playwright") {
    const state = parsePlaywrightState(config);
    return {
      transport: "http",
      mcpUrl: state.mcpUrl,
      activeProfileName: null,
      envVar: null,
      headers: {},
      configured: Boolean(state.mcpUrl),
    };
  }

  if (service === "postman") {
    const state = parsePostmanState(config);
    const activeProfile = state.activeProfile;
    const envVar = activeProfile?.apiKeyEnvVar ?? "POSTMAN_API_KEY";
    const token = process.env[envVar]?.trim();
    if (!token) {
      return {
        transport: "http",
        mcpUrl: state.mcpUrl,
        activeProfileName: state.activeProfileName,
        envVar,
        headers: {},
        configured: false,
        error: `Missing Postman key env var: ${envVar}`,
      };
    }
    return {
      transport: "http",
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
  const tokenInfo = resolveStitchToken(envVar);
  const token = tokenInfo?.token;
  if (!token && !state.useSystemGcloud) {
    return {
      transport: "http",
      mcpUrl: state.mcpUrl,
      activeProfileName: state.activeProfileName,
      envVar: tokenInfo?.envVar || envVar,
      headers: {},
      configured: false,
      error: `Missing Stitch key env var: ${envVar}`,
    };
  }
  return {
    transport: "http",
    mcpUrl: state.mcpUrl,
    activeProfileName: state.activeProfileName,
    envVar: tokenInfo?.envVar || envVar,
    headers: token ? { "X-Goog-Api-Key": token } : {},
    configured: Boolean(state.mcpUrl),
  };
}

function resolveStitchToken(
  preferredEnvVar: string,
  env: NodeJS.ProcessEnv = process.env,
): { envVar: string; token: string } | null {
  const candidates = [preferredEnvVar, ...STITCH_ENV_FALLBACKS].filter(Boolean);
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const token = env[candidate]?.trim();
    if (token) {
      return { envVar: candidate, token };
    }
  }
  return null;
}

async function withUpstreamClient<T>({
  transport,
  url,
  headers,
  command,
  args,
  env,
  cwd,
  fn,
}: {
  transport: "http" | "stdio";
  url?: string | null;
  headers: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string | null;
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
  const clientTransport =
    transport === "stdio"
      ? new StdioClientTransport({
          command: command || "npx",
          args: args || [],
          env: env || {},
          cwd: cwd || process.cwd(),
          stderr: "pipe",
        })
      : new StreamableHTTPClientTransport(new URL(url || ""), {
          requestInit: { headers },
        });
  await client.connect(clientTransport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

function isCallToolResult(
  result: Awaited<ReturnType<Client["callTool"]>>,
): result is CallToolResult {
  return Array.isArray(
    (
      result as {
        content?: unknown;
      }
    ).content,
  );
}

function normalizeUpstreamToolResult(
  result: Awaited<ReturnType<Client["callTool"]>>,
): CallToolResult {
  if (isCallToolResult(result)) {
    return result;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            toolResult: result.toolResult,
          },
          null,
          2,
        ),
      },
    ],
    _meta: result._meta,
  };
}

function isStitchLongRunningTool(name: string): boolean {
  return STITCH_MUTATION_TOOLS.has(String(name || "").trim());
}

function getUpstreamRequestOptions(
  service: ServiceId,
  name: string,
): RequestOptions | undefined {
  if (service !== "stitch" || !isStitchLongRunningTool(name)) {
    return undefined;
  }
  return {
    timeout: STITCH_LONG_RUNNING_TIMEOUT_MS,
    maxTotalTimeout: STITCH_LONG_RUNNING_TIMEOUT_MS,
    resetTimeoutOnProgress: true,
  };
}

function applyStitchDefaultArguments(
  name: string,
  argumentsValue: Record<string, unknown>,
): Record<string, unknown> {
  if (name !== "generate_screen_from_text" && name !== "edit_screens") {
    return argumentsValue;
  }
  const next = { ...argumentsValue };
  if (typeof next.modelId !== "string" || !next.modelId.trim()) {
    next.modelId = STITCH_DEFAULT_COMPLEX_MODEL;
  }
  return next;
}

async function listStitchScreens(
  client: Client,
  projectId: string,
): Promise<StitchScreenSummary[]> {
  const response = normalizeUpstreamToolResult(
    await client.callTool(
      {
        name: "list_screens",
        arguments: { projectId },
      },
      undefined,
      {
        timeout: STITCH_DISCOVERY_TIMEOUT_MS,
      },
    ),
  );
  const text = response.content.find((item) => item.type === "text")?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as {
      screens?: StitchScreenSummary[];
    };
    return Array.isArray(parsed.screens) ? parsed.screens : [];
  } catch {
    return [];
  }
}

async function listStitchProjects(client: Client): Promise<StitchProjectSummary[]> {
  const response = normalizeUpstreamToolResult(
    await client.callTool(
      {
        name: "list_projects",
        arguments: {},
      },
      undefined,
      {
        timeout: STITCH_DISCOVERY_TIMEOUT_MS,
      },
    ),
  );
  const text = response.content.find((item) => item.type === "text")?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as {
      projects?: StitchProjectSummary[];
    };
    return Array.isArray(parsed.projects) ? parsed.projects : [];
  } catch {
    return [];
  }
}

function findMatchingStitchProject(
  projects: StitchProjectSummary[],
  title: string,
): StitchProjectSummary | null {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) return null;
  return (
    projects.find(
      (project) =>
        typeof project.title === "string" &&
        project.title.trim().toLowerCase() === normalizedTitle,
    ) || null
  );
}

function isTimeoutError(error: unknown): boolean {
  const text = String(error || "");
  return text.includes("Request timed out") || text.includes("RequestTimeout");
}

function buildStitchTimeoutRecoveryResult({
  toolName,
  projectId,
  screens,
}: {
  toolName: string;
  projectId: string;
  screens: StitchScreenSummary[];
}): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            service: "stitch",
            tool: `stitch.${toolName}`,
            projectId,
            recoveredAfterTimeout: true,
            message:
              "The Stitch request timed out locally, but new screens were detected in the project. Treat these as recovered results and prefer edit_screens for follow-up changes.",
            outputComponents: screens.map((screen) => ({
              text: `Recovered screen ${screen.title || screen.name || "unknown"} after timeout.`,
              design: {
                screens: [screen],
              },
            })),
          },
          null,
          2,
        ),
      },
    ],
  };
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

export async function discoverUpstreamCatalogs(
  scope: ConfigScope | "auto" = "auto",
): Promise<{
  postman: UpstreamCatalog;
  stitch: UpstreamCatalog;
  playwright: UpstreamCatalog;
  android: UpstreamCatalog;
}> {
  const effective = readEffectiveConfig(scope);
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
    const missingPlaywright: UpstreamCatalog = {
      ...missing,
      service: "playwright",
    };
    const missingAndroid: UpstreamCatalog = {
      ...missing,
      service: "android",
    };
    return {
      postman: missing,
      stitch: missingStitch,
      playwright: missingPlaywright,
      android: missingAndroid,
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
      const missingConnection =
        auth.transport === "http"
          ? !auth.mcpUrl
          : !(auth.command && auth.command.trim());
      if (!missingConnection && !auth.error) {
        // continue to discovery
      } else {
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath,
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = auth.error
          ? `${auth.error} (using cached tool catalog)`
          : "Upstream not configured; using cached tool catalog";
      }
      await persistCatalog(catalog);
      return catalog;
      }
    }

    try {
      const listed = await withUpstreamClient({
        transport: auth.transport,
        url: auth.mcpUrl,
        headers: auth.headers,
        command: auth.command,
        args: auth.args,
        env: auth.env,
        cwd: auth.cwd,
        fn: async (client) => client.listTools(),
      });
      const rawTools = Array.isArray(listed.tools) ? listed.tools : [];
      catalog.tools = rawTools
        .map((tool) => buildUpstreamToolInfo(service, tool || {}))
        .filter((tool): tool is UpstreamToolInfo => Boolean(tool));
      catalog.toolCount = catalog.tools.length;
    } catch (error) {
      catalog.discoveryError = `Tool discovery failed: ${String(error)}`;
      const cachedTools = await loadCachedCatalogTools({
        service,
        scope: baseInfo.scope,
        configPath: baseInfo.configPath,
      });
      if (cachedTools.length > 0) {
        catalog.tools = cachedTools;
        catalog.toolCount = cachedTools.length;
        catalog.discoveryError = `${catalog.discoveryError} (using cached tool catalog)`;
      }
    }

    await persistCatalog(catalog);
    return catalog;
  };

  return {
    postman: await discoverOne("postman"),
    stitch: await discoverOne("stitch"),
    playwright: await discoverOne("playwright"),
    android: await discoverOne("android"),
  };
}

export async function callUpstreamTool({
  service,
  name,
  argumentsValue,
  scope = "auto",
}: {
  service: ServiceId;
  name: string;
  argumentsValue: Record<string, unknown>;
  scope?: ConfigScope | "auto";
}): Promise<CallToolResult> {
  const effective = readEffectiveConfig(scope);
  if (!effective) {
    throw new Error("cbx_config.json not found");
  }
  const auth = getServiceAuth(effective.config, service);
  const missingConnection =
    auth.transport === "http"
      ? !auth.mcpUrl
      : !(auth.command && auth.command.trim());
  if (!auth.configured || missingConnection) {
    throw new Error(auth.error || `${service} is not configured`);
  }
  if (auth.error) {
    throw new Error(auth.error);
  }

  return withUpstreamClient({
    transport: auth.transport,
    url: auth.mcpUrl,
    headers: auth.headers,
    command: auth.command,
    args: auth.args,
    env: auth.env,
    cwd: auth.cwd,
    fn: async (client): Promise<CallToolResult> => {
      const effectiveArguments =
        service === "stitch"
          ? applyStitchDefaultArguments(name, argumentsValue)
          : argumentsValue;
      const requestOptions = getUpstreamRequestOptions(service, name);
      const projectId =
        service === "stitch" && typeof effectiveArguments.projectId === "string"
          ? effectiveArguments.projectId.trim()
          : "";
      const shouldRecoverAfterTimeout =
        service === "stitch" &&
        STITCH_TIMEOUT_RECOVERY_TOOLS.has(name) &&
        projectId.length > 0;
      if (
        service === "stitch" &&
        name === "create_project" &&
        typeof effectiveArguments.title === "string"
      ) {
        const existingProject = findMatchingStitchProject(
          await listStitchProjects(client),
          effectiveArguments.title,
        );
        if (existingProject) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    ...existingProject,
                    reusedExistingProject: true,
                    message:
                      "Reused an existing Stitch project with the same title instead of creating a duplicate.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      }
      const beforeScreens =
        shouldRecoverAfterTimeout && projectId
          ? await listStitchScreens(client, projectId)
          : [];

      try {
        return normalizeUpstreamToolResult(
          await client.callTool(
            {
              name,
              arguments: effectiveArguments,
            },
            undefined,
            requestOptions,
          ),
        );
      } catch (error) {
        if (
          shouldRecoverAfterTimeout &&
          projectId &&
          isTimeoutError(error)
        ) {
          const knownNames = new Set(
            beforeScreens.map((screen) => screen.name).filter(Boolean),
          );
          const afterScreens = await listStitchScreens(client, projectId);
          const recoveredScreens = afterScreens.filter(
            (screen) => screen.name && !knownNames.has(screen.name),
          );
          if (recoveredScreens.length > 0) {
            return buildStitchTimeoutRecoveryResult({
              toolName: name,
              projectId,
              screens: recoveredScreens,
            });
          }
        }
        throw error;
      }
    },
  });
}

export {
  applyStitchDefaultArguments,
  findMatchingStitchProject,
  getUpstreamRequestOptions,
  isStitchLongRunningTool,
  resolveStitchToken,
};
