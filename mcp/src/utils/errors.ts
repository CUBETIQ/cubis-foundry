/**
 * Cubis Foundry MCP Server – error utilities.
 *
 * Provides structured MCP-compatible error helpers.
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/** Throw when a tool receives invalid input that passes Zod but fails domain validation. */
export function invalidInput(message: string): never {
  throw new McpError(ErrorCode.InvalidParams, message);
}

/** Throw when a required config file is missing. */
export function configNotFound(): never {
  throw new McpError(
    ErrorCode.InternalError,
    "cbx_config.json not found. Run cbx workflows config --scope global --show to diagnose.",
  );
}

/** Throw for unknown Postman mode URL found in config. */
export function unknownPostmanMode(url: string): never {
  throw new McpError(
    ErrorCode.InvalidParams,
    `Unknown Postman MCP URL in config: "${url}". Expected one of: https://mcp.postman.com/minimal, https://mcp.postman.com/code, https://mcp.postman.com/mcp`,
  );
}

/** Throw when a vault skill or category is not found. */
export function notFound(entity: string, id: string): never {
  throw new McpError(ErrorCode.InvalidParams, `${entity} not found: "${id}"`);
}

/** Throw for any internal server error with a message. */
export function internalError(message: string): never {
  throw new McpError(ErrorCode.InternalError, message);
}
