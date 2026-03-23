# Foundry UI Implementation Backlog

Date: March 23, 2026

This backlog converts the current UI benchmark findings into execution-ready work for Foundry.

## Priority Definitions

- `P0` = required to make the UI benchmark system trustworthy
- `P1` = required to make the benchmark system useful at scale
- `P2` = quality multipliers after the core system is stable

## 1. Workflow Runtime

### `P0` Add a first-class `ui-testing` workflow

- Owner area: workflow routing / CLI
- Problem:
  - the current harness is still folder-first and operator-driven
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
- Problem:
  - `design-audit`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, and `design-polish` still require manual routing
- Deliverable:
  - a remediation runtime that starts from `design-audit` and routes to the right second-pass skills automatically
- Acceptance criteria:
  - one failed fixture can be re-run through a guided second pass
  - remediation steps are emitted as structured trace data
  - the runtime can distinguish composition, typography, intensity, clutter, and polish issues

### `P1` Add benchmark-lane orchestration

- Owner area: workflow routing / comparison lanes
- Problem:
  - `local-authored`, `stitch`, and `playwright-interactive` lanes exist conceptually but are not orchestrated uniformly
- Deliverable:
  - lane-aware benchmark execution and reporting
- Acceptance criteria:
  - lane status is produced automatically in scorecards
  - unavailable lanes are recorded explicitly without blocking the full benchmark

## 2. Runtime Provenance And Reporting

### `P0` Emit prompt trace and dataset provenance from runtime

- Owner area: design-engine runtime
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
- Problem:
  - component-system review is now required, but many Foundry report surfaces still think only in terms of page fixtures
- Deliverable:
  - reporting schema that treats the atlas as a first-class harness artifact
- Acceptance criteria:
  - final report always states atlas presence
  - atlas route, note, and screenshot are visible in aggregate outputs

## 3. Design Audit And Scoring

### `P0` Add style-fidelity scoring to `design-audit`

- Owner area: design audit / scoring
- Problem:
  - style fidelity is currently judged manually
- Deliverable:
  - explicit style-family-aware scoring inside `design-audit`
- Acceptance criteria:
  - restrained SaaS, editorial, luxury, terminal, industrial, and brutalist directions can fail for style drift
  - fallback to generic startup, generic enterprise BI, or generic premium styling is scored as a failure

### `P0` Add layout-occupancy and optical-collision checks

- Owner area: design audit / layout review
- Problem:
  - dead desktop tracks and visual collisions still rely on manual browser review
- Deliverable:
  - formal audit checks for:
    - empty page-level rails or columns
    - giant headline collisions
    - weak seam definition
- Acceptance criteria:
  - fixtures like the first `coach-loop`, `field-notes`, `pulse-festival`, and `atelier-stay` would fail automatically

### `P1` Add mobile-recomposition scoring

- Owner area: web QA / responsive scoring
- Problem:
  - the harness captures mobile screenshots but cannot tell real re-staging from desktop stacking
- Deliverable:
  - viewport-aware responsive scoring hooks
- Acceptance criteria:
  - dense mobile flows such as `wealth-ops` can be flagged for stack-only behavior
  - scorecards expose mobile recomposition as a computed signal, not just a manual note

### `P1` Add texture-discipline and geometry-coverage checks

- Owner area: design audit / visual direction
- Problem:
  - repeated grid overlays and repeated hard-edge geometry became hidden defaults
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
- Problem:
  - Design Prompts normalization still lives inside the harness layer
- Deliverable:
  - a runtime-native style catalog pipeline with source metadata, anti-patterns, and Foundry mappings
- Acceptance criteria:
  - design workflows can read normalized style-reference data directly
  - research intake is not trapped inside `ui-testing/research/`

### `P1` Expand canonical rounded-system coverage

- Owner area: design datasets / style-selector
- Problem:
  - rounded and tactile systems were underrepresented until `material-expressive` and the atlas were added
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
- Problem:
  - the atlas is documented and live, but runtime support is still implicit
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
- Problem:
  - page mocks and atlas review still share the same general reporting voice
- Deliverable:
  - a separate component-system summary in benchmark output
- Acceptance criteria:
  - reports distinguish page-shell failures from component-language failures
  - geometry, chips, sheets, and action clusters are reviewed explicitly

## 6. Recommended Delivery Sequence

1. `P0` Ship the first-class `ui-testing` workflow.
2. `P0` Ship guided remediation routing from `design-audit`.
3. `P0` Emit runtime provenance and dataset trace data.
4. `P0` Add style-fidelity, layout-occupancy, and optical-collision checks.
5. `P0` Make the atlas a runtime-required benchmark artifact.
6. `P0` Promote external style normalization into runtime datasets.
7. `P1` Add mobile-recomposition, geometry-coverage, and texture-discipline scoring.
8. `P1` Expand rounded-system coverage and benchmark-lane orchestration.
9. `P1` Add dedicated component-system review outputs.
10. `P2` Expand atlas-oriented motifs and layouts once the core runtime is stable.

## Canonical References

- Final benchmark summary: `ui-testing/reports/foundry-ui-benchmark-final-report.md`
- Consolidated gap report: `ui-testing/reports/ui-testing-gap-report.md`
- Master Foundry gap log: `docs/foundry-real-world-gaps.md`
- Canonical design context: `docs/foundation/DESIGN.md`
