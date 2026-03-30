# Foundry V2 Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current scattered migration notes with one coherent execution path that reduces user-facing skill sprawl, rewrites testing/design/agent/workflow/rule surfaces, and aligns Foundry V2 around the new canonical model.

**Architecture:** Keep the existing catalog/compiler foundation, but change the authoring model above it. Rebuild the human-facing taxonomy first, then rewrite agents/workflows/rules to match it, then clean up adapters and compatibility layers.

**Tech Stack:** Markdown specs and plans, Foundry module YAML + `SKILL.md`, agent/workflow/rule authoring files, catalog/compiler CLI, Playwright MCP, Android `adb`, iOS `simctl` and Python helper scripts.

Current runtime note:
- `mobile-mcp` is now part of the active MCP/runtime plan as a first-class provider.
- Web remains Playwright-MCP-first.
- Android/iOS testing guidance is dual-path: semantic MCP first where available, CLI-first fallback for deterministic evidence and recovery.

---

## Scope and Working Copy

- Active worktree: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
- Source-of-truth spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
- This plan supersedes the older active migration path for day-to-day work, but older plans remain in repo as historical context.
- Progress snapshot on 2026-03-28:
  - Tasks 1-4 are complete.
  - Task 5 is complete.
  - Current checkpoint: the deprecated/internal testing and core skill modules are physically deleted, the old names no longer resolve, workflow/agent/runtime references now prefer the reduced canonical surfaces, and the MCP alias layer has been reanchored to `foundry/modules`.
  - `catalog build` now clears stale platform output before writing regenerated runtime assets, so deleted skills do not linger in `generated/runtime-assets`.

---

## Phase 1 — Establish the New Source of Truth

### Task 1: Supersede older top-level plans and specs

**Files:**
- Modify: `docs/superpowers/specs/2026-03-25-foundry-v2-unified-control-plane-design.md`
- Modify: `docs/superpowers/specs/2026-03-26-agent-workflow-skill-canonical-model.md`
- Modify: `docs/superpowers/plans/2026-03-26-foundry-v2-unified-plan.md`
- Modify: `docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md`

- [x] Add short superseded notes pointing to the new spec and plan.
- [x] Add the active worktree path note where appropriate.
- [x] Update the handoff so the next recommended work follows this plan, not the older scattered plan set.

### Task 2: Inventory and classify current surfaces

**Files:**
- Create: `docs/superpowers/plans/2026-03-28-foundry-v2-reduction-matrix.md`
- Read: `foundry/modules/*/module.yaml`
- Read: `foundry/modules/*/SKILL.md`
- Read: `foundry/modules/workflows/*/workflow.md`
- Read: `foundry/modules/agents-core/agents/*.md`

- [x] List every current skill, agent, and workflow.
- [x] Classify each skill as `keep`, `merge`, `compat-alias`, or `remove`.
- [x] Classify each agent as `core`, `domain-specialist`, `alias`, or `remove`.
- [x] Confirm whether each existing workflow stays, renames, or folds into another workflow.

---

## Phase 2 — Rebuild the Testing Stack

### Task 3: Define the three canonical testing skills

**Files:**
- Create: `foundry/modules/web-testing/`
- Create: `foundry/modules/android-emulator-testing/`
- Create: `foundry/modules/ios-simulator-testing/`
- Read seed content from:
  - `sample/Test Web Apps Full/skills/web-ui-qa/SKILL.md`
  - `sample/Test Android Apps/skills/android-emulator-qa/SKILL.md`
  - `sample/Test iOS Apps Full/skills/ios-simulator-qa/SKILL.md`
  - `sample/Test iOS Skills Full/ios-simulator-skill/**`

- [x] Create `module.yaml` and `SKILL.md` for `web-testing`.
- [x] Create `module.yaml` and `SKILL.md` for `android-emulator-testing`.
- [x] Create `module.yaml` and `SKILL.md` for `ios-simulator-testing`.
- [x] Add sidecar references and helper content where needed.

### Task 4: Make runtime boundaries explicit

**Files:**
- Modify: `foundry/modules/mcp-core/**`
- Modify: `src/cli/core.ts`
- Modify: any relevant MCP runtime/config docs

- [x] Keep Playwright MCP as the canonical browser-testing runtime.
- [x] Remove Android MCP from the default testing path.
- [x] Document that Android and iOS are dual-path: `mobile-mcp` preferred for semantic interaction, CLI retained as deterministic fallback.
- [x] Ensure generated guidance no longer implies Android MCP is required for mobile testing.

### Task 5: Remove old testing wrappers and fold their content into the reduced taxonomy

**Files:**
- Modify or demote:
  - `foundry/modules/qa/**`
  - `foundry/modules/unit-testing/**`
  - `foundry/modules/integration-testing/**`
  - `foundry/modules/playwright-interactive/**`

- [x] Remove `qa`, `unit-testing`, `integration-testing`, and `playwright-interactive` as skill surfaces after their content was redistributed.
- [x] Fold unit-test guidance into language/framework skills.
- [x] Fold integration-test guidance into framework/platform skills.
- [x] Retain only the browser and device guidance that is still useful under the canonical testing skills.

Status:
- `web-testing` is now the canonical browser runtime surface.
- Unit-test guidance now lives explicitly in the language skills:
  - `typescript-best-practices`
  - `python-best-practices`
  - `golang-best-practices`
  - `rust-best-practices`
  - `java-best-practices`
  - `kotlin-best-practices`
  - `swift-best-practices`
  - `csharp-best-practices`
- Integration-test guidance now lives explicitly in the framework and platform skills:
  - `react`
  - `nextjs`
  - `fastapi`
  - `nestjs`
  - `django-drf`
  - `spring-boot`
  - `sqlalchemy`
  - `prisma`
  - `svelte-sveltekit`
  - `expo-app`
- Task 5 closeout is complete:
  - stale MCP docs/examples were updated to the canonical testing IDs
  - the broad testing alias map now routes historical testing-pattern requests through `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`
  - generated MCP manifest paths now point at `foundry/modules/*/SKILL.md`, which clears the old alias-manifest test failures
  - the deleted testing skill IDs no longer resolve or emit runtime assets

---

## Phase 3 — Rebuild the Design Stack

### Task 6: Create the new canonical design quartet

**Files:**
- Rebuild:
  - `foundry/modules/design/**`
  - `foundry/modules/web-ui-design/**`
  - `foundry/modules/mobile-ui-design/**`
  - `foundry/modules/design-system/**`

- [x] Make `design` the master routing and critique skill.
- [x] Make `web-ui-design` the browser-first design specialization.
- [x] Make `mobile-ui-design` the small-screen specialization.
- [x] Make `design-system` the canonical systemization support surface.

### Task 7: Absorb or demote fragmented frontend design skills

**Files:**
- Modify or demote:
  - `foundry/modules/frontend-design/**`
  - `foundry/modules/frontend-design-core/**`
  - `foundry/modules/frontend-design-screen-brief/**`
  - `foundry/modules/frontend-design-style-selector/**`
  - `foundry/modules/frontend-design-system/**`
  - `foundry/modules/frontend-design-implementation-handoff/**`
  - `foundry/modules/frontend-design-mobile-patterns/**`
  - `foundry/modules/design-audit/**`
  - `foundry/modules/stitch/**`

- [x] Keep `design-audit` only if it remains a clearly distinct review surface.
- [x] Remove `stitch` as a skill surface after design routing was absorbed by `design`, `web-ui-design`, `mobile-ui-design`, and `design-system`.
- [x] Merge redundant frontend-design content into the new trio.

Status:
- `web-ui-design` and `mobile-ui-design` now exist as canonical execution surfaces.
- `design` is now the public router and audit surface.
- `design-system` is now the canonical systemization support surface.
- Legacy frontend-design slices have been collapsed into the canonical design quartet.

### Task 8: Upgrade design prompting quality

**Files:**
- Modify: `foundry/modules/design/SKILL.md`
- Modify: `foundry/modules/web-ui-design/SKILL.md`
- Modify: `foundry/modules/mobile-ui-design/SKILL.md`
- Modify: `foundry/modules/design-system/SKILL.md`
- Add: `foundry/modules/design/references/execution-contract.md`

- [x] Encode stronger visual-direction constraints.
- [x] Add explicit mobile and web output structure.
- [x] Add clearer specialist-role separation for critique, systemization, and handoff.
- [x] Add a shared execution-contract reference only where it materially improves the prompt quality.
- [x] Tighten the canonical design prompts without widening into agent or workflow rewrites.

Status:
- The canonical design surfaces now separate routing/critique, systemization, and web/mobile execution more cleanly.
- The shared `references/execution-contract.md` payload now gives the four design surfaces a common deliverable contract.
- Task 8 is complete.

---

## Phase 4 — Language and Framework Skill Cleanup

### Task 9: Rename and normalize language skills

**Files:**
- Modify:
  - `foundry/modules/typescript-best-practices/**`
  - `foundry/modules/python-best-practices/**`
  - `foundry/modules/golang-best-practices/**`
  - `foundry/modules/rust-best-practices/**`
  - `foundry/modules/java-best-practices/**`
  - `foundry/modules/kotlin-best-practices/**`
  - `foundry/modules/swift-best-practices/**`
  - `foundry/modules/csharp-best-practices/**`

- [x] Retain module IDs for now and normalize the user-facing naming first.
- [x] Fold unit-test guidance into each language skill where appropriate.
- [x] Remove generic duplicated testing sections that no longer belong at top level.

Decision:
- Retain the existing module IDs for now and normalize the user-facing language-level guidance first.
- Keep the language skills owning unit-test guidance, but push framework, platform, and runtime-boundary checks out to the appropriate specialized skills.

### Task 10: Normalize framework skills

**Files:**
- Modify framework module content:
  - `react`
  - `nextjs`
  - `fastapi`
  - `nestjs`
  - `django-drf`
  - `spring-boot`
  - `sqlalchemy`
  - `prisma`
  - `svelte-sveltekit`
  - `expo-app`

- [x] Fold framework-specific testing guidance into each framework skill.
- [x] Remove overlap with the deleted top-level testing wrappers.
- [x] Keep framework skills concrete and user-searchable.

Status:
- First-pass normalization is complete for the framework skills listed in this task.
- The framework layer now keeps runtime-boundary tests local while making live browser and device evidence explicit through `web-testing`, `android-emulator-testing`, and `ios-simulator-testing` where applicable.
- Task 10 is complete for this worktree checkpoint.

---

## Phase 5 — Rebuild Agents and Subagents

### Task 11: Rewrite the core agent set against the reduced skill taxonomy

**Files:**
- Modify: `foundry/modules/agents-core/agents/*.md`

- [x] Update routing examples to the new skill names.
- [x] Remove dependence on deprecated wrappers.
- [x] Tighten MCP-vs-CLI-vs-subagent routing rules.

Status:
- First-pass rewrite is complete for the core agent set.
- `implementer`, `tester`, and `orchestrator` now encode the reduced testing taxonomy and explicit MCP-vs-CLI-vs-delegation boundaries.
- Regression coverage lives in `src/cli/catalog/agent-surfaces.test.ts`.
- Task 11 is complete for this worktree checkpoint.

### Task 12: Keep only justified domain specialists

**Files:**
- Modify or relocate:
  - `foundry/modules/playwright-interactive/agents/*.md`
  - any future design specialists

- [x] Keep browser specialists only if they materially improve `web-testing`.
- [x] Add design specialists only if they materially improve the design stack.
- [x] Remove or demote specialist prompts that merely restate a skill.

Status:
- Complete for this worktree checkpoint.
- The active module tree now contains only the 8 core agent prompts under `foundry/modules/agents-core/agents/*.md`.
- No extra browser- or design-specialist markdown prompts remain in `foundry/modules`.

---

## Phase 6 — Rebuild Workflows

### Task 13: Rewrite workflows against the reduced skill/agent surface

**Files:**
- Modify: `foundry/modules/workflows/*/workflow.md`
- Modify: `foundry/modules/workflows-core/**`

- [x] Keep workflow count small and explicit.
- [x] Ensure `/test` points into the new testing model.
- [x] Ensure design workflows target the new design trio.
- [x] Ensure workflow examples no longer mention retired wrappers.

Status:
- Canonical workflow markdown and the shared workflow bundle now align to the reduced taxonomy.
- The shared scaffold no longer advertises deleted testing or design-wrapper skills, and the manifest no longer emits them.
- Regression coverage lives in `src/cli/catalog/shared-workflow-bundle.test.ts`.
- Task 13 is complete for this worktree checkpoint.

---

## Phase 7 — Rebuild Rules and Platform Instruction Outputs

### Task 14: Rewrite rule packs for smarter agent behavior

**Files:**
- Modify: `foundry/modules/rules-core/**`
- Modify: `foundry/modules/rules-security/**`
- Modify adapter projection outputs as needed

- [x] Make rules encode routing policy, verification requirements, and tool boundaries.
- [x] Avoid duplicating full skill content inside rules.
- [x] Improve platform-native instruction quality for Codex, Claude, Gemini, and Copilot.

Status:
- The active steering/rule surfaces now emphasize route honoring, repo-first evidence, verification discipline, and explicit runtime/tool boundaries.
- `hooks-core` guidance now encodes Playwright-for-web, `mobile-mcp`-first mobile traversal, and CLI fallback for deterministic evidence.
- Task 14 is complete for this worktree checkpoint.

### Task 15: Rebuild generated instruction surfaces

**Files:**
- Modify generation logic and templates that project into:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `GEMINI.md`
  - Copilot instruction files

- [x] Make the generated instruction surfaces reflect the reduced taxonomy.
- [x] Ensure platform-specific features are represented cleanly.
- [x] Keep Playwright MCP guidance for web and remove Android MCP default guidance.

Status:
- The platform-asset generator no longer teaches deleted stitch-skill routing.
- Generated workflow/agent prompts now carry explicit runtime boundaries: Playwright MCP for web, `mobile-mcp` first for semantic mobile work, CLI fallback for deterministic evidence.
- Route/research hook templates for Claude and Gemini now reinforce the same web/mobile runtime policy.
- Regression coverage lives in `src/cli/catalog/generated-instruction-surfaces.test.ts`.
- Task 15 is complete for this worktree checkpoint.

---

## Phase 8 — Compiler, Catalog, and Adapter Cleanup

### Task 16: Align module metadata, adapters, and generated assets

**Files:**
- Modify: `foundry/adapters/*.yaml`
- Modify: `src/cli/catalog/**`
- Modify: `src/cli/compiler/**`
- Modify: generator/check scripts under `scripts/**`

- [ ] Remove stale projections to deprecated skill names.
- [ ] Ensure aliases project correctly where compatibility must remain.
- [ ] Ensure generated runtime assets match the reduced taxonomy.

Status:
- In progress.
- The shared workflow manifest, platform-asset generator, mirror sync script, and Stitch execution trace now stop projecting deleted skill wrappers into active runtime surfaces.
- Remaining hits are now mostly intentional legacy maps, workflow names, or historical docs rather than active canonical skill projections.

### Task 17: Validate migration completeness

**Files:**
- Update tests and validation scripts as needed

- [ ] Add catalog/compiler regression tests for the new testing and design surfaces.
- [ ] Re-run targeted CLI tests.
- [ ] Re-run repo-local `catalog validate` and `catalog build`.

---

## Phase 9 — Final Documentation Cleanup

### Task 18: Clean old docs without losing history

**Files:**
- Modify older plans/specs to point clearly to the new source-of-truth docs
- Update handoffs and contributor guidance

- [ ] Mark superseded docs consistently.
- [ ] Remove ambiguity about the active worktree and active branch.
- [ ] Ensure the next session can start from one plan, not six.

---

## Success Criteria

- Users see the reduced canonical skill surface clearly.
- Testing is routed through exactly three user-facing testing skills.
- Web testing uses Playwright MCP; Android MCP is no longer part of the default testing path.
- Design is routed through one master skill plus explicit web/mobile specializations.
- Language/framework skills remain concrete and user-facing.
- Agents and workflows reference the new reduced taxonomy.
- Rules project into smarter platform instruction files.
- The worktree docs no longer leave future sessions lost about what plan to follow.
