# plant-ops Remediation Pass

- Style reference: `industrial-light-26`
- Style direction: `industrial-control`
- Build status: `reviewed-remediated-local-fixture`
- Execution status: `completed-harness-runtime`

## Score Snapshot

- Style fidelity: 5
- Composition balance: 5
- Layout occupancy: 5
- Mobile recomposition: 2.7
- Texture discipline: 5
- Geometry coverage: 3.5

## Required Remediation Steps

### 1. design-audit
- Status: completed
- Triggered by: the twin-board layout must show real tension between output and maintenance, warning strips cannot dominate the page without supporting detail, lead with active line status and one intervention action above fold, defer secondary watchlists below the primary maintenance sequence, the page feels like an industrial control surface rather than enterprise BI, line switching updates the maintenance and intervention detail, holding a line produces visible status changes in the queue
- Summary: Audit the current surface before any second-pass intervention.
- Actions:
  - Weakest benchmark signals: mobile recomposition=2.7, geometry coverage=3.5, anti-slop=4.8, design intent=5.
  - Current high or medium gaps: runtime-provenance, shared-remediation-runtime, workflow-surface, warning-governance, mobile-recomposition.

### 5. design-distill
- Status: instruction-emitted
- Triggered by: warning-governance
- Summary: Remove reusable harness defaults and reduce visual noise that masks the intended style signal.
- Actions:
  - Strip repeated texture overlays or box-pattern treatments unless the style family explicitly requires them.
  - Reduce competing accent moves so the primary component language reads clearly.

### 6. design-polish
- Status: instruction-emitted
- Triggered by: warning-governance
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

