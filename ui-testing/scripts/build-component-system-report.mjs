#!/usr/bin/env node

import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { analyzeStyleAtlas } from "./lib/benchmark-analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const atlasPath = path.join(root, "fixtures", "style-atlas", "index.html");
const reportPath = path.join(root, "reports", "component-system-summary.md");
const jsonPath = path.join(root, "reports", "component-system-summary.json");

function buildMarkdown(summary) {
  const lines = [];
  lines.push("# Component System Summary");
  lines.push("");
  lines.push("This report isolates component-language signals from page-shell composition.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Atlas lanes: ${summary.lane_count}`);
  lines.push(`- Rounded lanes: ${summary.rounded_lane_count}`);
  lines.push(`- Hard-edge lanes: ${summary.hard_edge_lane_count}`);
  lines.push(`- Tactile lanes: ${summary.tactile_lane_count}`);
  lines.push(`- Geometry diversity score: ${summary.geometry_diversity_score}`);
  lines.push(`- Atlas background gradient count: ${summary.background_gradient_count}`);
  lines.push("");
  lines.push("## Lane Details");
  lines.push("");
  for (const lane of summary.lanes) {
    lines.push(`- ${lane.id}: rounded=${lane.rounded ? "yes" : "no"}, tactile=${lane.tactile ? "yes" : "no"}, components=${lane.component_count}`);
  }
  lines.push("");
  lines.push("## Interpretation");
  lines.push("");
  lines.push("- Use this report to distinguish component-language drift from page-shell balance issues.");
  lines.push("- Rounded/tactile systems should not be represented by color alone; they need component geometry, chips, sheets, or FAB-like actions.");
  lines.push("- Hard-edge editorial and brutalist lanes should remain visibly distinct from rounded product systems.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const summary = await analyzeStyleAtlas(atlasPath);
  await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(reportPath, buildMarkdown(summary), "utf8");
  process.stdout.write(`Wrote ${reportPath}\n`);
  process.stdout.write(`Wrote ${jsonPath}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
