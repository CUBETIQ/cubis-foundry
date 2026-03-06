#!/usr/bin/env node

/**
 * generate-mcp-rules-block.mjs
 *
 * Generates a managed compact MCP rules block for injection into rule files
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
  lines.push("## Cubis Foundry MCP (auto-managed)");
  lines.push("");
  lines.push("Keep MCP context lazy and exact. Do not front-load the skill catalog.");
  lines.push("");
  lines.push("### Compact Tool Map");
  lines.push("");
  lines.push(
    "- Skill tools: `skill_search`, `skill_validate`, `skill_get`, `skill_get_reference`, `skill_budget_report`",
  );
  lines.push(
    "- Fallback browsing only: `skill_list_categories`, `skill_browse_category`",
  );
  lines.push("- Config tools: `postman_*`, `stitch_*`");
  lines.push("");
  lines.push("### Validated Skill Flow");
  lines.push("");
  lines.push(
    "1. Inspect the repo/task locally first. Do not start with `skill_search`.",
  );
  lines.push(
    "2. If the user names an exact skill, run `skill_validate` directly. Otherwise use one narrow `skill_search` only if local grounding still leaves the domain unclear.",
  );
  lines.push(
    "3. Always run `skill_validate` on the exact selected ID before `skill_get`.",
  );
  lines.push(
    "4. Call `skill_get` with `includeReferences:false` by default.",
  );
  lines.push(
    "5. Load at most one sidecar markdown file at a time with `skill_get_reference`.",
  );
  lines.push(
    "6. Use `skill_list_categories` or `skill_browse_category` only as fallback when targeted search fails.",
  );
  lines.push(
    "7. Never print catalog counts or budget details unless the user asks.",
  );
  lines.push("");
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
