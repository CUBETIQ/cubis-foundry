# Copilot Instructions — Cubis Foundry Protocol

Managed by Foundry. Keep this file compact and high-signal. Use it as the root rule surface for GitHub Copilot coding agent in this repository.

## 0) Cognitive Contract

Inspect first, route second, load the minimum surface needed.

Silent checks before every substantial action:

1. Grounded: did I inspect the repo/task locally first?
2. Minimal: am I using the smallest route that solves this correctly?
3. Safe: have I flagged what I did not validate?

## 1) Platform Paths

| Asset            | Path                                 |
| ---------------- | ------------------------------------ |
| Rules            | `.github/copilot-instructions.md`    |
| Custom agents    | `.github/agents/*.agent.md`          |
| Workflow prompts | `.github/prompts/*.prompt.md`        |
| Skills           | `.github/skills/<skill-id>/SKILL.md` |
| Hooks            | `.github/hooks/*.json`               |
| MCP config       | `.vscode/mcp.json`                   |

## 2) Route Resolution

1. Trivial, obvious, reversible?
   Do it directly.

2. User named an explicit prompt, `@agent`, or exact skill?
   Honor it directly. For exact skill IDs, validate first.

3. UI or design work?
   Prefer the canonical design workflows and skills.

4. Non-trivial feature or architecture work?
   Prefer `/plan`.

5. Bug/debug/test/review/deploy intent?
   Choose the matching canonical workflow.

6. Cross-domain work with real handoffs?
   Use the orchestrator custom agent or the matching workflow prompt.

7. Still unclear?
   Use `route_resolve`, then load the smallest supporting skill set.

## 3) Foundry Surface Hierarchy

- workflow prompt = multi-step execution pattern
- custom agent = specialist persona with bounded handoffs
- skill = supporting domain knowledge
- MCP = real external actions and exact retrieval

Do not use custom agents as a substitute for route selection.

## 4) Copilot Custom Agents And Model Assignment

Foundry supports Copilot custom-agent frontmatter through the compiler.

Current allowed keys include:

- `name`
- `description`
- `tools`
- `mcp-servers`
- `model`
- `handoffs`
- `agents`
- `argument-hint`
- `metadata`

The current source is:

- `src/cli/compiler/projectors/copilot-agent.ts`

Rule of thumb:

- put model choice on the custom agent frontmatter, not in the root instructions
- keep orchestrators and reviewers on stronger models when cost allows
- keep implementers and narrow specialists practical and bounded

## 5) MCP Usage Contract

- Use MCP after route selection, not before.
- Use `playwright` for web testing.
- Use `mobile-mcp` first for mobile interaction.
- Keep references lazy and exact.
- **Load acknowledgment:** After calling `route_resolve`, `skill_get`, or delegating to a `@agent`, emit a single-line acknowledgment visible to the user: `🔧 Foundry: loaded <kind> "<id>"` (e.g. `🔧 Foundry: loaded skill "typescript-best-practices"`, `🔧 Foundry: loaded workflow "/implement"`). Keep it one line, no extra explanation.
- **Diagnostic:** If the user asks whether Foundry is active or working, call `skill_budget_report` and display the summary.

## 6) Canonical Current Surfaces

Agents:

- `@orchestrator`
- `@planner`
- `@explorer`
- `@implementer`
- `@debugger`
- `@tester`
- `@reviewer`

Design:

- `design`
- `web-ui-design`
- `mobile-ui-design`
- `desktop-ui-design`
- `design-system`

Testing:

- `web-testing`
- `android-emulator-testing`
- `ios-simulator-testing`

## 7) Source Of Truth

- Shared steering: `workflows/workflows/agent-environment-setup/shared/rules/STEERING.md`
- Copilot override: `workflows/workflows/agent-environment-setup/shared/rules/overrides/copilot.md`
- Active spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
- Active plan: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Design foundation: `docs/foundation/DESIGN.md`

<!-- cbx:mcp:auto:start version=1 -->
## Cubis Foundry MCP (auto-managed)

Keep MCP context lazy and exact. Skills are supporting context, not the route layer.

1. Never begin with `skill_search`. Inspect the repo/task locally first.
2. If the user already named `/workflow`, `@agent`, or an exact skill ID, honor it directly. For exact skills, run `skill_validate` first and skip `route_resolve` when valid.
3. Resolve only free-text workflow/agent intent with `route_resolve` before loading non-explicit skills.
4. If the route is still unresolved and local grounding leaves the domain unclear, use one narrow `skill_search`.
5. Always run `skill_validate` on the exact selected ID before `skill_get`.
6. Call `skill_get` with `includeReferences:false` by default.
7. Load at most one sidecar markdown file at a time with `skill_get_reference`.
8. Do not auto-prime every specialist with a skill. Load only what the task clearly needs.
9. For research: repo/local evidence first, official docs next, Reddit/community only as labeled secondary evidence.
10. Escalate to research only when freshness matters, public comparison matters, or the user explicitly asks to research/verify.
11. For non-trivial work, read `ENGINEERING_RULES.md` first and `TECH.md` next when they exist.
12. If those docs declare architecture or design-system rules, follow them unless the current spec or task explicitly changes them.
13. Use upstream MCP servers such as `postman`, `stitch`, or `playwright` for real cloud/browser actions when available.

<!-- cbx:mcp:auto:end -->

<!-- cbx:workflows:auto:start platform=copilot version=1 -->

## CBX Workflow Routing (auto-managed)

<!-- cbx:managed:skill-routing start -->

Classify intent before any MCP call.

- TIER 1 DIRECT: `skill_get <exact-skill-id>` when skill ID is known from route or context.
- TIER 1b ROUTE-RECOMMENDED: after `route_resolve`, load `primarySkillHint` or first `primarySkills` entry via `skill_validate` -> `skill_get` before executing non-trivial tasks.
- TIER 2 TARGETED SEARCH: one `skill_search <1-3 word noun>` max when domain is unclear, then `skill_validate` -> `skill_get`.
- TIER 3 SKIP: no MCP call for conversational replies, trivial one-liners, or identical skill already loaded this session.
- Never pre-load skills or agents speculatively before route resolution.
- Keep one primary agent and one primary skill by default.
- Add supporting skills only when the active task explicitly crosses domains.
- Direct skill-package creation or repair work to `skill-creator` instead of starting with `skill_search`.

# Full reference: foundry-detail.md#tiered-routing

<!-- cbx:managed:skill-routing end -->

<!-- cbx:managed:long-plan-execution start -->

When `PLAN_HANDOFF` is present, continue task 1→N without confirmation pauses.

- Pre-load deduped `skill_hint` values once, then run `skill_budget_report`.
- Execute in order, respecting `depends_on` and `stop_if_failed`.
- Emit `CHECKPOINT` every ~3 tasks in runs of 5+.
- Finish with `EXECUTION_SUMMARY {completed, skipped, stopped_at, artifacts, skills_used, dropped}`.
- Stop only for blocking artifact failure, unplanned destructive action, missing required skill after one search, or explicit user halt.
- Codex: compact before context exhaustion. Antigravity/Gemini: native long context. Copilot: write `.copilot-tracking/handoff.md`.

# Full reference: foundry-detail.md#plan-handoff-and-execution

<!-- cbx:managed:long-plan-execution end -->

Prefer native Copilot route surfaces first:

- Workflow prompts: `.github/prompts/*.prompt.md`
- Custom agents: `.github/agents/*.agent.md`
- Skills: `.github/skills/<skill>/SKILL.md`
- Agents: `@agent-name`
- Workspace-first MCP: `.vscode/mcp.json`

Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:

1. Match explicit workflow prompt or `@agent` first.
2. Else match user intent to one primary workflow and reuse the matching prompt file.
3. Use skill_search only when the best workflow or agent route is unclear.

<!-- cbx:workflows:auto:end -->
