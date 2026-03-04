# AGENTS.md - Cubis Foundry Codex Protocol

This file defines mandatory behavior for Codex projects installed via `cbx workflows`.

## 1) Platform Paths

- Workflows: `.agents/workflows`
- Agents: `.agents/agents`
- Skills: `.agents/skills`
- Rules file: `AGENTS.md`

## Startup Transparency (Required)

Before executing workflows, agents, or code edits, publish a short `Decision Log` that is visible to the user:

1. Rule file(s) read at startup (at minimum `AGENTS.md`, plus any additional rule files loaded).
2. MCP status: confirm Foundry MCP server (`cbx-mcp`) is reachable; if unavailable, declare "MCP offline — fallback mode" and continue without blocking.
3. Workflow decision ($workflow-\* or direct mode) and why it was chosen.
4. Agent routing decision ($agent-\* or direct mode) and why it was chosen.
5. Skill loading decision: skill IDs selected, how they were discovered, and why.

If routing changes during the task, publish a `Decision Update` before continuing.
Keep this user-visible summary concise and factual; do not expose private chain-of-thought.
When mentioning wrappers in user-visible logs, use raw $workflow-_ and $agent-_ tokens (no backticks) so Codex can render icon/blue mention styling.

## 2) Skill-Based Workflow

Skills and workflows are the two primary execution layers. **Skills** deliver domain expertise via the Foundry MCP server (see §5 MCP Skill Engine). **Workflows** orchestrate task execution via slash commands. They work together — never in isolation.

1. Codex operates primarily through **Skills** and **Rules**; the Foundry MCP server (`cbx-mcp`) is the delivery mechanism for all domain skills.
2. Before implementing any non-trivial task, run `skill_search` to check if a matching skill exists — load it before writing a single line of code.
3. Complex multi-domain tasks: compose multiple skill loads within a single $workflow-orchestrate execution.
4. Workflow and skill namespaces are distinct — never mix workflow IDs (`workflow-*`) with skill IDs in MCP calls.

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

## 4) Agent Routing Policy

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

1. Run `skill_search <domain>` to find the best matching skill.
2. If a strong match exists, load it with `skill_get <id>` before delegating.
3. Include the loaded skill ID in the Decision Log for the routing decision.

This ensures the specialist starts with accurate domain knowledge, not just role intent.

## 5) MCP Skill Engine

The Foundry MCP server is the primary knowledge layer. Use tools decisively — discover first, load only when committed.

### Tool Namespace Reference

| Prefix      | Tools                                                                                                | When to use                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `skill_*`   | `skill_list_categories`, `skill_search`, `skill_browse_category`, `skill_get`, `skill_budget_report` | Domain expertise for any implementation, debug, or review task |
| `postman_*` | `postman_get_mode`, `postman_set_mode`, `postman_get_status`                                         | API testing or Postman configuration tasks                     |
| `stitch_*`  | `stitch_get_mode`, `stitch_set_profile`, `stitch_get_status`                                         | Stitch data pipeline tasks                                     |

### Discovery Flow (Mandatory Order)

Stop at the earliest step that gives enough signal. Do not jump ahead.

1. `skill_list_categories` — run once per session if domain is unknown; see what exists
2. `skill_search <keyword>` — fast keyword match across all skills; always try this first
3. `skill_browse_category <category>` — explore if search is too broad or returns 0 results
4. `skill_get <id>` — load full skill content; only when committed to using it
5. `skill_budget_report` — verify token cost after loading; triggers the compact ctx stamp

### Postman Intent Trigger (Required)

When user intent includes Postman workflows (for example: workspace, collection, environment, runCollection, monitor, mock, or "run Postman tests"):

1. Run `skill_search "postman"` first.
2. If `postman` skill exists, load `skill_get "postman"` before workflow/agent routing.
3. Prefer Postman MCP tools (`postman.*`) over Newman/CLI fallback unless the user explicitly asks for fallback.
4. If `--postman` was installed but `postman` skill cannot be found, report installation drift and suggest reinstall with `cbx workflows install ... --postman`.

**Hard rules:**

- Never call `skill_get` without a prior `skill_search` or `skill_browse_category`
- Never call `skill_get` with a workflow ID — `workflow-*` are routes, not skills; keep workflow mentions in the Decision Log using raw $workflow-\* wrappers
- Never reload a skill already loaded this session — reuse content already in context
- If `skill_search` returns 0 results, try `skill_browse_category`, then fall back to built-in knowledge

### Adaptive Load Policy

| Request type                                   | Skills to load via `skill_get`                                  |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Q&A / explanation                              | None — answer from knowledge; load only if user explicitly asks |
| Single-domain implementation, debug, or review | 1 primary + 1 supporting (max)                                  |
| Multi-domain / orchestration                   | 1 per distinct domain, hard cap at 3                            |
| User explicitly names a skill                  | Always load it — overrides all caps                             |

### Graceful Degradation

If MCP tools are unavailable (server down, timeout, tool not listed):

1. Announce briefly: "MCP unavailable — continuing with built-in knowledge."
2. Proceed using codebase context and expertise; do not block on MCP.
3. Never fabricate or hallucinate skill content.
4. Retry once on transient network errors; accept failure after the retry.

### Skill Log (Required After Any `skill_get` Call)

Append one compact inline line — no separate structured block:

```
Skills: loaded=<id> | skipped=<id> (reason)
```

Follow immediately with the compact ctx stamp (see § Context Budget Tracking).

### Anti-Patterns (Never Do These)

- Loading skills speculatively "just in case" they might be useful
- Calling `skill_get` before running `skill_search` or `skill_browse_category`
- Using partial or guessed skill IDs in `skill_get`
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

## 9) Context Budget Tracking

After loading skills or completing a significant task phase, emit a single compact stamp so context cost is visible without adding prose.

**Stamp format** (one line, end of response section):

```
[ctx: +skill-id(~Xk) | session=~Yk/108k | saved=Z%]
```

- `+skill-id(~Xk)` — each skill loaded this turn with its estimated token cost
- `session=~Yk/108k` — cumulative tokens used vs full catalog ceiling
- `saved=Z%` — estimated savings from progressive disclosure

**Rules:**

1. Emit stamp only when a skill was loaded via `skill_get` or `skill_budget_report` was called.
2. Omit stamp for pure Q&A or browsing-only turns (no full skill content loaded).
3. Use `skill_budget_report` MCP tool to get accurate numbers; do not guess.
4. One stamp per response — consolidate if multiple skills were loaded.
5. Keep the stamp on its own line at the very end of the response, after all content.

**Example stamp after loading `flutter-expert` (~3.2k tokens):**

```
[ctx: +flutter-expert(~3k) | session=~3k/108k | saved=97%]
```

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
## Cubis Foundry MCP Tool Catalog (auto-managed)

The Foundry MCP server provides progressive-disclosure skill discovery and integration management tools.

### Skill Vault

- **123** skills across **22** categories
- Estimated full catalog: ~109,067 tokens

Categories:
- `ai`: 1 skill(s)
- `api`: 3 skill(s)
- `architecture`: 3 skill(s)
- `backend`: 14 skill(s)
- `data`: 4 skill(s)
- `design`: 6 skill(s)
- `devops`: 20 skill(s)
- `documentation`: 3 skill(s)
- `frontend`: 9 skill(s)
- `game-dev`: 1 skill(s)
- `general`: 26 skill(s)
- `localization`: 1 skill(s)
- `marketing`: 2 skill(s)
- `mobile`: 7 skill(s)
- `observability`: 1 skill(s)
- `payments`: 1 skill(s)
- `performance`: 2 skill(s)
- `practices`: 5 skill(s)
- `saas`: 1 skill(s)
- `security`: 4 skill(s)
- `testing`: 6 skill(s)
- `tooling`: 3 skill(s)

### Built-in Tools

**Skill Discovery:**
- `skill_list_categories`: List all skill categories available in the vault. Returns category names and skill counts.
- `skill_browse_category`: Browse skills within a specific category. Returns skill IDs and short descriptions.
- `skill_search`: Search skills by keyword. Matches against skill IDs and descriptions.
- `skill_get`: Get full content of a specific skill by ID. Returns SKILL.md content and referenced files.
- `skill_budget_report`: Report estimated context/token budget for selected and loaded skills.

**Postman Integration:**
- `postman_get_mode`: Get current Postman MCP mode from cbx_config.
- `postman_set_mode`: Set Postman MCP mode in cbx_config.
- `postman_get_status`: Get Postman integration status and active profile.

**Stitch Integration:**
- `stitch_get_mode`: Get Stitch MCP mode from cbx_config.
- `stitch_set_profile`: Switch active Stitch profile in cbx_config.
- `stitch_get_status`: Get Stitch integration status and active profile.

### Skill Discovery Flow

Use progressive disclosure to minimize context usage:
1. `skill_list_categories` → see available categories and counts
2. `skill_browse_category` → browse skills in a category with short descriptions
3. `skill_search` → search by keyword across all skills
4. `skill_get` → load full content of a specific skill (only tool that reads full content)
5. `skill_budget_report` → check token usage for selected/loaded skills; use result to emit the § Context Budget Tracking stamp

### Connection

- **stdio**: `cbx mcp serve --transport stdio --scope auto`
- **HTTP**: `cbx mcp serve --transport http --scope auto --port 3100`

<!-- cbx:mcp:auto:end -->
