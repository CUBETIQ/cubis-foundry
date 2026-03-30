# Foundry V2 Cleanup Handoff

Date: 2026-03-30  
Repo: `/Users/phumrin/Documents/Cubis Foundry`  
Branch: `v2`

## Current Canonical Docs

- Spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
- Implementation plan: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Cleanup plan: `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`
- Cleanup inventory: `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md`

All older plan/spec files under `docs/superpowers/` are historical only. Do not execute from them.

## Current Branch State

- Active checkout: `v2`
- Active repo path: `/Users/phumrin/Documents/Cubis Foundry`
- Main source-of-truth taxonomy now centers on:
  - testing: `web-testing`, `android-emulator-testing`, `ios-simulator-testing`
  - design: `design`, `web-ui-design`, `mobile-ui-design`, `design-system`
- Browser testing is Playwright-MCP-first.
- Mobile testing is dual-path:
  - preferred semantic runtime: `mobile-mcp`
  - deterministic fallback: CLI-first device/simulator tooling

## What Was Intentionally Removed

- Deprecated/internal skill modules were physically deleted:
  - `qa`
  - `unit-testing`
  - `integration-testing`
  - `playwright-interactive`
  - `stitch`
  - `mcp-core`
  - `research-core`
  - `rules-core`
- Fragmented design source modules were removed in favor of the canonical quartet:
  - `frontend-design*`
  - `design-audit`
- Legacy route aliases were removed from active MCP routing.

Old names may still appear only in:
- negative tests
- explicit rejection guards
- short historical tombstone docs

## Current Verification Commands

Run these from repo root:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/catalog/agent-surfaces.test.ts src/cli/catalog/shared-workflow-bundle.test.ts src/cli/catalog/generated-instruction-surfaces.test.ts src/cli/compiler/compiler.test.ts
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/stitchExecute.test.ts src/tools/registry.test.ts src/tools/mobileQaRun.test.ts src/tools/webQaRun.test.ts
npx tsc -p tsconfig.cli.json --noEmit
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Recent targeted checks that were green during cleanup:

```bash
npm run test:cli -- src/cli/commands/register.test.ts src/cli/init/prompts.test.ts src/cli/mobile/commands.test.ts src/cli/web/commands.test.ts
npm --prefix mcp test -- src/tools/webQaRun.test.ts src/tools/mobileQaRun.test.ts src/tools/registry.test.ts
```

## What Remains

The deprecation cleanup plan is not finished yet.

Next tasks:
1. Task 4: reduce low-value regression noise while keeping the negative tests that protect current behavior.
2. Task 5: run the full verification gate, refresh the cleanup plan progress, and commit the final cleanup checkpoint.

## Resume Guidance

Resume from:
- `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`
- `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md`

Current execution status:
- Task 1 complete
- Task 2 complete
- Task 3 in progress during this handoff refresh
- Task 4 pending
- Task 5 pending
