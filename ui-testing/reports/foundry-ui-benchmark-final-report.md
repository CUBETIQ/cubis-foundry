# Foundry UI Benchmark Final Report

Date: March 25, 2026

## Scope

This final report summarizes the current web UI benchmark pass across:

- 10 scenario fixtures
- 1 required supplementary `style-atlas` surface
- desktop and mobile evidence captured under `ui-testing/reports/`
- the full Foundry UI skill path plus the new remediation layer

## Benchmark Status

- Live routes verified: `/`, `/atelier-stay/`, `/wealth-ops/`, `/coach-loop/`, `/field-notes/`, `/pulse-festival/`, `/saas-foundry/`, `/maison-prive/`, `/neo-market/`, `/terminal-cloud/`, `/plant-ops/`, `/style-atlas/`
- All verified routes returned `200`
- Consolidated benchmark summary: see `ui-testing-gap-report.md`
- Supplementary atlas artifacts present:
  - `ui-testing/reports/style-atlas.md`
  - `ui-testing/reports/style-atlas-desktop.png`

## What Improved

- The harness now covers 10 style families instead of a small editorial-heavy subset.
- Repeated desktop shell failures such as empty reserved tracks are now explicit benchmark failures instead of vague spacing complaints.
- Rounded and tactile system coverage now exists through the `style-atlas` route and `material-expressive` dataset coverage.
- The benchmark contract now explicitly requires a component atlas in addition to page-level fixtures.
- Background texture overuse is now tracked as a design-system problem instead of being dismissed as a visual preference.

## Current Findings

### 1. Foundry now has a first-class route, but not a native benchmark executor

- The shared `/ui-testing` route now exists, and the repo now has a single benchmark runner plus top-level runtime and execution artifacts.
- The actual benchmark execution is still repo-local and script-backed, so the route is not yet a shared native executor for scenario refresh, remediation, and report generation.

### 2. Style fidelity is better than before, but still weakly enforced

- The benchmark can now describe style drift clearly.
- The harness runtime now scores style fidelity, geometry variation, and texture discipline automatically.
- Those signals are still not native shared `design-audit` primitives outside the harness layer.

### 3. Provenance exists at the harness layer, but not in the core design runtime

- Scenario traces are now emitted from the harness runtime with dataset ids, exclusions, lane status, and remediation plans.
- Foundry still does not emit this provenance natively from the design runtime itself.

### 4. Remediation routing exists at the harness layer, but not as native execution

- The harness can now derive second-pass remediation steps from scenario gaps and review criteria.
- The harness now also executes a remediation pass and emits remediation execution artifacts per scenario.
- Foundry still has no shared runtime that can expose that execution path end-to-end outside the benchmark layer.

### 5. Responsive evidence exists, but mobile quality is still under-scored

- Mobile screenshots and state captures exist for every scenario.
- The harness runtime can now distinguish real mobile re-staging from a compressed desktop stack heuristically.
- Shared QA primitives still do not expose that scoring outside the benchmark layer.

### 6. Page mocks were not enough on their own

- The new `style-atlas` surface proved necessary because several issues were really component-system problems:
  - too much hard-edge geometry
  - missing rounded/Material-like language
  - repeated background texture fallback
- The atlas is now a required benchmark artifact and emits a separate component-system summary.

## Required Foundry Updates

### Immediate

1. Keep the shared `ui-testing` workflow as the canonical benchmark entrypoint for scenario runs, atlas capture, screenshots, score aggregation, and report updates.
2. Promote the repo-local benchmark runner into a native runtime executor behind that route.
3. Promote the harness remediation executor into a shared runtime that starts from `design-audit` and routes into the correct second-pass skills automatically.
4. Promote prompt trace and dataset provenance from harness-derived artifacts into first-class design runtime artifacts.

### Near-term

1. Promote harness scoring logic into shared `design-audit` and web QA primitives.
2. Add geometry-coverage scoring so rounded/tactile systems and hard-edge systems are both represented intentionally across shared runtime reviews.
3. Add texture-discipline checks so repeated grid overlays and generic atmosphere tricks fail review outside the benchmark harness.
4. Add layout-occupancy and optical-collision checks as first-class shared audit failures.
5. Add mobile-recomposition scoring that can tell re-staging apart from simple stacking outside the benchmark harness.

### Dataset and design-system updates

1. Keep the Design Prompts intake normalized as Foundry-owned data rather than raw prompt text.
2. Expand canonical support for:
   - rounded/Material-like surfaces
   - tactile action clusters
   - component-atlas review patterns
3. Require style families to differ in geometry and component logic, not only palette and typography.

## Canonical References

- Consolidated benchmark report: `ui-testing/reports/ui-testing-gap-report.md`
- Implementation backlog: `ui-testing/reports/foundry-ui-implementation-backlog.md`
- Master Foundry gap log: `docs/foundry-real-world-gaps.md`
- Canonical repo design context: `docs/foundation/DESIGN.md`
- Style atlas: `ui-testing/reports/style-atlas.md`

## Conclusion

Foundry is now materially better at exposing UI quality gaps than it was at the start of this pass. The benchmark harness now has runtime dataset sync, analyzer-backed scoring, atlas-aware reporting, a remediation executor, and a single end-to-end runner. The biggest remaining problem is no longer “can it make a page,” but “can it promote harness-level workflow, provenance, scoring, and remediation behavior into native shared runtime guarantees.” The benchmark suite is now good enough to drive those fixes directly.
