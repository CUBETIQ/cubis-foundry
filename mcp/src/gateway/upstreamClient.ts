/**
 * Cubis Foundry MCP Server – upstream MCP client abstraction.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { UpstreamTool } from "./types.js";

export interface UpstreamCallResult {
  content: Array<Record<string, unknown>>;
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

export interface ConnectedUpstreamClient {
  listTools(): Promise<UpstreamTool[]>;
  callTool(toolName: string, args: Record<string, unknown>): Promise<UpstreamCallResult>;
  close(): Promise<void>;
}

export interface UpstreamClientConnectParams {
  mcpUrl: string;
  headers: Record<string, string>;
}

export interface UpstreamClientFactory {
  connect(params: UpstreamClientConnectParams): Promise<ConnectedUpstreamClient>;
}

function toObjectSchema(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

export class SdkUpstreamClientFactory implements UpstreamClientFactory {
  async connect(
    params: UpstreamClientConnectParams,
  ): Promise<ConnectedUpstreamClient> {
    const client = new Client(
      {
        name: "cubis-foundry-mcp-gateway",
        version: "0.1.0",
      },
      { capabilities: {} },
    );

    const transport = new StreamableHTTPClientTransport(new URL(params.mcpUrl), {
      requestInit: {
        headers: params.headers,
      },
    });

    await client.connect(transport);

    return {
      async listTools(): Promise<UpstreamTool[]> {
        const listed = await client.listTools();
        return listed.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: toObjectSchema(tool.inputSchema),
        }));
      },
      async callTool(
        toolName: string,
        args: Record<string, unknown>,
      ): Promise<UpstreamCallResult> {
        return (await client.callTool({
          name: toolName,
          arguments: args,
        })) as UpstreamCallResult;
      },
      async close(): Promise<void> {
        await client.close();
      },
    };
  }
}
