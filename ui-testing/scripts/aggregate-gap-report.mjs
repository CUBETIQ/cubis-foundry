#!/usr/bin/env node

import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportsRoot = path.resolve(root, "reports", "scenarios");
const scenariosRoot = path.resolve(root, "scenarios");
const outPath = path.resolve(root, "reports", "ui-testing-gap-report.md");
const jsonOutPath = path.resolve(root, "reports", "ui-testing-gap-report.json");
const atlasPath = path.resolve(root, "fixtures", "style-atlas", "index.html");
const atlasReportPath = path.resolve(root, "reports", "style-atlas.md");
const atlasScreenshotPath = path.resolve(root, "reports", "style-atlas-desktop.png");
const benchmarkRuntimePath = path.resolve(root, "reports", "benchmark-runtime.json");
const benchmarkExecutionPath = path.resolve(root, "reports", "benchmark-execution.json");

async function loadScenarioMap() {
  const files = (await fs.readdir(scenariosRoot)).filter((file) => file.endsWith(".json")).sort();
  const entries = await Promise.all(
    files.map(async (file) => {
      const scenario = JSON.parse(await fs.readFile(path.join(scenariosRoot, file), "utf8"));
      return [scenario.id, scenario];
    }),
  );
  return new Map(entries);
}

async function loadScorecards() {
  const scenarioDirs = await fs.readdir(reportsRoot, { withFileTypes: true });
  const scorecards = [];
  for (const entry of scenarioDirs) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(reportsRoot, entry.name, "scorecard.json");
    const raw = await fs.readFile(filePath, "utf8");
    scorecards.push(JSON.parse(raw));
  }
  return scorecards.sort((a, b) => a.scenario_id.localeCompare(b.scenario_id));
}

async function loadSupplementaryArtifacts() {
  const [atlasFixture, atlasNote, atlasShot, benchmarkRuntime, benchmarkExecution] = await Promise.all([
    fs.access(atlasPath).then(() => true).catch(() => false),
    fs.access(atlasReportPath).then(() => true).catch(() => false),
    fs.access(atlasScreenshotPath).then(() => true).catch(() => false),
    fs.access(benchmarkRuntimePath).then(() => true).catch(() => false),
    fs.access(benchmarkExecutionPath).then(() => true).catch(() => false),
  ]);

  return {
    style_atlas: {
      fixture: atlasFixture,
      note: atlasNote,
      screenshot: atlasShot,
      route: "/style-atlas/",
      report_path: "ui-testing/reports/style-atlas.md",
      screenshot_path: "ui-testing/reports/style-atlas-desktop.png",
    },
    benchmark_runtime: {
      present: benchmarkRuntime,
      path: "ui-testing/reports/benchmark-runtime.json",
    },
    benchmark_execution: {
      present: benchmarkExecution,
      path: "ui-testing/reports/benchmark-execution.json",
    },
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function summarize(scorecards, scenarioMap) {
  const repeated = new Map();
  const repeatedByCategory = new Map();
  const repeatedByOwner = new Map();
  const styleCoverage = new Map();
  const laneCoverage = new Map();
  const scenarioSpecificNotes = [];

  for (const card of scorecards) {
    const scenario = scenarioMap.get(card.scenario_id);
    if (scenario) {
      const styleEntry = styleCoverage.get(card.style_reference_id) || {
        style_reference_id: card.style_reference_id,
        primary_style_direction: scenario.primary_style_direction,
        scenarios: [],
      };
      styleEntry.scenarios.push(card.scenario_id);
      styleCoverage.set(card.style_reference_id, styleEntry);
    }

    for (const lane of card.benchmark_lane_results || []) {
      const laneEntry = laneCoverage.get(lane.lane) || { lane: lane.lane, counts: {} };
      laneEntry.counts[lane.status] = (laneEntry.counts[lane.status] || 0) + 1;
      laneCoverage.set(lane.lane, laneEntry);
    }

    for (const gap of card.gaps || []) {
      const key = `${gap.category}::${gap.symptom}`;
      const existing = repeated.get(key) || { ...gap, scenarios: [] };
      existing.scenarios.push(card.scenario_id);
      repeated.set(key, existing);
    }
  }

  const repeatedGaps = [...repeated.values()]
    .filter((gap) => gap.scenarios.length > 1)
    .sort((a, b) => b.scenarios.length - a.scenarios.length || a.category.localeCompare(b.category));

  for (const gap of repeatedGaps) {
    const categoryEntry = repeatedByCategory.get(gap.category) || { category: gap.category, count: 0, scenarios: new Set() };
    categoryEntry.count += 1;
    gap.scenarios.forEach((scenarioId) => categoryEntry.scenarios.add(scenarioId));
    repeatedByCategory.set(gap.category, categoryEntry);

    const ownerEntry = repeatedByOwner.get(gap.foundry_owner_area) || { owner: gap.foundry_owner_area, count: 0, scenarios: new Set() };
    ownerEntry.count += 1;
    gap.scenarios.forEach((scenarioId) => ownerEntry.scenarios.add(scenarioId));
    repeatedByOwner.set(gap.foundry_owner_area, ownerEntry);
  }

  for (const gap of repeated.values()) {
    if (gap.scenarios.length === 1 && (gap.severity === "high" || gap.severity === "medium")) {
      scenarioSpecificNotes.push(gap);
    }
  }

  scenarioSpecificNotes.sort((a, b) => a.scenarios[0].localeCompare(b.scenarios[0]) || a.category.localeCompare(b.category));

  const scoreSummary = {
    design_intent: average(scorecards.map((card) => card.design_intent_score)),
    anti_slop: average(scorecards.map((card) => card.anti_slop_score)),
    responsive: average(scorecards.map((card) => card.responsive_score)),
    interaction: average(scorecards.map((card) => card.interaction_score)),
    accessibility: average(scorecards.map((card) => card.accessibility_score)),
    style_fidelity: average(scorecards.map((card) => card.style_fidelity_score)),
    composition_balance: average(scorecards.map((card) => card.composition_balance_score)),
    layout_occupancy: average(scorecards.map((card) => card.layout_occupancy_score)),
    mobile_recomposition: average(scorecards.map((card) => card.mobile_recomposition_score)),
  };

  const fixOrder = [
    "promote harness-derived prompt traces and design execution traces into the core design runtime",
    "add a native remediation executor that routes audit output into arrange, typeset, bolder, distill, and polish",
    "promote the shared ui-testing route from script-backed orchestration into a native runtime executor",
    "promote Design Prompts-style normalization into a reusable Foundry style catalog",
    "add style-fidelity scoring, optical-collision checks, and layout-occupancy checks to design-audit",
    "add viewport-aware mobile recomposition scoring and shell-track occupancy failure rules",
  ];

  return {
    scoreSummary,
    repeatedGaps,
    repeatedByCategory: [...repeatedByCategory.values()]
      .map((entry) => ({ ...entry, scenarios: [...entry.scenarios].sort() }))
      .sort((a, b) => b.scenarios.length - a.scenarios.length || a.category.localeCompare(b.category)),
    repeatedByOwner: [...repeatedByOwner.values()]
      .map((entry) => ({ ...entry, scenarios: [...entry.scenarios].sort() }))
      .sort((a, b) => b.scenarios.length - a.scenarios.length || a.owner.localeCompare(b.owner)),
    scenarioSpecificNotes,
    styleCoverage: [...styleCoverage.values()].sort((a, b) => a.primary_style_direction.localeCompare(b.primary_style_direction)),
    laneCoverage: [...laneCoverage.values()].sort((a, b) => a.lane.localeCompare(b.lane)),
    fixOrder,
  };
}

function buildMarkdown(scorecards, summary, scenarioMap, supplementary) {
  const lines = [];
  lines.push("# UI Testing Gap Report");
  lines.push("");
  lines.push("## Harness Summary");
  lines.push("");
  lines.push(`- Scenarios reviewed: ${scorecards.length}`);
  lines.push(`- Style families covered: ${summary.styleCoverage.length}`);
  lines.push(`- Benchmark lanes observed: ${summary.laneCoverage.length}`);
  lines.push("- Surface: web and webapp fixtures");
  lines.push("- Goal: expose repeated Foundry workflow gaps in anti-slop UI generation, style fidelity, and responsive recomposition");
  lines.push("");
  lines.push("## Supplementary Harness Artifacts");
  lines.push("");
  lines.push(`- Style atlas route: ${supplementary.style_atlas.route}`);
  lines.push(`- Style atlas fixture present: ${supplementary.style_atlas.fixture ? "yes" : "no"}`);
  lines.push(`- Style atlas note present: ${supplementary.style_atlas.note ? "yes" : "no"} (${supplementary.style_atlas.report_path})`);
  lines.push(`- Style atlas screenshot present: ${supplementary.style_atlas.screenshot ? "yes" : "no"} (${supplementary.style_atlas.screenshot_path})`);
  lines.push(`- Benchmark runtime artifact present: ${supplementary.benchmark_runtime.present ? "yes" : "no"} (${supplementary.benchmark_runtime.path})`);
  lines.push(`- Benchmark execution artifact present: ${supplementary.benchmark_execution.present ? "yes" : "no"} (${supplementary.benchmark_execution.path})`);
  lines.push("");
  lines.push("## Score Summary");
  lines.push("");
  lines.push(`- Design intent: ${summary.scoreSummary.design_intent}`);
  lines.push(`- Anti-slop: ${summary.scoreSummary.anti_slop}`);
  lines.push(`- Responsive: ${summary.scoreSummary.responsive}`);
  lines.push(`- Interaction: ${summary.scoreSummary.interaction}`);
  lines.push(`- Accessibility: ${summary.scoreSummary.accessibility}`);
  lines.push(`- Style fidelity: ${summary.scoreSummary.style_fidelity}`);
  lines.push(`- Composition balance: ${summary.scoreSummary.composition_balance}`);
  lines.push(`- Layout occupancy: ${summary.scoreSummary.layout_occupancy}`);
  lines.push(`- Mobile recomposition: ${summary.scoreSummary.mobile_recomposition}`);
  lines.push("");
  lines.push("## Scenario Results");
  lines.push("");
  lines.push("| Scenario | Style Direction | Design | Anti-slop | Style | Composition | Occupancy | Mobile | Responsive | Interaction | Accessibility |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const card of scorecards) {
    const scenario = scenarioMap.get(card.scenario_id);
    lines.push(
      `| ${card.scenario_id} | ${scenario?.primary_style_direction || "unknown"} | ${card.design_intent_score} | ${card.anti_slop_score} | ${card.style_fidelity_score} | ${card.composition_balance_score} | ${card.layout_occupancy_score} | ${card.mobile_recomposition_score} | ${card.responsive_score} | ${card.interaction_score} | ${card.accessibility_score} |`,
    );
  }
  lines.push("");
  lines.push("## Style-Family Coverage");
  lines.push("");
  for (const item of summary.styleCoverage) {
    lines.push(`- ${item.primary_style_direction} via ${item.style_reference_id}: ${item.scenarios.join(", ")}`);
  }
  lines.push("");
  lines.push("## Benchmark-Lane Coverage");
  lines.push("");
  for (const lane of summary.laneCoverage) {
    const statuses = Object.entries(lane.counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([status, count]) => `${status}=${count}`)
      .join(", ");
    lines.push(`- ${lane.lane}: ${statuses}`);
  }
  lines.push("");
  lines.push("## Repeated Gaps");
  lines.push("");
  if (summary.repeatedGaps.length === 0) {
    lines.push("- No repeated gaps were detected across scenarios.");
  } else {
    for (const gap of summary.repeatedGaps) {
      lines.push(`- ${gap.category}: ${gap.symptom}`);
      lines.push(`  Scenarios: ${gap.scenarios.join(", ")}`);
      lines.push(`  Owner area: ${gap.foundry_owner_area}`);
      lines.push(`  Recommended fix: ${gap.recommended_fix}`);
    }
  }
  lines.push("");
  lines.push("## Repeated Failures By Foundry Subsystem");
  lines.push("");
  if (summary.repeatedByOwner.length === 0) {
    lines.push("- No repeated subsystem failures were detected.");
  } else {
    for (const item of summary.repeatedByOwner) {
      lines.push(`- ${item.owner}: repeated across ${item.scenarios.length} scenarios`);
      lines.push(`  Scenarios: ${item.scenarios.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("## Repeated Failures By Gap Category");
  lines.push("");
  if (summary.repeatedByCategory.length === 0) {
    lines.push("- No repeated gap categories were detected.");
  } else {
    for (const item of summary.repeatedByCategory) {
      lines.push(`- ${item.category}: repeated across ${item.scenarios.length} scenarios`);
      lines.push(`  Scenarios: ${item.scenarios.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("## Scenario-Specific Notes");
  lines.push("");
  if (summary.scenarioSpecificNotes.length === 0) {
    lines.push("- No scenario-specific medium-or-higher signal gaps were detected.");
  } else {
    for (const gap of summary.scenarioSpecificNotes) {
      lines.push(`- ${gap.scenarios[0]} / ${gap.category}: ${gap.symptom}`);
      lines.push(`  Owner area: ${gap.foundry_owner_area}`);
      lines.push(`  Recommended fix: ${gap.recommended_fix}`);
    }
  }
  lines.push("");
  lines.push("## Fix Order");
  lines.push("");
  for (const [index, item] of summary.fixOrder.entries()) {
    lines.push(`${index + 1}. ${item}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const [scenarioMap, scorecards, supplementary] = await Promise.all([loadScenarioMap(), loadScorecards(), loadSupplementaryArtifacts()]);
  const summary = summarize(scorecards, scenarioMap);
  await fs.writeFile(outPath, buildMarkdown(scorecards, summary, scenarioMap, supplementary), "utf8");
  await fs.writeFile(
    jsonOutPath,
    `${JSON.stringify({ scorecards, supplementary, ...summary }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`Wrote ${outPath}\n`);
  process.stdout.write(`Wrote ${jsonOutPath}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
