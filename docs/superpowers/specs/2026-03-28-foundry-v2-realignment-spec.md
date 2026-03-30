# Foundry V2 — Realignment Specification

**Date:** 2026-03-28
**Status:** Draft v1
**Working tree:** `/Users/phumrin/Documents/Cubis Foundry`
**Branch:** `v2`

> **Supersedes for active work:** `docs/superpowers/specs/2026-03-25-foundry-v2-unified-control-plane-design.md` and `docs/superpowers/specs/2026-03-26-agent-workflow-skill-canonical-model.md`

---

## 1. Why This Rewrite Exists

Foundry V2 currently has the right low-level compiler and catalog foundation, but the authoring surface is still too messy for humans:

- too many overlapping skill names
- wrapper skills mixed with true canonical skills
- testing split across generic QA, Playwright, and sample mobile skills
- design/frontend skills fragmented into too many slices
- workflows and agent prompts improved structurally but still not aligned to the reduced skill surface
- rule/instruction files still need a cleaner, smarter contract across `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and Copilot repo instructions

The goal of this rewrite is not another migration note. It is a new source of truth for the final user-facing model.

---

## 2. Product Direction

### 2.1 Core principle

Reduce top-level names for users, but keep real technical boundaries where the names actually help routing.

### 2.2 What to reduce

- generic wrappers
- overlapping aliases
- fragmented design skill slices
- old testing wrappers
- duplicated mobile/browser testing surfaces

### 2.3 What to keep

- concrete language skills
- concrete framework skills
- a small explicit workflow set
- a small core agent set
- platform-native instruction outputs
- Playwright MCP as the canonical browser runtime
- `mobile-mcp` as a first-class semantic mobile runtime
- CLI-first mobile fallback for deterministic device/simulator evidence

---

## 3. Final User-Facing Skill Strategy

### 3.1 Skills that remain top-level

These remain first-class because users naturally search by these names and they map to real knowledge boundaries.

#### Architecture and engineering

- `system-design`
- `api-design`
- `database-design`
- `architecture-doc`
- `tech-doc`
- `observability`
- `secret-management`
- `code-review`
- `deep-research`
- `prompt-engineering`
- `mcp-server-builder`
- `skill-creator`

#### Languages

- `typescript`
- `python`
- `go`
- `rust`
- `java`
- `kotlin`
- `swift`
- `csharp`

#### Frameworks and platforms

- `react`
- `nextjs`
- `fastapi`
- `nestjs`
- `django-drf`
- `spring-boot`
- `sqlalchemy`
- `prisma`
- `sveltekit`
- `expo`
- `docker-compose-dev`
- `kubernetes-deploy`

### 3.2 Testing is reduced to exactly three user-facing skills

- `web-testing`
- `android-emulator-testing`
- `ios-simulator-testing`

#### Testing policy

- `web-testing` uses Playwright MCP as the primary runtime
- `android-emulator-testing` is dual-path:
  - preferred semantic runtime: `mobile-mcp`
  - deterministic fallback runtime: `adb` and emulator tooling
- `ios-simulator-testing` is dual-path:
  - preferred semantic runtime: `mobile-mcp`
  - deterministic fallback runtime: `xcrun simctl`, Xcode tooling, and Python helper scripts
- `mobile-mcp` is the first-class semantic mobile runtime in the default testing architecture
- `qa`, `unit-testing`, `integration-testing`, and `playwright-interactive` are removed as skill surfaces after their content is redistributed into the canonical testing, language, and framework skills

### 3.3 Design is reduced to one master, two explicit specializations, and one canonical support surface

- `design` — master design skill
- `web-ui-design`
- `mobile-ui-design`
- `design-system` — canonical systemization support surface

Supporting design content can still exist, but it should not create more top-level user-facing names unless absolutely necessary.

### 3.4 Skills to demote or absorb

These legacy names were evaluated for demotion or absorption:

- `qa`
- `unit-testing`
- `integration-testing`
- `playwright-interactive`
- `frontend-design-core`
- `frontend-design-screen-brief`
- `frontend-design-style-selector`
- `frontend-design-implementation-handoff`
- `frontend-design-mobile-patterns`
- `frontend-design-system`
- `stitch`
- `skills-core`

Current outcome:

- merged content inside a stronger canonical skill
- removed entirely

---

## 4. Testing Canonical Model

### 4.1 Web testing

Canonical skill: `web-testing`

Runtime model:

- Playwright MCP for browser automation

Responsibilities:

- browser navigation
- stable selector strategy
- console and network evidence
- screenshots and accessibility snapshots
- deterministic reproduction of web flows

This replaces generic browser QA guidance.

### 4.2 Android testing

Canonical skill: `android-emulator-testing`

Runtime model:

- preferred semantic runtime via `mobile-mcp`
- deterministic fallback via `adb`, emulator CLI, and Android UI dump/helper scripts

Responsibilities:

- preferred semantic runtime via `mobile-mcp` when element-level interaction or richer inspection is needed
- deterministic fallback via emulator lifecycle, `adb`, UI tree inspection, screenshots, and logcat evidence
- explicit guidance on when to prefer semantic MCP interaction versus low-level CLI evidence capture

### 4.3 iOS testing

Canonical skill: `ios-simulator-testing`

Runtime model:

- preferred semantic runtime via `mobile-mcp`
- deterministic fallback via `xcrun simctl`, `xcodebuild`, and Python helper scripts from the iOS sample skill set
- expected heavier setup for semantic iOS automation because it depends on Apple tooling and WebDriverAgent-class infrastructure

Responsibilities:

- simulator lifecycle
- build/install/launch
- semantic navigation
- screenshots, logs, app state capture
- accessibility and permission flows

The Python helper inventory already present under `sample/Test iOS Skills Full/ios-simulator-skill` is the seed for this canonical skill.

### 4.4 Testing guidance folded into language/framework skills

`unit-testing`, `integration-testing`, and `playwright-interactive` are not top-level skills anymore. Their content is redistributed into:

- language skills for language-specific test patterns
- framework skills for framework-specific test setup
- the three canonical testing skills for end-user behavior verification

---

## 5. Design Canonical Model

### 5.1 Master design skill

Canonical skill: `design`

Responsibilities:

- routing and critique
- audit-first diagnosis
- choosing the right downstream design surface
- preserving the non-negotiable constraints that must survive execution

### 5.2 Web specialization

Canonical skill: `web-ui-design`

Responsibilities:

- desktop and responsive browser UI execution
- component architecture for browser-first surfaces
- web interaction patterns
- implementation-ready handoff for browser products

### 5.3 Mobile specialization

Canonical skill: `mobile-ui-design`

Responsibilities:

- small-screen interaction patterns
- touch ergonomics and reachability
- mobile navigation and density
- implementation-ready handoff for iOS and Android surfaces

### 5.4 Design-system support surface

Canonical skill: `design-system`

Responsibilities:

- canonical visual language
- semantic tokens
- component vocabulary
- overlays and durable design-state refresh

### 5.5 Design quality bar

The design stack should be upgraded using current OpenAI and Anthropic prompting guidance:

- explicit sequential design steps
- stricter deliverable contracts
- concrete visual direction choices
- cleaner role separation between routing/critique, systemization, and web/mobile execution

Reference sources:

- OpenAI prompt engineering best practices: `https://help.openai.com/en/articles/6654000-playground-and-prompt-engineering`
- Anthropic Claude Code subagents: `https://docs.anthropic.com/en/docs/claude-code/sub-agents`

---

## 6. Agent and Subagent Model

### 6.1 Core agent set

The canonical core agent set remains:

- `orchestrator`
- `planner`
- `implementer`
- `reviewer`
- `debugger`
- `tester`
- `explorer`
- `researcher`

### 6.2 Domain specialists

Domain specialists should exist only where they materially improve output quality and tool selection. Current justified domain specialists:

- Playwright/browser specialists for web testing
- design specialists for critique and implementation handoff

Any domain specialist must have:

- a narrow scope
- explicit tool boundaries
- no overlap with a core agent unless there is a clear quality gain

### 6.3 Agent intelligence contract

Agent prompts should become smarter by:

- matching tasks to the reduced skill surface
- routing to workflows first when a workflow clearly applies
- preferring MCP only where MCP is actually the best runtime
- using specialized subagents only when they improve quality, not by default

---

## 7. Workflow Model

Workflows should stay small, named, and explicit. The current target of roughly ten canonical workflows is still correct.

The workflow surface should be rebuilt around the reduced skill surface, not the old wrappers.

Expected stable set:

- `/plan`
- `/implement`
- `/debug`
- `/review`
- `/test`
- `/loop`
- `/design-system`
- `/design-screen`
- `/design-audit`
- `/deploy`

Renames are acceptable only if they materially improve clarity.

---

## 8. Rules and Platform Instruction Model

### 8.1 Canonical rule source

Rules should remain canonical in Foundry and project into:

- `AGENTS.md` for Codex
- `CLAUDE.md` for Claude
- `GEMINI.md` for Gemini-compatible surfaces
- GitHub Copilot repository instruction files

### 8.2 Instruction quality goals

Instruction files should be optimized for:

- stronger task routing
- clearer verification discipline
- better use of subagents
- explicit testing/runtime/tool boundaries
- reduced noise and fewer generic platitudes

Reference source:

- GitHub Copilot repository instructions: `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode`

### 8.3 Rules should encode policy, not duplicate skills

Rules should define:

- default priorities
- verification requirements
- safety constraints
- tool usage rules
- escalation behavior

They should not try to re-document every skill.

---

## 9. MCP Policy

### Keep

- Playwright MCP for web testing
- `mobile-mcp` as the first-class semantic mobile runtime
- existing MCP server builder and MCP integration capabilities

### Keep as deterministic fallback path

- CLI-first Android tooling (`adb`, emulator control, screenshots, logcat)
- CLI-first iOS tooling (`simctl`, `xcodebuild`, Python helper scripts)

---

## 10. Migration Policy

### 10.1 Old docs

Older top-level plans and specs are not deleted immediately. They remain in the repo for audit trail, but should be marked as superseded for active work.

### 10.2 Compat aliases

Compat aliases are temporary and should be used only when:

- a name is popular enough that breaking it immediately would be disruptive
- the alias points clearly to a stronger canonical surface

### 10.3 Active working copy

All active planning and implementation for this rewrite is happening in:

`/Users/phumrin/Documents/Cubis Foundry`

This checkout on branch `v2` is the active implementation location.

---

## 11. Expected End State

When this realignment is complete:

- users see fewer, stronger skill names
- testing is obvious and platform-correct
- design is easier to route and produces better UI output
- language/framework skills remain discoverable and concrete
- workflows are stable and small
- agents are sharper and less overlapping
- rules are smarter and more platform-native
- old migration noise stops competing with the current source of truth
