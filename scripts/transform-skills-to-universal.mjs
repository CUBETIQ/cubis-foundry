#!/usr/bin/env node
/**
 * transform-skills-to-universal.mjs
 *
 * Transforms canonical skills from old Foundry format to the
 * universal-skill-creator portable template format.
 *
 * Strategy: preserve domain content, restructure into the 7-section template,
 * keep domain subsections as ### under ## Instructions, clean frontmatter.
 */

import path from "node:path";
import { promises as fs } from "node:fs";

const ROOT = process.cwd();
const SKILLS_ROOT = path.join(ROOT, "workflows", "skills");

const SKIP_DIRS = new Set(["_schema", "catalogs", "generated"]);

// ─── Frontmatter ────────────────────────────────────────────

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: "", body: content, hasFm: false };
  return { fm: match[1], body: match[2], hasFm: true };
}

function parseSimpleYaml(fm) {
  const result = {};
  const lines = fm.split(/\r?\n/);
  let currentKey = null;
  let currentObj = null;

  for (const line of lines) {
    const topMatch = line.match(/^([a-zA-Z_-]+)\s*:\s*(.+)$/);
    if (topMatch && !/^\s/.test(line)) {
      currentKey = topMatch[1];
      let val = topMatch[2].trim().replace(/^["']|["']$/g, "");
      if (val === ">") val = "";
      result[currentKey] = val;
      currentObj = null;
      continue;
    }
    const topObjMatch = line.match(/^([a-zA-Z_-]+)\s*:\s*$/);
    if (topObjMatch && !/^\s/.test(line)) {
      currentKey = topObjMatch[1];
      result[currentKey] = {};
      currentObj = result[currentKey];
      continue;
    }
    if (currentObj && /^\s+/.test(line)) {
      const subMatch = line.match(/^\s+([a-zA-Z_-]+)\s*:\s*(.*)$/);
      if (subMatch) {
        currentObj[subMatch[1]] = subMatch[2]
          .trim()
          .replace(/^["']|["']$/g, "");
      }
      continue;
    }
    if (
      currentKey &&
      /^\s+/.test(line) &&
      typeof result[currentKey] === "string"
    ) {
      result[currentKey] += (result[currentKey] ? " " : "") + line.trim();
    }
  }
  return result;
}

function buildCleanFrontmatter(parsed, skillId) {
  const lines = ["---"];
  lines.push(`name: ${parsed.name || skillId}`);

  let desc = (parsed.description || "").replace(/^["']|["']$/g, "").trim();
  // Always use single-line quoted description for compatibility with getScalar parser
  lines.push(`description: "${desc}"`);

  lines.push("license: MIT");
  let ver = "1.0";
  if (
    parsed.metadata &&
    typeof parsed.metadata === "object" &&
    parsed.metadata.version
  ) {
    ver = parsed.metadata.version
      .replace(/^["']|["']$/g, "")
      .replace(/\.0\.0$/, ".0");
    if (!/\./.test(ver)) ver += ".0";
  }
  lines.push("metadata:");
  lines.push("  author: cubis-foundry");
  lines.push(`  version: "${ver}"`);
  lines.push("compatibility: Claude Code, Codex, GitHub Copilot");
  lines.push("---");
  return lines.join("\n");
}

// ─── Section parser ─────────────────────────────────────────

function parseSections(body) {
  const lines = body.split("\n");
  const sections = [];
  let heading = "";
  let content = [];

  for (const line of lines) {
    if (/^#{1,2}\s/.test(line)) {
      if (heading || content.length) {
        sections.push({ heading, content: content.join("\n") });
      }
      heading = line;
      content = [];
    } else {
      content.push(line);
    }
  }
  if (heading || content.length) {
    sections.push({ heading, content: content.join("\n") });
  }
  return sections;
}

// ─── Heading classification ─────────────────────────────────

const SECTION_ROLE = {
  identity: /^## (IDENTITY|Identity)$/i,
  whenToUse: /^## When to [Uu]se$/,
  whenNotToUse: /^## When [Nn]ot to [Uu]se$/,
  coreWorkflow: /^## (Core workflow|SOP|STANDARD OPERATING PROCEDURE)$/i,
  baseline: /^## Baseline standards$/i,
  boundaries: /^## (BOUNDARIES|Boundaries)$/i,
  avoid: /^## Avoid$/i,
  implGuidance: /^## Implementation guidance$/i,
  rules: /^## Rules$/i,
  reference: /^## (References?|Reference files?)$/i,
  scripts: /^## (Scripts?|Helper [Ss]cripts?)$/i,
  outputFormat: /^## Output [Ff]ormat$/i,
  examples: /^## Examples?$/i,
};

function classifySection(heading) {
  for (const [role, re] of Object.entries(SECTION_ROLE)) {
    if (re.test(heading.trim())) return role;
  }
  return null;
}

// ─── Body transformation ────────────────────────────────────

function transformBody(body, skillId, description) {
  const sections = parseSections(body);

  let title = null;
  let purposeText = null;
  let whenToUseText = null;
  let outputFormatText = null;
  let referencesText = null;
  let scriptsText = null;
  let examplesText = null;

  // Domain subsections preserved as ### under Instructions
  const instructionBlocks = [];
  const avoidItems = [];

  for (const sec of sections) {
    const h = sec.heading.trim();
    const c = sec.content.trim();

    // H1 title
    if (h.startsWith("# ") && !h.startsWith("## ")) {
      title = h;
      continue;
    }

    const role = classifySection(h);

    switch (role) {
      case "identity":
        purposeText = c;
        break;
      case "whenToUse":
        whenToUseText = c;
        break;
      case "whenNotToUse":
        // discard
        break;
      case "coreWorkflow":
        instructionBlocks.push({ heading: null, content: c });
        break;
      case "baseline":
        instructionBlocks.push({
          heading: "### Baseline standards",
          content: c,
        });
        break;
      case "implGuidance":
        instructionBlocks.push({
          heading: "### Implementation guidance",
          content: c,
        });
        break;
      case "rules":
        instructionBlocks.push({ heading: "### Rules", content: c });
        break;
      case "boundaries":
        // Extract boundary items as "avoid" constraints
        for (const line of c.split("\n")) {
          const m = line.match(/^-\s+(.+)/);
          if (m) avoidItems.push(m[1].trim());
        }
        break;
      case "avoid":
        for (const line of c.split("\n")) {
          const m = line.match(/^-\s+(.+)/);
          if (m) avoidItems.push(m[1].trim());
        }
        break;
      case "reference":
        referencesText = c;
        break;
      case "scripts":
        scriptsText = c;
        break;
      case "outputFormat":
        outputFormatText = c;
        break;
      case "examples":
        examplesText = c;
        break;
      default:
        // Any other ## section → keep as ### domain subsection
        if (h.startsWith("## ")) {
          const subName = h.replace(/^##\s*/, "");
          instructionBlocks.push({ heading: `### ${subName}`, content: c });
        }
        break;
    }
  }

  // ── Assemble ────

  const out = [];

  // Title
  out.push(
    title ||
      `# ${skillId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}`,
  );
  out.push("");

  // Purpose
  out.push("## Purpose");
  out.push("");
  if (purposeText) {
    out.push(purposeText);
  } else {
    // Derive from description
    out.push(
      description ||
        `Specialist skill for ${skillId.replace(/-/g, " ")} tasks.`,
    );
  }
  out.push("");

  // When to Use
  out.push("## When to Use");
  out.push("");
  out.push(
    whenToUseText || `- Working on ${skillId.replace(/-/g, " ")} related tasks`,
  );
  out.push("");

  // Instructions – keep original structure with ### subsections
  out.push("## Instructions");
  out.push("");

  for (const block of instructionBlocks) {
    if (block.heading) {
      out.push(block.heading);
      out.push("");
    }
    out.push(block.content);
    out.push("");
  }

  // Append avoid items as a subsection if any exist
  if (avoidItems.length > 0) {
    out.push("### Constraints");
    out.push("");
    for (const item of avoidItems) {
      // Normalise to "Do not …" form
      let text = item.replace(/\.$/, "");
      if (!/^(Do not|Don't|Never|Avoid)/i.test(text)) {
        text = `Avoid ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
      }
      out.push(`- ${text}.`);
    }
    out.push("");
  }

  // Output Format
  out.push("## Output Format");
  out.push("");
  out.push(
    outputFormatText ||
      "Provide implementation guidance, code examples, and configuration as appropriate to the task.",
  );
  out.push("");

  // References (optional)
  if (referencesText) {
    out.push("## References");
    out.push("");
    out.push(referencesText);
    out.push("");
  }

  // Scripts (optional)
  if (scriptsText) {
    out.push("## Scripts");
    out.push("");
    out.push(scriptsText);
    out.push("");
  }

  // Examples
  out.push("## Examples");
  out.push("");
  if (examplesText) {
    out.push(examplesText);
  } else {
    const pretty = skillId.replace(/-/g, " ");
    out.push(`- "Help me with ${pretty} best practices in this project"`);
    out.push(`- "Review my ${pretty} implementation for issues"`);
  }

  return out.join("\n");
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlySkill = process.argv.find(
    (a, i) => process.argv[i - 1] === "--only",
  );

  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
  const skillDirs = entries
    .filter(
      (e) =>
        e.isDirectory() && !e.name.startsWith(".") && !SKIP_DIRS.has(e.name),
    )
    .map((e) => e.name)
    .sort();

  let transformed = 0;
  let skipped = 0;
  const errors = [];

  for (const skillId of skillDirs) {
    if (onlySkill && skillId !== onlySkill) continue;

    const skillFile = path.join(SKILLS_ROOT, skillId, "SKILL.md");
    try {
      await fs.stat(skillFile);
    } catch {
      skipped++;
      continue;
    }

    try {
      const content = await fs.readFile(skillFile, "utf8");
      const { fm, body, hasFm } = extractFrontmatter(content);

      if (!hasFm) {
        errors.push(`${skillId}: no frontmatter found`);
        continue;
      }

      // Already transformed - but check if description uses folded string that needs fixing
      const needsDescFix = /^description:\s*>\s*$/m.test(fm);
      if (
        body.includes("## Purpose") &&
        body.includes("## Instructions") &&
        !needsDescFix
      ) {
        console.log(`  ✓ ${skillId} (already transformed)`);
        skipped++;
        continue;
      }

      const parsed = parseSimpleYaml(fm);
      const newFm = buildCleanFrontmatter(parsed, skillId);
      const desc = (parsed.description || "")
        .replace(/^["']|["']$/g, "")
        .trim();
      const newBody = transformBody(body, skillId, desc);
      const newContent = `${newFm}\n\n${newBody}\n`;

      if (dryRun) {
        console.log(`  [dry-run] ${skillId}`);
      } else {
        await fs.writeFile(skillFile, newContent, "utf8");
        console.log(`  ✓ ${skillId}`);
      }
      transformed++;
    } catch (err) {
      errors.push(`${skillId}: ${err.message}`);
    }
  }

  console.log(
    `\nTransformed: ${transformed}, Skipped: ${skipped}, Errors: ${errors.length}`,
  );
  if (errors.length) {
    console.error("\nErrors:");
    for (const e of errors) console.error(`  ✗ ${e}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
