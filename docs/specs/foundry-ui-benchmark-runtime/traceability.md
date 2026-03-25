# Traceability

## Source Inputs

- `ui-testing/reports/foundry-ui-benchmark-final-report.md`
- `ui-testing/reports/foundry-ui-implementation-backlog.md`
- `ui-testing/reports/ui-testing-gap-report.md`
- `docs/foundry-real-world-gaps.md`
- `docs/foundation/DESIGN.md`

## Requirement To Finding Map

### Requirement: first-class benchmark workflow

- Supported by:
  - `workflow-surface`
  - benchmark route verification
  - current script-driven harness behavior

### Requirement: guided remediation runtime

- Supported by:
  - `design-command-orchestration`
  - harness-derived `remediation_trace` output in scenario scorecards
  - current manual use of `design-audit`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, and `design-polish`

### Requirement: runtime provenance

- Supported by:
  - `runtime-provenance`
  - harness-emitted `prompt-trace.json`
  - `ui-testing/reports/benchmark-runtime.json`

### Requirement: style-fidelity and geometry scoring

- Supported by:
  - `style-fidelity-scoring`
  - `style-geometry-coverage`
  - `style-fidelity`
  - `ui-testing/scripts/lib/benchmark-analysis.mjs`
  - `ui-testing/reports/component-system-summary.md`

### Requirement: texture discipline

- Supported by:
  - `texture-discipline`
  - browser review of repeated box/grid background overlays
  - analyzer-driven `texture_discipline_score` in scenario scorecards

### Requirement: atlas as benchmark artifact

- Supported by:
  - `component-atlas-coverage`
  - the move to `style-atlas` as a required supplementary harness artifact
  - `ui-testing/reports/component-system-summary.json`

### Requirement: responsive scoring

- Supported by:
  - `responsive-scoring`
  - `mobile-recomposition`
  - analyzer-driven `mobile_recomposition_score` in scenario scorecards

### Requirement: layout occupancy and collision checks

- Supported by:
  - `layout-occupancy`
  - `composition-balance`
  - `composition-calibration`
  - analyzer signals for shell-track occupancy and collision risk

## Architecture Impact

- Workflow surface: yes
- Design runtime: yes
- Reporting contract: yes
- Dataset pipeline: yes
- QA scoring: yes
- Design-system review model: yes

## Doc Impact

This spec should stay aligned with:

- `docs/foundry-real-world-gaps.md`
- `ui-testing/reports/foundry-ui-benchmark-final-report.md`
- `ui-testing/reports/foundry-ui-implementation-backlog.md`
- `docs/foundation/DESIGN.md`
