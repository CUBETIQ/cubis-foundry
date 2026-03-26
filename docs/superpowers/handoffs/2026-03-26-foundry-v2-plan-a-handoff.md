# Foundry V2 Plan A Handoff

Date: 2026-03-26
Repo: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
Branch: `foundry-v2-plan-a`
Remote: `origin https://github.com/CUBETIQ/cubis-foundry.git`

## Why This File Exists

This is a resume point for continuing the Foundry V2 migration from another session or machine. It captures the important decisions, current branch state, fresh verification evidence, and the next recommended work.

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

## Important Current Gap

The new canonical skills now include `References` sections in `SKILL.md`, but sidecar `references/` directories are not migrated or projected yet.

Current behavior:
- `src/cli/compiler/stages/transform.ts` discovers `SKILL.md` files and copies them to platform output paths.
- No sidecar `references/` files are currently discovered or emitted.
- Adapter `skills.projection` metadata exists, but the current transform path does not apply a platform-specific skill projection pipeline beyond output path selection.

This means Foundry does not yet match the full Superpowers-style skill layout of:
- `SKILL.md`
- `references/*.md`
- platform-aware packaging of both

## Verification Run Before Handoff

These commands were run successfully in this branch on 2026-03-26:

```bash
npm run test:cli -- src/cli/commands/register.test.ts src/cli/catalog/catalog.test.ts src/cli/compiler/projectors/projectors.test.ts src/cli/compiler/compiler.test.ts
npx tsc -p tsconfig.cli.json --noEmit
npm run test:cli-help
```

Observed results:
- `36` tests passed in the targeted CLI suite
- TypeScript CLI compile check passed
- Built CLI help validation passed

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

## Global Superpowers Note

Global installed Superpowers skills in `~/.codex/superpowers` were inspected for reference-layout guidance, but they were not modified in this handoff state.

## Recommended Next Work

1. Implement canonical sidecar `references/` support for skills in Foundry.
2. Decide the canonical storage rule:
   - `foundry/modules/<skill-id>/references/*.md`
3. Extend compiler transform/install logic so references are emitted alongside each projected skill.
4. Add tests proving:
   - references are discovered
   - references are copied to each supported platform skill directory
   - module-scoped compilation includes owned references only
5. Only after Foundry packaging works cleanly, update any global Superpowers files if a wording or structure adjustment is still necessary.

## Resume Prompt

Use this prompt in the next session:

```text
Continue from docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md in branch foundry-v2-plan-a. The next task is to implement canonical skill sidecar references/ support in Foundry so projected skills can include Superpowers-style reference files across Claude, Codex, Copilot, and Gemini. Do not modify ~/.codex/superpowers unless the Foundry compiler change proves a global skill update is still needed.
```
