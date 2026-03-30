# Foundry V2 Plan A Handoff

Date: 2026-03-30
Repo: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
Branch: `foundry-v2-plan-a`
Remote: `origin https://github.com/CUBETIQ/cubis-foundry.git`

## Why This File Exists

This is a resume point for continuing the Foundry V2 realignment from another session or machine. It captures the important decisions, current branch state, fresh verification evidence, and the next recommended work.

## Current Resume Status

- Active source of truth now lives in:
  - `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
  - `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
  - `docs/superpowers/specs/2026-03-30-ui-mobile-mcp-enhancement-design.md`
  - `docs/superpowers/plans/2026-03-30-ui-mobile-mcp-enhancement-plan.md`
- Phase 1 and Phase 2 Tasks 1-5 are complete in the active worktree.
- Phase 3 design-stack collapse checkpoint is now complete and pushed.
- The UI/mobile enhancement plan is now complete in this worktree:
  - canonical UI skills use the stronger route-first and anti-generic design contract
  - `web-testing` remains Playwright-MCP-first
  - `mobile-mcp` is fully wired as a first-class bundled MCP provider
  - root CLI/help/docs now expose the mobile runtime story cleanly
  - `android-emulator-testing` and `ios-simulator-testing` are now explicit dual-path skills with `mobile-mcp` references and deterministic CLI fallback guidance
- The current checkpoint physically deletes the deprecated/internal skill modules:
  - `qa`
  - `unit-testing`
  - `integration-testing`
  - `playwright-interactive`
  - `stitch`
  - `mcp-core`
  - `research-core`
  - `rules-core`
- Those deleted names no longer resolve as skills and no longer emit runtime assets.
- Verification now routes through the canonical testing skills only:
  - `web-testing`
  - `android-emulator-testing`
  - `ios-simulator-testing`
- The current checkpoint also redistributes testing ownership:
  - language skills now explicitly own unit-test guidance
  - framework and platform skills now explicitly own runtime-boundary guidance
- New Phase 4 checkpoint:
  - the eight language skills now use a consistent unit-test guidance shape while retaining their current module IDs
  - user-facing guidance is normalized first; any module-ID rename pass is deferred
- New Phase 4 Task 10 checkpoint:
  - the framework skills now use the same testing-ownership split, keeping runtime-boundary tests local and making live browser/device evidence routing explicit
  - React, Next.js, FastAPI, NestJS, Django/DRF, Spring Boot, SQLAlchemy, Prisma, SvelteKit, and Expo now point their live QA guidance at the specialized web/mobile testing skills where appropriate
- Shared workflow and agent scaffolds now prefer `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`.
- `mobile-mcp` is now a first-class upstream MCP provider in the bundled server.
- Browser testing remains Playwright-MCP-first through `web-testing`.
- Android and iOS testing are now explicitly dual-path:
  - preferred semantic runtime: `mobile-mcp`
  - deterministic fallback runtime: CLI-first device/simulator tooling
- The old MCP alias layer has also been cleaned:
  - `mcp/README.md` examples now use the canonical Android testing skill
  - `scripts/lib/legacy-skill-map.mjs` now routes broad historical testing patterns through `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`
  - `scripts/generate-mcp-manifest.mjs` now scans `foundry/modules` so generated alias entries point at real canonical `SKILL.md` paths instead of stale `workflows/skills/*` paths
- The current pushed checkpoint also removes the visible legacy design module folders from `foundry/modules`:
  - deleted: `frontend-design*`
  - deleted: `design-audit`
  - retained canonical public surfaces:
    - `design`
    - `web-ui-design`
    - `mobile-ui-design`
    - `design-system`
- Compatibility for old design skill IDs is now synthetic at build/projection time:
  - `src/cli/compiler/stages/transform.ts` generates alias skill bundles from canonical skill metadata
  - generated runtime assets still expose old IDs like `frontend-design`, `frontend-design-system`, and `design-audit`
  - the old source module folders are no longer needed for that backward compatibility
- Catalog emission now clears each platform output directory before writing regenerated assets, so deleted skills do not linger in `generated/runtime-assets` after a rebuild.

## Work Completed In This Branch

1. Added the canonical model foundation for:
   - skills
   - workflows
   - agents
   - rules
   - hooks
2. Added projector support and updated compiler transform behavior so module-scoped compilation respects ownership boundaries.
3. Implemented `compileModule()` and `needsRecompile()` in the CLI compiler.
4. Extracted the doctor functionality into a dedicated CLI subsystem and registered `cbx doctor`.
5. Migrated many module skills to canonical `SKILL.md` frontmatter/body format.
6. Added canonical agent/workflow/rule/hook source directories:
   - `foundry/modules/agents-core/agents/`
   - `foundry/modules/workflows/`
   - the legacy rules source tree
   - `foundry/modules/hooks-core/hooks/`

## Work Completed After Initial Handoff

1. Added compiler support for sidecar skill references under `foundry/modules/<skill-id>/references/**`.
2. Updated skill projection so references emit alongside `SKILL.md` for native skill platforms.
3. Added native Gemini skill projection to `.gemini/skills/<skill-id>/SKILL.md`.
4. Updated Gemini runtime/config/docs surfaces to point at `.gemini/skills` instead of old shared-hint paths.
5. Recovered canonical reference payloads from legacy skill trees for the currently referenced module set, including:
   - `foundry/modules/api-design/references/`
   - `foundry/modules/system-design/references/`
   - `foundry/modules/frontend-design/references/`
   - canonical browser testing reference payloads
   - and the remaining exact-match `references/*.md` payloads for the canonical skill modules that already linked to them
6. Restored the browser-specialist agent payloads into the canonical testing surfaces before the hard-delete cleanup.
7. Added compiler validation for broken relative markdown links inside canonical `SKILL.md` files.
8. Updated `design-audit` to use current canonical references:
   - local `references/scoring-rubric.md`
9. Repointed the remaining compiler-facing legacy module descriptors:
   - `foundry/modules/design/module.yaml` now routes all capability outputs through canonical `foundry/modules/design/SKILL.md`
10. Cleaned stale canonical naming references such as `flutter-mobile-qa` from the affected design and handoff skills/templates.
11. Added catalog regression tests locking the canonical design output paths in place.
14. Extended compiler validation beyond canonical `SKILL.md` files so relative markdown links are now checked across:
   - `SKILL.md`
   - `templates/*`
   - `references/*.md`
   - `agents/*.md`
15. Fixed a real canonical typo exposed by the broader validator:
   - `foundry/modules/typescript-best-practices/templates/claude.j2`
   - `references/utility-type.md` -> `references/utility-types.md`
16. Verified the full catalog with the repo-local built CLI:
   - `node dist/cli/index.js catalog validate`
   - `node dist/cli/index.js catalog build`
17. Confirmed the global `cbx` on PATH is not the correct binary for this branch's catalog commands. Use the repo-local built CLI while continuing this worktree.
18. Collapsed the legacy design skill source tree:
   - removed `foundry/modules/frontend-design/**`
   - removed `foundry/modules/frontend-design-core/**`
   - removed `foundry/modules/frontend-design-implementation-handoff/**`
   - removed `foundry/modules/frontend-design-mobile-patterns/**`
   - removed `foundry/modules/frontend-design-screen-brief/**`
   - removed `foundry/modules/frontend-design-style-selector/**`
   - removed `foundry/modules/frontend-design-system/**`
   - removed `foundry/modules/design-audit/**`
19. Introduced the canonical design-system surface:
   - `foundry/modules/design-system/**`
20. Moved reusable design references onto canonical modules:
   - `foundry/modules/design/references/`
   - `foundry/modules/web-ui-design/references/`
21. Updated shared routing/manifests/docs so the public design surface is now:
   - `design`
   - `web-ui-design`
   - `mobile-ui-design`
   - `design-system`
22. Added compiler regression coverage for metadata-driven synthetic alias projection.
23. Upgraded the canonical design prompting contract:
   - strengthened `foundry/modules/design/SKILL.md`
   - strengthened `foundry/modules/web-ui-design/SKILL.md`
   - strengthened `foundry/modules/mobile-ui-design/SKILL.md`
   - strengthened `foundry/modules/design-system/SKILL.md`
   - added shared `foundry/modules/design/references/execution-contract.md`
24. Updated the active realignment docs so Phase 3 now treats `design-system` as part of the canonical design surface and records Task 8 as complete.
25. Normalized the framework skill/testing split for Phase 4 Task 10:
   - framework skills now keep runtime-boundary tests local
   - live browser evidence routes through `web-testing`
   - live mobile device evidence routes through `android-emulator-testing` and `ios-simulator-testing`

## Important Current Gap

The canonical authoring surfaces now resolve their currently referenced relative markdown files, and the compiler will fail fast if a future canonical skill, template, reference doc, or agent markdown file links to a missing sidecar file or nested markdown dependency.

The remaining migration work is now narrower:
- the design source tree is cleaned up, but the broader reduction pass across language/framework skills, agents, workflows, and rules is still ahead
- some docs and research ledgers still intentionally mention historical names because they serve as migration records
- if new canonical skills or templates are added, they must now satisfy the compiler's markdown-link validation rules and synthetic-alias expectations

## Verification Run Before Handoff

These commands were run successfully in this branch on 2026-03-27:

```bash
npm run test:cli -- src/cli/commands/register.test.ts src/cli/catalog/catalog.test.ts src/cli/compiler/projectors/projectors.test.ts src/cli/compiler/compiler.test.ts
npx tsc -p tsconfig.cli.json --noEmit
npm run test:cli-help
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- `43` tests passed in the targeted CLI suite
- TypeScript CLI compile check passed
- Built CLI help validation passed
- Repo-local catalog validation passed: `Catalog is valid.`
- Repo-local catalog build compiled all 5 platforms successfully:
  - `codex`: `281` assets
  - `claude`: `297` assets
  - `copilot`: `286` assets
  - `gemini`: `287` assets
  - `antigravity`: `281` assets

Additional verification snapshot:
- expanded authoring-surface markdown scan: `323` files checked, `0` missing refs

## Verification Run For The Current Testing Checkpoint

These commands were run successfully in this branch on 2026-03-28:

```bash
npm --prefix mcp test -- src/tools/mobileQaRun.test.ts src/tools/registry.test.ts
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- `mobileQaRun` wrapper fix passed its targeted tests, including the failure-path provider-preservation regression test
- MCP registry tests passed
- repo-local catalog validation still passed: `Catalog is valid.`
- repo-local catalog build still compiled all 5 platforms successfully:
  - `codex`: `289` assets
  - `claude`: `305` assets
  - `copilot`: `294` assets
  - `gemini`: `295` assets
  - `antigravity`: `289` assets

## Verification Run For The Task 5 Cleanup Closeout

These commands were run successfully in this branch on 2026-03-28:

```bash
node scripts/generate-mcp-manifest.mjs
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/mobileQaRun.test.ts src/tools/registry.test.ts
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- MCP skill tooling tests passed: `51/51`
- regenerated `mcp/generated/mcp-manifest.json` now points alias and canonical skill entries at `foundry/modules/*/SKILL.md`
- the redistributed testing guidance across language/framework skills still passed repo-local catalog validation
- repo-local catalog build still compiled all 5 platforms successfully:
  - `codex`: `294` assets
  - `claude`: `310` assets
  - `copilot`: `299` assets
  - `gemini`: `300` assets
  - `antigravity`: `294` assets

## Verification Run For The Design Collapse Checkpoint

These commands were run successfully in this branch on 2026-03-28:

```bash
npm install
npm run build:cli
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/registry.test.ts
npx tsc -p tsconfig.cli.json --noEmit
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
node scripts/generate-mcp-manifest.mjs
```

Observed results:
- repo-local CLI build passed
- targeted CLI tests passed: `41/41`
- targeted MCP tests passed: `49/49`
- TypeScript CLI no-emit check passed
- repo-local catalog validation passed: `Catalog is valid.`
- repo-local catalog build compiled all 5 platforms successfully:
  - `codex`: `297` assets
  - `claude`: `313` assets
  - `copilot`: `302` assets
  - `gemini`: `303` assets
  - `antigravity`: `297` assets
- regenerated MCP manifest now reports `54` skills after collapsing the deleted legacy design source modules
- rebuilt runtime assets confirm that old IDs like `frontend-design` and `frontend-design-system` are now emitted as synthetic alias wrappers pointing at `design` and `design-system`

## Verification Run For The Design Prompting Checkpoint

These commands were run successfully in this branch on 2026-03-30:

```bash
npm run build:cli
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
npx tsc -p tsconfig.cli.json --noEmit
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- repo-local CLI build passed
- targeted CLI tests passed: `41/41`
- TypeScript CLI no-emit check passed
- repo-local catalog validation still passed: `Catalog is valid.`
- repo-local catalog build still compiled all 5 platforms successfully:
  - `codex`: `298` assets
  - `claude`: `314` assets
  - `copilot`: `303` assets
  - `gemini`: `304` assets
  - `antigravity`: `298` assets
- the canonical design surfaces now share a stricter routing/systemization/execution contract via `foundry/modules/design/references/execution-contract.md`

## Verification Run For The Language Skill Normalization Checkpoint

These commands were run successfully in this branch on 2026-03-30:

```bash
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- repo-local catalog validation still passed: `Catalog is valid.`
- repo-local catalog build still compiled all 5 platforms successfully:
  - `codex`: `298` assets
  - `claude`: `314` assets
  - `copilot`: `303` assets
  - `gemini`: `304` assets
  - `antigravity`: `298` assets
- the retained-ID Phase 4 Task 9 pass keeps language-level testing guidance inside the eight language skills while pushing runtime-boundary checks outward to framework and platform surfaces

## Verification Run For The Framework Skill Normalization Checkpoint

These commands were run successfully in this branch on 2026-03-30:

```bash
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Observed results:
- repo-local catalog validation still passed: `Catalog is valid.`
- repo-local catalog build still compiled all 5 platforms successfully:
  - `codex`: `298` assets
  - `claude`: `314` assets
  - `copilot`: `303` assets
  - `gemini`: `304` assets
  - `antigravity`: `298` assets
- the Phase 4 Task 10 pass keeps framework-native runtime tests local while routing live browser and device evidence through the canonical testing skills

## Branch / Push Notes

- Current branch: `foundry-v2-plan-a`
- Local and remote `v2` both exist
- `foundry-v2-plan-a` and `origin/v2` are diverged, not fast-forward
- `git rev-list --left-right --count HEAD...origin/v2` returned `16 1`

Interpretation:
- this branch is ahead by 16 commits relative to the merge base comparison
- `origin/v2` also has 1 commit not in this branch
- pushing directly to `origin/v2` is not a safe fast-forward operation

Recommended safe next move:
1. Keep working on `foundry-v2-plan-a`
2. Push that branch to origin as needed
3. Open a PR targeting `v2` when the broader realignment is ready

Do not push directly to:
- `main`
- `v2`

If you continue from home, keep working on `foundry-v2-plan-a` and only integrate through a PR.

## Branch Status Note

The latest pushed checkpoint is still the design-collapse handoff refresh, and the current local worktree now contains uncommitted Phase 3 Task 8 plus Phase 4 Task 9 and Task 10 changes.

- Branch: `foundry-v2-plan-a`
- Latest pushed commit: `2c10c73e docs(foundry): refresh handoff for design collapse checkpoint`
- Local worktree status at handoff update time: dirty with the intended Phase 3 Task 8 and Phase 4 Task 9/10 edits

If you continue from home:
- fetch and switch to `foundry-v2-plan-a`
- do not continue from `main`
- do not continue from `v2`

## Global Superpowers Note

Global installed Superpowers skills in `~/.codex/superpowers` were inspected for reference-layout guidance, but they were not modified in this handoff state.

## Recommended Next Work

1. Commit the current Phase 3 Task 8 plus Phase 4 Task 9/10 checkpoint if you want to preserve the worktree state.
2. Continue from the 2026-03-28 realignment plan at Phase 5.
3. Rewrite the core agent and subagent surfaces against the reduced testing and design taxonomy.
4. After the agent pass, continue the broader reduction pass for:
   - agents/subagents
   - workflows
   - rules
5. Keep the remaining compatibility cleanup focused on the reduced canonical surface.

## Resume Prompt

Use this prompt in the next session:

```text
Continue from docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md in branch foundry-v2-plan-a within the active worktree `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`. The 2026-03-28 realignment spec and plan are the source of truth. Phase 1 and Phase 2 are complete. Phase 3 now includes both the design collapse checkpoint and the design prompting upgrade: canonical design now lives in `design`, `web-ui-design`, `mobile-ui-design`, and `design-system`, and the four design surfaces now share the stricter execution contract in `foundry/modules/design/references/execution-contract.md`. Phase 4 Task 9 and Task 10 are also complete in the worktree: the language skills retain their existing module IDs for now but now own language-level testing guidance cleanly, and the framework skills now keep runtime-boundary tests local while routing live browser/device evidence through `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`. The next task is Phase 5: rewrite the agent/subagent, workflow, and rule surfaces around that reduced taxonomy. Do not switch back to the older migration sequence or treat the main checkout as the active implementation area.
```
