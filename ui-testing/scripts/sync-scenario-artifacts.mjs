#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const scenariosDir = path.join(root, "scenarios");
const reportsDir = path.join(root, "reports", "scenarios");
const benchmarkRuntimePath = path.join(root, "reports", "benchmark-runtime.json");

const TRACE_VERSION = "1.0";
const ROUTE_ID = "ui-testing";
const ROUTE_COMMAND = "/ui-testing";
const EMISSION_SOURCE = "ui-testing/scripts/sync-scenario-artifacts.mjs";

const LANE_STATUS = {
  "local-authored": "active",
  stitch: "skipped-unavailable",
  "playwright-interactive": "pending-review",
};

const REMEDIATION_ROUTING = {
  "composition-balance": ["design-arrange", "design-typeset"],
  "composition-calibration": ["design-arrange", "design-typeset"],
  "layout-occupancy": ["design-arrange"],
  "mobile-recomposition": ["design-arrange"],
  "style-fidelity": ["design-distill", "design-polish"],
  "intensity-governance": ["design-distill", "design-bolder"],
  "luxury-operability": ["design-arrange", "design-polish"],
  "warning-governance": ["design-distill", "design-polish"],
  "texture-discipline": ["design-distill"],
  "style-geometry-coverage": ["design-bolder", "design-polish"],
};

const commonGaps = [
  {
    category: "component-atlas-coverage",
    severity: "medium",
    symptom: "The harness benchmarked full pages but did not originally include a first-class component atlas showing how each style treats buttons, inputs, chips, cards, rails, and interactive states.",
    likely_root_cause: "Foundry review has focused on full-surface composition more than cross-style component-system comparison.",
    foundry_owner_area: "design-system guidance / ui-testing",
    recommended_fix: "Add a first-class style atlas workflow that compares component behavior, geometry, state language, and density across style families alongside full-page fixtures."
  },
  {
    category: "style-geometry-coverage",
    severity: "medium",
    symptom: "The current harness over-indexed on hard-edge, low-radius component geometry and underrepresented rounded systems such as Material-style surfaces.",
    likely_root_cause: "The style catalog favored editorial, enterprise, and brutalist directions before adding a tactile rounded-system benchmark.",
    foundry_owner_area: "design datasets / style-selector",
    recommended_fix: "Expand canonical style coverage to include rounded, tactile systems and make geometry variation a first-class style-fidelity check."
  },
  {
    category: "texture-discipline",
    severity: "medium",
    symptom: "Background texture patterns were reused too freely as a quick way to differentiate surfaces, which made several pages feel templated instead of style-specific.",
    likely_root_cause: "The runtime and harness do not yet distinguish between a deliberate surface texture and a generic grid-overlay fallback.",
    foundry_owner_area: "design audit / visual direction",
    recommended_fix: "Teach design-audit to flag repeated texture overlays and require surface texture to be justified by the chosen style family."
  },
  {
    category: "style-catalog-normalization",
    severity: "medium",
    symptom: "The harness now depends on a large external style reference intake, but Foundry still lacks a first-class normalized style catalog that the design runtime can query directly.",
    likely_root_cause: "Style research is being normalized inside the repo harness instead of inside a reusable runtime data layer shared by design workflows.",
    foundry_owner_area: "design datasets / runtime data",
    recommended_fix: "Promote Design Prompts-style normalization into a first-class Foundry dataset pipeline with explicit source metadata, mappings, and anti-pattern fields."
  },
  {
    category: "style-fidelity-scoring",
    severity: "medium",
    symptom: "The harness can describe style drift, but style fidelity still depends on manually assigned scorecard numbers rather than a runtime scoring dimension.",
    likely_root_cause: "Foundry QA primitives capture evidence and screenshots, but they do not yet score whether a surface remained faithful to a restrained, editorial, industrial, or other chosen style family.",
    foundry_owner_area: "design audit / scoring",
    recommended_fix: "Add style-fidelity checks to design-audit and the UI harness so each scenario can fail when it drifts back to generic product defaults."
  },
  {
    category: "runtime-provenance",
    severity: "medium",
    symptom: "The UI harness can now emit derived runtime traces, but Foundry's underlying design runtime still does not natively emit first-class provenance for style selection, exclusions, remediation steps, and dataset usage.",
    likely_root_cause: "Benchmark routing can derive trace artifacts from scenario contracts, but the design engine itself still lacks a runtime-native provenance layer.",
    foundry_owner_area: "design-engine runtime",
    recommended_fix: "Promote prompt-trace generation into the core design runtime and attach dataset ids, exclusions, remediation skills, and style reference ids automatically."
  },
  {
    category: "design-command-orchestration",
    severity: "medium",
    symptom: "The UI harness can now derive remediation routing, but Foundry still lacks a native runtime that executes second-pass design remediation automatically after a weak first pass.",
    likely_root_cause: "Foundry has a command layer for design remediation and harness-level routing, but no shared runtime that can diagnose a surface and execute the right second-pass skills end-to-end.",
    foundry_owner_area: "design-engine runtime / workflow routing",
    recommended_fix: "Add a first-class design remediation runtime that chains audit, layout repair, typography repair, intensity adjustment, simplification, and polish with explicit execution traces."
  },
  {
    category: "workflow-surface",
    severity: "medium",
    symptom: "Foundry now has a first-class ui-testing route and a single benchmark runner, but the execution path still lives in repo-local harness scripts instead of a shared Foundry runtime or CLI executor.",
    likely_root_cause: "Workflow routing and runner consolidation exist, but the benchmark runtime is still implemented in repo-local scripts rather than a reusable shared execution layer.",
    foundry_owner_area: "workflow routing / CLI",
    recommended_fix: "Promote the repo-local benchmark runner into a native ui-testing runtime or CLI surface that the shared route can execute directly."
  },
  {
    category: "responsive-scoring",
    severity: "medium",
    symptom: "Responsive quality is visible in screenshots but not automatically scored by existing Foundry QA primitives.",
    likely_root_cause: "Web QA captures evidence but lacks a built-in rubric for mobile re-composition quality.",
    foundry_owner_area: "web QA / scoring",
    recommended_fix: "Add viewport-aware scoring hooks and responsive heuristics to the harness workflow."
  }
];

const scenarioMeta = {
  "atelier-stay": {
    research_refs: ["design-prompts-style-reference", "figma-better-ai-prompts", "vercel-design-systems"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 4, style: 5, composition: 4, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "composition-balance",
        severity: "medium",
        symptom: "The first atelier-stay layout let the hero headline dominate the spread so heavily that the supporting editorial modules looked underweighted until the type scale and column proportions were manually rebalanced.",
        likely_root_cause: "Foundry can produce technically valid editorial grids without checking whether headline mass and adjacent module density stay in visual parity.",
        foundry_owner_area: "design remediation / composition guidance",
        recommended_fix: "Add composition-balance checks to design-audit so oversized editorial headlines and underweighted companion columns fail review before screenshots are approved."
      }
    ]
  },
  "wealth-ops": {
    research_refs: ["design-prompts-style-reference", "vercel-design-systems", "google-a2ui", "figma-better-ai-prompts"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 5, style: 5, composition: 4, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "composition-calibration",
        severity: "medium",
        symptom: "The first remediated wealth-ops pass still produced an optical collision between the left control rail and the main hero canvas even though the CSS grid itself was valid.",
        likely_root_cause: "The harness and remediation loop do not yet score composition balance, rail-to-canvas tension, or headline collision risk as first-class review criteria.",
        foundry_owner_area: "design remediation / scoring",
        recommended_fix: "Add optical-collision and composition-balance checks to design-audit and the UI harness so dense layouts can fail before screenshots are approved."
      },
      {
        category: "mobile-recomposition",
        severity: "high",
        symptom: "The wealth-ops mobile view initially read like a compressed desktop stack instead of a staged mobile command surface with reprioritized sections and tighter action flow.",
        likely_root_cause: "The fixture and harness do not yet enforce mobile-first re-composition rules for dense operational surfaces, so desktop zones simply collapse into one long feed.",
        foundry_owner_area: "design remediation / responsive guidance",
        recommended_fix: "Add mobile re-staging checks to design-arrange and the UI harness so dense dashboards must reorder, compress, or defer sections instead of only stacking them."
      }
    ]
  },
  "coach-loop": {
    research_refs: ["design-prompts-style-reference", "figma-better-ai-prompts", "vercel-design-systems"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 5, style: 5, composition: 5, occupancy: 4, mobile: 4 },
    gaps: [
      {
        category: "layout-occupancy",
        severity: "high",
        symptom: "The first coach-loop desktop shell reserved a full right-side grid track with no mounted content, creating a large dead zone until the shell structure was manually corrected.",
        likely_root_cause: "Foundry can validate CSS structure and visual style without checking whether major grid tracks are actually occupied by meaningful interface content.",
        foundry_owner_area: "design remediation / layout audit",
        recommended_fix: "Add layout-occupancy checks to design-audit and the UI harness so empty reserved rails or underfilled desktop columns fail review."
      }
    ]
  },
  "field-notes": {
    research_refs: ["design-prompts-style-reference", "figma-make-designs-retrospective", "figma-better-ai-prompts"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 4, accessibility: 5, style: 5, composition: 4, occupancy: 4, mobile: 4 },
    gaps: [
      {
        category: "layout-occupancy",
        severity: "high",
        symptom: "The first field-notes desktop shell reserved a page-level track that read like accidental left-spacing waste until the shell structure was collapsed into one real page canvas.",
        likely_root_cause: "Foundry can generate a nominally complex shell without checking whether page-level grid tracks are actually used by mounted content.",
        foundry_owner_area: "design remediation / layout audit",
        recommended_fix: "Add page-shell occupancy checks so empty desktop tracks fail review before spacing debates start."
      }
    ]
  },
  "pulse-festival": {
    research_refs: ["design-prompts-style-reference", "google-a2ui", "figma-better-ai-prompts"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 4, style: 5, composition: 4, occupancy: 4, mobile: 4 },
    gaps: [
      {
        category: "layout-occupancy",
        severity: "high",
        symptom: "The first pulse-festival desktop shell also reserved a dead page-level track, so the left-side hero felt like a spacing bug instead of intentional poster composition.",
        likely_root_cause: "The current audit loop does not distinguish between deliberate negative space and a shell grid that has no real peer content mounted into a reserved track.",
        foundry_owner_area: "design remediation / layout audit",
        recommended_fix: "Teach design-audit to fail poster-style shells when the page-level right track is empty instead of structurally counterweighted."
      }
    ]
  },
  "saas-foundry": {
    research_refs: ["design-prompts-style-reference", "vercel-design-systems", "figma-better-ai-prompts"],
    scores: { design: 4, anti: 4, responsive: 4, interaction: 5, accessibility: 5, style: 4, composition: 4, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "style-fidelity",
        severity: "medium",
        symptom: "Minimal SaaS surfaces remain vulnerable to collapsing into generic shadcn-like shells unless the preview lane and command ribbon are explicitly designed as product proof, not decorative support.",
        likely_root_cause: "Foundry has stronger anti-slop coverage for editorial or high-contrast surfaces than for deliberately restrained SaaS product language.",
        foundry_owner_area: "style-selector / screen-brief",
        recommended_fix: "Add stronger style-fidelity checks for restrained SaaS directions so generic startup fallback fails even when the UI is clean."
      }
    ]
  },
  "maison-prive": {
    research_refs: ["design-prompts-style-reference", "figma-better-ai-prompts", "figma-make-designs-retrospective"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 4, accessibility: 4, style: 5, composition: 4, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "luxury-operability",
        severity: "medium",
        symptom: "Luxury concierge surfaces still need stronger heuristics for coupling narrative atmosphere to itinerary and host actions so they do not drift into static premium storytelling.",
        likely_root_cause: "Foundry’s current luxury-adjacent guidance is stronger on mood than on operational service design.",
        foundry_owner_area: "design-engine direction / screen-brief",
        recommended_fix: "Expand service-led luxury patterns so host itineraries, rate ledgers, and request actions are first-class design moves."
      }
    ]
  },
  "neo-market": {
    research_refs: ["design-prompts-style-reference", "figma-better-ai-prompts", "google-a2ui"],
    scores: { design: 4, anti: 4, responsive: 4, interaction: 5, accessibility: 4, style: 5, composition: 4, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "intensity-governance",
        severity: "medium",
        symptom: "Neo-brutalist product surfaces can lose operability quickly if loud labels and offset stacks are not explicitly bounded around the transaction path.",
        likely_root_cause: "Foundry does not yet encode enough guardrails for high-intensity styles that must still preserve marketplace or commerce clarity.",
        foundry_owner_area: "design-audit / style-selector",
        recommended_fix: "Add intensity-governance checks that verify loud styles still preserve the primary transaction path and do not bury critical actions."
      }
    ]
  },
  "terminal-cloud": {
    research_refs: ["design-prompts-style-reference", "google-a2ui", "vercel-design-systems"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 5, style: 5, composition: 5, occupancy: 5, mobile: 4 },
    gaps: []
  },
  "plant-ops": {
    research_refs: ["design-prompts-style-reference", "google-a2ui", "figma-better-ai-prompts"],
    scores: { design: 5, anti: 5, responsive: 4, interaction: 5, accessibility: 5, style: 5, composition: 5, occupancy: 5, mobile: 4 },
    gaps: [
      {
        category: "warning-governance",
        severity: "medium",
        symptom: "Industrial control surfaces need better guardrails for warning-state density so risk colors do not flatten the hierarchy when several maintenance signals are active at once.",
        likely_root_cause: "Foundry has not yet encoded a dedicated industrial warning strategy beyond generic enterprise severity treatments.",
        foundry_owner_area: "design-engine direction / audit",
        recommended_fix: "Add industrial warning-state heuristics that separate watch, hold, and stop conditions through structure as well as color."
      }
    ]
  }
};

function unique(values) {
  return [...new Set(values)];
}

function titleCase(id) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseArgs(argv) {
  const args = { scenario: null, scope: "full-suite" };
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
      continue;
    }
    if (arg.startsWith("--scope=")) {
      args.scope = arg.slice("--scope=".length) || args.scope;
    }
  }
  return args;
}

function laneStatus(lane) {
  return LANE_STATUS[lane] || "planned";
}

function laneResults(scenario) {
  return scenario.benchmark_lanes.map((lane) => ({
    lane,
    status: laneStatus(lane),
  }));
}

function remediationStepsForScenario(scenario, meta) {
  const triggeredBySkill = new Map();
  for (const gap of meta.gaps) {
    const skills = REMEDIATION_ROUTING[gap.category] || [];
    for (const skill of skills) {
      const current = triggeredBySkill.get(skill) || [];
      current.push(gap.category);
      triggeredBySkill.set(skill, unique(current));
    }
  }

  const orderedSkills = [
    "design-audit",
    "design-arrange",
    "design-typeset",
    "design-bolder",
    "design-distill",
    "design-polish",
    "playwright-web-qa",
    "ui-testing-harness",
  ];

  return orderedSkills.map((skill, index) => {
    if (skill === "design-audit") {
      return {
        order: index + 1,
        skill,
        status: "required",
        triggered_by: unique([
          ...scenario.desktop_failure_checks,
          ...scenario.mobile_expectations,
          ...scenario.acceptance_checks,
        ]),
        rationale: "Audit the scenario against its desktop failure checks, mobile expectations, and acceptance checks before any second-pass remediation.",
      };
    }

    if (skill === "playwright-web-qa") {
      return {
        order: index + 1,
        skill,
        status: "required",
        triggered_by: ["refresh deterministic browser evidence after remediation"],
        rationale: "Capture post-remediation screenshots, snapshots, and execution evidence before summarizing the scenario.",
      };
    }

    if (skill === "ui-testing-harness") {
      return {
        order: index + 1,
        skill,
        status: "required",
        triggered_by: ["refresh scorecards, reports, and repeated-gap summary"],
        rationale: "Update the benchmark outputs and consolidated Foundry gap summary after the evidence pass.",
      };
    }

    const categories = triggeredBySkill.get(skill) || [];
    return {
      order: index + 1,
      skill,
      status: categories.length > 0 ? "required" : "standby",
      triggered_by: categories,
      rationale:
        categories.length > 0
          ? `Selected automatically from scenario gap categories: ${categories.join(", ")}.`
          : "Not selected by current scenario gaps, but available if browser review surfaces additional issues in this style family.",
    };
  });
}

function buildBrief(scenario) {
  const lines = [];
  lines.push(`# ${titleCase(scenario.id)} Brief`);
  lines.push("");
  lines.push(`- Goal: benchmark whether Foundry can express a ${scenario.topic} without collapsing into the scenario's banned defaults.`);
  lines.push(`- Style reference: \`${scenario.style_reference_id}\``);
  lines.push(`- Direction: \`${scenario.primary_style_direction}\``);
  lines.push(`- Motif: \`${scenario.supporting_motif}\``);
  lines.push(`- Layout: \`${scenario.layout_pattern}\``);
  lines.push(`- Complexity tier: \`${scenario.complexity_tier}\``);
  lines.push("- Anti-slop constraints:");
  for (const item of scenario.anti_slop_constraints) lines.push(`  - ${item}`);
  lines.push("- Required interactions:");
  for (const item of scenario.interactive_states) lines.push(`  - ${item}`);
  return `${lines.join("\n")}\n`;
}

function buildRuntimeTrace(scenario, meta) {
  return {
    trace_version: TRACE_VERSION,
    route: {
      id: ROUTE_ID,
      command: ROUTE_COMMAND,
      scope: "scenario",
    },
    emission_source: EMISSION_SOURCE,
    provenance_status: "derived-harness-runtime",
    scenario_contract: {
      manifest_path: `ui-testing/scenarios/${scenario.id}.json`,
      topic: scenario.topic,
      surface_type: scenario.surface_type,
      complexity_tier: scenario.complexity_tier,
      style_reference_id: scenario.style_reference_id,
      dataset_ids: {
        style_direction: scenario.primary_style_direction,
        supporting_motif: scenario.supporting_motif,
        layout_pattern: scenario.layout_pattern,
      },
      exclusions: scenario.anti_slop_constraints,
    },
    design_inputs: {
      must_include: scenario.must_include,
      interactive_states: scenario.interactive_states,
      desktop_failure_checks: scenario.desktop_failure_checks,
      mobile_expectations: scenario.mobile_expectations,
      acceptance_checks: scenario.acceptance_checks,
      normalized_research_refs: meta.research_refs,
    },
    lanes: laneResults(scenario),
    remediation_plan: remediationStepsForScenario(scenario, meta),
    runtime_limitations: [
      "The harness now emits deterministic benchmark traces, but Foundry's core design runtime still does not natively emit this provenance.",
      "Remediation routing is derived automatically here, but execution still depends on downstream workflow support rather than a shared native remediation executor.",
    ],
  };
}

function buildPromptTrace(scenario, meta) {
  const runtimeTrace = buildRuntimeTrace(scenario, meta);
  return {
    scenario_id: scenario.id,
    style_reference_id: scenario.style_reference_id,
    dataset_ids: runtimeTrace.scenario_contract.dataset_ids,
    research_refs: meta.research_refs,
    excluded_cliches: scenario.anti_slop_constraints,
    intended_skill_sequence: [
      "design-context-capture",
      "frontend-design-style-selector",
      "frontend-design-system",
      "frontend-design-screen-brief",
      "frontend-design",
      "design-audit",
      "frontend-design-mobile-patterns",
      "playwright-web-qa",
      "ui-testing-harness"
    ],
    remediation_skill_sequence: runtimeTrace.remediation_plan
      .filter((step) => step.status === "required")
      .map((step) => step.skill),
    benchmark_lane_results: runtimeTrace.lanes,
    runtime_trace: runtimeTrace,
    fixture_stack: "static-html",
    trace_generated_from_runtime: true
  };
}

function buildScorecard(scenario, meta) {
  const remediationTrace = remediationStepsForScenario(scenario, meta);
  const remediationSkills = remediationTrace
    .filter((step) => step.status === "required")
    .map((step) => step.skill);

  return {
    scenario_id: scenario.id,
    style_reference_id: scenario.style_reference_id,
    build_status: "reviewed-remediated-local-fixture",
    design_intent_score: meta.scores.design,
    anti_slop_score: meta.scores.anti,
    responsive_score: meta.scores.responsive,
    interaction_score: meta.scores.interaction,
    accessibility_score: meta.scores.accessibility,
    style_fidelity_score: meta.scores.style,
    composition_balance_score: meta.scores.composition,
    layout_occupancy_score: meta.scores.occupancy,
    mobile_recomposition_score: meta.scores.mobile,
    skills_exercised: [...new Set([...scenario.skills_required, ...remediationSkills])],
    benchmark_lane_results: laneResults(scenario),
    remediation_trace: remediationTrace,
    artifact_paths: [
      `ui-testing/scenarios/${scenario.id}.json`,
      `ui-testing/charters/${scenario.id}.yaml`,
      `ui-testing/fixtures/${scenario.id}/index.html`,
      `ui-testing/reports/scenarios/${scenario.id}/brief.md`,
      `ui-testing/reports/scenarios/${scenario.id}/prompt-trace.json`,
      `ui-testing/reports/scenarios/${scenario.id}/desktop.png`,
      `ui-testing/reports/scenarios/${scenario.id}/mobile-state.png`,
      `ui-testing/reports/scenarios/${scenario.id}/interactive-snapshot.md`
    ],
    gaps: [...commonGaps, ...meta.gaps]
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarioFiles = (await fs.readdir(scenariosDir))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .filter((file) => (args.scenario ? file === `${args.scenario}.json` : true));

  if (args.scenario && scenarioFiles.length === 0) {
    throw new Error(`Unknown scenario '${args.scenario}'`);
  }

  const refreshed = [];

  for (const file of scenarioFiles) {
    const scenario = JSON.parse(await fs.readFile(path.join(scenariosDir, file), "utf8"));
    const meta = scenarioMeta[scenario.id];
    if (!meta) {
      throw new Error(`Missing scenario meta for ${scenario.id}`);
    }

    const outDir = path.join(reportsDir, scenario.id);
    const remediationTrace = remediationStepsForScenario(scenario, meta);

    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "brief.md"), buildBrief(scenario), "utf8");
    await fs.writeFile(path.join(outDir, "prompt-trace.json"), `${JSON.stringify(buildPromptTrace(scenario, meta), null, 2)}\n`, "utf8");
    await fs.writeFile(path.join(outDir, "scorecard.json"), `${JSON.stringify(buildScorecard(scenario, meta), null, 2)}\n`, "utf8");

    try {
      await fs.access(path.join(outDir, "interactive-snapshot.md"));
    } catch {
      await fs.writeFile(path.join(outDir, "interactive-snapshot.md"), `Interactive snapshot pending browser capture for ${scenario.id}.\n`, "utf8");
    }

    refreshed.push({
      scenario_id: scenario.id,
      trace_path: `ui-testing/reports/scenarios/${scenario.id}/prompt-trace.json`,
      scorecard_path: `ui-testing/reports/scenarios/${scenario.id}/scorecard.json`,
      remediation_required: remediationTrace
        .filter((step) => step.status === "required" && !["design-audit", "playwright-web-qa", "ui-testing-harness"].includes(step.skill))
        .map((step) => step.skill),
    });
  }

  await fs.writeFile(
    benchmarkRuntimePath,
    `${JSON.stringify(
      {
        trace_version: TRACE_VERSION,
        route: {
          id: ROUTE_ID,
          command: ROUTE_COMMAND,
          scope: args.scope,
        },
        emission_source: EMISSION_SOURCE,
        scenarios_refreshed: refreshed,
        atlas_required: args.scope !== "targeted",
        report_targets: [
          "ui-testing/reports/ui-testing-gap-report.md",
          "ui-testing/reports/ui-testing-gap-report.json",
          "ui-testing/reports/foundry-ui-benchmark-final-report.md",
          "docs/foundry-real-world-gaps.md",
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
