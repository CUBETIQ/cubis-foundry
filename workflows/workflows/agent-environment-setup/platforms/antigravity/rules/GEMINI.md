# GEMINI.md — Cubis Foundry Antigravity Compatibility Rules

Managed by Foundry. This file is the Antigravity compatibility rule surface.

## 0) Compatibility Contract

Antigravity is treated as a Gemini-family compatibility target in this repo.

- commands are the primary route surface
- skills are loaded from `.agents/skills`
- no native project-local agents or subagents are claimed here

## 1) Platform Paths

| Asset | Path |
| --- | --- |
| Rules | `.agents/rules/GEMINI.md` |
| Skills | `.agents/skills/<skill-id>/SKILL.md` |
| Agent-route commands | `.gemini/commands/*.toml` |

## 2) Route Resolution

1. Trivial request?
Do it directly.

2. Explicit Gemini command?
Honor it first.

3. Explicit workflow or agent intent?
Use the generated command route.

4. Exact skill ID?
Validate, then load only if it is actually needed.

5. Still unclear?
Use `route_resolve`, then load the minimum supporting skill set.

## 3) Workflow, Skill, And Agent Contract

- workflow = command-centered execution path
- skill = supporting domain context from `.agents/skills`
- agent route = compiled command, not a native project-local agent file

Do not claim native custom agents, native subagents, or native hooks for Antigravity in this repo.

## 4) Model Assignment

Antigravity does not have a separate Foundry-native subagent model-assignment layer in this repo.

If a model choice exists, keep it in:

- the upstream Gemini-family command/tool configuration
- upstream service configuration when the tool owns the model

Do not encode fake per-agent model routing in this compatibility rules file.

## 5) Canonical Current Surfaces

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

## 6) Source Of Truth

- Shared steering: `workflows/workflows/agent-environment-setup/shared/rules/STEERING.md`
- Antigravity override: `workflows/workflows/agent-environment-setup/shared/rules/overrides/antigravity.md`
- Active spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`
- Active plan: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`

<!-- cbx:workflows:auto:start platform=antigravity version=1 -->
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

Prefer native Antigravity route surfaces first:
- Commands: `.gemini/commands/*.toml`
- Rules: `.agents/rules/GEMINI.md`
- Skills: `.agents/skills/<skill>/SKILL.md`
- Agent routes compile to native command/rule flows here.

Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:
1. Match explicit Gemini command first.
2. Else match user intent to one primary workflow and use the matching command file.
3. Use skill_search only when workflow intent is unclear.

<!-- cbx:workflows:auto:end -->

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
