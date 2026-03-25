# atelier-stay Remediation Pass

- Style reference: `monochrome-light-01`
- Style direction: `monochrome-editorial`
- Build status: `reviewed-remediated-local-fixture`
- Execution status: `completed-harness-runtime`

## Score Snapshot

- Style fidelity: 4.4
- Composition balance: 5
- Layout occupancy: 2
- Mobile recomposition: 3.6
- Texture discipline: 3.7
- Geometry coverage: 3.5

## Required Remediation Steps

### 1. design-audit
- Status: completed
- Triggered by: hero headline cannot visually collide with the adjacent booking or arrival cards, the booking column must feel operational instead of like decorative stacked boxes, lead with the stay thesis and one active booking action above fold, arrival and room-family controls should stay visible without requiring the full editorial spread first, the page relies on typography and rules rather than decorative imagery alone, the booking panel feels operational while the hero remains editorial, room selection updates the descriptive and pricing text
- Summary: Audit the current surface before any second-pass intervention.
- Actions:
  - Weakest benchmark signals: layout occupancy=2, geometry coverage=3.5, mobile recomposition=3.6, texture discipline=3.7.
  - Current high or medium gaps: runtime-provenance, shared-remediation-runtime, workflow-surface, composition-balance, style-fidelity-drift, layout-occupancy, mobile-recomposition, texture-discipline.

### 2. design-arrange
- Status: instruction-emitted
- Triggered by: composition-balance
- Summary: Recompose shell structure, hierarchy order, and mounted zones before touching styling polish.
- Actions:
  - Remove dead shell tracks, under-occupied rails, or decorative columns with no operational purpose.
  - Reprioritize the mobile order so the first scroll segment carries the primary action and the most important state.
  - Keep these desktop failure checks visible: hero headline cannot visually collide with the adjacent booking or arrival cards; the booking column must feel operational instead of like decorative stacked boxes.

### 3. design-typeset
- Status: instruction-emitted
- Triggered by: composition-balance
- Summary: Recalibrate display scale and reading rhythm so hierarchy survives without optical collisions.
- Actions:
  - Reduce oversized display type or limit line length when the headline competes with adjacent modules.
  - Use type rhythm to reinforce the chosen style family instead of generic product hero typography.
  - Preserve these acceptance checks: the page relies on typography and rules rather than decorative imagery alone; the booking panel feels operational while the hero remains editorial; room selection updates the descriptive and pricing text.

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

