# Foundry UI Benchmark Final Report

Date: March 23, 2026

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

### 1. Foundry still lacks a first-class UI testing runtime

- The harness is strong enough to expose problems, but it is still folder-first and script-driven.
- Operators still have to manually coordinate fixtures, scorecards, screenshots, atlas review, and report generation.

### 2. Style fidelity is better than before, but still weakly enforced

- The benchmark can now describe style drift clearly.
- The runtime still does not score style fidelity, geometry variation, or texture discipline automatically.

### 3. Remediation works, but routing is still manual

- `design-audit`, `design-arrange`, `design-typeset`, `design-bolder`, `design-distill`, and `design-polish` improved results.
- Foundry still has no guided remediation runtime that can route a failed surface through the right second-pass sequence automatically.

### 4. Responsive evidence exists, but mobile quality is still under-scored

- Mobile screenshots and state captures exist for every scenario.
- The runtime still cannot automatically distinguish real mobile re-staging from a compressed desktop stack.

### 5. Page mocks were not enough on their own

- The new `style-atlas` surface proved necessary because several issues were really component-system problems:
  - too much hard-edge geometry
  - missing rounded/Material-like language
  - repeated background texture fallback

## Required Foundry Updates

### Immediate

1. Add a first-class `ui-testing` workflow that owns scenario runs, atlas capture, screenshots, score aggregation, and report updates.
2. Add a remediation runtime that starts from `design-audit` and routes into the correct second-pass skills automatically.
3. Promote prompt trace and dataset provenance into first-class runtime artifacts.

### Near-term

1. Add style-fidelity scoring to `design-audit`.
2. Add geometry-coverage scoring so rounded/tactile systems and hard-edge systems are both represented intentionally.
3. Add texture-discipline checks so repeated grid overlays and generic atmosphere tricks fail review.
4. Add layout-occupancy and optical-collision checks as first-class audit failures.
5. Add mobile-recomposition scoring that can tell re-staging apart from simple stacking.

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

Foundry is now materially better at exposing UI quality gaps than it was at the start of this pass. The biggest remaining problem is no longer “can it make a page,” but “can it systematically enforce style fidelity, component-system diversity, and remediation without manual supervision.” The benchmark suite is now good enough to drive those fixes directly.
