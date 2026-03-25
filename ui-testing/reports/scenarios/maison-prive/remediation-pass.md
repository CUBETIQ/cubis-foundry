# maison-prive Remediation Pass

- Style reference: `luxury-light-06`
- Style direction: `luxury-formal`
- Build status: `reviewed-remediated-local-fixture`
- Execution status: `completed-harness-runtime`

## Score Snapshot

- Style fidelity: 5
- Composition balance: 5
- Layout occupancy: 5
- Mobile recomposition: 3.6
- Texture discipline: 4.7
- Geometry coverage: 3.5

## Required Remediation Steps

### 1. design-audit
- Status: completed
- Triggered by: the narrative panel cannot overpower the itinerary ledger, service cards must read like hosted operations, not generic upsells, lead with the selected residence and one hosted action above fold, compress service details into a staged itinerary rather than parallel columns, the page feels hosted and curated rather than transactional, residence switching updates the itinerary and rate summary, the concierge action feels more like a host desk than an ecommerce CTA
- Summary: Audit the current surface before any second-pass intervention.
- Actions:
  - Weakest benchmark signals: geometry coverage=3.5, mobile recomposition=3.6, design intent=4.2, anti-slop=4.2.
  - Current high or medium gaps: runtime-provenance, shared-remediation-runtime, workflow-surface, luxury-operability, mobile-recomposition.

### 2. design-arrange
- Status: instruction-emitted
- Triggered by: luxury-operability
- Summary: Recompose shell structure, hierarchy order, and mounted zones before touching styling polish.
- Actions:
  - Remove dead shell tracks, under-occupied rails, or decorative columns with no operational purpose.
  - Reprioritize the mobile order so the first scroll segment carries the primary action and the most important state.
  - Keep these desktop failure checks visible: the narrative panel cannot overpower the itinerary ledger; service cards must read like hosted operations, not generic upsells.

### 6. design-polish
- Status: instruction-emitted
- Triggered by: luxury-operability
- Summary: Polish only after structure, type, and state hierarchy are already coherent.
- Actions:
  - Tighten spacing, border treatment, and state transitions without changing the layout diagnosis.
  - Use polish to clarify the chosen style family, not to hide unresolved shell problems.

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

