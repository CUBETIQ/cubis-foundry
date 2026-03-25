# coach-loop Remediation Pass

- Style reference: `swiss-minimalist-light-08`
- Style direction: `swiss-minimalist`
- Build status: `reviewed-remediated-local-fixture`
- Execution status: `completed-harness-runtime`

## Score Snapshot

- Style fidelity: 5
- Composition balance: 3.2
- Layout occupancy: 5
- Mobile recomposition: 3.6
- Texture discipline: 3.7
- Geometry coverage: 4

## Required Remediation Steps

### 1. design-audit
- Status: completed
- Triggered by: the page shell cannot reserve an empty right-side track, the readiness card and coach rail must feel proportionate to the prescription zone, lead with current prescription and readiness before secondary monitoring, collapse the weekly rail into staged sessions rather than tiny desktop cards, the interface feels like a coaching workspace instead of a generic health dashboard, readiness data changes the prescription language, the monitor rail supports the prescription rather than competing with it
- Summary: Audit the current surface before any second-pass intervention.
- Actions:
  - Weakest benchmark signals: composition balance=3.2, mobile recomposition=3.6, texture discipline=3.7, geometry coverage=4.
  - Current high or medium gaps: runtime-provenance, shared-remediation-runtime, workflow-surface, layout-occupancy, composition-balance, mobile-recomposition, texture-discipline.

### 2. design-arrange
- Status: instruction-emitted
- Triggered by: layout-occupancy
- Summary: Recompose shell structure, hierarchy order, and mounted zones before touching styling polish.
- Actions:
  - Remove dead shell tracks, under-occupied rails, or decorative columns with no operational purpose.
  - Reprioritize the mobile order so the first scroll segment carries the primary action and the most important state.
  - Keep these desktop failure checks visible: the page shell cannot reserve an empty right-side track; the readiness card and coach rail must feel proportionate to the prescription zone.

### 7. playwright-web-qa
- Status: ready-for-refresh
- Triggered by: refresh deterministic browser evidence after remediation
- Summary: Refresh browser evidence after remediation changes are applied.
- Actions:
  - Re-capture desktop and mobile screenshots.
  - Refresh the interactive snapshot and confirm the scenario still serves correctly.

### 8. ui-testing-harness
- Status: ready-for-refresh
- Triggered by: refresh scorecards, reports, and repeated-gap summary
- Summary: Roll the scenario back into the suite-level artifacts.
- Actions:
  - Refresh the scenario scorecard and prompt trace.
  - Regenerate the consolidated benchmark and gap reports.

## Shared Runtime Limitation

- This remediation pass now executes as a harness-runtime artifact generator, but the same execution path is not yet exposed as a shared native Foundry runtime.

