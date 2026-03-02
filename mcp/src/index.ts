#!/usr/bin/env node
/**
 * Cubis Foundry MCP Server – entry point.
 *
 * Usage:
 *   cubis-mcp                          # stdio (default)
 *   cubis-mcp --transport stdio        # explicit stdio
 *   cubis-mcp --transport http         # Streamable HTTP
 *   cubis-mcp --scan-only              # scan vault and exit
 */

import { loadServerConfig } from "./config/index.js";
import { scanVaultRoots } from "./vault/scanner.js";
import { buildManifest, enrichWithDescriptions } from "./vault/manifest.js";
import { createServer } from "./server.js";
import { createStdioTransport } from "./transports/stdio.js";
import { createStreamableHttpTransport } from "./transports/streamableHttp.js";
import { logger, setLogLevel } from "./utils/logger.js";
import { readEffectiveConfig, redactConfig } from "./cbxConfig/index.js";
import { urlToMode } from "./tools/postmanModes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Arg parsing ─────────────────────────────────────────────

function parseArgs(argv: string[]): {
  transport: "stdio" | "http";
  scanOnly: boolean;
  debug: boolean;
  configPath?: string;
} {
  let transport: "stdio" | "http" = "stdio";
  let scanOnly = false;
  let debug = false;
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
    } else if (arg === "--scan-only") {
      scanOnly = true;
    } else if (arg === "--debug") {
      debug = true;
    } else if (arg === "--config" && argv[i + 1]) {
      configPath = argv[++i];
    }
  }

  return { transport, scanOnly, debug, configPath };
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

function printConfigStatus(): void {
  try {
    const effective = readEffectiveConfig("auto");
    if (!effective) {
      logger.warn(
        "cbx_config.json not found. Postman/Stitch tools will return config-not-found errors.",
      );
      return;
    }

    const config = effective.config;

    // Postman status
    const postmanUrl = config.postman?.mcpUrl;
    if (postmanUrl) {
      const mode = urlToMode(postmanUrl) ?? "unknown";
      logger.info(`Postman mode: ${mode} (${postmanUrl})`);
    } else {
      logger.info("Postman: not configured");
    }

    // Stitch status
    const stitchProfile = config.stitch?.activeProfileName;
    if (stitchProfile && config.stitch?.profiles?.[stitchProfile]) {
      const url = config.stitch.profiles[stitchProfile].url ?? "(no URL)";
      logger.info(`Stitch profile: ${stitchProfile} (${url})`);
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

  // Resolve vault roots relative to the mcp package root
  const basePath = __dirname.endsWith("dist")
    ? path.resolve(__dirname, "..")
    : path.resolve(__dirname, "../..");
  const skills = await scanVaultRoots(serverConfig.vault.roots, basePath);
  const manifest = buildManifest(skills);

  // Enrich with descriptions for faster browse/search at runtime
  await enrichWithDescriptions(
    manifest.skills,
    serverConfig.vault.summaryMaxLength,
  );

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
  const transportName =
    args.transport === "http"
      ? `Streamable HTTP :${serverConfig.transport.http?.port ?? 3100}`
      : "stdio";
  printStartupBanner(
    manifest.skills.length,
    manifest.categories.length,
    transportName,
  );
  printConfigStatus();

  // Create MCP server
  const mcpServer = createServer({ config: serverConfig, manifest });

  // Connect transport
  if (args.transport === "http") {
    const httpOpts = {
      port: serverConfig.transport.http?.port ?? 3100,
      host: serverConfig.transport.http?.host ?? "127.0.0.1",
    };
    const { transport, httpServer } = createStreamableHttpTransport(httpOpts);
    await mcpServer.connect(transport);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down HTTP transport...");
      httpServer.close();
      await mcpServer.close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
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
