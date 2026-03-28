# Foundry V2 — Agent, Workflow, and Skill Canonical Model

> **Superseded for active work:** See `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md` and `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`. Active implementation is happening in `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`.
>
> Archived historical context only. The body below is not authoritative for current work.

**Date:** 2026-03-26
**Status:** Draft v1
**Approach:** Hybrid — ECC Markdown format as canonical, platform-native as projection targets. No STEERING.md routing layer. Agents contain all execution intelligence.

---

## 1. What Exists vs What Changes

### What stays the same
- `foundry/package.yaml` — already done
- `foundry/schemas/*.schema.json` — already done
- `foundry/adapters/*.yaml` — needs projection rules filled in (currently empty)
- `src/cli/catalog/` — already done
- `src/cli/compiler/` — already done
- `src/cli/installer/` — already done
- `src/cli/state/` — already done
- `src/cli/rules/` — already done

### What changes
- **Agents** — redesign canonical format, rewrite all 8 agent prompts (orchestrator, planner, implementer, reviewer, debugger, tester, explorer, + new specialist agents from ECC)
- **Skills** ��� redesign canonical SKILL.md format with trigger metadata
- **Workflows** — redesign canonical workflow.md format with trigger + chain metadata
- **Rules** — no STEERING.md; rules projected directly into platform instruction files
- **Hooks** — new canonical hooks module (currently absent)
- **Adapters** — fill in empty `workflows.projection` and `specialists.projection` arrays

---

## 2. Canonical Module Structure

Every module in `foundry/modules/<id>/` follows this structure:

```
foundry/modules/<id>/
  module.yaml              # Module descriptor (already exists)
  SKILL.md                 # Canonical skill knowledge content
  agent.md                 # Canonical agent prompt (if applicable)
  workflow.md              # Canonical workflow pattern (if applicable)
  rules/
    common.md              # Platform-neutral rules
    <platform>.md          # Platform-specific rules (claude.md, gemini.md, etc.)
  hooks/
    pre-tool.md            # Pre-tool-use hook script (if applicable)
    post-tool.md           # Post-tool-use hook script (if applicable)
    hooks.json             # Hook recipe definitions
```

---

## 3. Agent Canonical Format

**File:** `foundry/modules/agents/<id>/agent.md`

```yaml
---
name: orchestrator
description: Multi-specialist coordinator. Decomposes tasks, delegates to specialists, verifies output, iterates until acceptance criteria are met.
tools: Task, Read, Grep, Glob, Bash
model: sonnet
priority: high
---
```

**Body sections (in order):**

1. **Role** — one-paragraph persona description
2. **Skill and Workflow Selection** — trigger-based guidance with concrete examples
3. **MCP Routing** — when to use MCP tools vs bash vs subagent
4. **Delegation Protocol** — handoff contract fields (goal, criteria, contract, boundary, max iterations)
5. **Execution Steps** — step-by-step protocol
6. **Output Format** — what the agent must return
7. **Noise Control** — when NOT to act or comment
8. **Escalation** — when to escalate vs handle directly

### Agent Prompt Example — Orchestrator

```markdown
---
name: orchestrator
description: Multi-specialist coordinator. Decomposes tasks, delegates to specialists, verifies output, iterates until acceptance criteria are met.
tools: Task, Read, Grep, Glob, Bash
model: sonnet
priority: high
---

# Orchestrator

You are an orchestrating agent. Your job is to decompose complex tasks, delegate to the narrowest appropriate specialist, verify output, and iterate until acceptance criteria are met.

## Skill and Workflow Selection

Before delegating, match the task context against known patterns:

**Workflows** — invoke when the task matches a structured pattern:
- Needs a structured implementation plan → `/plan` → chain: explorer → planner → orchestrator
- Needs end-to-end feature implementation → `/implement` → chain: implementer
- Needs debugging with verification loop → `/debug` → chain: debugger
- Needs code review + security audit → `/review` → chain: reviewer
- Needs test coverage + verification → `/test` → chain: tester
- Needs bounded autonomous iteration → `/loop` → chain: orchestrator (self)
- Needs design system work → `/design-system` → chain: implementer
- Needs screen design → `/design-screen` → chain: planner → implementer
- Needs design audit → `/design-audit` → chain: reviewer
- Needs deployment / CI/CD → `/deploy` → chain: planner → implementer

**Skills** — load supporting skills AFTER route resolution:
- Architecture / distributed systems → `system-design`
- API design / REST / GraphQL → `api-design`
- Database / data modeling → `database-design`
- Security / OWASP review → `owasp-security-review`
- TypeScript / JavaScript → `typescript-best-practices`
- Python → `python-best-practices`
- Go → `golang-best-practices`
- Rust → `rust-best-practices`
- Testing and verification → `web-testing`, `android-emulator-testing`, `ios-simulator-testing`
- Observability → `observability`
- MCP server patterns → `mcp-server-builder`
- Deep research → `deep-research`

Load skills via `skill_validate` → `skill_get`. Never start with `skill_search`.

**MCP tools** — use MCP as the first-choice for:
- Filesystem operations → always use MCP filesystem tools
- Git operations → always use MCP git tools
- Package management → always use MCP npm/pip/gradle tools
- Network / API calls → MCP http tools if available
- Bash only when MCP is insufficient or unavailable

## Delegation Protocol

Every delegation MUST include all of the following:

- **Goal** — one-sentence description of what success looks like
- **Criteria** — how to verify the output is acceptable (specific, testable)
- **Contract** — what format the subagent must return
- **Boundary** — what is explicitly NOT in scope
- **Max iterations** — cap on loops before escalating back to orchestrator

## Execution Steps

1. **Receive task** — read the user request. Ask clarifying questions only if critical information is missing.
2. **Assess scope** — single domain or cross-domain?
3. **Select route** — direct execution, workflow, or specialist delegation?
4. **Delegate or execute** — apply delegation protocol for subagents. For direct execution, proceed with the narrowest tool set needed.
5. **Verify output** — check against acceptance criteria.
6. **Iterate or conclude** — if criteria not met, delegate back with specific feedback. If met, return to user.

## Output Format

```yaml
TASK_RESULT:
  status: completed | partial | escalated
  goal: <one-sentence summary>
  deliverables:
    - <file or output produced>
  verification: <how output was verified against criteria>
  remaining: [<item not completed, if any>]
  escalated: <reason, if applicable>
```

## Noise Control

- Do not delegate trivial, single-step tasks. Execute directly.
- Do not load every skill proactively. Load only what the task clearly needs.
- Do not spawn subagents for work that touches the same files. Serialize or coordinate.
- If the user named a specific workflow or agent, honor it. Do not reroute.
- If the task matches a workflow pattern, prefer the workflow. Do not re-decompose.

## Escalation

Escalate to the user (not back to a subagent) when:
- The task spans 3+ unrelated domains
- A delegation hit max iterations and criteria are still not met
- The task requires a decision the orchestrator cannot make
- The task changes product direction or project structure
```

---

## 4. Skill Canonical Format

**File:** `foundry/modules/<id>/SKILL.md`

```yaml
---
name: system-design
description: System design and architecture guidance for distributed systems, scalability, reliability, and production infrastructure.
triggers:
  - architecture
  - scalability
  - distributed systems
  - CAP theorem
  - load balancing
  - sharding
  - data partitioning
  - messaging
  - SLO
domains:
  - backend
  - infrastructure
  - architecture
whenToUse: "When designing new services, evaluating trade-offs, or reviewing architecture for scalability gaps."
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
```

**Body sections:**

1. **Purpose** — one-paragraph description of what this skill covers
2. **When to Use** — specific, concrete situations where this skill applies
3. **Instructions** — numbered guidance with rationale (not just "do this")
4. **Anti-patterns** — explicit "never do this" with reasons
5. **Output Format** — what the agent should produce when using this skill
6. **Examples** — worked examples where applicable (especially for complex patterns)
7. **References** — link to related skills and documentation

---

## 5. Workflow Canonical Format

**File:** `foundry/modules/<id>/workflow.md`

```yaml
---
name: plan
command: "/plan"
description: "Research a codebase and produce a structured implementation plan. Explore first, then design."
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
whenToUse: "When the task is non-trivial and needs a structured plan before writing code. Best for architecture decisions, feature scoping, and implementation planning."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
```

**Body sections:**

1. **What this workflow does** — one-paragraph summary
2. **When to use** — concrete trigger situations
3. **Agent chain** — which agents are invoked and in what order
4. **Step details** — what each agent does at each step
5. **Skill routing** — which skills each agent loads at each step
6. **Context notes** — what context the user should provide
7. **Verification** — how to verify the workflow completed correctly
8. **Output contract** — structured YAML output format
9. **Follow-up items** — what typically comes next

---

## 6. Rules — No STEERING.md

Rules are projected directly into platform native instruction files. No routing protocol, no decision tree.

**Structure:**

```
foundry/modules/rules-core/
  module.yaml
  SKILL.md                    # Core rules as knowledge content (when to apply, why)
  rules/
    common.md                 # Platform-neutral rules (coding style, testing, security)
    claude.md                 # Claude-specific rules (scoped rules, hook guidance)
    codex.md                  # Codex-specific rules
    copilot.md                # Copilot-specific rules
    gemini.md                 # Gemini-specific rules
    antigravity.md            # Antigravity-specific rules
```

**Projection per platform:**

| Platform | Rule surface | Projection target |
|----------|---|---|
| Claude | `common.md` + `claude.md` | `CLAUDE.md` + `.claude/rules.d/` |
| Codex | `common.md` + `codex.md` | `AGENTS.md` |
| Copilot | `common.md` + `copilot.md` | `.github/copilot-instructions.md` |
| Gemini | `common.md` + `gemini.md` | `.gemini/GEMINI.md` |
| Antigravity | `common.md` + `antigravity.md` | `.gemini/GEMINI.md` |

Rules use the **ECC extends pattern**:
- `common.md` starts with universal rules (immutability, error handling, fail-fast, file size limits)
- Each platform file starts with `> This file extends [common.md](../common.md) with <Platform> specific content.`
- Language rules follow the same pattern: `rules/python.md` extends `common.md`

---

## 7. Hooks — New Canonical Module

Hooks are currently absent from Foundry. New canonical module:

```
foundry/modules/hooks-core/
  module.yaml
  hooks/
    pre-tool.md               # Documentation + examples for PreToolUse hooks
    post-tool.md              # Documentation + examples for PostToolUse hooks
    hooks.json                # Recipe definitions per platform
    scripts/
      <hook-name>.mjs         # Hook JavaScript implementations
```

**Projection per platform:**

| Platform | Hook surface | Projection target |
|----------|---|---|
| Claude | Native hook JSON + JS | `.claude/hooks/` + `.claude/settings.json` |
| Codex | Experimental | Not shipped by default (experimental flag required) |
| Copilot | Native hook JSON + JS | `.github/hooks/` |
| Gemini | Native hook JSON + JS | `.gemini/hooks/` |
| Antigravity | None | `do-not-ship` |

---

## 8. Adapter Projections — What Goes Where

### Claude

| Content type | Canonical source | Projection target | Format |
|---|---|---|---|
| Skills | `SKILL.md` | `.claude/skills/<id>/SKILL.md` | Markdown |
| Agents | `agent.md` | `.claude/agents/<id>.md` | Markdown + frontmatter |
| Workflows | `workflow.md` | `.claude/skills/<id>/SKILL.md` | Markdown (workflow mode) |
| Rules | `rules/common.md` + `rules/claude.md` | `CLAUDE.md` + `.claude/rules.d/` | Markdown |
| Hooks | `hooks/` | `.claude/hooks/` + `.claude/settings.json` | JSON + JS |

### Codex

| Content type | Canonical source | Projection target | Format |
|---|---|---|---|
| Skills | `SKILL.md` | `.agents/skills/<id>/SKILL.md` | Markdown |
| Agents | `agent.md` | `.codex/agents/<id>.toml` | TOML (from Markdown) |
| Workflows | `workflow.md` | `.agents/skills/<id>/SKILL.md` | Markdown |
| Rules | `rules/common.md` + `rules/codex.md` | `AGENTS.md` | Markdown |
| Hooks | Not shipped | Not shipped | Experimental only |

### GitHub Copilot

| Content type | Canonical source | Projection target | Format |
|---|---|---|---|
| Skills | `SKILL.md` | `.github/skills/<id>/SKILL.md` | Markdown |
| Agents | `agent.md` | `.github/agents/<id>.agent.md` | Markdown + frontmatter |
| Workflows | `workflow.md` | `.github/prompts/<id>.prompt.md` | Markdown prompt |
| Rules | `rules/common.md` + `rules/copilot.md` | `.github/copilot-instructions.md` | Markdown |
| Hooks | `hooks/` | `.github/hooks/` | JSON + JS |

### Gemini CLI

| Content type | Canonical source | Projection target | Format |
|---|---|---|---|
| Skills | `SKILL.md` | Not shipped (degraded — MCP guidance only) | n/a |
| Agents | `agent.md` | Skipped (degraded — command routing only) | n/a |
| Workflows | `workflow.md` | `.gemini/commands/<id>.toml` | TOML command |
| Rules | `rules/common.md` + `rules/gemini.md` | `.gemini/GEMINI.md` | Markdown |
| Hooks | `hooks/` | `.gemini/hooks/` | JSON + JS |

### Antigravity

| Content type | Canonical source | Projection target | Format |
|---|---|---|---|
| Skills | `SKILL.md` | `.agents/skills/<id>/SKILL.md` | Markdown |
| Agents | `agent.md` | Not shipped | n/a |
| Workflows | `workflow.md` | `.gemini/commands/<id>.toml` | TOML command |
| Rules | `rules/common.md` + `rules/antigravity.md` | `.gemini/GEMINI.md` | Markdown |
| Hooks | Not shipped | Not shipped | do-not-ship |

---

## 9. What Gets Rewritten vs Reused

### Rewrite from scratch
- All 8 agent prompts (orchestrator, planner, implementer, reviewer, debugger, tester, explorer, + new specialists)
- Rules canonical files (rules/common.md, rules/<platform>.md)
- Hooks canonical files (hooks-core module)

### Enhance existing
- Skills: keep existing SKILL.md content, add trigger metadata frontmatter
- Workflows: keep existing workflow content, add trigger + chain metadata frontmatter

### Migrate to canonical structure
- Move from `workflows/workflows/agent-environment-setup/shared/agents/` to `foundry/modules/agents/`
- Move from `workflows/workflows/agent-environment-setup/shared/workflows/` to `foundry/modules/workflows/`
- Move from `workflows/skills/` to `foundry/modules/<id>/SKILL.md`

---

## 10. Implementation Order

1. **Agents** — write canonical agent prompts (most impact, no dependencies)
2. **Workflows** — add trigger + chain metadata to existing workflows
3. **Skills** — add trigger metadata to existing skills
4. **Rules** — rewrite rules as platform-native injection (no STEERING.md)
5. **Hooks** — create hooks-core module from scratch
6. **Adapters** — fill in projection arrays for workflows, agents, rules, hooks
7. **Compiler** — ensure projection templates handle each format (TOML for Gemini commands, .agent.md for Copilot, etc.)

---

## 12. Platform Model Constraints

Each platform supports a specific set of models. The canonical agent frontmatter specifies `model` as a hint; the adapter projection replaces it with the platform-appropriate model.

### Model Maps

| Platform | Available Models | Routing Guidance |
|----------|---|---|
| Claude | `sonnet`, `opus`, `haiku` | `sonnet` for most work; `opus` for architecture/security/debugging; `haiku` for simple tasks |
| Codex | `gpt-5.4`, `gpt-5.4-mini` | `gpt-5.4-mini` for most work; `gpt-5.4` for complex reasoning, architecture, security |
| Copilot | Platform-managed (not user-specified in agent frontmatter) | Agents on Copilot do not accept explicit model in frontmatter |
| Gemini | Platform-managed (not user-specified in agent frontmatter) | Agents on Gemini do not accept explicit model in frontmatter |
| Antigravity | Platform-managed | Same as Gemini |

### Codex Agent Model Overrides

Codex is the **only platform with hard model constraints**. The canonical `model` field in the agent frontmatter is a **suggestion** for Claude; it is **ignored** for Codex projections. Codex adapters always use:

| Agent type | Codex model |
|---|---|
| `orchestrator`, `planner` | `gpt-5.4` |
| `reviewer`, `debugger`, `tester` | `gpt-5.4` |
| `implementer`, `explorer` | `gpt-5.4-mini` |
| `explorer` (research-heavy) | `gpt-5.4` |

### Frontmatter `model` Field

The `model` field in canonical agent frontmatter is:

- **Claude**: respected — directly projected
- **Codex**: ignored — replaced by model map in adapter
- **Copilot**: ignored — platform manages model selection
- **Gemini**: ignored — platform manages model selection
- **Antigravity**: ignored — platform manages model selection

Canonical agents should default to `sonnet` for model (the Claude default) unless a specific agent type requires a different model.

```yaml
---
name: reviewer
model: sonnet   # Canonical hint (used for Claude; Codex uses model map)
---
```

### Codex TOML Schema

```toml
name = "reviewer"
description = "Code review agent..."
model = "gpt-5.4"           # Always replaced per Codex model map
model_reasoning_effort = "high"  # Set per agent type
sandbox_mode = "read-only"   # Read-only agents only; implementer uses workspace-write
developer_instructions = """
[Full markdown body]
"""
```

`sandbox_mode` values:
- `read-only` — reviewer, debugger, tester, explorer, planner
- `workspace-write` — implementer (and only implementer)

---

## 13. Open Questions

1. **Copilot custom agents** — `.github/agents/*.agent.md` format — is the frontmatter schema documented anywhere official? What fields are required vs optional?
2. **Codex TOML agents** — is `model_reasoning_effort` the only reasoning control, or are there others?
3. **Gemini TOML commands** — does the current template need updating? Is there a `mode` or `temperature` field?
4. **ECC new agents** — the ECC repo has 28 agents vs Foundry's 8. Should we adopt all ECC agents or select a subset?
5. **Language rules** — should rules for Python, TypeScript, Go, etc. be in `foundry/modules/rules-core/rules/` or in separate `foundry/modules/<lang>-rules/` modules?
