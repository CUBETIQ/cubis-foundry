#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { normalizeSkillId } from "./lib/legacy-skill-map.mjs";

const ROOT = process.cwd();
const SHARED_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
  "shared",
);
const SHARED_WORKFLOWS_DIR = path.join(SHARED_ROOT, "workflows");
const SHARED_AGENTS_DIR = path.join(SHARED_ROOT, "agents");
const CANONICAL_SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
const REQUIRED_SHARED_OVERRIDE_FILES = [
  path.join(SHARED_ROOT, "rules", "STEERING.md"),
  path.join(SHARED_ROOT, "rules", "overrides", "codex.md"),
  path.join(SHARED_ROOT, "rules", "overrides", "claude.md"),
  path.join(SHARED_ROOT, "rules", "overrides", "copilot.md"),
  path.join(SHARED_ROOT, "rules", "overrides", "gemini.md"),
  path.join(SHARED_ROOT, "rules", "overrides", "antigravity.md"),
];

const REQUIRED_WORKFLOW_SECTIONS = [
  "When to use",
  "Routing",
  "Skill Routing",
  "Workflow steps",
  "Context notes",
  "Verification",
  "Output Contract",
];

const DISALLOWED_AGENT_PHRASES = [
  "Claude Write tool",
  "Check the PROMPT",
  "workflows/powers/",
];

const DISALLOWED_AGENT_TOOLS = new Set(["ViewCodeItem", "FindByName", "Agent"]);
let canonicalSkillIdsPromise;

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function collectCanonicalSkillIds() {
  const ids = new Set();
  const queue = [CANONICAL_SKILLS_ROOT];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !(await pathExists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile() || entry.name !== "SKILL.md") continue;
      const relativeDir = path.relative(CANONICAL_SKILLS_ROOT, path.dirname(fullPath));
      const parts = relativeDir.split(path.sep).filter(Boolean);
      if (parts.length === 0) continue;
      ids.add(parts[parts.length - 1]);
      if (parts.length >= 3 && parts[1] === "skills") {
        ids.add(`${parts[0]}/${parts.slice(2).join("/")}`);
      } else {
        ids.add(parts.join("/"));
      }
    }
  }
  return ids;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length),
  };
}

function stripQuotes(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseInlineArray(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((item) => stripQuotes(item.replace(/\[|\]/g, "").trim()))
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return stripQuotes(match[1]);
}

function getArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (bracketMatch) {
    return unique(parseInlineArray(bracketMatch[1]));
  }

  const singleLine = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!singleLine) return [];
  return unique(parseInlineArray(singleLine[1]));
}

function hasSection(body, heading) {
  return new RegExp(`^##\\s+${heading}$`, "m").test(body);
}

function extractSection(body, heading) {
  const match = body.match(
    new RegExp(`^##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=^##\\s+|\\Z)`, "m"),
  );
  return match ? match[1].trim() : "";
}

function extractBacktickedItems(text) {
  return unique(
    [...String(text || "").matchAll(/`([^`]+)`/g)]
      .map((match) => match[1].trim())
      .filter(Boolean),
  );
}

function workflowHasStructuredOutput(body) {
  return /^## Output Contract\s*\n```ya?ml[\s\S]*?^```/m.test(body);
}

async function skillRefExists(skillId) {
  if (!skillId || skillId.includes("<") || skillId.endsWith(".md")) return true;
  canonicalSkillIdsPromise ||= collectCanonicalSkillIds();
  const canonicalSkillIds = await canonicalSkillIdsPromise;
  return canonicalSkillIds.has(normalizeSkillId(skillId));
}

function error(errors, filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

async function validateWorkflowFile(filePath, validAgents, errors) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const command = getScalar(parsed.raw, "command");
  const description = getScalar(parsed.raw, "description");
  const triggers = getArray(parsed.raw, "triggers");

  if (!command) error(errors, filePath, "missing frontmatter command");
  if (!description) error(errors, filePath, "missing frontmatter description");
  if (triggers.length === 0) error(errors, filePath, "missing frontmatter triggers");

  for (const section of REQUIRED_WORKFLOW_SECTIONS) {
    if (!hasSection(parsed.body, section)) {
      error(errors, filePath, `missing required section '${section}'`);
    }
  }

  if (!workflowHasStructuredOutput(parsed.body)) {
    error(errors, filePath, "Output Contract must use fenced YAML");
  }

  if (parsed.body.includes("workflows/powers/")) {
    error(errors, filePath, "contains stale workflows/powers reference");
  }

  const routingSection = extractSection(parsed.body, "Routing");
  for (const agentId of unique(
    [...routingSection.matchAll(/@([A-Za-z0-9_-]+)/g)].map((match) => match[1]),
  )) {
    if (!validAgents.has(agentId)) {
      error(errors, filePath, `references unknown agent '${agentId}' in Routing`);
    }
  }

  const skillRoutingSection = extractSection(parsed.body, "Skill Routing");
  for (const skillId of extractBacktickedItems(skillRoutingSection)) {
    if (!(await skillRefExists(skillId))) {
      error(errors, filePath, `references unknown skill '${skillId}' in Skill Routing`);
    }
  }
}

async function validateAgentFile(filePath, errors) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const name = getScalar(parsed.raw, "name");
  const description = getScalar(parsed.raw, "description");
  const skills = getArray(parsed.raw, "skills");
  const tools = getArray(parsed.raw, "tools");

  if (!name) error(errors, filePath, "missing frontmatter name");
  if (!description) error(errors, filePath, "missing frontmatter description");
  if (skills.length === 0) error(errors, filePath, "missing frontmatter skills");
  if (!getScalar(parsed.raw, "model")) {
    error(errors, filePath, "missing frontmatter model");
  }

  if (!hasSection(parsed.body, "Skill Loading Contract")) {
    error(errors, filePath, "missing required section 'Skill Loading Contract'");
  }

  if (!hasSection(parsed.body, "Skill References")) {
    error(errors, filePath, "missing required section 'Skill References'");
  }

  for (const phrase of DISALLOWED_AGENT_PHRASES) {
    if (raw.includes(phrase)) {
      error(errors, filePath, `contains platform-specific or stale phrase '${phrase}'`);
    }
  }

  for (const tool of tools) {
    if (DISALLOWED_AGENT_TOOLS.has(tool)) {
      error(errors, filePath, `uses unsupported shared agent tool '${tool}'`);
    }
  }

  for (const skillId of skills) {
    if (!(await skillRefExists(skillId))) {
      error(errors, filePath, `declares unknown skill '${skillId}'`);
    }
  }
}

async function main() {
  const errors = [];
  for (const filePath of REQUIRED_SHARED_OVERRIDE_FILES) {
    if (!(await pathExists(filePath))) {
      error(errors, filePath, "required shared routing source is missing");
    }
  }
  const workflowFiles = await listMarkdownFiles(SHARED_WORKFLOWS_DIR);
  const agentFiles = await listMarkdownFiles(SHARED_AGENTS_DIR);
  const validAgents = new Set(agentFiles.map((fileName) => path.basename(fileName, ".md")));

  for (const fileName of workflowFiles) {
    await validateWorkflowFile(
      path.join(SHARED_WORKFLOWS_DIR, fileName),
      validAgents,
      errors,
    );
  }

  for (const fileName of agentFiles) {
    await validateAgentFile(path.join(SHARED_AGENTS_DIR, fileName), errors);
  }

  if (errors.length > 0) {
    console.error("Shared routing validation failed:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ Shared routing validation passed (workflows=${workflowFiles.length}, agents=${agentFiles.length})`,
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
