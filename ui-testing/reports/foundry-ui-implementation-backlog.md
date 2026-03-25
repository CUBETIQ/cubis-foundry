# Foundry UI Implementation Backlog

Date: March 25, 2026

This backlog converts the current UI benchmark findings into execution-ready work for Foundry.

## Priority Definitions

- `P0` = required to make the UI benchmark system trustworthy
- `P1` = required to make the benchmark system useful at scale
- `P2` = quality multipliers after the core system is stable

## 1. Workflow Runtime

### `P0` Add a first-class `ui-testing` workflow

- Owner area: workflow routing / CLI
- Status: route and single runner complete, native shared executor pending
- Problem:
  - the current harness now has a shared route and a single runner, but execution is still repo-local, script-backed, and not yet shared-runtime-native
- Deliverable:
  - one canonical workflow or CLI path that runs:
    - scenario selection
    - fixture serving or route checks
    - screenshot capture
    - atlas capture
    - scorecard sync
    - consolidated report generation
- Acceptance criteria:
  - one command runs the benchmark suite end-to-end
  - scorecards and consolidated report update without manual file coordination
  - the workflow knows about the supplementary `style-atlas` artifact

### `P0` Add a guided design remediation workflow

- Owner area: design-engine runtime / workflow routing
- Status: harness-runtime execution complete, shared runtime adoption pending
- Problem:
  - `design-audit`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, and `design-polish` no longer require manual routing inside the harness, but shared runtime ownership is still missing
- Deliverable:
  - a remediation runtime that starts from `design-audit` and routes to the right second-pass skills automatically
- Acceptance criteria:
  - one failed fixture can be re-run through a guided second pass
  - remediation steps are emitted as structured trace data
  - the runtime can distinguish composition, typography, intensity, clutter, and polish issues

### `P1` Add benchmark-lane orchestration

- Owner area: workflow routing / comparison lanes
- Status: harness-runtime orchestration complete
- Problem:
  - `local-authored`, `stitch`, and `playwright-interactive` lanes now exist in scorecards and benchmark runtime artifacts, but shared runtime ownership is still absent
- Deliverable:
  - lane-aware benchmark execution and reporting
- Acceptance criteria:
  - lane status is produced automatically in scorecards
  - unavailable lanes are recorded explicitly without blocking the full benchmark

## 2. Runtime Provenance And Reporting

### `P0` Emit prompt trace and dataset provenance from runtime

- Owner area: design-engine runtime
- Status: harness-runtime emission complete, native design-runtime emission pending
- Problem:
  - `prompt-trace.json` is still authored by harness scripts instead of the design runtime
- Deliverable:
  - runtime-emitted provenance for:
    - style direction
    - motif
    - layout pattern
    - style reference id
    - exclusions
    - remediation skills
- Acceptance criteria:
  - design-heavy runs emit structured provenance automatically
  - harness scripts no longer need to fabricate trace content by hand

### `P1` Add atlas-aware consolidated reporting

- Owner area: reporting / ui-testing
- Status: harness-runtime reporting complete
- Problem:
  - component-system review is now required, and the harness emits it correctly, but broader Foundry report surfaces still assume page-fixture-first reporting
- Deliverable:
  - reporting schema that treats the atlas as a first-class harness artifact
- Acceptance criteria:
  - final report always states atlas presence
  - atlas route, note, and screenshot are visible in aggregate outputs

## 3. Design Audit And Scoring

### `P0` Add style-fidelity scoring to `design-audit`

- Owner area: design audit / scoring
- Status: harness-runtime scoring complete, shared `design-audit` adoption pending
- Problem:
  - style fidelity is no longer manual in the harness, but the scoring logic still lives in benchmark analysis rather than shared `design-audit`
- Deliverable:
  - explicit style-family-aware scoring inside `design-audit`
- Acceptance criteria:
  - restrained SaaS, editorial, luxury, terminal, industrial, and brutalist directions can fail for style drift
  - fallback to generic startup, generic enterprise BI, or generic premium styling is scored as a failure

### `P0` Add layout-occupancy and optical-collision checks

- Owner area: design audit / layout review
- Status: harness-runtime scoring complete, shared `design-audit` adoption pending
- Problem:
  - dead desktop tracks and visual collisions no longer rely on manual browser review in the harness, but shared audit primitives still do not expose these checks
- Deliverable:
  - formal audit checks for:
    - empty page-level rails or columns
    - giant headline collisions
    - weak seam definition
- Acceptance criteria:
  - fixtures like the first `coach-loop`, `field-notes`, `pulse-festival`, and `atelier-stay` would fail automatically

### `P1` Add mobile-recomposition scoring

- Owner area: web QA / responsive scoring
- Status: harness-runtime scoring complete, shared QA adoption pending
- Problem:
  - the harness can now tell real re-staging from desktop stacking heuristically, but shared QA primitives still do not expose this scoring
- Deliverable:
  - viewport-aware responsive scoring hooks
- Acceptance criteria:
  - dense mobile flows such as `wealth-ops` can be flagged for stack-only behavior
  - scorecards expose mobile recomposition as a computed signal, not just a manual note

### `P1` Add texture-discipline and geometry-coverage checks

- Owner area: design audit / visual direction
- Status: harness-runtime scoring complete
- Problem:
  - repeated grid overlays and repeated hard-edge geometry are now benchmarked, but the shared design runtime has not adopted those checks yet
- Deliverable:
  - checks for:
    - unjustified repeated background textures
    - low geometry diversity across style families
- Acceptance criteria:
  - repeated box/grid overlays fail unless justified by the selected style
  - the system can detect when multiple style families share effectively the same component geometry

## 4. Design Datasets And Style Catalog

### `P0` Promote external style normalization into runtime datasets

- Owner area: design datasets / runtime data
- Status: harness-runtime dataset complete
- Problem:
  - Design Prompts normalization now reaches a runtime-readable dataset, but shared design workflows have not adopted it yet
- Deliverable:
  - a runtime-native style catalog pipeline with source metadata, anti-patterns, and Foundry mappings
- Acceptance criteria:
  - design workflows can read normalized style-reference data directly
  - research intake is not trapped inside `ui-testing/research/`

### `P1` Expand canonical rounded-system coverage

- Owner area: design datasets / style-selector
- Status: dataset expansion complete
- Problem:
  - rounded and tactile systems are now represented in datasets and atlas coverage, but selector/runtime usage needs broader adoption
- Deliverable:
  - canonical rounded-system support for:
    - Material-like surfaces
    - FABs
    - chips
    - sheets
    - tonal cards
- Acceptance criteria:
  - the style selector can intentionally choose rounded/tactile systems, not just hard-edge systems
  - benchmark fixtures and atlas lanes can use that direction without bespoke setup

### `P2` Expand motif and layout coverage for component-atlas work

- Owner area: design datasets
- Problem:
  - the atlas is now required, but dataset support for component-board review is still thin
- Deliverable:
  - more atlas-oriented layouts and component motifs
- Acceptance criteria:
  - component comparison no longer depends on one-off atlas composition

## 5. Benchmark Artifacts And QA

### `P0` Make `style-atlas` a first-class benchmark artifact in runtime

- Owner area: design-system guidance / ui-testing
- Status: harness-runtime artifact handling complete
- Problem:
  - the atlas is now documented, live, and enforced by the harness runtime, but shared runtime support is still implicit outside the benchmark executor
- Deliverable:
  - benchmark runtime knows it must check:
    - atlas route
    - atlas screenshot
    - atlas note
- Acceptance criteria:
  - benchmark runs fail if the atlas artifact package is missing
  - atlas review appears in final outputs automatically

### `P1` Add explicit component-system review output

- Owner area: ui-testing / QA
- Status: harness-runtime reporting complete
- Problem:
  - page mocks and atlas review are now separated in harness output, but broader Foundry outputs do not yet consume the component summary directly
- Deliverable:
  - a separate component-system summary in benchmark output
- Acceptance criteria:
  - reports distinguish page-shell failures from component-language failures
  - geometry, chips, sheets, and action clusters are reviewed explicitly

## 6. Recommended Delivery Sequence

1. `P0` Ship the first-class `ui-testing` workflow.
2. `P0` Promote harness remediation execution from `design-audit` into shared runtime support.
3. `P0` Emit runtime provenance and dataset trace data.
4. `P0` Promote harness scoring into shared `design-audit` and QA primitives.
5. `P0` Promote the atlas and benchmark runner from harness scope into shared runtime support.
6. `P0` Adopt the runtime style-reference catalog across shared design workflows.
7. `P1` Harden shared mobile-recomposition, geometry-coverage, and texture-discipline scoring.
8. `P1` Broaden rounded-system usage and benchmark-lane execution ownership across the shared runtime.
9. `P1` Feed dedicated component-system review outputs into broader Foundry reporting surfaces.
10. `P2` Expand atlas-oriented motifs and layouts once the core runtime is stable.

## Canonical References

- Final benchmark summary: `ui-testing/reports/foundry-ui-benchmark-final-report.md`
- Consolidated gap report: `ui-testing/reports/ui-testing-gap-report.md`
- Master Foundry gap log: `docs/foundry-real-world-gaps.md`
- Canonical design context: `docs/foundation/DESIGN.md`
