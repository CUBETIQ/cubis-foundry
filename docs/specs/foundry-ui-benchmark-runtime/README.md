# Foundry UI Benchmark Runtime

- `spec_id`: `foundry-ui-benchmark-runtime`
- `spec_root`: `docs/specs/foundry-ui-benchmark-runtime`
- Status: active
- Last updated: March 24, 2026

## Goal

Turn the current repo-local UI benchmark harness into a first-class Foundry runtime workflow with:

- scenario execution
- atlas execution
- evidence capture
- score generation
- remediation routing
- final report generation

## Why This Needs A Spec

This is multi-step, cross-cutting work that touches:

- workflow routing
- design runtime provenance
- design audit scoring
- design datasets
- benchmark artifacts
- report generation

Without a spec pack, the work will drift into disconnected scripts and partial fixes.

## Scope

In scope:

- first-class `ui-testing` workflow
- guided remediation runtime
- runtime-emitted provenance
- atlas as a required benchmark artifact
- style-fidelity, layout-occupancy, optical-collision, geometry-coverage, texture-discipline, and mobile-recomposition scoring
- style-catalog normalization and rounded-system dataset expansion

Out of scope:

- shipping production apps from the benchmark fixtures
- replacing the current fixture set with a new content universe
- full Stitch execution ownership beyond benchmark lane coordination

## Canonical Inputs

- `ui-testing/reports/foundry-ui-benchmark-final-report.md`
- `ui-testing/reports/foundry-ui-implementation-backlog.md`
- `ui-testing/reports/ui-testing-gap-report.md`
- `docs/foundry-real-world-gaps.md`
- `docs/foundation/DESIGN.md`

## Recommended Next Route

Implement in this order:

1. workflow runtime
2. provenance runtime
3. design-audit scoring expansion
4. atlas-required artifact support
5. dataset and style-selector expansion

## Current Progress

- Completed: shared `/ui-testing` workflow entrypoint under `workflows/workflows/agent-environment-setup/shared/workflows/ui-testing.md`
- Completed: repo-local benchmark runner under `ui-testing/scripts/run-benchmark.mjs`
- Completed: harness runtime now emits derived scenario provenance, remediation routing, and top-level benchmark runtime status through `ui-testing/scripts/sync-scenario-artifacts.mjs`
- Next: move derived harness traces and remediation routing into the core design runtime so the shared route does not depend on repo-local emitter logic
