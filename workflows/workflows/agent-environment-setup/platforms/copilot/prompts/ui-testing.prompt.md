# Workflow Prompt: /ui-testing

Run the Foundry UI benchmark harness, refresh scenario evidence and atlas artifacts, and update the consolidated UI gap report.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ui-testing-harness`, `playwright-web-qa`, `playwright-interactive`, `design-context-capture`, `frontend-design-style-selector`, `frontend-design-system`, `frontend-design-screen-brief`, `frontend-design`, `design-audit`, `frontend-design-mobile-patterns`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, `design-polish`, `stitch-design-orchestrator`.
- Local skill file hints if installed: `.github/skills/ui-testing-harness/SKILL.md`, `.github/skills/playwright-web-qa/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/design-context-capture/SKILL.md`, `.github/skills/frontend-design-style-selector/SKILL.md`, `.github/skills/frontend-design-system/SKILL.md`, `.github/skills/frontend-design-screen-brief/SKILL.md`, `.github/skills/frontend-design/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# UI Testing Workflow

## When to use

Use when the goal is to benchmark Foundry's frontend design workflow across the canonical UI scenario matrix, capture browser evidence, and refresh the reports that drive Foundry fixes.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` confirms the benchmark scope, scenario matrix, atlas requirements, existing fixture state, and runtime prerequisites.
2. **Test**: `@tester` runs the harness flow, refreshes scenario artifacts, captures benchmark evidence, and records any blocked scenario or missing atlas artifact.
3. **Review**: `@reviewer` checks whether the scorecards, atlas artifacts, and consolidated reports support a Foundry-level verdict rather than a fixture-only summary.

## Skill Routing

- Primary skills: `ui-testing-harness`, `playwright-web-qa`
- Supporting skills (optional): `playwright-interactive`, `design-context-capture`, `frontend-design-style-selector`, `frontend-design-system`, `frontend-design-screen-brief`, `frontend-design`, `design-audit`, `frontend-design-mobile-patterns`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, `design-polish`, `stitch-design-orchestrator`

## Context notes

- Provide whether the run is full-suite or targeted, which scenarios are in scope, and whether remediation is allowed during the same pass.
- The route must treat `ui-testing/fixtures/style-atlas/` and its report artifacts as required benchmark inputs, not optional extras.
- Prefer repo-local benchmark artifacts under `ui-testing/` and report the exact file paths that were refreshed or left stale.

## Runtime contract

- Use the canonical scenario manifests under `ui-testing/scenarios/`.
- Treat `ui-testing/reports/scenarios/` as the per-scenario artifact root and `ui-testing/reports/ui-testing-gap-report.md` as the consolidated report target.
- Require `ui-testing/reports/style-atlas.md` and `ui-testing/reports/style-atlas-desktop.png` during full-suite benchmark runs.
- Prefer `node ui-testing/scripts/run-benchmark.mjs` as the repo-local benchmark executor when the route is operating against this repository.
- Route failed fixtures through `design-audit` first, then choose the targeted remediation step instead of applying generic polish.
- Refresh report-ready artifacts before summarizing findings.

## Workflow steps

1. Confirm the benchmark scope, route type, and whether the run includes remediation.
2. Load the canonical scenario matrix from `ui-testing/scenarios/` and the atlas expectations from the UI testing harness contract.
3. Refresh scenario artifacts with the benchmark sync path and ensure scorecards, prompt traces, and screenshots are current.
4. Verify the supplementary atlas artifact set and fail the route when required atlas outputs are missing.
5. If a scenario fails review, run `design-audit` and apply the most specific remediation route before the final evidence pass.
6. Regenerate the consolidated UI benchmark reports and summarize repeated Foundry gaps, blocked reasons, and next fixes.

## Verification

- The benchmark route touched the intended scenario set and reported which scenarios were refreshed.
- Atlas artifacts exist during a full-suite run.
- Scenario scorecards, atlas artifacts, and the consolidated report point to the same benchmark pass.
- The final report distinguishes fixture failures from repeated Foundry subsystem gaps.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: tester
  supporting_agents: [explorer, reviewer]
  benchmark_scope: <full-suite|targeted>
  scenarios_refreshed: [<scenario-id>]
  atlas_status: <present|missing|stale>
  artifacts: [<path>]
  blocked_reasons: [<string>] | []
  follow_up_items: [<string>] | []
```
