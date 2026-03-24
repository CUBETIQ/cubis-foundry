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

- Status: partial on March 24, 2026
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
  - native second-pass execution is still pending in the shared runtime

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

- Owner area: design audit / scoring
- Dependencies: Task 3
- Deliverables:
  - style-family-aware scoring logic
- Verification:
  - generic fallback can fail benchmark review automatically

### Task 5. Add layout-occupancy and optical-collision checks

- Owner area: design audit / layout review
- Dependencies: Task 3
- Deliverables:
  - shell-track occupancy checks
  - collision-risk heuristics
- Verification:
  - earlier `coach-loop`, `field-notes`, `pulse-festival`, and `atelier-stay` failures would be caught automatically

### Task 6. Add atlas-required benchmark support

- Owner area: design-system guidance / ui-testing
- Dependencies: Task 1
- Deliverables:
  - atlas presence checks
  - atlas route awareness
  - atlas screenshot/note expectations
- Verification:
  - benchmark run fails when atlas artifacts are missing

## `P1` Responsive And Component-System Quality

### Task 7. Add mobile-recomposition scoring

- Owner area: web QA / scoring
- Dependencies: Task 1
- Deliverables:
  - viewport-aware responsive checks
- Verification:
  - stack-only mobile layouts can fail automatically

### Task 8. Add texture-discipline and geometry-coverage scoring

- Owner area: design audit / visual direction
- Dependencies: Task 4
- Deliverables:
  - repeated texture fallback detection
  - low geometry diversity detection
- Verification:
  - repeated grid-overlay use and overuse of sharp-corner geometry become explicit findings

### Task 9. Add explicit component-system reporting

- Owner area: ui-testing / reporting
- Dependencies: Task 6, Task 8
- Deliverables:
  - component-system summary output separate from page-shell findings
- Verification:
  - reports distinguish component-language failures from composition failures

## `P1` Datasets

### Task 10. Promote style-reference normalization into runtime datasets

- Owner area: design datasets / runtime data
- Dependencies: none
- Deliverables:
  - runtime-readable style-reference catalog
- Verification:
  - design workflows can query normalized style-reference data directly

### Task 11. Expand rounded/tactile coverage

- Owner area: design datasets / style-selector
- Dependencies: Task 10
- Deliverables:
  - rounded/material-like direction support
  - tactile motifs and atlas-aligned layout coverage
- Verification:
  - style selector can choose rounded/tactile systems without bespoke local setup

## `P2` Benchmark Lane Maturity

### Task 12. Formalize lane orchestration

- Owner area: workflow routing / comparison lanes
- Dependencies: Task 1
- Deliverables:
  - explicit support for `local-authored`, `stitch`, and `playwright-interactive`
- Verification:
  - lane state is generated uniformly in reports and scorecards
