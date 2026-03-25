#!/usr/bin/env node

import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "research", "design-prompts-style-catalog.json");
const targetPath = path.resolve(root, "..", "workflows", "design-datasets", "style-reference-catalog.json");

async function main() {
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const dataset = {
    dataset: "style-reference-catalog",
    version: 1,
    source: "ui-testing/research/design-prompts-style-catalog.json",
    entries: source.map((entry) => ({
      id: entry.style_id,
      display_name: entry.display_name,
      mode: entry.mode,
      type_family: entry.type_family,
      source_url: entry.source_url,
      site_route: entry.site_route,
      prompt_digest: entry.prompt_digest,
      visual_traits: entry.visual_traits,
      layout_cues: entry.layout_cues,
      motion_cues: entry.motion_cues,
      anti_patterns: entry.anti_patterns,
      foundry_mapping_status: entry.foundry_mapping_status,
      candidate_dataset_ids: entry.candidate_dataset_ids,
    })),
  };

  await fs.writeFile(targetPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${targetPath}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
