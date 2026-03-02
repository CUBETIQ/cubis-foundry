/**
 * Cubis Foundry MCP Server – Streamable HTTP transport adapter.
 *
 * Uses the SDK's StreamableHTTPServerTransport for remote connections.
 * Binds to localhost by default (security: prevents DNS rebinding).
 */

import { createServer, type Server } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { logger } from "../utils/logger.js";

export interface HttpTransportOptions {
  port: number;
  host: string;
}

export function createStreamableHttpTransport(options: HttpTransportOptions): {
  transport: StreamableHTTPServerTransport;
  httpServer: Server;
} {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  const httpServer = createServer(async (req, res) => {
    // Only handle the /mcp endpoint
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    await transport.handleRequest(req, res);
  });

  httpServer.listen(options.port, options.host, () => {
    logger.info(
      `Streamable HTTP transport listening on http://${options.host}:${options.port}/mcp`,
    );
  });

  return { transport, httpServer };
}
