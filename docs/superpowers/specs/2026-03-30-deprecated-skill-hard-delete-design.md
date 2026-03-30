# Deprecated Skill Hard Delete Design

Date: 2026-03-30
Repo: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
Branch: `foundry-v2-plan-a`

## Goal

Reduce the visible skill surface by physically deleting deprecated and internal skill modules instead of keeping them as compatibility stubs or synthetic aliases.

This is an intentional breaking cleanup. The old names listed here are expected to stop resolving.

## Approved Direction

Use the hard-delete option:

- physically delete the deprecated public skill modules
- physically delete the internal support skill modules
- do not preserve compatibility aliases for the deleted names

## Scope

Delete these module directories from `foundry/modules`:

- `qa`
- `unit-testing`
- `integration-testing`
- `playwright-interactive`
- `stitch`
- `mcp-core`
- `research-core`
- `rules-core`

## Consequences

These names will stop resolving:

- `qa`
- `unit-testing`
- `integration-testing`
- `playwright-interactive`
- `stitch`
- `mcp-core`
- `research-core`
- `rules-core`

This means:

- old user habits and old prompts using those names will break until migrated
- generated runtime assets should no longer include those deleted skills
- any compiler, manifest, workflow, routing, or docs surface still referencing them must be updated or removed

## Replacement Surface

The reduced surface after deletion should route work through existing canonical skills:

- testing:
  - `web-testing`
  - `android-emulator-testing`
  - `ios-simulator-testing`
- design:
  - `design`
  - `web-ui-design`
  - `mobile-ui-design`
  - `design-system`
- direct framework or language skills for local testing ownership

## Implementation Steps

1. Delete the 8 module directories under `foundry/modules`.
2. Remove any synthetic alias generation or manifest behavior that still emits those names.
3. Update compiler/catalog/runtime surfaces so those deleted names are no longer treated as valid skills.
4. Update plan/handoff docs to record the intentional breaking cleanup.
5. Rebuild and validate the catalog.

## Verification

Minimum verification for this cleanup:

```bash
npm run build:cli
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
npx tsc -p tsconfig.cli.json --noEmit
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Success criteria:

- deleted modules are gone from `foundry/modules`
- deleted names no longer appear in generated runtime assets as skills
- catalog validation passes
- targeted compiler/catalog tests pass after updating expectations

## Non-Goals

- no attempt to preserve backward compatibility for deleted names
- no language/framework renames in this cleanup
- no new alias layer replacing the removed modules
