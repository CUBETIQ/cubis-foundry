/**
 * Cubis Foundry MCP Server – config schema (Zod v4 via zod/v4 import path).
 *
 * Validates the server's own config.json. Rejects credential fields.
 */

import { z } from "zod";

export const ServerConfigSchema = z.object({
  server: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  vault: z.object({
    roots: z.array(z.string()).min(1),
    summaryMaxLength: z.number().int().positive().default(200),
  }),
  transport: z.object({
    default: z.enum(["stdio", "streamable-http"]).default("stdio"),
    http: z
      .object({
        port: z.number().int().positive().default(3100),
        host: z.string().default("127.0.0.1"),
      })
      .optional(),
  }),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Keys that must NEVER appear in the server config (security gate).
 * These belong in cbx_config.json, not here.
 */
const FORBIDDEN_KEYS = [
  "apiKey",
  "api_key",
  "secret",
  "token",
  "password",
  "credential",
];

export function rejectCredentialFields(raw: Record<string, unknown>): void {
  const json = JSON.stringify(raw);
  for (const key of FORBIDDEN_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(
        `Server config.json must not contain credential field "${key}". ` +
          `Store credentials in cbx_config.json instead.`,
      );
    }
  }
}
