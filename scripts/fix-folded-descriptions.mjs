#!/usr/bin/env node
/**
 * Fix YAML folded string descriptions (description: >) to single-line quoted format.
 * The getScalar parser in skill-catalog.mjs only reads the first line of a value,
 * so folded strings appear as ">" instead of the actual description text.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKILLS = path.join(ROOT, "workflows", "skills");

const dirs = (await fs.readdir(SKILLS, { withFileTypes: true }))
  .filter(
    (d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "_schema",
  )
  .map((d) => d.name);

let fixed = 0;
for (const id of dirs) {
  const f = path.join(SKILLS, id, "SKILL.md");
  try {
    await fs.stat(f);
  } catch {
    continue;
  }
  const content = await fs.readFile(f, "utf8");

  // Match description: > followed by indented continuation lines
  const re = /^(description:\s*>)\s*\n((?:\s{2,}.+\n?)+)/m;
  const m = content.match(re);
  if (!m) continue;

  // Collapse continuation lines into one quoted string
  const lines = m[2].split("\n").filter((l) => l.trim());
  const desc = lines.map((l) => l.trim()).join(" ");

  const newContent = content.replace(re, `description: "${desc}"\n`);
  await fs.writeFile(f, newContent, "utf8");
  fixed++;
  console.log("  ✓", id);
}
console.log("\nFixed:", fixed);
