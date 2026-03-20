import type { Command } from "commander";
import type { WorkflowAction, WorkflowTargetAction } from "../types.js";

export interface McpCommandDeps {
  runMcpServe: WorkflowAction;
  runMcpToolsSync: WorkflowAction;
  runMcpToolsList: WorkflowAction;
  runMcpRuntimeStatus: WorkflowAction;
  runMcpRuntimeUp: WorkflowAction;
  runMcpRuntimeDown: WorkflowAction;
  defaultMcpDockerContainerName: string;
  runMcpStatus: WorkflowAction;
  runMcpTest: WorkflowTargetAction;
  runMcpProxy: WorkflowAction;
}

export function registerMcpCommands(program: Command, deps: McpCommandDeps) {
  const mcpCommand = program
    .command("mcp")
    .description("Manage Cubis MCP runtime catalogs and tool discovery");

  mcpCommand
    .command("status")
    .description("Show unified MCP health and configured runtime defaults")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option(
      "--name <name>",
      "container name",
      deps.defaultMcpDockerContainerName,
    )
    .option(
      "--skills-root <path>",
      "host skills directory to resolve/mount (default: auto-detect)",
    )
    .action(deps.runMcpStatus);

  mcpCommand
    .command("test <tool>")
    .description("Inspect local MCP catalogs for a tool and its configuration source")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .action(deps.runMcpTest);

  mcpCommand
    .command("proxy")
    .description("Run the Cubis MCP gateway in HTTP proxy mode")
    .option("--port <port>", "HTTP port override", "3100")
    .option("--host <host>", "HTTP host override", "127.0.0.1")
    .option("--config <path>", "explicit MCP server config file path")
    .option("--debug", "enable debug logging in MCP proxy")
    .action(deps.runMcpProxy);

  mcpCommand
    .command("serve")
    .description(
      "Launch bundled Cubis Foundry MCP server (canonical local entrypoint)",
    )
    .option("--transport <transport>", "stdio|http", "stdio")
    .option("--scope <scope>", "auto|global|project", "auto")
    .option("--port <port>", "HTTP port override")
    .option("--host <host>", "HTTP host override")
    .option("--scan-only", "scan vault and exit")
    .option("--config <path>", "explicit MCP server config file path")
    .option("--debug", "enable debug logging in MCP server")
    .action(deps.runMcpServe);

  const mcpToolsCommand = mcpCommand
    .command("tools")
    .description("Discover and inspect upstream MCP tool catalogs");

  mcpToolsCommand
    .command("sync")
    .description("Discover upstream tools and persist local non-secret catalogs")
    .option("--service <service>", "postman|stitch|all", "all")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--dry-run", "preview sync without writing catalog files")
    .action(deps.runMcpToolsSync);

  mcpToolsCommand
    .command("list")
    .description("List cached tool names from local MCP catalog")
    .requiredOption("--service <service>", "postman|stitch")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .action(deps.runMcpToolsList);

  const mcpRuntimeCommand = mcpCommand
    .command("runtime")
    .description("Manage local Docker runtime container for Cubis MCP gateway");

  mcpRuntimeCommand
    .command("status")
    .description("Show Docker runtime status and configured MCP runtime defaults")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option(
      "--name <name>",
      "container name",
      deps.defaultMcpDockerContainerName,
    )
    .option(
      "--skills-root <path>",
      "host skills directory to resolve/mount (default: auto-detect)",
    )
    .action(deps.runMcpRuntimeStatus);

  mcpRuntimeCommand
    .command("up")
    .description("Start Docker runtime container for Cubis MCP gateway")
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option(
      "--name <name>",
      "container name",
      deps.defaultMcpDockerContainerName,
    )
    .option("--image <image:tag>", "docker image to run")
    .option("--update-policy <policy>", "pinned|latest")
    .option(
      "--fallback <fallback>",
      "when endpoint is unreachable: local|fail|skip",
    )
    .option(
      "--build-local",
      "build MCP Docker image from local package mcp/ directory instead of pulling",
    )
    .option("--port <port>", "host port to map to container :3100")
    .option(
      "--skills-root <path>",
      "host skills directory to mount into /workflows/skills (default: auto-detect)",
    )
    .option("--replace", "remove existing container with same name before start")
    .action(deps.runMcpRuntimeUp);

  mcpRuntimeCommand
    .command("down")
    .description("Stop and remove Docker runtime container")
    .option(
      "--name <name>",
      "container name",
      deps.defaultMcpDockerContainerName,
    )
    .action(deps.runMcpRuntimeDown);

  mcpRuntimeCommand.action(() => {
    mcpRuntimeCommand.help();
  });

  mcpCommand.action(() => {
    mcpCommand.help();
  });
}
