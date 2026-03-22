import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parseToolText, normalizeToolName } from "./qa-common.mjs";

function createClient(name) {
  return new Client(
    {
      name,
      version: "0.1.0",
    },
    {
      capabilities: {},
    },
  );
}

export async function connectHttpClient({ name, mcpUrl, headers = {} }) {
  const client = createClient(name);
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: { headers },
  });
  await client.connect(transport);
  return client;
}

export async function connectStdioClient({
  name,
  command,
  args = [],
  env = {},
  cwd = process.cwd(),
}) {
  const client = createClient(name);
  const transport = new StdioClientTransport({
    command,
    args,
    env,
    cwd,
    stderr: "pipe",
  });
  await client.connect(transport);
  return client;
}

export async function listToolNames(client) {
  const listed = await client.listTools();
  return Array.isArray(listed.tools)
    ? listed.tools.map((tool) => tool.name)
    : [];
}

export function resolveToolName(availableTools, candidates) {
  const normalizedMap = new Map(
    availableTools.map((name) => [normalizeToolName(name), name]),
  );
  for (const candidate of candidates) {
    const exact = normalizedMap.get(normalizeToolName(candidate));
    if (exact) return exact;
  }
  return null;
}

export async function callToolParsed(client, name, args = {}) {
  const result = await client.callTool({
    name,
    arguments: args,
  });
  return {
    raw: result,
    parsed: parseToolText(result),
  };
}
