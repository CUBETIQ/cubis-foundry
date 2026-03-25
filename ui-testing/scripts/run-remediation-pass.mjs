#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const scenariosRoot = path.join(root, "scenarios");
const reportsRoot = path.join(root, "reports");
const scenarioReportsRoot = path.join(reportsRoot, "scenarios");
const outPath = path.join(reportsRoot, "remediation-runtime.json");

function parseArgs(argv) {
  const args = {
    scenario: null,
    scope: "full-suite",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--scenario") {
      args.scenario = argv[index + 1] || null;
      args.scope = "targeted";
      index += 1;
      continue;
    }
    if (arg.startsWith("--scenario=")) {
      args.scenario = arg.slice("--scenario=".length) || null;
      args.scope = "targeted";
    }
  }
  return args;
}

async function loadScenarioIds(targetScenario) {
  const files = (await fs.readdir(scenariosRoot))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const ids = files.map((file) => file.replace(/\.json$/, ""));
  if (!targetScenario) return ids;
  if (!ids.includes(targetScenario)) {
    throw new Error(`Unknown scenario '${targetScenario}'`);
  }
  return [targetScenario];
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function summarizeWeakSignals(scorecard) {
  const pairs = [
    ["design intent", scorecard.design_intent_score],
    ["anti-slop", scorecard.anti_slop_score],
    ["style fidelity", scorecard.style_fidelity_score],
    ["composition balance", scorecard.composition_balance_score],
    ["layout occupancy", scorecard.layout_occupancy_score],
    ["mobile recomposition", scorecard.mobile_recomposition_score],
    ["texture discipline", scorecard.texture_discipline_score],
    ["geometry coverage", scorecard.geometry_coverage_score],
  ];
  return pairs
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4);
}

function relevantGaps(scorecard, categories) {
  const categorySet = new Set(categories || []);
  if (categorySet.size === 0) return [];
  return (scorecard.gaps || []).filter((gap) => categorySet.has(gap.category));
}

function buildInstruction(skill, scenario, scorecard, gaps) {
  const focus = gaps.map((gap) => gap.category);
  if (skill === "design-arrange") {
    return {
      summary: "Recompose shell structure, hierarchy order, and mounted zones before touching styling polish.",
      actions: [
        "Remove dead shell tracks, under-occupied rails, or decorative columns with no operational purpose.",
        "Reprioritize the mobile order so the first scroll segment carries the primary action and the most important state.",
        `Keep these desktop failure checks visible: ${scenario.desktop_failure_checks.join("; ")}.`,
      ],
      focus,
    };
  }
  if (skill === "design-typeset") {
    return {
      summary: "Recalibrate display scale and reading rhythm so hierarchy survives without optical collisions.",
      actions: [
        "Reduce oversized display type or limit line length when the headline competes with adjacent modules.",
        "Use type rhythm to reinforce the chosen style family instead of generic product hero typography.",
        `Preserve these acceptance checks: ${scenario.acceptance_checks.join("; ")}.`,
      ],
      focus,
    };
  }
  if (skill === "design-bolder") {
    return {
      summary: "Increase directional identity only where the chosen style family still feels too safe or under-defined.",
      actions: [
        "Strengthen motif presence through geometry, density, or contrast before adding ornamental accents.",
        "Keep the primary transaction or operational path more legible than the supporting noise.",
      ],
      focus,
    };
  }
  if (skill === "design-distill") {
    return {
      summary: "Remove reusable harness defaults and reduce visual noise that masks the intended style signal.",
      actions: [
        "Strip repeated texture overlays or box-pattern treatments unless the style family explicitly requires them.",
        "Reduce competing accent moves so the primary component language reads clearly.",
      ],
      focus,
    };
  }
  if (skill === "design-polish") {
    return {
      summary: "Polish only after structure, type, and state hierarchy are already coherent.",
      actions: [
        "Tighten spacing, border treatment, and state transitions without changing the layout diagnosis.",
        "Use polish to clarify the chosen style family, not to hide unresolved shell problems.",
      ],
      focus,
    };
  }
  if (skill === "design-audit") {
    const weakSignals = summarizeWeakSignals(scorecard).map(([label, value]) => `${label}=${value}`);
    const currentGapCategories = [...new Set(
      (scorecard.gaps || [])
        .filter((gap) => gap.severity === "high" || gap.severity === "medium")
        .map((gap) => gap.category),
    )];
    return {
      summary: "Audit the current surface before any second-pass intervention.",
      actions: [
        `Weakest benchmark signals: ${weakSignals.join(", ")}.`,
        `Current high or medium gaps: ${currentGapCategories.join(", ")}.`,
      ],
      focus,
    };
  }
  if (skill === "playwright-web-qa") {
    return {
      summary: "Refresh browser evidence after remediation changes are applied.",
      actions: [
        "Re-capture desktop and mobile screenshots.",
        "Refresh the interactive snapshot and confirm the scenario still serves correctly.",
      ],
      focus,
    };
  }
  if (skill === "ui-testing-harness") {
    return {
      summary: "Roll the scenario back into the suite-level artifacts.",
      actions: [
        "Refresh the scenario scorecard and prompt trace.",
        "Regenerate the consolidated benchmark and gap reports.",
      ],
      focus,
    };
  }

  return {
    summary: "No explicit remediation adapter defined for this step.",
    actions: [],
    focus,
  };
}

function buildStepExecution(step, scenario, scorecard) {
  const gaps = relevantGaps(scorecard, step.triggered_by);
  const instruction = buildInstruction(step.skill, scenario, scorecard, gaps);
  let status = "standby";
  if (step.status === "required") {
    if (step.skill === "design-audit") {
      status = "completed";
    } else if (step.skill === "playwright-web-qa" || step.skill === "ui-testing-harness") {
      status = "ready-for-refresh";
    } else {
      status = "instruction-emitted";
    }
  }

  return {
    order: step.order,
    skill: step.skill,
    status,
    triggered_by: step.triggered_by,
    rationale: step.rationale,
    focus_categories: instruction.focus,
    instruction_summary: instruction.summary,
    actions: instruction.actions,
  };
}

function buildMarkdown(scenarioId, scenario, scorecard, execution) {
  const lines = [];
  lines.push(`# ${scenarioId} Remediation Pass`);
  lines.push("");
  lines.push(`- Style reference: \`${scorecard.style_reference_id}\``);
  lines.push(`- Style direction: \`${scenario.primary_style_direction}\``);
  lines.push(`- Build status: \`${scorecard.build_status}\``);
  lines.push(`- Execution status: \`${execution.execution_status}\``);
  lines.push("");
  lines.push("## Score Snapshot");
  lines.push("");
  lines.push(`- Style fidelity: ${scorecard.style_fidelity_score}`);
  lines.push(`- Composition balance: ${scorecard.composition_balance_score}`);
  lines.push(`- Layout occupancy: ${scorecard.layout_occupancy_score}`);
  lines.push(`- Mobile recomposition: ${scorecard.mobile_recomposition_score}`);
  lines.push(`- Texture discipline: ${scorecard.texture_discipline_score}`);
  lines.push(`- Geometry coverage: ${scorecard.geometry_coverage_score}`);
  lines.push("");
  lines.push("## Required Remediation Steps");
  lines.push("");
  for (const step of execution.steps.filter((item) => item.status !== "standby")) {
    lines.push(`### ${step.order}. ${step.skill}`);
    lines.push(`- Status: ${step.status}`);
    lines.push(`- Triggered by: ${step.triggered_by.join(", ") || "none"}`);
    lines.push(`- Summary: ${step.instruction_summary}`);
    if (step.actions.length > 0) {
      lines.push("- Actions:");
      for (const action of step.actions) {
        lines.push(`  - ${action}`);
      }
    }
    lines.push("");
  }
  lines.push("## Shared Runtime Limitation");
  lines.push("");
  lines.push("- This remediation pass now executes as a harness-runtime artifact generator, but the same execution path is not yet exposed as a shared native Foundry runtime.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarioIds = await loadScenarioIds(args.scenario);
  const executions = [];

  for (const scenarioId of scenarioIds) {
    const scenario = await readJson(path.join(scenariosRoot, `${scenarioId}.json`));
    const scenarioReportDir = path.join(scenarioReportsRoot, scenarioId);
    const scorecardPath = path.join(scenarioReportDir, "scorecard.json");
    const promptTracePath = path.join(scenarioReportDir, "prompt-trace.json");
    const scorecard = await readJson(scorecardPath);
    const promptTrace = await readJson(promptTracePath);
    const steps = (scorecard.remediation_trace || []).map((step) =>
      buildStepExecution(step, scenario, scorecard),
    );
    const requiredSkills = steps.filter((step) => step.status !== "standby").map((step) => step.skill);
    const execution = {
      trace_version: "1.0",
      route: {
        id: "ui-testing",
        command: "/ui-testing",
        scope: args.scope === "targeted" ? "scenario-remediation" : "suite-remediation",
      },
      scenario_id: scenarioId,
      style_reference_id: scorecard.style_reference_id,
      generated_at: new Date().toISOString(),
      execution_status: "completed-harness-runtime",
      provenance_source: "ui-testing/scripts/run-remediation-pass.mjs",
      prompt_trace_path: path.relative(process.cwd(), promptTracePath),
      scorecard_path: path.relative(process.cwd(), scorecardPath),
      remediation_skill_sequence: promptTrace.remediation_skill_sequence || requiredSkills,
      required_skills: requiredSkills,
      steps,
      shared_runtime_limitations: [
        "This remediation executor runs at the harness-runtime layer.",
        "Shared Foundry runtime still needs to adopt the same remediation execution path natively.",
      ],
    };

    const markdownPath = path.join(scenarioReportDir, "remediation-pass.md");
    const jsonPath = path.join(scenarioReportDir, "remediation-execution.json");
    await fs.writeFile(markdownPath, buildMarkdown(scenarioId, scenario, scorecard, execution), "utf8");
    await fs.writeFile(jsonPath, `${JSON.stringify(execution, null, 2)}\n`, "utf8");

    executions.push({
      scenario_id: scenarioId,
      execution_status: execution.execution_status,
      required_skills: execution.required_skills,
      markdown_path: path.relative(process.cwd(), markdownPath),
      json_path: path.relative(process.cwd(), jsonPath),
    });
  }

  const runtimeArtifact = {
    trace_version: "1.0",
    execution_source: "ui-testing/scripts/run-remediation-pass.mjs",
    scope: args.scope,
    scenarios: executions,
    shared_runtime_limitations: [
      "Harness remediation execution is now available.",
      "Shared native runtime adoption is still pending.",
    ],
  };

  await fs.writeFile(outPath, `${JSON.stringify(runtimeArtifact, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${path.relative(process.cwd(), outPath)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
