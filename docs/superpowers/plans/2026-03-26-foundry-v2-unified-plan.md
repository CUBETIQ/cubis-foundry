# Foundry V2 — Unified Implementation Plan

> **Supersedes:** Plans A (Control Plane Bootstrap), B (Compiler Pipeline), C (Capability Migration), D (CLI Subsystem Split), E (Documentation System)
>
> **Source of truth:** `docs/superpowers/specs/2026-03-26-agent-workflow-skill-canonical-model.md`
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

---

## Recap: What's Already Done

| Subsystem | Status | Notes |
|---|---|---|
| `foundry/package.yaml` | ✅ Complete | Canonical package manifest |
| `foundry/schemas/*.schema.json` | ✅ Complete | JSON Schema for package, module, adapter |
| `foundry/adapters/*.yaml` | ✅ Present | Projection arrays need filling in |
| `src/cli/catalog/` | ✅ Complete | Load, validate, resolve, profile APIs |
| `src/cli/compiler/` | ✅ Scaffolded | Transform + Emit + Resolve done; needs new format support |
| `src/cli/state/` | ✅ Complete | Platform state read/write |
| `src/cli/rules/` | ✅ Complete | Smart rules + merger |
| `src/cli/installer/` | ✅ Complete | Staged-diff installer |
| `foundry/modules/<id>/` | ✅ Migrated | 20+ capabilities in `foundry/modules/` — **old format** |

---

## Remaining Work: Scope

The canonical model spec (2026-03-26) materially changes how agents, skills, workflows, rules, and hooks are structured. All migrated capabilities need updating, plus three new subsystems (agents-core full prompts, rules canonical files, hooks-core) and two compiler updates.

---

## Phase 1 — Agents Core (Rewrite from Scratch)

**Why first:** Agent prompts inform workflow chain design. Nothing else depends on them, but they depend on nothing.

**Goal:** Full agent prompts for all canonical agents in `foundry/modules/agents/<id>/agent.md`.

### Task 1: Create agents-core module directory structure

- [ ] Create `foundry/modules/agents-core/module.yaml`
  ```yaml
  id: agents-core
  kind: specialist
  label: Core Agents
  description: Shared specialist agents — orchestrator, planner, implementer, reviewer, debugger, tester, explorer.
  stability: stable
  profiles: [core, developer]
  ```
- [ ] Create `foundry/modules/agents-core/agents/` directory

### Task 2: Write canonical agent prompts

Write all 8 agent prompts in canonical format. Each file: `foundry/modules/agents-core/agents/<id>.md` with YAML frontmatter + markdown body.

- [ ] **orchestrator.md** — Multi-specialist coordinator. Decomposes tasks, delegates to specialists, verifies output, iterates. **Primary orchestrator for all work.**
- [ ] **planner.md** — Takes a goal and produces a structured implementation plan. Uses `system-design`, `api-design`, `database-design` skills.
- [ ] **implementer.md** — Executes a plan. Loads relevant skills, writes code, self-verifies against acceptance criteria. `sandbox_mode: workspace-write`.
- [ ] **reviewer.md** — Code review agent. Loads `code-review`, `owasp-security-review`. `sandbox_mode: read-only`.
- [ ] **debugger.md** — Systematic debugging agent. Loads `systematic-debugging`. Root-cause analysis loop.
- [ ] **tester.md** — Test coverage agent. Loads `unit-testing`, `integration-testing`. Ensures acceptance criteria are tested.
- [ ] **explorer.md** — Codebase exploration agent. Reads files, maps structure, produces ARCHITECTURE.md / STRUCTURE.md.
- [ ] **researcher.md** — Deep research agent. Loads `deep-research`. Web search, synthesis, citation.

**Agent frontmatter template:**
```yaml
---
name: <id>
description: <one-sentence description>
tools: <comma-separated list>
model: sonnet   # Claude default; Codex uses model map (see adapter spec)
priority: high | medium | low
sandbox_mode: read-only | workspace-write
---
```

- [ ] **Commit:** `git add foundry/modules/agents-core/ && git commit -m "feat(agents-core): add canonical agent prompts for all 8 core agents"`

---

## Phase 2 — Skills Frontmatter (Enhance Existing)

**Goal:** Add canonical frontmatter to all existing migrated SKILL.md files in `foundry/modules/<id>/`.

**Old format (current):**
```yaml
---
name: api-design
description: ...
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
```

**New format (canonical):**
```yaml
---
name: api-design
description: API design best practices covering REST, GraphQL, gRPC patterns, versioning strategies, pagination, error contracts, and OpenAPI specifications for robust service interfaces.
triggers:
  - architecture
  - API design
  - REST
  - GraphQL
  - gRPC
  - versioning
  - OpenAPI
domains:
  - backend
  - infrastructure
whenToUse: "When designing a new REST API, modeling a GraphQL schema, defining gRPC services, or choosing a versioning strategy."
priority: primary | secondary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
```

### Task 3: Add frontmatter to all migrated SKILL.md files

Run a script or process each file manually to add:
- `triggers:` array (derived from existing content — extract key topics)
- `domains:` array (backend | frontend | infrastructure | security | data | mobile | design | etc.)
- `whenToUse:` one-sentence concrete trigger
- `priority:` primary (directly solving the problem) vs secondary (supporting)
- Replace `compatibility:` from string list to array of platform IDs

**Skills requiring frontmatter:**
- [ ] `foundry/modules/api-design/SKILL.md`
- [ ] `foundry/modules/architecture-doc/SKILL.md`
- [ ] `foundry/modules/ci-cd-pipeline/SKILL.md`
- [ ] `foundry/modules/code-review/SKILL.md`
- [ ] `foundry/modules/csharp-best-practices/SKILL.md`
- [ ] `foundry/modules/database-design/SKILL.md`
- [ ] `foundry/modules/deep-research/SKILL.md`
- [ ] `foundry/modules/design/SKILL.md`
- [ ] `foundry/modules/design-audit/SKILL.md`
- [ ] `foundry/modules/django-drf/SKILL.md`
- [ ] `foundry/modules/docker-compose-dev/SKILL.md`
- [ ] `foundry/modules/expo-app/SKILL.md`
- [ ] `foundry/modules/fastapi/SKILL.md`
- [ ] `foundry/modules/frontend-design/SKILL.md`
- [ ] `foundry/modules/frontend-design-core/SKILL.md`
- [ ] `foundry/modules/frontend-design-implementation-handoff/SKILL.md`
- [ ] `foundry/modules/frontend-design-mobile-patterns/SKILL.md`
- [ ] `foundry/modules/frontend-design-screen-brief/SKILL.md`
- [ ] `foundry/modules/frontend-design-style-selector/SKILL.md`
- [ ] `foundry/modules/frontend-design-system/SKILL.md`
- [ ] `foundry/modules/git-workflow/SKILL.md`
- [ ] `foundry/modules/golang-best-practices/SKILL.md`
- [ ] `foundry/modules/integration-testing/SKILL.md`
- [ ] `foundry/modules/java-best-practices/SKILL.md`
- [ ] `foundry/modules/kaizen-iteration/SKILL.md`
- [ ] `foundry/modules/kotlin-best-practices/SKILL.md`
- [ ] `foundry/modules/kubernetes-deploy/SKILL.md`
- [ ] `foundry/modules/mcp-core/SKILL.md`
- [ ] `foundry/modules/mcp-server-builder/SKILL.md`
- [ ] `foundry/modules/nestjs/SKILL.md`
- [ ] `foundry/modules/nextjs/SKILL.md`
- [ ] `foundry/modules/observability/SKILL.md`
- [ ] `foundry/modules/owasp-security-review/SKILL.md`
- [ ] `foundry/modules/pentest-skill/SKILL.md`
- [ ] `foundry/modules/playwright-interactive/SKILL.md`
- [ ] `foundry/modules/prisma/SKILL.md`
- [ ] `foundry/modules/prompt-engineering/SKILL.md`
- [ ] `foundry/modules/python-best-practices/SKILL.md`
- [ ] `foundry/modules/react/SKILL.md`
- [ ] `foundry/modules/research-core/SKILL.md`
- [ ] `foundry/modules/rules-core/SKILL.md` (if it exists — create if missing)
- [ ] `foundry/modules/rust-best-practices/SKILL.md`
- [ ] `foundry/modules/secret-management/SKILL.md`
- [ ] `foundry/modules/skill-creator/SKILL.md`
- [ ] `foundry/modules/spec-driven-delivery/SKILL.md`
- [ ] `foundry/modules/sqlalchemy/SKILL.md`
- [ ] `foundry/modules/spring-boot/SKILL.md`
- [ ] `foundry/modules/svelte-sveltekit/SKILL.md`
- [ ] `foundry/modules/swift-best-practices/SKILL.md`
- [ ] `foundry/modules/system-design/SKILL.md`
- [ ] `foundry/modules/systematic-debugging/SKILL.md`
- [ ] `foundry/modules/tech-doc/SKILL.md`
- [ ] `foundry/modules/typescript-best-practices/SKILL.md`
- [ ] `foundry/modules/unit-testing/SKILL.md`
- [ ] `foundry/modules/qa/SKILL.md`

- [ ] **Commit:** `git add foundry/modules/*/SKILL.md && git commit -m "feat(skills): add canonical frontmatter to all migrated SKILL.md files"`

---

## Phase 3 — Workflows Canonical Format

**Goal:** Add `workflow.md` files with trigger + agent chain metadata to all workflow-capable modules.

### Task 4: Identify and document canonical workflows

From the canonical model spec, these are the named workflows:

| Workflow | Command | Agent Chain | Modules |
|---|---|---|---|
| `/plan` | plan | explorer → planner → orchestrator | spec-driven-delivery, system-design |
| `/implement` | implement | implementer | (direct) |
| `/debug` | debug | debugger | systematic-debugging |
| `/review` | review | reviewer | code-review, owasp-security-review |
| `/test` | test | tester | unit-testing, integration-testing |
| `/loop` | loop | orchestrator (self-loop) | (direct) |
| `/design-system` | design-system | implementer | design, frontend-design-system |
| `/design-screen` | design-screen | planner → implementer | frontend-design-screen-brief |
| `/design-audit` | design-audit | reviewer | design-audit |
| `/deploy` | deploy | planner → implementer | ci-cd-pipeline, kubernetes-deploy |

### Task 5: Create workflow.md files

For each named workflow, create `foundry/modules/workflows/<workflow-id>/workflow.md` in canonical format:

```yaml
---
name: plan
command: "/plan"
description: "Research a codebase and produce a structured implementation plan."
triggers:
  - plan
  - design
  - architect
  - scope
  - spec
  - rfc
agentChain:
  - explorer
  - planner
  - orchestrator
primarySkills:
  - spec-driven-delivery
  - system-design
supportingSkills:
  - deep-research
whenToUse: "When the task is non-trivial and needs a structured plan before writing code."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
```

- [ ] Create `foundry/modules/workflows/plan/workflow.md`
- [ ] Create `foundry/modules/workflows/implement/workflow.md`
- [ ] Create `foundry/modules/workflows/debug/workflow.md`
- [ ] Create `foundry/modules/workflows/review/workflow.md`
- [ ] Create `foundry/modules/workflows/test/workflow.md`
- [ ] Create `foundry/modules/workflows/loop/workflow.md`
- [ ] Create `foundry/modules/workflows/design-system/workflow.md`
- [ ] Create `foundry/modules/workflows/design-screen/workflow.md`
- [ ] Create `foundry/modules/workflows/design-audit/workflow.md`
- [ ] Create `foundry/modules/workflows/deploy/workflow.md`
- [ ] **Commit:** `git add foundry/modules/workflows/ && git commit -m "feat(workflows): add canonical workflow.md files with agent chain metadata"`

---

## Phase 4 — Rules Canonical Model (No STEERING.md)

**Goal:** Replace the old rules approach (STEERING.md routing) with platform-native rule projection.

### Task 6: Create rules canonical structure

Old structure (to be removed):
```
foundry/modules/rules-core/rules.yaml   # Generated flat file
```

New structure (canonical model):
```
foundry/modules/rules-core/
  module.yaml
  SKILL.md                    # Rules as knowledge content
  rules/
    common.md                 # Platform-neutral rules
    claude.md                 # Claude-specific (extends common.md)
    codex.md                  # Codex-specific (extends common.md)
    copilot.md                # Copilot-specific (extends common.md)
    gemini.md                 # Gemini-specific (extends common.md)
    antigravity.md            # Antigravity-specific (extends common.md)
    python.md                 # Language-specific (extends common.md)
    typescript.md             # Language-specific (extends common.md)
    go.md
    rust.md
    ...
```

**Rules content for `common.md`** (platform-neutral):
- Immutability principle (no mutating inputs)
- Error handling (fail fast, meaningful errors)
- File size limits (warn at 300 lines, reject at 600)
- Testing mandate (new code requires tests)
- Security baseline (no secrets in code, no SQL injection, input validation)
- Commit hygiene (atomic commits, conventional format)
- Review culture (all PRs reviewed, 24h SLA)

**Rules content per platform** (`claude.md`, etc.):
- Platform-specific hook guidance (e.g., Claude pre/post tool hooks)
- Platform instruction file location (CLAUDE.md, AGENTS.md, GEMINI.md, etc.)
- Platform-specific model hints
- Platform-specific tool conventions

- [ ] Create `foundry/modules/rules-core/rules/common.md`
- [ ] Create `foundry/modules/rules-core/rules/claude.md`
- [ ] Create `foundry/modules/rules-core/rules/codex.md`
- [ ] Create `foundry/modules/rules-core/rules/copilot.md`
- [ ] Create `foundry/modules/rules-core/rules/gemini.md`
- [ ] Create `foundry/modules/rules-core/rules/antigravity.md`
- [ ] Create `foundry/modules/rules-core/rules/python.md`
- [ ] Create `foundry/modules/rules-core/rules/typescript.md`
- [ ] Create `foundry/modules/rules-core/rules/go.md`
- [ ] Create `foundry/modules/rules-core/rules/rust.md`
- [ ] Remove old `foundry/modules/rules-core/rules.yaml` if it exists
- [ ] Update `foundry/modules/rules-core/SKILL.md` with rules-as-knowledge content
- [ ] **Commit:** `git add foundry/modules/rules-core/ && git commit -m "feat(rules): rewrite rules as canonical platform-native format — no STEERING.md"`

### Task 7: Update adapter rule projections

Update `foundry/adapters/<platform>.yaml` to use the new rule projection model:

| Platform | Rule surface | Projection target |
|---|---|---|
| Claude | `common.md` + `claude.md` | `CLAUDE.md` + `.claude/rules.d/` |
| Codex | `common.md` + `codex.md` | `AGENTS.md` |
| Copilot | `common.md` + `copilot.md` | `.github/copilot-instructions.md` |
| Gemini | `common.md` + `gemini.md` | `.gemini/GEMINI.md` |
| Antigravity | `common.md` + `antigravity.md` | `.gemini/GEMINI.md` |

- [ ] Update `foundry/adapters/claude.yaml` — rules section
- [ ] Update `foundry/adapters/codex.yaml` — rules section
- [ ] Update `foundry/adapters/copilot.yaml` — rules section
- [ ] Update `foundry/adapters/gemini.yaml` — rules section
- [ ] Update `foundry/adapters/antigravity.yaml` — rules section
- [ ] **Commit:** `git add foundry/adapters/ && git commit -m "feat(adapters): update rule projections to canonical model"`

---

## Phase 5 — Hooks Core (New Module from Scratch)

**Goal:** Create the `hooks-core` module that is currently entirely absent.

### Task 8: Create hooks-core module

```
foundry/modules/hooks-core/
  module.yaml
  hooks/
    pre-tool.md               # Documentation + examples for PreToolUse hooks
    post-tool.md              # Documentation + examples for PostToolUse hooks
    hooks.json                # Recipe definitions per platform
    scripts/
      <hook-name>.mjs        # Hook JavaScript implementations
```

**Hook module.yaml:**
```yaml
id: hooks-core
kind: capability
label: Agent Hooks
description: Platform-native PreToolUse and PostToolUse hook recipes for Claude, Copilot, and Gemini.
stability: experimental
profiles: [developer]
capability:
  type: tool
  domains: [hooks, agent, tooling]
  outputs:
    - type: rules
      path: generated/hooks/<platform>/
      platforms: [claude, copilot, gemini]
```

**Projection per platform:**

| Platform | Projection target |
|---|---|
| Claude | `.claude/hooks/` + `.claude/settings.json` |
| Codex | Experimental only (do-not-ship by default) |
| Copilot | `.github/hooks/` |
| Gemini | `.gemini/hooks/` |
| Antigravity | do-not-ship |

- [ ] Create `foundry/modules/hooks-core/module.yaml`
- [ ] Create `foundry/modules/hooks-core/hooks/pre-tool.md`
- [ ] Create `foundry/modules/hooks-core/hooks/post-tool.md`
- [ ] Create `foundry/modules/hooks-core/hooks/hooks.json`
- [ ] Create `foundry/modules/hooks-core/hooks/scripts/pre-tool-example.mjs`
- [ ] Create `foundry/modules/hooks-core/hooks/scripts/post-tool-example.mjs`
- [ ] **Commit:** `git add foundry/modules/hooks-core/ && git commit -m "feat(hooks-core): add canonical hooks module with pre/post tool hook recipes"`

---

## Phase 6 — Adapter Projections (Fill the Gaps)

**Goal:** Fill in `workflows.projection`, `specialists.projection`, and `agents.projection` arrays in all 5 adapters. Update `skills.capabilityProjection` direction (it currently projects TO foundry/modules instead of FROM).

### Task 9: Fill workflows.projection arrays

- [ ] Update `foundry/adapters/claude.yaml` — `workflows.projection: []` → list workflow projection rules
- [ ] Update `foundry/adapters/codex.yaml` — `workflows.projection: []` → TOML command projection
- [ ] Update `foundry/adapters/copilot.yaml` — `workflows.projection: []` → `.github/prompts/<id>.prompt.md`
- [ ] Update `foundry/adapters/gemini.yaml` — `workflows.projection: []` → TOML command projection
- [ ] Update `foundry/adapters/antigravity.yaml` — `workflows.projection: []` → TOML command projection

### Task 10: Fill specialists.projection arrays

- [ ] Update `foundry/adapters/claude.yaml` — `specialists.projection: []` → agent.md → `.claude/agents/<id>.md`
- [ ] Update `foundry/adapters/codex.yaml` — `specialists.projection: []` → TOML projection with model map
- [ ] Update `foundry/adapters/copilot.yaml` — `specialists.projection: []` → `.github/agents/<id>.agent.md`
- [ ] Update `foundry/adapters/gemini.yaml` — `specialists.projection: []` → (degraded — command routing only)
- [ ] Update `foundry/adapters/antigravity.yaml` — `specialists.projection: []` → (not shipped)

### Task 11: Add agents.projection to all adapters

Add `agents:` section to each adapter yaml (if not already present):
- [ ] `foundry/adapters/claude.yaml` — `agents.projection` → project agent.md files to `.claude/agents/`
- [ ] `foundry/adapters/codex.yaml` — `agents.projection` → TOML with model map
- [ ] `foundry/adapters/copilot.yaml` — `agents.projection` → `.github/agents/`
- [ ] `foundry/adapters/gemini.yaml` — `agents.projection` → skipped (degraded)
- [ ] `foundry/adapters/antigravity.yaml` — `agents.projection` → not shipped

### Task 12: Fix skills.capabilityProjection direction

Current: `capabilityProjection` lists capabilities with `output: foundry/modules/<id>/SKILL.md` — this is backwards (it says "compile TO the canonical source").
Correct: `capabilityProjection` should describe how to project FROM canonical SKILL.md TO platform-specific output. Remove or correct the inverted entries. The skill projection is handled by `skills.projection` (markdown transform pipeline).

- [ ] Clean up `foundry/adapters/claude.yaml` — `skills.capabilityProjection` entries
- [ ] Clean up all other adapters similarly
- [ ] **Commit:** `git add foundry/adapters/ && git commit -m "feat(adapters): fill workflows, specialists, and agents projection arrays"`

---

## Phase 7 — Compiler: New Format Support

**Goal:** Update the compiler to handle new projection formats required by the canonical model.

### Task 13: Add TOML agent projector for Codex

- [ ] Create `src/cli/compiler/projectors/codex-agent.ts` — transforms `agent.md` to TOML format per Codex TOML schema:
  ```toml
  name = "<name>"
  description = "<description>"
  model = "<from model map>"
  model_reasoning_effort = "high | medium | low"
  sandbox_mode = "read-only | workspace-write"
  developer_instructions = """<markdown body>"""
  ```
- [ ] Update Codex adapter `specialists.projection` to reference this projector
- [ ] Write test for TOML output correctness
- [ ] **Commit**

### Task 14: Add TOML command projector for Gemini

- [ ] Create `src/cli/compiler/projectors/gemini-command.ts` — transforms `workflow.md` to Gemini TOML command format
- [ ] Update Gemini adapter `workflows.projection` to reference this projector
- [ ] Write test for TOML command output
- [ ] **Commit**

### Task 15: Add .agent.md projector for Copilot

- [ ] Create `src/cli/compiler/projectors/copilot-agent.ts` — transforms `agent.md` to Copilot `.agent.md` format (frontmatter + body)
- [ ] Update Copilot adapter `specialists.projection` to reference this projector
- [ ] Write test
- [ ] **Commit**

### Task 16: Add hook projector

- [ ] Create `src/cli/compiler/projectors/hooks.ts` — projects `hooks-core/` to platform-specific hook files
- [ ] Update all relevant adapters
- [ ] Write test
- [ ] **Commit**

### Task 17: Full compilation test

- [ ] Run `cbx catalog build` — all 5 platforms compile without errors
- [ ] Verify output formats: `.claude/agents/`, `.claude/hooks/`, `.github/agents/`, `.gemini/commands/`, `AGENTS.md`
- [ ] **Commit:** `git add generated/ && git commit -m "test(compiler): verify all 5 platforms compile with new format projectors"`

---

## Phase 8 — CLI Subsystem Split (Plan D)

**Goal:** Split `src/cli/core.ts` into explicit command modules, wire all subsystems to commands.

### Task 18: Extract doctor subsystem

- [ ] Read `src/cli/core.ts` — find existing doctor/harness audit logic
- [ ] Create `src/cli/doctor/checks.ts` — implement 7 checks from spec (state integrity, asset presence, catalog drift, user override audit, orphaned files, checksum, platform-specific)
- [ ] Create `src/cli/doctor/reporter.ts` — format DoctorReport as human-readable output
- [ ] Create `src/cli/doctor/index.ts` — `doctor()`, `healthCheck()`, `autoFix()`
- [ ] Write tests for doctor checks
- [ ] **Commit**

### Task 19: Extract MCP subsystem

- [ ] Read existing MCP-related code in `core.ts`
- [ ] Create `src/cli/mcp/manifest.ts` — generate `.mcp.json` from catalog's `mcp-core` module
- [ ] Create `src/cli/mcp/index.ts` — `listCatalogServers`, `generateMcpManifest`, `applyMcpConfig`
- [ ] **Commit**

### Task 20: Split core.ts into command modules

- [ ] Create `src/cli/commands/catalog-commands.ts` — `cbx catalog validate|build|audit|diff|status`
- [ ] Create `src/cli/commands/build-commands.ts` — `cbx build architecture`
- [ ] Refactor `src/cli/commands/workflow-commands.ts` — wire to new installer
- [ ] Refactor `src/cli/commands/doctor-commands.ts` — wire to new doctor subsystem
- [ ] Slim `src/cli/core.ts` — import and register all command modules
- [ ] Ensure `cbx --help` shows all new commands
- [ ] Run `cbx catalog validate` and `cbx catalog build` manually
- [ ] **Commit**

---

## Phase 9 — Documentation (Plan E)

### Task 21: User Documentation

- [ ] Write `docs/user/getting-started.md`
- [ ] Write `docs/user/install-profiles.md`
- [ ] Write `docs/user/commands/cbx-init.md`
- [ ] Write `docs/user/commands/cbx-workflows.md`
- [ ] Write `docs/user/commands/cbx-catalog.md`
- [ ] Write `docs/user/commands/cbx-build.md`
- [ ] Write `docs/user/commands/cbx-doctor.md`
- [ ] Write `docs/user/troubleshooting.md`
- [ ] Write `docs/user/faq.md`
- [ ] **Commit**

### Task 22: Contributor Guide

- [ ] Write `docs/contributor/getting-started.md`
- [ ] Write `docs/contributor/adding-module.md`
- [ ] Write `docs/contributor/adding-platform.md`
- [ ] Write `docs/contributor/skill-authoring.md`
- [ ] Write `docs/contributor/testing.md`
- [ ] Write `docs/contributor/release-process.md`
- [ ] Write `docs/contributor/coding-standards.md`
- [ ] **Commit**

### Task 23: Runbooks

- [ ] Write `docs/runbooks/release.md`
- [ ] Write `docs/runbooks/hotfix.md`
- [ ] Write `docs/runbooks/incident-response.md`
- [ ] Write `docs/runbooks/skill-update.md`
- [ ] **Commit**

### Task 24: Technical Reference

- [ ] Write `docs/tech/schemas/package-yaml.md`
- [ ] Write `docs/tech/schemas/module-yaml.md`
- [ ] Write `docs/tech/schemas/adapter-yaml.md`
- [ ] Write `docs/tech/cli-reference.md`
- [ ] Write `docs/tech/build-pipeline.md`
- [ ] Write `docs/tech/install-flow.md`
- [ ] **Commit**

### Task 25: GitHub Workflows

- [ ] Create `.github/workflows/research.yml`
- [ ] Create `.github/workflows/eval.yml`
- [ ] Configure `cbx catalog audit --skills` to run on PRs changing `foundry/modules/`
- [ ] **Commit**

---

## Phase 10 — Open Questions (Resolved Before Phase 7)

Before Phase 7 (Compiler new format support), resolve the 5 open questions from the canonical model spec:

### Q1: Copilot custom agents format
- `.github/agents/*.agent.md` — what frontmatter schema is required vs optional?
- **Action:** Research GitHub Copilot agent documentation; if undocumented, define a pragmatic schema based on existing patterns.

### Q2: Codex model_reasoning_effort
- Is `model_reasoning_effort` the only reasoning control for Codex?
- **Action:** Verify with OpenAI Codex documentation; if more controls exist, add to the TOML projector.

### Q3: Gemini TOML commands schema
- Does the current template need a `mode` or `temperature` field?
- **Action:** Research Gemini CLI command format; update projector template accordingly.

### Q4: ECC agents adoption
- ECC has 28 agents vs Foundry's 8. Adopt all or a subset?
- **Action:** Review ECC agent list; propose a filtered adoption list (likely ~12 agents max — keep the 8 core + 4 highest-value ECC specialists).

### Q5: Language rules location
- Python, TypeScript, Go, Rust rules — in `foundry/modules/rules-core/rules/` or separate `foundry/modules/<lang>-rules/` modules?
- **Action:** Keep in `rules-core/rules/` for Phase 4 simplicity. Flag as "future: extract to separate modules" in the module.yaml.

---

## Verification

After all phases:

1. `npm run test:cli` — all tests pass
2. `cbx catalog validate` — exits 0, no errors
3. `cbx catalog build` — all 5 platforms compile successfully
4. `ls foundry/modules/agents-core/agents/` — all 8 agent.md files present with canonical frontmatter
5. `ls foundry/modules/workflows/` — all 10 workflow.md files present
6. `ls foundry/modules/rules-core/rules/` — common.md + 5 platform files + 4 language files
7. `ls foundry/modules/hooks-core/hooks/` — pre-tool.md, post-tool.md, hooks.json, scripts/
8. All 45+ migrated SKILL.md files have `triggers:`, `domains:`, `whenToUse:`, `priority:`, `compatibility:` frontmatter
9. `cbx --help` — shows all commands including new `catalog *`, `build`, `doctor`
10. All `docs/` files exist with meaningful content (not stubs)
11. `npm run check` — CLI still works
