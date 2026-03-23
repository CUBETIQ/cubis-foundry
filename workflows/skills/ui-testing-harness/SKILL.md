---
name: ui-testing-harness
description: Use when building or reviewing a Foundry-owned UI evaluation harness, generating anti-slop web fixtures, scoring design outputs with deterministic evidence, or turning multi-scenario UI findings into concrete Foundry gaps.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# UI Testing Harness

## Purpose

Create a repeatable harness for evaluating whether Foundry can produce distinctive, testable UI work instead of generic AI-generated surfaces. This skill coordinates research normalization, scenario definition, runnable fixtures, Playwright evidence capture, score layering, and gap reporting so UI quality can be improved as a system rather than by one-off taste fixes.

## When to Use

- Creating a repo-local UI evaluation harness for web or webapp surfaces
- Turning anti-slop design goals into fixed scenarios, fixtures, and scorecards
- Reviewing whether `frontend-design`, Stitch flows, or related agents are producing distinctive interfaces
- Building a repeatable artifact trail for UI quality regressions
- Converting exploratory frontend experiments into concrete Foundry gaps and fixes

## Instructions

1. **Normalize research before execution** — Convert outside references into Foundry-owned notes or dataset entries because execution should depend on internal artifacts, not raw external pages.
2. **Treat the Design Prompts catalog as intake, not runtime source** — Digest style prompts into a normalized catalog with structural traits, exclusions, and candidate dataset ids because raw prompt payloads do not belong in the runtime path.
3. **Use a benchmark matrix, not one-off scenario picks** — Keep a stable canonical set of scenarios and style families because v2 comparison depends on repeated benchmark lanes rather than ad hoc taste checks.
4. **Define fixed scenarios before generating anything** — Lock the topic, style direction, supporting motif, layout pattern, anti-slop constraints, and acceptance checks because moving targets make UI quality impossible to compare across runs.
5. **Require complex surfaces** — Every benchmark fixture must have at least two meaningful operational zones and one real interaction panel because simple hero pages do not expose enough Foundry workflow signal.
6. **Choose one primary direction and one supporting motif per scenario** — Keep each fixture opinionated and bounded because piling on multiple vibes causes prompt drift and generic output.
7. **Route through the full Foundry UI stack** — Use `design-context-capture`, `frontend-design-style-selector`, `frontend-design-system`, `frontend-design-screen-brief`, `frontend-design`, `design-audit`, `frontend-design-mobile-patterns`, and `playwright-web-qa` as the baseline benchmark path because the harness should exercise the real workflow.
8. **Make the fixture runnable, not illustrative** — Build a local surface with at least one real interaction state because Playwright scoring needs observable UI transitions instead of screenshots alone.
9. **Author the screen brief and prompt trace together** — Record selected datasets, exclusions, style reference ids, and skill sequence because provenance is part of the quality contract for anti-slop UI work.
10. **Use the remediation command layer on failed fixtures** — After a weak first pass, run `design-audit` to diagnose and then use `design-typeset`, `design-arrange`, `design-bolder`, `design-distill`, or `design-polish` as targeted second-pass moves because “prompt harder” is not a reliable anti-slop workflow.
11. **Use `playwright-web-qa` for evidence capture** — Write a deterministic charter for each fixture because screenshots, DOM snapshots, and accessibility artifacts should be collected through the same QA path Foundry already supports.
12. **Use `playwright-interactive` selectively on dense scenarios** — Add a deeper browser lane for high-density operational surfaces because functional, visual, and accessibility evidence should converge where the benchmark is most demanding.
13. **Use `stitch-design-orchestrator` only as a comparison lane** — Treat Stitch as a sampled generation lane, not the primary benchmark source of truth, because the harness is testing Foundry’s workflow quality rather than outsourcing authorship.
14. **Score both aesthetics and operability** — Rate visual direction, motif consistency, responsiveness, accessibility, interaction clarity, style fidelity, composition balance, layout occupancy, and testability because a beautiful interface that cannot be validated is still a harness failure.
15. **Treat default-house-style fallback as a bug** — Call out unexplained typography, palette, layout, or motion drift because anti-slop work fails when the model or workflow quietly reverts to a generic template.
16. **Treat shell-track waste as a failure, not a spacing nit** — If a page-level grid reserves a major desktop column or rail without mounting meaningful content into it, the fixture fails layout occupancy review.
17. **Keep reports small but decision-ready** — Summarize the symptom, likely root cause, owner area, and fix because the end goal is to improve Foundry, not to produce decorative audit prose.
18. **Aggregate findings across scenarios** — Compare repeated failures across multiple fixtures because systemic gaps matter more than a single weak concept.
19. **Require a cross-style component atlas** — Maintain a `style-atlas` surface that compares geometry, chips, cards, inputs, tabs, action clusters, and Material-like rounded systems because page mocks alone are not enough to diagnose component-language drift.
20. **Separate harness artifacts from product docs** — Store scenarios, charters, fixtures, scorecards, and the atlas under `ui-testing/` because the harness itself should remain inspectable and rerunnable without polluting product docs.
21. **Promote only stable patterns into canonical gaps** — Add findings to the master Foundry gap log only after the symptom appears clearly in the harness because that log should track Foundry problems, not temporary taste debates.

## Output Format

Deliver:

1. Research intake summary
2. Scenario matrix with style reference ids and dataset ids
3. Fixture status and local run path
4. Style atlas status and artifact path
5. Evidence artifact paths
6. Scorecards and consolidated gap summary

## References

| File | Load when |
| --- | --- |
| `references/research-intake.md` | Normalizing Anthropic, Google, Vercel, Figma, or Design Prompts guidance into Foundry-owned notes or dataset entries. |
| `references/scenario-schema.md` | Defining the required fields for a scenario manifest, brief, charter, and prompt trace. |
| `references/scoring-rubric.md` | Scoring anti-slop quality, responsive behavior, interaction clarity, accessibility, and provenance. |
| `references/reporting-contract.md` | Writing scorecards, gap summaries, and the master report update without mixing product bugs and Foundry gaps. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-single-scenario.md` | Building and scoring one new web fixture from a fixed design direction. |
| `examples/02-batch-harness.md` | Running the full five-scenario harness and updating the consolidated gap report. |
