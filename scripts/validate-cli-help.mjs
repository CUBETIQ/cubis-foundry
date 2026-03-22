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
assertIncludes(normalizedRootHelp, "mobile", "root help");
assertIncludes(normalizedRootHelp, "web", "root help");
assertIncludes(normalizedRootHelp, "web", "root help");

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

const mobileCommand = findCommand(program, "mobile");
const mobileHelp = mobileCommand
  ? mobileCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedMobileHelp = normalizeWhitespace(mobileHelp);
assertIncludes(
  normalizedMobileHelp,
  "first-class mobile QA workflows",
  "mobile help",
);
const mobileQaCommand = mobileCommand
  ? findCommand(mobileCommand, "qa")
  : null;
const mobileQaRunCommand = mobileQaCommand
  ? findCommand(mobileQaCommand, "run")
  : null;
const mobileQaRunHelp = mobileQaRunCommand
  ? mobileQaRunCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedMobileQaRunHelp = normalizeWhitespace(mobileQaRunHelp);
assertIncludes(
  normalizedMobileQaRunHelp,
  "--allow-adb-fallback",
  "mobile qa run help",
);
assertIncludes(
  normalizedMobileQaRunHelp,
  "--charter <path>",
  "mobile qa run help",
);

const webCommand = findCommand(program, "web");
const webHelp = webCommand
  ? webCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedWebHelp = normalizeWhitespace(webHelp);
assertIncludes(
  normalizedWebHelp,
  "first-class web QA workflows",
  "web help",
);
const webQaCommand = webCommand
  ? findCommand(webCommand, "qa")
  : null;
const webQaRunCommand = webQaCommand
  ? findCommand(webQaCommand, "run")
  : null;
const webQaRunHelp = webQaRunCommand
  ? webQaRunCommand.helpInformation().replace(/\r\n/g, "\n")
  : "";
const normalizedWebQaRunHelp = normalizeWhitespace(webQaRunHelp);
assertIncludes(
  normalizedWebQaRunHelp,
  "--charter <path>",
  "web qa run help",
);
assertIncludes(
  normalizedWebQaRunHelp,
  "artifacts/web-qa",
  "web qa run help",
);
if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log("CLI help validation passed.");


