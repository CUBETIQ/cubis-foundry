/**
 * Cubis Foundry MCP Server – Postman mode mapping.
 *
 * Maps friendly mode names to Postman MCP URLs and back.
 */

export const POSTMAN_MODES = {
  minimal: "https://mcp.postman.com/minimal",
  code: "https://mcp.postman.com/code",
  full: "https://mcp.postman.com/mcp",
} as const;

export type PostmanMode = keyof typeof POSTMAN_MODES;

const URL_TO_MODE = new Map<string, PostmanMode>(
  Object.entries(POSTMAN_MODES).map(([mode, url]) => [
    url,
    mode as PostmanMode,
  ]),
);

export function urlToMode(url: string): PostmanMode | undefined {
  return URL_TO_MODE.get(url);
}

export function isValidMode(mode: string): mode is PostmanMode {
  return mode in POSTMAN_MODES;
}
