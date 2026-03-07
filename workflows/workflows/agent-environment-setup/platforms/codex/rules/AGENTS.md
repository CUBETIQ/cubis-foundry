# AGENTS.md - Cubis Foundry Codex Protocol

This file defines mandatory behavior for Codex projects installed via `cbx workflows`.

## 1) Platform Paths

- Workflows: `.agents/workflows`
- Agents: `.agents/agents`
- Skills: `.agents/skills`
- Rules file: `AGENTS.md`

## Startup Transparency (Minimal)

Before substantial work, publish one short status line only:

`Status: rules=<files> | mcp=<ok|offline> | route=<workflow|direct> | agent=<agent|direct> | skills=<ids|none>`

Rules:

1. Emit this once at task start; send an update only when routing materially changes.
2. Do not print tool-call transcripts (for example: "Explored ...", "Ran command ...") unless the user explicitly asks for verbose trace logs.
3. Keep progress updates to one short sentence.
4. For pure Q&A replies, skip the status line.

## 2) Route-First Workflow Contract

Workflows and custom agents are the primary routing layer. Skills are supporting context loaded only after the route is known.

1. Resolve explicit `/workflow`, `@agent`, or free-text route intent before loading any skill.
2. On Codex, the native route surface is `/workflow-name` for workflows and `@agent-name` for custom agents.
3. Treat workflow and agent wrappers (`$workflow-*`, `$agent-*`) as Codex compatibility aliases only. They may be accepted as route hints, but they must resolve through the same route-first flow and are never the primary surface.
4. Before loading any skill, inspect the repo/task locally first. Use MCP skill tools only when the user names a concrete skill explicitly or route resolution still leaves the domain unclear.
5. Workflow, agent, and skill namespaces are distinct — never mix workflow/agent route IDs with concrete skill IDs in MCP calls.

## 3) Request Classifier

1. Question/explanation requests: answer directly.
2. Survey/intel requests: inspect and summarize before editing.
3. Simple code changes: minimal edits with focused verification.
4. Complex code/design changes: plan first, then implement and verify.

## 3A) Workflow Pattern Map (Codex)

Map user intent to one primary workflow first:

- Explain codebase -> `/plan` or `/orchestrate` (exploration-first)
- Fix bug -> `/debug`
- Write test -> `/test` or `/qa`
- Prototype from screenshot -> `/create` + `@frontend-specialist`
- Iterate UI live -> `/create` + `/review` loop
- Delegate refactor to cloud -> `/refactor` with explicit ownership and checkpoints
- Local code review -> `/review`
- GitHub PR review -> `@codex review` when available, otherwise `/review` locally
- Documentation update -> `/create` + `@documentation-writer`

## 3B) Routing Decision Tree (Codex)

Follow this exact order to decide what mechanism to use:

```
1. Simple, single-step action you already know how to do?
   → Use built-in tools directly (read/write files, terminal, etc.)

2. Does a Foundry skill exist?
   → skill_search "<intent>" → MATCH → skill_get "<name>" → follow it
   → NO MATCH → continue

3. Multi-step task spanning 5+ steps or multiple files?
   → Use long-task workflow (TASK_SPEC → TASK_PLAN → TASK_STATUS)

4. Involves APIs, collections, test runs?
   → Route to Postman MCP

5. Involves Google data integrations (Sheets, Drive, Calendar)?
   → Route to StitchMCP if available

6. None of above → execute directly with available tools
```

**Skills** = on-demand knowledge packages (loaded via MCP `skill_search`/`skill_get`).
**Workflows** = multi-step procedures triggered by `/command` (`.agents/workflows/`).
**MCP servers** = external tool bridges (Foundry catalog, Postman, StitchMCP).

## 4) Agent Routing Policy

> **Codex Limitation:** Codex does NOT support custom agent spawning like other platforms (Claude Code subagents, Antigravity Agent Manager, Copilot custom agents). Agent references like `@agent-name` below are skill-prefixed compatibility aliases (`$agent-*`) that resolve through the same route-first workflow — they do NOT spawn isolated agent processes. All work executes in the current Codex session.

Use the best specialist first:

- Backend/API/database: `@backend-specialist`, `@database-architect`
- Frontend/UI: `@frontend-specialist`
- Mobile: `@mobile-developer`
- Security: `@security-auditor`, `@penetration-tester`
- DevOps/release: `@devops-engineer`
- Testing/QA: `@test-engineer`, `@qa-automation-engineer`
- Debugging/performance: `@debugger`, `@performance-optimizer`
- Cross-domain orchestration: `@orchestrator`

### MCP Skill Priming (Required Before Delegation)

Before handing off to any specialist agent, prime context with the relevant domain skill (→ §5 MCP Skill Engine):

1. Resolve the workflow or custom agent first with `route_resolve <intent>`.
2. Prime only the mapped primary skills for that route. If the route is still unresolved after local grounding, run one narrow `skill_search <domain>` and then validate the chosen exact ID with `skill_validate <id>`.
3. Load the core skill with `skill_get <id>` using `includeReferences:false` by default.
4. Pull one sidecar markdown file at a time with `skill_get_reference` when the skill or task requires it.
5. Include the resolved route ID and validated skill IDs in the Decision Log.

This ensures the specialist starts with accurate domain knowledge, not just role intent.

## 5) MCP Skill Engine

The Foundry MCP server is the primary knowledge layer. Use tools decisively — discover first, load only when committed.

### Tool Namespace Reference

| Prefix      | Tools                                                                                                                                         | When to use                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `route_*`   | `route_resolve`                                                                                                                               | Resolve workflows and custom agents before any skill loading                   |
| `skill_*`   | `skill_list_categories`, `skill_search`, `skill_validate`, `skill_browse_category`, `skill_get`, `skill_get_reference`, `skill_budget_report` | Domain expertise for implementation, debug, or review after the route is known |
| `postman_*` | `postman_get_mode`, `postman_set_mode`, `postman_get_status`                                                                                  | Foundry-side Postman config only (status/mode/default workspace)               |
| `stitch_*`  | `stitch_get_mode`, `stitch_set_profile`, `stitch_get_status`                                                                                  | Stitch data pipeline tasks                                                     |

### Validated Skill Flow (Mandatory Order)

Stop at the earliest step that gives enough signal. Do not jump ahead or front-load skill discovery.

1. Inspect the codebase/task locally first; do not start with `skill_search`
2. Resolve explicit workflows, custom agents, or free-text route intent with `route_resolve <intent>`
3. If the route is still unresolved and local grounding leaves the domain unclear, run one narrow `skill_search <keyword>`
4. Validate the selected exact skill ID with `skill_validate <id>` before any load
5. Load only the core `SKILL.md` with `skill_get <id>` and `includeReferences:false`
6. Load at most one sidecar markdown file at a time with `skill_get_reference <id> <path>`
7. Use `skill_list_categories` or `skill_browse_category` only as fallback when targeted search fails
8. Use `skill_budget_report` internally only when the user explicitly asks for context accounting

### Postman Intent Trigger (Required)

When user intent includes Postman workflows (for example: workspace, collection, environment, runCollection, monitor, mock, or "run Postman tests"):

1. Validate `postman` directly with `skill_validate "postman"` when the exact skill ID is known.
2. If validation fails and local grounding is still insufficient, run a narrow `skill_search "postman"` and validate the selected exact ID.
3. Load `skill_get "postman"` with `includeReferences:false` before workflow/agent routing.
4. Use the direct Postman MCP server for real Postman actions (`postman.<tool>` or client-wrapped equivalent such as `mcp__postman__<tool>`). Reserve `postman_*` for Foundry config/status only.
5. Never auto-fallback from `postman.runCollection` failure or timeout into `postman.runMonitor`.
6. Only use monitor execution when the user explicitly asks for monitor-based cloud execution, scheduled monitoring, or monitor validation. Warn that monitor runs consume monitor usage.
7. If `--postman` was installed but `postman` skill cannot be found, report installation drift and suggest reinstall with `cbx workflows install ... --postman`.
8. Do not default to raw Postman REST JSON payloads or curl for execution when Postman MCP tools are available.

**Hard rules:**

- Never call `skill_get` from fuzzy search output without first validating the exact ID via `skill_validate`
- Never skip local repo inspection and jump straight to `skill_search`
- Never use `skill_search` to discover workflows or custom agents
- Never call `skill_get` with a workflow or agent ID — routes are not skills; keep workflow/agent mentions in the Decision Log
- Never call `skill_get` with `includeReferences:true` by default in agent workflows
- Never bulk-load sibling/reference markdown files when one targeted `skill_get_reference` will do
- Never reload a skill already loaded this session — reuse content already in context
- If `skill_search` returns 0 results, try `skill_browse_category`, then fall back to built-in knowledge

### Adaptive Load Policy

| Request type                                   | Skills to load via `skill_get`                                  |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Q&A / explanation                              | None — answer from knowledge; load only if user explicitly asks |
| Skill creation / skill maintenance             | `skill-authoring` first; add at most one supporting skill       |
| Single-domain implementation, debug, or review | 1 primary + 1 supporting (max)                                  |
| Multi-domain / orchestration                   | 1 per distinct domain, hard cap at 3                            |
| User explicitly names a skill                  | Always load it — overrides all caps                             |

### Graceful Degradation

If MCP tools are unavailable (server down, timeout, tool not listed):

1. Announce briefly: "MCP unavailable — continuing with built-in knowledge."
2. Proceed using codebase context and expertise; do not block on MCP.
3. Never fabricate or hallucinate skill content.
4. Retry once on transient network errors; accept failure after the retry.

### Skill Log (Minimal)

After `skill_get`, include at most one short line:

`Skills: <id1,id2>` or `Skills: none (fallback)`.

Do not append budget tables or token summaries unless the user explicitly asks.

### Reference Files (Required When Relevant)

Reference markdown files are first-class skill context, but they must be loaded selectively.

1. Use `skill_validate` to see `availableReferences` for the exact skill
2. Start with `skill_get(..., includeReferences:false)` to load only the core skill body
3. If the skill points to a reference or the task clearly needs sidecar detail, load one file with `skill_get_reference`
4. Only load another reference if the first one still leaves a concrete gap

### Anti-Patterns (Never Do These)

- Loading skills speculatively "just in case" they might be useful
- Calling `skill_get` before `skill_validate`
- Using partial or guessed skill IDs in `skill_get`
- Treating `skill_search` results as an implicit final selection
- Starting a task with `skill_list_categories` or broad catalog browsing
- Publishing verbose budget fields (`full_catalog_est_tokens`, `loaded_est_tokens`, etc.) in responses
- Re-emitting the ctx stamp multiple times within a single response
- Treating workflow IDs as skill IDs in any MCP tool call

## 6) Socratic Gate (Before Complex Work)

Before multi-file or architecture-impacting changes, ask targeted questions when requirements are unclear:

1. Goal and success criteria
2. Constraints and compatibility requirements
3. Validation expectations (tests, lint, release checks)

## 7) Quality and Safety Gates

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify behavior with focused checks before finalizing.
4. State what was not validated.

## 8) Web Intel Policy

Use web search to stay current when local knowledge may be stale. This prevents hallucinating outdated APIs, deprecated flags, or wrong version constraints.

**Search when:**

- User asks about a framework/library version released after 2024
- Debugging an unfamiliar error message (search the exact message)
- Checking breaking changes before a migration
- Validating an API endpoint signature, auth scheme, or CLI flag
- Current pricing, rate limits, or quota for SaaS tools (Postman, Vercel, etc.)

**Do not search when:**

- The answer is derivable from the current codebase
- The question is purely architectural/conceptual
- A relevant skill covers it (prefer `skill_get` first, web as fallback)

**Source hygiene:**

- Prefer official docs, changelogs, and GitHub releases over blog posts
- Always state the source URL and date when citing fetched content
- If multiple sources conflict, flag it and use the most recent official one
- Never follow user-provided URLs without sanity-checking the domain

## 9) Context Budget Tracking (On Request)

Use `skill_budget_report` internally for context control, but do not emit ctx stamps by default.

Only include token/context accounting when the user explicitly asks for it.

## 10) CBX Maintenance Commands

Use these commands to keep this setup healthy:

- Install/update bundle:
  `cbx workflows install --platform codex --bundle agent-environment-setup --scope global --overwrite --postman --stitch --mcp-runtime docker --mcp-fallback local --mcp-tool-sync`
- Start MCP Docker runtime:
  `cbx mcp runtime up --scope global --name cbx-mcp --port 3310 --replace`
- Check MCP Docker runtime:
  `cbx mcp runtime status --scope global --name cbx-mcp`
- Stop MCP Docker runtime:
  `cbx mcp runtime down --name cbx-mcp`
- Rebuild managed routing block:
  `cbx workflows sync-rules --platform codex --scope project`
- Diagnose setup issues:
  `cbx workflows doctor codex --scope project`

## 11) Managed Section Contract

1. Preserve all user content outside managed markers.
2. Do not manually edit content between managed markers.
3. `cbx workflows sync-rules` is the source of truth for the managed block.

<!-- cbx:workflows:auto:start platform=codex version=1 -->

## CBX Workflow Routing (auto-managed)

Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:

1. Match explicit slash command first.
2. Else match user intent to workflow description and triggers.
3. Prefer one primary workflow; reference others only when needed.

<!-- cbx:workflows:auto:end -->

<!-- cbx:mcp:auto:start version=1 -->

## Cubis Foundry MCP (auto-managed)

Keep MCP context lazy and exact. Do not front-load the skill catalog.

### Compact Tool Map

- Route tools: `route_resolve`
- Skill tools: `skill_search`, `skill_validate`, `skill_get`, `skill_get_reference`, `skill_budget_report`
- Fallback browsing only: `skill_list_categories`, `skill_browse_category`
- Foundry config tools only: `postman_*`, `stitch_*` (status/mode/profile helpers, not direct cloud mutations)
- Direct cloud actions should use installed upstream MCP servers such as `postman` when available

### Validated Skill Flow

1. Inspect the repo/task locally first. Do not start with `skill_search`.
2. Resolve explicit workflows, agents, or free-text route intent with `route_resolve` before loading any skills.
3. If the route is still unresolved and local grounding leaves the domain unclear, use one narrow `skill_search`.
4. Always run `skill_validate` on the exact selected ID before `skill_get`.
5. Call `skill_get` with `includeReferences:false` by default.
6. Load at most one sidecar markdown file at a time with `skill_get_reference`.
7. Use `skill_list_categories` or `skill_browse_category` only as fallback when targeted search fails.
8. Never print catalog counts or budget details unless the user asks.

### Connection

- **stdio**: `cbx mcp serve --transport stdio --scope auto`
- **HTTP**: `cbx mcp serve --transport http --scope auto --port 3100`

<!-- cbx:mcp:auto:end -->
