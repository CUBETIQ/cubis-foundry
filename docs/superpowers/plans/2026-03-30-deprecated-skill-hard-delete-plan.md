# Deprecated Skill Hard Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove deprecated and internal skill modules from `foundry/modules`, stop those names from resolving, and keep the catalog/runtime surfaces consistent with the reduced taxonomy.

**Architecture:** This cleanup removes eight skill source modules, then updates compiler/catalog/manifest/runtime surfaces so those deleted names are no longer emitted or treated as valid skills. The work is intentionally breaking: no compatibility alias layer should remain for the deleted names.

**Tech Stack:** Node.js CLI compiler, generated runtime assets, MCP manifest generation, Markdown skill sources, Vitest, TypeScript.

---

### Task 1: Delete Deprecated And Internal Skill Modules

**Files:**
- Delete: `foundry/modules/qa/**`
- Delete: `foundry/modules/unit-testing/**`
- Delete: `foundry/modules/integration-testing/**`
- Delete: `foundry/modules/playwright-interactive/**`
- Delete: `foundry/modules/stitch/**`
- Delete: `foundry/modules/mcp-core/**`
- Delete: `foundry/modules/research-core/**`
- Delete: `foundry/modules/rules-core/**`

- [ ] **Step 1: Confirm the exact directories still exist**

Run:

```bash
find foundry/modules -maxdepth 1 -type d | sort | rg '/(qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core)$'
```

Expected: all 8 target directories are listed.

- [ ] **Step 2: Delete the target module directories**

Run:

```bash
rm -rf foundry/modules/qa \
  foundry/modules/unit-testing \
  foundry/modules/integration-testing \
  foundry/modules/playwright-interactive \
  foundry/modules/stitch \
  foundry/modules/mcp-core \
  foundry/modules/research-core \
  foundry/modules/rules-core
```

- [ ] **Step 3: Confirm the directories are gone**

Run:

```bash
find foundry/modules -maxdepth 1 -type d | sort | rg '/(qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core)$'
```

Expected: no matches.

- [ ] **Step 4: Commit the source-tree deletion checkpoint**

```bash
git add foundry/modules
git commit -m "refactor(foundry): remove deprecated skill modules"
```

### Task 2: Remove Deleted Skills From Compiler And Manifest Resolution

**Files:**
- Modify: `src/cli/compiler/stages/transform.ts`
- Modify: `src/cli/catalog/catalog.test.ts`
- Modify: `src/cli/compiler/compiler.test.ts`
- Modify: `scripts/generate-mcp-manifest.mjs`
- Modify: `scripts/lib/legacy-skill-map.mjs`
- Modify: `mcp/generated/mcp-manifest.json`

- [ ] **Step 1: Write or update failing expectations that deleted skills no longer resolve**

Add assertions covering:

```ts
expect(skillIds).not.toContain("qa");
expect(skillIds).not.toContain("unit-testing");
expect(skillIds).not.toContain("integration-testing");
expect(skillIds).not.toContain("playwright-interactive");
expect(skillIds).not.toContain("stitch");
expect(skillIds).not.toContain("mcp-core");
expect(skillIds).not.toContain("research-core");
expect(skillIds).not.toContain("rules-core");
```

- [ ] **Step 2: Run the targeted tests to watch them fail**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
```

Expected: failures mentioning deleted skills still present in catalog/compiler output or expectations not yet updated.

- [ ] **Step 3: Remove alias and manifest emission for deleted names**

Update the compiler and manifest code so it no longer:

```ts
// stop emitting deleted names entirely
const deletedSkills = new Set([
  "qa",
  "unit-testing",
  "integration-testing",
  "playwright-interactive",
  "stitch",
  "mcp-core",
  "research-core",
  "rules-core",
]);
```

Apply the equivalent logic in the actual code paths that currently emit or remap those names.

- [ ] **Step 4: Regenerate the MCP manifest**

Run:

```bash
node scripts/generate-mcp-manifest.mjs
```

Expected: regenerated manifest contains no entries for the deleted skills.

- [ ] **Step 5: Re-run the targeted tests**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the compiler/manifest cleanup**

```bash
git add src/cli/compiler/stages/transform.ts src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts scripts/generate-mcp-manifest.mjs scripts/lib/legacy-skill-map.mjs mcp/generated/mcp-manifest.json
git commit -m "refactor(foundry): stop resolving deleted skills"
```

### Task 3: Remove Remaining Deleted-Skill References From Runtime Guidance

**Files:**
- Modify: any workflow, route, or docs surfaces still referencing the deleted skill names
- Likely modify: `mcp/src/tools/routeResolve.ts`
- Likely modify: `mcp/src/tools/skillTools.test.ts`
- Likely modify: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Modify: `docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md`

- [ ] **Step 1: Search for surviving references to deleted skill names**

Run:

```bash
rg -n "qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core" .
```

Expected: a list of remaining references outside deleted directories.

- [ ] **Step 2: Remove or rewrite the surviving references**

Replace them with the canonical surfaces:

```text
qa -> web-testing / android-emulator-testing / ios-simulator-testing
unit-testing -> owning language skill
integration-testing -> owning framework or platform skill
playwright-interactive -> web-testing
stitch -> design or design-system, depending on context
```

- [ ] **Step 3: Update the active plan and handoff to record the breaking cleanup**

Record:

```text
- the 8 deprecated/internal modules were physically deleted
- those names no longer resolve
- this was an intentional breaking reduction
- the next phase starts from the smaller post-delete surface
```

- [ ] **Step 4: Commit the runtime/docs cleanup**

```bash
git add mcp docs
git commit -m "docs(foundry): record hard deletion of deprecated skills"
```

### Task 4: Run Full Verification For The Breaking Cleanup

**Files:**
- Verify only

- [ ] **Step 1: Build the CLI and MCP surfaces**

Run:

```bash
npm run build:cli
```

Expected: PASS.

- [ ] **Step 2: Run targeted CLI tests**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/compiler/compiler.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the TypeScript no-emit check**

Run:

```bash
npx tsc -p tsconfig.cli.json --noEmit
```

Expected: PASS.

- [ ] **Step 4: Validate the catalog**

Run:

```bash
node dist/cli/index.js catalog validate
```

Expected:

```text
Catalog is valid.
```

- [ ] **Step 5: Build the catalog**

Run:

```bash
node dist/cli/index.js catalog build
```

Expected: all platforms compile successfully and deleted skills do not reappear in generated runtime assets.

- [ ] **Step 6: Capture final deletion proof**

Run:

```bash
find foundry/modules -maxdepth 2 -name 'SKILL.md' | sort | wc -l
rg -n "qa|unit-testing|integration-testing|playwright-interactive|stitch|mcp-core|research-core|rules-core" generated/runtime-assets mcp/generated
```

Expected:
- skill count is lower than 54
- no matches for the deleted names in generated runtime assets or generated MCP manifest

- [ ] **Step 7: Commit the verified final checkpoint**

```bash
git add .
git commit -m "refactor(foundry): hard-delete deprecated skills"
```
