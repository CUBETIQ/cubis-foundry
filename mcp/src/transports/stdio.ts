/**
 * Cubis Foundry MCP Server – stdio transport adapter.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export function createStdioTransport(): StdioServerTransport {
  return new StdioServerTransport();
}
