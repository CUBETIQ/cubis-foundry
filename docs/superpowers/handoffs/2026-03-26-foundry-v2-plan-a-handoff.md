# Foundry V2 Plan A Handoff

Date: 2026-03-27
Repo: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
Branch: `foundry-v2-plan-a`
Remote: `origin https://github.com/CUBETIQ/cubis-foundry.git`

## Why This File Exists

This is a resume point for continuing the Foundry V2 realignment from another session or machine. It captures the important decisions, current branch state, fresh verification evidence, and the next recommended work.

## Current Resume Status

- Active source of truth now lives in:
  - `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
  - `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Phase 1 and Phase 2 Tasks 1-4 are complete in the active worktree.
- Phase 2 Task 5 is now complete.
- The current checkpoint demotes the old testing wrappers:
  - `qa` is now a compat alias that routes to `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`
  - `playwright-interactive` is now specialist browser support under `web-testing`
  - workflows and core agent prompts now reference the new testing stack instead of generic `unit-testing` / `integration-testing` wrappers for user-facing routing
- The current checkpoint also redistributes testing ownership:
  - language skills now explicitly own unit-test guidance
  - framework and platform skills now explicitly own integration-test guidance
- Shared workflow and agent scaffolds have also been updated to prefer `web-testing`, `android-emulator-testing`, and `ios-simulator-testing` over the retired generic testing routes.
- The old MCP alias layer has also been cleaned:
  - `mcp/README.md` examples now use the canonical Android testing skill
  - `scripts/lib/legacy-skill-map.mjs` now routes broad historical testing patterns through `qa` instead of `unit-testing`
  - `scripts/generate-mcp-manifest.mjs` now scans `foundry/modules` so generated alias entries point at real canonical `SKILL.md` paths instead of stale `workflows/skills/*` paths

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
   - `foundry/modules/rules-core/rules/`
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
   - `foundry/modules/playwright-interactive/references/`
   - and the remaining exact-match `references/*.md` payloads for the canonical skill modules that already linked to them
6. Restored `foundry/modules/playwright-interactive/agents/*.md` from legacy history so the canonical skill's internal agent references resolve again.
7. Added compiler validation for broken relative markdown links inside canonical `SKILL.md` files.
8. Updated `design-audit` to use current canonical references:
   - local `references/scoring-rubric.md`
   - `../playwright-interactive/SKILL.md`
9. Repointed the `qa` capability metadata away from dead legacy workflow skill paths:
   - `foundry/modules/qa/module.yaml` now targets canonical `foundry/modules/qa/SKILL.md`
   - Playwright browser mode now targets `foundry/modules/playwright-interactive/SKILL.md`
   - added a catalog regression test locking those canonical `qa` output paths in place
10. Repointed the remaining compiler-facing legacy module descriptors:
   - `foundry/modules/design/module.yaml` now routes all capability outputs through canonical `foundry/modules/design/SKILL.md`
   - `foundry/modules/stitch/module.yaml` now points at canonical `foundry/modules/stitch/SKILL.md`
11. Added a real canonical `foundry/modules/stitch/SKILL.md` compat wrapper and updated the `design` and `stitch` wrapper content to route into the current frontend design stack instead of retired `workflows/skills/*` sub-skills.
12. Cleaned stale canonical naming references such as `flutter-mobile-qa` and `stitch-design-system` from the affected design and handoff skills/templates.
13. Added catalog regression tests locking `design` and `stitch` canonical output paths in place.
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

## Important Current Gap

The canonical authoring surfaces now resolve their currently referenced relative markdown files, and the compiler will fail fast if a future canonical skill, template, reference doc, or agent markdown file links to a missing sidecar file or nested markdown dependency.

The remaining migration work is now narrower:
- the repo still carries too many overlapping skills and wrappers; a reduction pass is still needed to classify skills/agents/workflows into `keep`, `merge`, `compat-alias`, or `remove`
- some recovered or reference-side content may still mention historical names where the repo intentionally keeps backward-looking terminology for narrative reasons
- if new canonical skills or templates are added, they must now satisfy the compiler's markdown-link validation rules

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
1. Commit the current branch
2. Push `foundry-v2-plan-a` to origin
3. Open a PR targeting `v2`

Do not push directly to:
- `main`
- `v2`

If you continue from home, keep working on `foundry-v2-plan-a` and only integrate through a PR.

## Worktree Status Note

The worktree is not clean. It contains both modified tracked files and new untracked files/directories that must be included in the next commit.

Modified tracked areas include:
- compiler and catalog code under `src/cli/**`
- platform/runtime generation scripts under `scripts/**`
- canonical design/qa/stitch skill sources under `foundry/modules/**`
- this handoff file and related docs

New untracked content includes:
- restored canonical `references/` directories for many skills under `foundry/modules/*/references/`
- restored Playwright sidecar agent docs under `foundry/modules/playwright-interactive/agents/`
- new compat wrapper at `foundry/modules/stitch/SKILL.md`

When you commit from home, do not stage only modified tracked files. Make sure the new files are added too, especially:
- `foundry/modules/*/references/**`
- `foundry/modules/playwright-interactive/agents/**`
- `foundry/modules/stitch/SKILL.md`

## Global Superpowers Note

Global installed Superpowers skills in `~/.codex/superpowers` were inspected for reference-layout guidance, but they were not modified in this handoff state.

## Recommended Next Work

1. Move into Phase 3 design-stack realignment from the 2026-03-28 realignment plan.
2. Collapse the current frontend/design stack into `design`, `web-ui-design`, and `mobile-ui-design`.
3. Keep `stitch` only as a thin compat alias where explicit backward compatibility is still required.

## Resume Prompt

Use this prompt in the next session:

```text
Continue from docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md in branch foundry-v2-plan-a within the active worktree `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`. The 2026-03-28 realignment spec and plan are now the source of truth. Phase 1 and Phase 2 are complete, including the three canonical testing skills, the CLI-first mobile / Playwright-MCP runtime split, the redistributed language/framework testing guidance, and the MCP alias-layer cleanup that reanchors generated manifest paths to `foundry/modules`. The next task is Phase 3 design-stack realignment: collapse the current frontend/design surfaces into `design`, `web-ui-design`, and `mobile-ui-design`, while keeping `stitch` as a thin compat alias only where explicit backward compatibility is still required. Do not switch back to the older migration sequence or treat the main checkout as the active implementation area.
```
