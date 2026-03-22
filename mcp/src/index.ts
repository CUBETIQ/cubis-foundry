#!/usr/bin/env node
/**
 * Cubis Foundry MCP Server – entry point.
 *
 * Usage:
 *   cubis-mcp                          # stdio (default)
 *   cubis-mcp --transport stdio        # explicit stdio
 *   cubis-mcp --transport http         # Streamable HTTP
 *   cubis-mcp --scope global           # default config scope for built-in config tools
 *   cubis-mcp --host 0.0.0.0 --port 3100
 *   cubis-mcp --scan-only              # scan vault and exit
 */

import { loadServerConfig } from "./config/index.js";
import { loadGeneratedRouteManifest } from "./routes/loadGeneratedRouteManifest.js";
import { scanVaultRoots } from "./vault/scanner.js";
import { buildManifest } from "./vault/manifest.js";
import { assertBuildFreshness } from "./runtime/buildFreshness.js";
import {
  loadGeneratedSkillManifest,
  mergeGeneratedSkillMetadata,
} from "./vault/generatedManifest.js";
import { createServer } from "./server.js";
import { createStdioTransport } from "./transports/stdio.js";
import {
  createMultiSessionHttpServer,
  type McpServerFactory,
} from "./transports/streamableHttp.js";
import { logger, setLogLevel } from "./utils/logger.js";
import {
  parsePostmanState,
  parseStitchState,
  readEffectiveConfig,
} from "./cbxConfig/index.js";
import { urlToMode } from "./tools/postmanModes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Arg parsing ─────────────────────────────────────────────

function parseArgs(argv: string[]): {
  transport: "stdio" | "http";
  scope: "auto" | "global" | "project";
  scanOnly: boolean;
  debug: boolean;
  port?: number;
  host?: string;
  configPath?: string;
} {
  let transport: "stdio" | "http" = "stdio";
  let scope: "auto" | "global" | "project" = "auto";
  let scanOnly = false;
  let debug = false;
  let port: number | undefined;
  let host: string | undefined;
  let configPath: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--transport" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "http" || val === "streamable-http") {
        transport = "http";
      } else if (val === "stdio") {
        transport = "stdio";
      } else {
        logger.error(`Unknown transport: ${val}. Use "stdio" or "http".`);
        process.exit(1);
      }
    } else if (arg === "--scope" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "auto" || val === "global" || val === "project") {
        scope = val;
      } else {
        logger.error(
          `Unknown scope: ${val}. Use "auto", "global", or "project".`,
        );
        process.exit(1);
      }
    } else if (arg === "--port" && argv[i + 1]) {
      const val = Number.parseInt(argv[++i], 10);
      if (!Number.isInteger(val) || val <= 0 || val > 65535) {
        logger.error(
          `Invalid port: ${argv[i]}. Use an integer from 1 to 65535.`,
        );
        process.exit(1);
      }
      port = val;
    } else if (arg === "--host" && argv[i + 1]) {
      host = argv[++i];
    } else if (arg === "--scan-only") {
      scanOnly = true;
    } else if (arg === "--debug") {
      debug = true;
    } else if (arg === "--config" && argv[i + 1]) {
      configPath = argv[++i];
    }
  }

  return { transport, scope, scanOnly, debug, port, host, configPath };
}

// ─── Startup banner ──────────────────────────────────────────

function printStartupBanner(
  skillCount: number,
  categoryCount: number,
  transportName: string,
): void {
  logger.raw("┌──────────────────────────────────────────────┐");
  logger.raw("│  Cubis Foundry MCP Server                    │");
  logger.raw("├──────────────────────────────────────────────┤");
  logger.raw(`│  Vault: 2004/35/~245/~80,160/99.7%           │`);
  logger.raw(`│  Skills loaded: ${String(skillCount).padEnd(29)}│`);
  logger.raw(`│  Categories: ${String(categoryCount).padEnd(32)}│`);
  logger.raw(`│  Transport: ${transportName.padEnd(33)}│`);
  logger.raw("└──────────────────────────────────────────────┘");
}

function printConfigStatus(scope: "auto" | "global" | "project"): void {
  try {
    const effective = readEffectiveConfig(scope);
    if (!effective) {
      logger.warn(
        "cbx_config.json not found. Postman/Stitch tools will return config-not-found errors.",
      );
      return;
    }

    const config = effective.config;

    // Postman status
    const postmanState = parsePostmanState(config);
    const postmanUrl = postmanState.mcpUrl;
    if (postmanUrl) {
      const mode = urlToMode(postmanUrl) ?? "unknown";
      logger.info(`Postman mode: ${mode} (${postmanUrl})`);
    } else {
      logger.info("Postman: not configured");
    }

    // Stitch status
    const stitchState = parseStitchState(config);
    const stitchProfile = stitchState.activeProfileName;
    const stitchUrl =
      stitchState.mcpUrl ??
      stitchState.activeProfile?.url;
    if (stitchProfile && stitchUrl) {
      logger.info(`Stitch profile: ${stitchProfile} (${stitchUrl})`);
    } else if (stitchUrl) {
      logger.info(`Stitch: configured (${stitchUrl})`);
    } else {
      logger.info("Stitch: not configured");
    }

    logger.info(`Config scope: ${effective.scope} (${effective.path})`);
  } catch {
    logger.warn("Failed to read cbx_config.json status");
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.debug) {
    setLogLevel("debug");
  }

  // Load server config
  const serverConfig = loadServerConfig(args.configPath);

  // Resolve vault roots relative to the mcp package root.
  // `index.ts` is in `<pkg>/src` during dev and `<pkg>/dist` after build.
  const basePath = path.resolve(__dirname, "..");
  assertBuildFreshness(basePath);
  const scannedSkills = await scanVaultRoots(serverConfig.vault.roots, basePath);
  const generatedSkillManifest = await loadGeneratedSkillManifest(basePath);
  const skills = mergeGeneratedSkillMetadata(
    scannedSkills,
    generatedSkillManifest,
  );
  const charsPerToken = serverConfig.telemetry.charsPerToken;
  const manifest = buildManifest(skills, charsPerToken);
  const routeManifest = await loadGeneratedRouteManifest(basePath);

  // Scan-only mode: print and exit
  if (args.scanOnly) {
    logger.info(
      `Scan complete: ${manifest.skills.length} skills in ${manifest.categories.length} categories`,
    );
    for (const cat of manifest.categories) {
      const count = manifest.skills.filter((s) => s.category === cat).length;
      logger.info(`  ${cat}: ${count} skills`);
    }
    process.exit(0);
  }

  // Print startup banner
  const resolvedHttpPort =
    args.port ?? serverConfig.transport.http?.port ?? 3100;
  const transportName =
    args.transport === "http"
      ? `Streamable HTTP :${resolvedHttpPort}`
      : "stdio";
  printStartupBanner(
    manifest.skills.length,
    manifest.categories.length,
    transportName,
  );
  printConfigStatus(args.scope);

  // Connect transport
  if (args.transport === "http") {
    const httpOpts = {
      port: resolvedHttpPort,
      host: args.host ?? serverConfig.transport.http?.host ?? "127.0.0.1",
    };

    // Multi-session architecture: the factory is called once per initialize
    // handshake. Vault/manifest/config are shared; only McpServer + tools
    // registration is per-session (lightweight).
    const serverFactory: McpServerFactory = async (transport) => {
      const server = await createServer({
        config: serverConfig,
        manifest,
        routeManifest,
        defaultConfigScope: args.scope,
      });
      await server.connect(transport);
      return server;
    };

    const { httpServer, closeAll } = createMultiSessionHttpServer(
      httpOpts,
      serverFactory,
    );

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down HTTP transport...");
      await closeAll();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    // stdio is single-session; create one McpServer directly.
    const mcpServer = await createServer({
      config: serverConfig,
      manifest,
      routeManifest,
      defaultConfigScope: args.scope,
    });
    const transport = createStdioTransport();
    await mcpServer.connect(transport);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down stdio transport...");
      await mcpServer.close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  logger.info("MCP server ready. Waiting for connections...");
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err}`);
  process.exit(1);
});
