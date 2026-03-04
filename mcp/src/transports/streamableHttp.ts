/**
 * Cubis Foundry MCP Server – Streamable HTTP transport adapter.
 *
 * Multi-session architecture: each initialize handshake creates a new
 * StreamableHTTPServerTransport + McpServer pair. Subsequent requests with
 * the returned `mcp-session-id` header are routed to the correct session.
 * This eliminates the "Server already initialized" error when smoke tests
 * or multiple clients hit the same container without restarting.
 *
 * Idle sessions are cleaned up after SESSION_TTL_MS (30 min default).
 */

import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../utils/logger.js";

/** Default session idle TTL in ms (30 minutes). */
const SESSION_TTL_MS = 30 * 60 * 1000;

/** Cleanup sweep interval in ms (5 minutes). */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export interface HttpTransportOptions {
  port: number;
  host: string;
}

/**
 * Callback invoked to create a new McpServer, register tools, and connect
 * it to the provided transport. Called once per session.
 */
export type McpServerFactory = (
  transport: StreamableHTTPServerTransport,
) => Promise<McpServer>;

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  lastActivity: number;
}

export interface MultiSessionHttpServer {
  httpServer: Server;
  /** Gracefully close all sessions and the HTTP server. */
  closeAll(): Promise<void>;
}

/**
 * Read the raw body from an IncomingMessage so we can inspect it before
 * handing it to the SDK transport.
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

export function createMultiSessionHttpServer(
  options: HttpTransportOptions,
  serverFactory: McpServerFactory,
): MultiSessionHttpServer {
  const sessions = new Map<string, SessionEntry>();

  // ── Periodic cleanup of idle sessions ───────────────────
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > SESSION_TTL_MS) {
        logger.info(
          `Session ${id.slice(0, 8)} expired after idle (active: ${sessions.size - 1})`,
        );
        entry.transport.close().catch(() => {});
        entry.server.close().catch(() => {});
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref(); // Don't prevent process exit

  // ── HTTP request handler ────────────────────────────────
  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      if (url.pathname !== "/mcp") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      // DELETE = session termination (per MCP spec)
      if (req.method === "DELETE") {
        const sid = req.headers["mcp-session-id"] as string | undefined;
        if (sid && sessions.has(sid)) {
          const entry = sessions.get(sid)!;
          await entry.transport.close().catch(() => {});
          await entry.server.close().catch(() => {});
          sessions.delete(sid);
          logger.info(
            `Session ${sid.slice(0, 8)} terminated (active: ${sessions.size})`,
          );
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Session closed");
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Session not found");
        }
        return;
      }

      // GET = SSE stream for an existing session
      if (req.method === "GET") {
        const sid = req.headers["mcp-session-id"] as string | undefined;
        if (sid && sessions.has(sid)) {
          const entry = sessions.get(sid)!;
          entry.lastActivity = Date.now();
          await entry.transport.handleRequest(req, res);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing or invalid mcp-session-id");
        }
        return;
      }

      // POST = either initialize (new session) or call (existing session)
      if (req.method === "POST") {
        const sid = req.headers["mcp-session-id"] as string | undefined;

        // Existing session — route to its transport
        if (sid && sessions.has(sid)) {
          const entry = sessions.get(sid)!;
          entry.lastActivity = Date.now();
          await entry.transport.handleRequest(req, res);
          return;
        }

        // Peek at the body to determine if this is an initialize request
        const rawBody = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawBody);
        } catch {
          logger.warn(`Bad JSON in POST from ${req.socket.remoteAddress}`);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32700, message: "Parse error" },
              id: null,
            }),
          );
          return;
        }

        const isInit =
          parsed &&
          typeof parsed === "object" &&
          "method" in parsed &&
          (parsed as Record<string, unknown>).method === "initialize";

        if (!isInit) {
          // Non-init request without valid session
          logger.warn(
            `POST without session: method=${(parsed as Record<string, unknown>)?.method ?? "unknown"}`,
          );
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: missing or unknown mcp-session-id",
              },
              id: (parsed as Record<string, unknown>)?.id ?? null,
            }),
          );
          return;
        }

        // ── New session: create transport + server ──────────
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });

        try {
          const server = await serverFactory(transport);

          // Re-inject the pre-read body so the transport can process it.
          // The SDK's StreamableHTTPServerTransport accepts a parsedBody
          // parameter to avoid re-reading the stream.
          await transport.handleRequest(req, res, parsed);

          // After handleRequest, the transport.sessionId is set by the SDK.
          const sessionId = transport.sessionId;
          if (sessionId) {
            sessions.set(sessionId, {
              transport,
              server,
              lastActivity: Date.now(),
            });
            logger.info(
              `New session ${sessionId.slice(0, 8)} (active: ${sessions.size})`,
            );
          }
        } catch (error) {
          logger.error(`Failed to create MCP session: ${error}`);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message: "Internal error creating session",
                },
                id: (parsed as Record<string, unknown>)?.id ?? null,
              }),
            );
          }
        }
        return;
      }

      // Unsupported method
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    },
  );

  httpServer.listen(options.port, options.host, () => {
    logger.info(
      `Streamable HTTP transport listening on http://${options.host}:${options.port}/mcp (multi-session)`,
    );
  });

  async function closeAll(): Promise<void> {
    clearInterval(cleanupTimer);
    for (const [id, entry] of sessions) {
      await entry.transport.close().catch(() => {});
      await entry.server.close().catch(() => {});
      sessions.delete(id);
      logger.debug(`Closed session ${id} during shutdown`);
    }
    httpServer.close();
  }

  return { httpServer, closeAll };
}

// ── Legacy single-session export (kept for backward compat) ──

/** @deprecated Use createMultiSessionHttpServer instead. */
export function createStreamableHttpTransport(options: HttpTransportOptions): {
  transport: StreamableHTTPServerTransport;
  httpServer: Server;
} {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  const httpServer = createServer(async (req, res) => {
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
