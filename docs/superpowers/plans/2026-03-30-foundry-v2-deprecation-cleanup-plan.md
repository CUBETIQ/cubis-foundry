# Foundry V2 Deprecation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove deprecated, unused, and misleading Foundry V2 surfaces across active runtime/code paths first, then collapse historical docs so the repo has one clear source of truth and one explicit migration ledger.

**Architecture:** Treat cleanup as a two-tier process. Tier 1 removes or rewrites active behavior-bearing surfaces so deleted skills, wrappers, and stale aliases stop affecting runtime, routing, generation, and onboarding. Tier 2 cleans historical plans/specs/handoffs so only one current plan/spec pair remains authoritative while older docs are either archived, reduced to short tombstones, or deleted when they add no value.

**Tech Stack:** Git branch `v2`, Foundry module YAML + `SKILL.md`, MCP tools/runtime, CLI/catalog/compiler scripts, generated instruction surfaces, markdown plans/specs/handoffs.

---

## Assumptions

- This plan covers **everything**, including active code, runtime assets, tests, and historical docs.
- `main` remains untouched. All cleanup happens on `v2`.
- Deleted/deprecated names may remain only where they are explicitly needed as:
  - regression guards
  - negative tests
  - migration tombstones
- If a historical document is kept, it must point clearly to the current source of truth instead of pretending to be active.

## Target End State

- Only current canonical skills, workflows, agents, hooks, and runtime surfaces remain active.
- No deprecated skill or wrapper name is advertised as a valid current user-facing surface.
- Old names remain only in:
  - narrow negative tests
  - compatibility guards that intentionally reject them
  - one migration ledger / tombstone doc set
- `docs/superpowers/` clearly answers:
  - what is active now
  - what was removed
  - where to continue work

## Cleanup Rules

- Prefer delete over demote when the surface no longer serves users.
- Prefer rewrite over alias when the old name still leaks into active instructions.
- Prefer a short tombstone note over a full stale historical document when the old document no longer helps execution.
- Keep regression coverage for removed names only when it protects current behavior.
- Do not preserve multiple “active” plans for the same migration.

---

### Task 1: Produce a final deprecated/unused inventory

**Files:**
- Read: `foundry/**`
- Read: `src/**`
- Read: `mcp/**`
- Read: `scripts/**`
- Read: `workflows/**`
- Read: `docs/superpowers/**`
- Create: `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md`

- [ ] **Step 1: Scan active code and runtime surfaces for deprecated names**

Run:

```bash
rg -n '(qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core|frontend-design|design-audit|stitch-design-orchestrator|stitch-design-system|stitch-implementation-handoff|stitch-prompt-enhancement)' foundry src scripts mcp workflows --glob '!docs/**' --glob '!generated/**'
```

Expected:
- A bounded list of remaining active-code references, each classifiable as `delete`, `rewrite`, `guard`, or `test-only`.

- [ ] **Step 2: Scan historical docs for deprecated names and stale “active” instructions**

Run:

```bash
rg -n '(qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core|frontend-design|design-audit)' docs/superpowers
```

Expected:
- A list of docs to classify as `keep-current`, `tombstone`, `archive`, or `delete`.

- [ ] **Step 3: Write the inventory ledger**

Create `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md` with four sections:

```md
# Foundry V2 Deprecation Inventory

## Active Runtime/Code Surfaces To Rewrite
- <path> — <reason>

## Guards/Negative Tests To Keep
- <path> — <reason>

## Historical Docs To Tombstone
- <path> — <reason>

## Historical Docs To Delete
- <path> — <reason>
```

- [ ] **Step 4: Commit the inventory**

```bash
git add docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md
git commit -m "docs(foundry): add deprecation cleanup inventory"
```

---

### Task 2: Remove remaining deprecated names from active runtime/code surfaces

**Files:**
- Modify: `foundry/**`
- Modify: `src/**`
- Modify: `mcp/**`
- Modify: `scripts/**`
- Modify: `workflows/**`
- Test: affected CLI/MCP tests

- [ ] **Step 1: Rewrite active source files flagged as `rewrite` from Task 1**

Edit only files where deprecated names still influence live behavior:

```text
- route resolution
- MCP runtime traces
- manifest generation
- generated instruction prompts
- CLI help/output that still advertises removed surfaces
```

Expected result:
- No deprecated name remains in active source unless it is a deliberate rejection/guard path.

- [ ] **Step 2: Delete dead active files flagged as `delete` from Task 1**

Delete only files or modules that are no longer referenced by canonical runtime behavior.

Run after deletion:

```bash
git status --short
```

Expected:
- Only the intended removed files appear as deletions.

- [ ] **Step 3: Keep and label guard paths explicitly**

Where an old name remains intentionally, rewrite the surrounding code/comment so the intent is obvious:

```ts
// Deleted skill IDs are filtered intentionally so removed wrappers never re-enter
// route selection or emitted runtime assets.
```

Expected result:
- Remaining old-name references are clearly guards, not hidden compatibility support.

- [ ] **Step 4: Run focused verification**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/catalog/agent-surfaces.test.ts src/cli/catalog/shared-workflow-bundle.test.ts src/cli/catalog/generated-instruction-surfaces.test.ts src/cli/compiler/compiler.test.ts
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/stitchExecute.test.ts src/tools/registry.test.ts src/tools/mobileQaRun.test.ts
```

Expected:
- All targeted CLI and MCP tests pass.

- [ ] **Step 5: Commit active-surface cleanup**

```bash
git add foundry src mcp scripts workflows
git commit -m "refactor(foundry): remove deprecated active surfaces"
```

---

### Task 3: Collapse historical plans/specs/handoffs to one clear source of truth

**Files:**
- Modify or delete: `docs/superpowers/specs/*.md`
- Modify or delete: `docs/superpowers/plans/*.md`
- Modify: `docs/superpowers/handoffs/*.md`

- [ ] **Step 1: Define the authoritative current docs**

Keep as authoritative:

```text
docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md
docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md
docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md
```

Expected:
- One active spec, one active implementation plan, one active handoff.

- [ ] **Step 2: Tombstone superseded docs instead of leaving them half-active**

For every superseded but retained doc, replace the top section with a concise note:

```md
> Superseded by:
> - `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
> - `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
>
> Historical record only. Do not execute from this file.
```

Expected:
- No older plan/spec still reads like an active execution source.

- [ ] **Step 3: Delete docs flagged `delete` in the inventory**

Delete only docs that are fully duplicated, misleading, or have no remaining archival value.

Run:

```bash
git status --short docs/superpowers
```

Expected:
- Only intended doc edits/deletions are present.

- [ ] **Step 4: Rewrite the handoff into a clean resume document**

Update `docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md` so it contains:

```md
- current branch
- current canonical docs
- current verification commands
- what remains
- what was intentionally removed
```

Expected:
- Another session can start from one handoff instead of reconstructing history.

- [ ] **Step 5: Commit doc collapse**

```bash
git add docs/superpowers
git commit -m "docs(foundry): collapse deprecated migration docs"
```

---

### Task 4: Reduce low-value regression noise without losing protection

**Files:**
- Modify: `src/cli/catalog/*.test.ts`
- Modify: `src/cli/compiler/compiler.test.ts`
- Modify: `mcp/src/tools/*.test.ts`

- [ ] **Step 1: Keep only negative tests that protect current behavior**

Allowed examples:

```text
- deleted names do not resolve
- invalid explicit route syntax fails cleanly
- deprecated names do not reappear in generated assets
```

Expected:
- Tests still protect the reduced taxonomy, but do not preserve obsolete behavior.

- [ ] **Step 2: Remove tests that only preserve historical wiring**

Delete or rewrite tests that assume compatibility for surfaces intentionally removed from the product.

Expected:
- Test suite checks current product rules, not legacy nostalgia.

- [ ] **Step 3: Re-run targeted verification**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/catalog/agent-surfaces.test.ts src/cli/catalog/shared-workflow-bundle.test.ts src/cli/catalog/generated-instruction-surfaces.test.ts src/cli/compiler/compiler.test.ts
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/stitchExecute.test.ts src/tools/registry.test.ts src/tools/mobileQaRun.test.ts
```

Expected:
- The trimmed suite still passes.

- [ ] **Step 4: Commit regression cleanup**

```bash
git add src/cli mcp/src/tools
git commit -m "test(foundry): trim deprecated-surface regressions"
```

---

### Task 5: Full repo verification and final cleanup gate

**Files:**
- Modify: any stragglers found by verification

- [ ] **Step 1: Run full cleanup verification**

Run:

```bash
npx tsc -p tsconfig.cli.json --noEmit
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
git status --short
```

Expected:
- TypeScript check passes.
- Catalog validates.
- Catalog builds all platforms.
- Working tree contains only intended changes.

- [ ] **Step 2: Run one final stale-name sweep**

Run:

```bash
rg -n '(qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core|frontend-design|design-audit|stitch-design-orchestrator|stitch-design-system|stitch-implementation-handoff|stitch-prompt-enhancement)' foundry src scripts mcp workflows docs/superpowers --glob '!generated/**'
```

Expected:
- Remaining hits are only:
  - intentional guards
  - negative tests
  - tombstoned historical notes

- [ ] **Step 3: Write final cleanup note into handoff**

Append a short final section to the active handoff:

```md
## Deprecation Cleanup Status
- active deprecated surfaces removed
- historical docs collapsed
- remaining old-name hits are intentional guards/tests/tombstones only
```

- [ ] **Step 4: Commit final cleanup**

```bash
git add .
git commit -m "chore(foundry): finish deprecated surface cleanup"
```

- [ ] **Step 5: Push**

```bash
git push origin v2
```

Expected:
- `v2` contains the final cleaned state.

---

## Success Criteria

- No deprecated or removed surface is advertised as current in active runtime/code outputs.
- Historical docs no longer compete with the current realignment spec/plan.
- Remaining old-name references exist only for guards, negative tests, or tombstones.
- The repo can be resumed from one current plan and one current handoff.
- `v2` passes targeted CLI/MCP verification plus `catalog validate` and `catalog build`.
