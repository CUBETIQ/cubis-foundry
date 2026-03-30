#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";

const ROOT = process.cwd();
const MODULES_ROOT = path.join(ROOT, "foundry", "modules");
const AGENTS_ROOT = path.join(MODULES_ROOT, "agents-core", "agents");
const WORKFLOWS_ROOT = path.join(MODULES_ROOT, "workflows");
const STEERING_FILES = [
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "STEERING.md",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "overrides",
    "codex.md",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "overrides",
    "claude.md",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "overrides",
    "copilot.md",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "overrides",
    "gemini.md",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "shared",
    "rules",
    "overrides",
    "antigravity.md",
  ),
];

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function stripQuotes(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function unique(values) {
  return [...new Set(values)];
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length),
  };
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(
    new RegExp(`^\\s*${escapeRegex(key)}\\s*:\\s*(.+)$`, "m"),
  );
  return match ? stripQuotes(match[1]) : null;
}

function parseInlineArray(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((item) => stripQuotes(item.replace(/\[|\]/g, "").trim()))
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function getArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(
    new RegExp(`${escapeRegex(key)}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"),
  );
  if (bracketMatch) return unique(parseInlineArray(bracketMatch[1]));

  const blockMatch = frontmatter.match(
    new RegExp(
      `^\\s*${escapeRegex(key)}\\s*:\\s*\\n((?:\\s*[-*]\\s*.+(?:\\n|$))+)`,
      "m",
    ),
  );
  if (blockMatch) {
    return unique(
      blockMatch[1]
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
        .map((item) => stripQuotes(item))
        .filter(Boolean),
    );
  }

  const singleLine = frontmatter.match(
    new RegExp(`^\\s*${escapeRegex(key)}\\s*:\\s*(.+)$`, "m"),
  );
  return singleLine ? unique(parseInlineArray(singleLine[1])) : [];
}

function error(errors, filePath, message) {
  errors.push(`- ${filePath}: ${message}`);
}

async function listCanonicalSkillIds() {
  const entries = await fs.readdir(MODULES_ROOT, { withFileTypes: true });
  const ids = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillFile = path.join(MODULES_ROOT, entry.name, "SKILL.md");
    if (await pathExists(skillFile)) ids.push(entry.name);
  }
  return new Set(ids);
}

async function main() {
  const errors = [];
  const skillIds = await listCanonicalSkillIds();
  const agentEntries = await fs.readdir(AGENTS_ROOT, { withFileTypes: true });
  const workflowEntries = await fs.readdir(WORKFLOWS_ROOT, { withFileTypes: true });
  const validAgents = new Set(
    agentEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.basename(entry.name, ".md")),
  );

  for (const filePath of STEERING_FILES) {
    if (!(await pathExists(filePath))) {
      error(errors, filePath, "required steering file is missing");
      continue;
    }
    const content = await fs.readFile(filePath, "utf8");
    const requiresRouteResolve = filePath.endsWith(path.join("rules", "STEERING.md"));
    if (requiresRouteResolve && !content.includes("route_resolve")) {
      error(errors, filePath, "missing route_resolve guidance");
    }
  }

  for (const entry of agentEntries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const filePath = path.join(AGENTS_ROOT, entry.name);
    const parsed = parseFrontmatter(await fs.readFile(filePath, "utf8"));
    if (!parsed) {
      error(errors, filePath, "missing frontmatter");
      continue;
    }
    if (!getScalar(parsed.raw, "name")) error(errors, filePath, "missing name");
    if (!getScalar(parsed.raw, "description")) {
      error(errors, filePath, "missing description");
    }

    for (const skillId of getArray(parsed.raw, "skills")) {
      if (!skillIds.has(skillId)) {
        error(errors, filePath, `declares unknown skill '${skillId}'`);
      }
    }
  }

  for (const entry of workflowEntries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(WORKFLOWS_ROOT, entry.name, "workflow.md");
    if (!(await pathExists(filePath))) continue;
    const parsed = parseFrontmatter(await fs.readFile(filePath, "utf8"));
    if (!parsed) {
      error(errors, filePath, "missing frontmatter");
      continue;
    }

    if (!getScalar(parsed.raw, "command")) error(errors, filePath, "missing command");
    if (!getScalar(parsed.raw, "description")) {
      error(errors, filePath, "missing description");
    }

    const agentChain = getArray(parsed.raw, "agentChain");
    if (agentChain.length === 0) {
      error(errors, filePath, "missing agentChain");
    }
    for (const agentId of agentChain) {
      if (!validAgents.has(agentId)) {
        error(errors, filePath, `references unknown agent '${agentId}'`);
      }
    }

    for (const skillId of [
      ...getArray(parsed.raw, "primarySkills"),
      ...getArray(parsed.raw, "supportingSkills"),
    ]) {
      if (!skillIds.has(skillId)) {
        error(errors, filePath, `references unknown skill '${skillId}'`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Shared routing validation failed:");
    for (const entry of errors) console.error(entry);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        agents: validAgents.size,
        workflows: workflowEntries.filter((entry) => entry.isDirectory()).length,
        skills: skillIds.size,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

await main();
