#!/usr/bin/env node

import process from "node:process";
import { buildCliProgram } from "../dist/cli/core.js";

const failures = [];

const program = buildCliProgram();

function assertIncludes(output, needle, label) {
  if (!output.includes(needle)) {
    failures.push(`${label}: missing "${needle}"`);
  }
}

function assertExcludes(output, needle, label) {
  if (output.includes(needle)) {
    failures.push(`${label}: unexpected "${needle}"`);
  }
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function findCommand(command, name) {
  const match = command.commands.find((item) => item.name() === name);
  if (!match) {
    failures.push(`command lookup: missing "${name}"`);
    return null;
  }
  return match;
}

const rootHelp = program.helpInformation().replace(/\r\n/g, "\n");
const normalizedRootHelp = normalizeWhitespace(rootHelp);
assertIncludes(
  normalizedRootHelp,
  "Cubis Foundry CLI for workflow-first AI agent environments",
  "root help",
);
assertIncludes(normalizedRootHelp, "init", "root help");
assertIncludes(normalizedRootHelp, "workflows", "root help");
assertIncludes(normalizedRootHelp, "build", "root help");

const workflowsCommand = findCommand(program, "workflows");
const workflowsHelp = workflowsCommand
  ? workflowsCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedWorkflowsHelp = normalizeWhitespace(workflowsHelp);
assertIncludes(
  normalizedWorkflowsHelp,
  "Install and manage workflow bundles for Antigravity, Codex, Copilot, Claude, and Gemini CLI",
  "workflows help",
);

const installCommand = workflowsCommand
  ? findCommand(workflowsCommand, "install")
  : null;
const installHelp = installCommand
  ? installCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedInstallHelp = normalizeWhitespace(installHelp);
assertIncludes(
  normalizedInstallHelp,
  "install scope: project (global is accepted but coerced to project)",
  "workflows install help",
);
assertIncludes(
  normalizedInstallHelp,
  "--playwright",
  "workflows install help",
);
assertIncludes(
  normalizedInstallHelp,
  "--android",
  "workflows install help",
);
assertIncludes(
  normalizedInstallHelp,
  'skill install profile: core|web-backend|full (default: "full")',
  "workflows install help",
);
assertExcludes(
  normalizedInstallHelp,
  "skill install profile: core|web-backend|full (default: full)",
  "workflows install help",
);

const initCommand = findCommand(program, "init");
const initHelp = initCommand
  ? initCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedInitHelp = normalizeWhitespace(initHelp);
assertIncludes(
  normalizedInitHelp,
  "--mcps <items>",
  "init help",
);
assertIncludes(
  normalizedInitHelp,
  "cubis-foundry,postman,stitch,playwright,android",
  "init help",
);
assertIncludes(
  normalizedInitHelp,
  "--mcp-runtime <runtime>",
  "init help",
);

const buildCommand = findCommand(program, "build");
const buildHelp = buildCommand
  ? buildCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedBuildHelp = normalizeWhitespace(buildHelp);
assertIncludes(
  normalizedBuildHelp,
  "strict platform-native build helpers",
  "build help",
);
const architectureCommand = buildCommand
  ? findCommand(buildCommand, "architecture")
  : null;
const architectureHelp = architectureCommand
  ? architectureCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedArchitectureHelp = normalizeWhitespace(architectureHelp);
assertIncludes(
  normalizedArchitectureHelp,
  "--platform <platform>",
  "build architecture help",
);
assertIncludes(
  normalizedArchitectureHelp,
  "codex|claude|gemini|copilot",
  "build architecture help",
);
assertIncludes(
  normalizedArchitectureHelp,
  "--research <mode>",
  "build architecture help",
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log("CLI help validation passed.");
