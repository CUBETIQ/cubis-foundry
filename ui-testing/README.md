# UI Testing Harness

This folder is the repo-local harness for evaluating whether Foundry can produce distinctive web UI work instead of generic AI output.

## Structure

- `research/` - normalized outside research, source lanes, and Design Prompts style intake
- `scenarios/` - fixed scenario manifests
- `charters/` - Playwright QA charters for each fixture
- `fixtures/` - runnable local web or webapp surfaces
- `reports/` - per-scenario artifacts and the consolidated gap report
- `scripts/` - local helpers for serving fixtures and aggregating reports
- `fixtures/style-atlas/` - cross-style component board for geometry, state, and Material coverage review

## Benchmark scenarios

1. `wealth-ops` - finance operations webapp
2. `atelier-stay` - boutique hotel booking site
3. `coach-loop` - fitness coaching webapp
4. `field-notes` - journaling and publishing webapp
5. `pulse-festival` - event discovery webapp
6. `saas-foundry` - minimalist SaaS marketing plus app-shell hybrid
7. `maison-prive` - luxury concierge and reservation site
8. `neo-market` - creator marketplace and fulfillment workspace
9. `terminal-cloud` - infrastructure deployment control plane
10. `plant-ops` - manufacturing operations dashboard

## Required supplementary artifact

Every benchmark pass also includes `style-atlas`, a cross-style component board used to review:

- geometry variation across styles
- rounded versus hard-edge systems
- Material-like component language
- repeated background texture or surface-treatment fallback

The benchmark runtime now also emits:

- `ui-testing/reports/benchmark-runtime.json`, which records route scope, refreshed scenarios, remediation requirements, and report targets
- `ui-testing/reports/benchmark-execution.json`, which records the executed runner steps, route checks, and supplementary artifact validation

## Run locally

Start the static server:

```bash
node ui-testing/scripts/serve-fixtures.mjs
```

Run the benchmark in one command:

```bash
node ui-testing/scripts/run-benchmark.mjs
```

Then run a QA charter against one fixture:

```bash
cbx web qa run --charter ui-testing/charters/wealth-ops.yaml
```

Aggregate scorecards into the consolidated report:

```bash
node ui-testing/scripts/sync-scenario-artifacts.mjs
```

Then refresh the consolidated report:

```bash
node ui-testing/scripts/aggregate-gap-report.mjs
```

## Review contract

Every scenario should have:

- a manifest
- a runnable fixture
- a charter
- `brief.md`
- `prompt-trace.json`
- `scorecard.json`

Use this harness to expose Foundry workflow gaps, not to nitpick copy in sample apps.
