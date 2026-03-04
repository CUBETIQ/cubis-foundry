#!/usr/bin/env node

/**
 * generate-mcp-rules-block.mjs
 *
 * Generates a managed MCP catalog block for injection into rule files
 * (AGENTS.md, GEMINI.md, copilot-instructions.md).
 *
 * Follows the same `<!-- cbx:mcp:auto:start -->` / `<!-- cbx:mcp:auto:end -->`
 * marker pattern used by workflow routing blocks.
 *
 * Can output to stdout (for use in sync-rules) or inject directly into a file.
 *
 * Usage:
 *   node scripts/generate-mcp-rules-block.mjs                    # stdout
 *   node scripts/generate-mcp-rules-block.mjs --inject AGENTS.md  # inject into file
 *   node scripts/generate-mcp-rules-block.mjs --check AGENTS.md   # verify up-to-date
 *
 * Reads from: mcp/generated/mcp-manifest.json (must be generated first)
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_FILE = path.join(ROOT, "mcp", "generated", "mcp-manifest.json");

const BLOCK_START = "<!-- cbx:mcp:auto:start";
const BLOCK_END = "<!-- cbx:mcp:auto:end -->";

// ─── Arg parsing ────────────────────────────────────────────

function parseArgs(argv) {
  let inject = null;
  let check = null;

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--inject" && argv[i + 1]) {
      inject = argv[++i];
    } else if (argv[i] === "--check" && argv[i + 1]) {
      check = argv[++i];
    }
  }

  return { inject, check };
}

// ─── Block builder ──────────────────────────────────────────

function buildMcpBlock(manifest) {
  const lines = [];
  lines.push(`${BLOCK_START} version=1 -->`);
  lines.push("## Cubis Foundry MCP Tool Catalog (auto-managed)");
  lines.push("");
  lines.push(
    "The Foundry MCP server provides progressive-disclosure skill discovery and integration management tools.",
  );
  lines.push("");

  // Skill vault summary
  lines.push("### Skill Vault");
  lines.push("");
  lines.push(
    `- **${manifest.summary.totalSkills}** skills across **${manifest.summary.totalCategories}** categories`,
  );
  lines.push(
    `- Estimated full catalog: ~${manifest.summary.estimatedTokens.toLocaleString()} tokens`,
  );
  lines.push("");

  // Categories
  lines.push("Categories:");
  for (const cat of manifest.categories) {
    lines.push(`- \`${cat.name}\`: ${cat.skillCount} skill(s)`);
  }
  lines.push("");

  // Built-in tools by category
  lines.push("### Built-in Tools");
  lines.push("");

  const toolsByCategory = {};
  for (const tool of manifest.builtinTools) {
    if (!toolsByCategory[tool.category]) {
      toolsByCategory[tool.category] = [];
    }
    toolsByCategory[tool.category].push(tool);
  }

  const categoryLabels = {
    skill: "Skill Discovery",
    postman: "Postman Integration",
    stitch: "Stitch Integration",
  };

  for (const [catKey, label] of Object.entries(categoryLabels)) {
    const tools = toolsByCategory[catKey];
    if (!tools?.length) continue;

    lines.push(`**${label}:**`);
    for (const tool of tools) {
      lines.push(`- \`${tool.name}\`: ${tool.description}`);
    }
    lines.push("");
  }

  // Discovery flow
  lines.push("### Skill Discovery Flow");
  lines.push("");
  lines.push("Use progressive disclosure to minimize context usage:");
  lines.push(
    "1. `skill_list_categories` → see available categories and counts",
  );
  lines.push(
    "2. `skill_browse_category` → browse skills in a category with short descriptions",
  );
  lines.push("3. `skill_search` → search by keyword across all skills");
  lines.push(
    "4. `skill_get` → load full content of a specific skill (only tool that reads full content)",
  );
  lines.push(
    "5. `skill_budget_report` → check token usage for selected/loaded skills; use result to emit the § Context Budget Tracking stamp",
  );
  lines.push("");

  // Server connection
  lines.push("### Connection");
  lines.push("");
  lines.push("- **stdio**: `cbx mcp serve --transport stdio --scope auto`");
  lines.push(
    "- **HTTP**: `cbx mcp serve --transport http --scope auto --port 3100`",
  );
  lines.push("");
  lines.push(BLOCK_END);

  return lines.join("\n");
}

// ─── Upsert block into file ─────────────────────────────────

function upsertBlock(fileContent, newBlock) {
  const startIdx = fileContent.indexOf(BLOCK_START);
  const endIdx = fileContent.indexOf(BLOCK_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing block
    const before = fileContent.slice(0, startIdx);
    const after = fileContent.slice(endIdx + BLOCK_END.length);
    return before + newBlock + after;
  }

  // Append block (with separator)
  const trimmed = fileContent.trimEnd();
  return trimmed + "\n\n" + newBlock + "\n";
}

function extractBlock(fileContent) {
  const startIdx = fileContent.indexOf(BLOCK_START);
  const endIdx = fileContent.indexOf(BLOCK_END);
  if (startIdx === -1 || endIdx === -1) return null;
  return fileContent.slice(startIdx, endIdx + BLOCK_END.length);
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const { inject, check } = parseArgs(process.argv);

  // Load manifest
  let manifestRaw;
  try {
    manifestRaw = await fs.readFile(MANIFEST_FILE, "utf8");
  } catch {
    console.error(
      `Manifest not found: ${MANIFEST_FILE}\nRun: node scripts/generate-mcp-manifest.mjs`,
    );
    process.exit(1);
  }

  const manifest = JSON.parse(manifestRaw);
  const block = buildMcpBlock(manifest);

  if (check) {
    // Verify existing block is up-to-date
    const filePath = path.resolve(check);
    let fileContent;
    try {
      fileContent = await fs.readFile(filePath, "utf8");
    } catch {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const existing = extractBlock(fileContent);
    if (!existing) {
      console.log(`⚠ No MCP managed block found in ${path.basename(filePath)}`);
      process.exit(0);
    }

    if (existing.trim() === block.trim()) {
      console.log(`✓ MCP block in ${path.basename(filePath)} is up-to-date`);
    } else {
      console.error(
        `✗ MCP block in ${path.basename(filePath)} is stale.\n  Run: node scripts/generate-mcp-rules-block.mjs --inject ${check}`,
      );
      process.exit(1);
    }
    return;
  }

  if (inject) {
    // Inject/update block in file
    const filePath = path.resolve(inject);
    let fileContent;
    try {
      fileContent = await fs.readFile(filePath, "utf8");
    } catch {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const updated = upsertBlock(fileContent, block);
    await fs.writeFile(filePath, updated, "utf8");
    console.log(`✓ MCP block injected into ${path.basename(filePath)}`);
    return;
  }

  // Default: output to stdout
  process.stdout.write(block + "\n");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
