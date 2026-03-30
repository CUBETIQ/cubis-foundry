# Foundry V2 Cleanup Handoff

Date: 2026-03-30
Repo: `/Users/phumrin/Documents/Cubis Foundry`
Branch: `v2`

## Current Canonical Docs

- Architecture/spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
- Execution plan: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Cleanup plan: `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`
- Cleanup inventory: `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md`

Use the 2026-03-28 spec/plan for the active taxonomy and system design. Use the 2026-03-30 cleanup plan/inventory for removal, tombstone, and final cleanup work. Do not resume from older migration plans or specs.

## Current Verification Commands

Run these from the repo root:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/catalog/agent-surfaces.test.ts src/cli/catalog/shared-workflow-bundle.test.ts src/cli/catalog/generated-instruction-surfaces.test.ts src/cli/catalog/ui-skills.test.ts src/cli/compiler/compiler.test.ts
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/stitchExecute.test.ts src/tools/registry.test.ts src/tools/mobileQaRun.test.ts src/tools/webQaRun.test.ts
npx tsc -p tsconfig.cli.json --noEmit
npm run build:cli
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

## What Remains

- Finish Task 3 from the cleanup plan:
  - review the historical-doc tombstones
  - commit the `docs/superpowers/**` collapse
- Finish Task 4:
  - reduce low-value regression noise without removing necessary deleted-surface guards
- Finish Task 5:
  - run the full verification gate
  - confirm the active runtime/code surfaces listed in the cleanup inventory are either rewritten, guarded, or intentionally kept
  - commit the final cleanup checkpoint

## What Was Intentionally Removed

- Deprecated/internal skill modules:
  - `qa`
  - `unit-testing`
  - `integration-testing`
  - `playwright-interactive`
  - `stitch`
  - `mcp-core`
  - `research-core`
  - `rules-core`
- Fragmented legacy design source modules:
  - `frontend-design`
  - `frontend-design-core`
  - `frontend-design-implementation-handoff`
  - `frontend-design-mobile-patterns`
  - `frontend-design-screen-brief`
  - `frontend-design-style-selector`
  - `frontend-design-system`
  - `design-audit`
- Old public route aliases such as deprecated testing/design wrappers no longer act as active current surfaces.

## Current Runtime Shape

- Canonical testing skills:
  - `web-testing`
  - `android-emulator-testing`
  - `ios-simulator-testing`
- Canonical design skills:
  - `design`
  - `web-ui-design`
  - `mobile-ui-design`
  - `design-system`
- Web testing is Playwright-MCP-first.
- Mobile testing is `mobile-mcp` first with CLI-first fallback for deterministic evidence.
- Language/framework skills now own their local test guidance instead of relying on shared `unit-testing` or `integration-testing` skills.

## Resume Point

Start from `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`.

Current cleanup status:
- Task 1 inventory: done
- Task 2 active-surface wording cleanup: done
- Task 3 historical-doc collapse: in progress

Do not switch back to old worktree-specific instructions. The active checkout is now the main repo on branch `v2`.
