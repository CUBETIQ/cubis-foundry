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
  - design: `design`, `web-ui-design`, `mobile-ui-design`, `desktop-ui-design`, `design-system`
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
- The canonical design stack was later expanded into five active surfaces:
  - `design`
  - `web-ui-design`
  - `mobile-ui-design`
  - `desktop-ui-design`
  - `design-system`
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

The deprecation cleanup plan is in the final stabilization stage.

Next tasks:
1. Finish the full stale-name sweep and classify any remaining hits as intentional guards, tests, workflow commands, or tombstones.
2. Decide whether the `.stitch/DESIGN.md` compatibility mirror stays as an intentional supported output or is removed from the remaining design-system contract.
3. Run the final full verification gate and commit the cleanup finish line.

## Resume Guidance

Resume from:
- `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`
- `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md`

## Deprecation Cleanup Status

- active deprecated testing and wrapper skill surfaces removed
- deprecated frontend-design compatibility aliases removed from live skill metadata
- historical docs collapsed to one active spec, one active plan, one active cleanup plan, and this handoff
- remaining old-name hits are now concentrated in:
  - intentional negative tests
  - workflow command surfaces such as `/design-audit`
  - Stitch compatibility docs/config/runtime
  - tombstoned historical notes

Current execution status:
- Task 1 complete
- Task 2 complete
- Task 3 complete
- Task 4 in progress
- Task 5 pending
