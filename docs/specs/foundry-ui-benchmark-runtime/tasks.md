# Tasks

## `P0` Workflow Runtime

### Task 1. Create a first-class `ui-testing` workflow

- Status: completed on March 24, 2026
- Owner area: workflow routing / CLI
- Dependencies: none
- Deliverables:
  - benchmark entrypoint
  - route/status execution
  - screenshot capture
  - scorecard/report refresh
  - atlas artifact handling
- Verification:
  - one command runs the benchmark suite
- Implementation notes:
  - shared workflow route added at `workflows/workflows/agent-environment-setup/shared/workflows/ui-testing.md`
  - route contract now requires scenario refresh, atlas validation, and consolidated report regeneration
  - repo-local executor added at `ui-testing/scripts/run-benchmark.mjs`

### Task 2. Create guided remediation routing

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design-engine runtime / workflow routing
- Dependencies: Task 1
- Deliverables:
  - audit-first routing
  - remediation-step selection
  - remediation trace emission
- Verification:
  - failed fixtures can be re-run through guided second pass behavior
- Implementation notes:
  - harness runtime now derives remediation routing and emits `remediation_trace` into scenario artifacts
  - harness runtime now executes remediation passes through `ui-testing/scripts/run-remediation-pass.mjs`
  - shared native second-pass execution is still pending outside the harness layer

### Task 3. Emit runtime provenance

- Status: completed on March 24, 2026
- Owner area: design-engine runtime
- Dependencies: Task 1
- Deliverables:
  - style, motif, layout, exclusions, and remediation trace output
- Verification:
  - scenario trace files can be generated from runtime output
- Implementation notes:
  - `ui-testing/scripts/sync-scenario-artifacts.mjs` now emits runtime-derived `prompt-trace.json` and top-level `benchmark-runtime.json`

## `P0` Audit And Scoring

### Task 4. Add style-fidelity scoring

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design audit / scoring
- Dependencies: Task 3
- Deliverables:
  - style-family-aware scoring logic
- Verification:
  - generic fallback can fail benchmark review automatically
- Implementation notes:
  - `ui-testing/scripts/lib/benchmark-analysis.mjs` now emits style-family-aware heuristic scores
  - `ui-testing/scripts/sync-scenario-artifacts.mjs` writes analyzer-driven `style_fidelity_score` values into scorecards

### Task 5. Add layout-occupancy and optical-collision checks

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design audit / layout review
- Dependencies: Task 3
- Deliverables:
  - shell-track occupancy checks
  - collision-risk heuristics
- Verification:
  - earlier `coach-loop`, `field-notes`, `pulse-festival`, and `atelier-stay` failures would be caught automatically
- Implementation notes:
  - benchmark analysis now scores page-shell occupancy and optical-collision risk
  - scenario scorecards emit `layout_occupancy_score`, `composition_balance_score`, and analyzer signals for shell waste and headline risk

### Task 6. Add atlas-required benchmark support

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design-system guidance / ui-testing
- Dependencies: Task 1
- Deliverables:
  - atlas presence checks
  - atlas route awareness
  - atlas screenshot/note expectations
- Verification:
  - benchmark run fails when atlas artifacts are missing
- Implementation notes:
  - `ui-testing/scripts/run-benchmark.mjs` now validates atlas artifacts during benchmark execution
  - aggregate reporting surfaces atlas and component-system artifacts as required supplementary outputs

## `P1` Responsive And Component-System Quality

### Task 7. Add mobile-recomposition scoring

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: web QA / scoring
- Dependencies: Task 1
- Deliverables:
  - viewport-aware responsive checks
- Verification:
  - stack-only mobile layouts can fail automatically
- Implementation notes:
  - benchmark analysis now emits `mobile_recomposition_score` and `responsive_score`
  - stack-only mobile behavior is recorded as an analyzer-backed scenario gap

### Task 8. Add texture-discipline and geometry-coverage scoring

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design audit / visual direction
- Dependencies: Task 4
- Deliverables:
  - repeated texture fallback detection
  - low geometry diversity detection
- Verification:
  - repeated grid-overlay use and overuse of sharp-corner geometry become explicit findings
- Implementation notes:
  - scorecards now emit `texture_discipline_score` and `geometry_coverage_score`
  - `style-atlas` analysis now separates rounded and hard-edge lanes in `component-system-summary.*`

### Task 9. Add explicit component-system reporting

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: ui-testing / reporting
- Dependencies: Task 6, Task 8
- Deliverables:
  - component-system summary output separate from page-shell findings
- Verification:
  - reports distinguish component-language failures from composition failures
- Implementation notes:
  - component reporting now exists at `ui-testing/reports/component-system-summary.md`
  - aggregate reporting treats atlas geometry review as separate from page-shell review

## `P1` Datasets

### Task 10. Promote style-reference normalization into runtime datasets

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design datasets / runtime data
- Dependencies: none
- Deliverables:
  - runtime-readable style-reference catalog
- Verification:
  - design workflows can query normalized style-reference data directly
- Implementation notes:
  - `ui-testing/scripts/sync-runtime-datasets.mjs` now writes `workflows/design-datasets/style-reference-catalog.json`

### Task 11. Expand rounded/tactile coverage

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: design datasets / style-selector
- Dependencies: Task 10
- Deliverables:
  - rounded/material-like direction support
  - tactile motifs and atlas-aligned layout coverage
- Verification:
  - style selector can choose rounded/tactile systems without bespoke local setup
- Implementation notes:
  - `material-expressive` and matching motif/layout coverage are present in the canonical design datasets
  - the atlas now benchmarks rounded, hard-edge, and tactile component language side by side

## `P2` Benchmark Lane Maturity

### Task 12. Formalize lane orchestration

- Status: completed on March 25, 2026 at the harness-runtime layer
- Owner area: workflow routing / comparison lanes
- Dependencies: Task 1
- Deliverables:
  - explicit support for `local-authored`, `stitch`, and `playwright-interactive`
- Verification:
  - lane state is generated uniformly in reports and scorecards
- Implementation notes:
  - scorecards and benchmark runtime artifacts now emit consistent lane status for `local-authored`, `stitch`, and `playwright-interactive`
