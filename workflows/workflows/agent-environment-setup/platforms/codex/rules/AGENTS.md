# AGENTS.md - Cubis Foundry Codex Protocol

This file defines durable project guidance for Codex installs created by `cbx workflows`.

## 1) Platform Paths

- Workflows: `.agents/workflows`
- Agents: `.agents/agents`
- Skills: `.agents/skills`
- Rules file: `AGENTS.md`

## 2) Core Steering

1. Inspect the repo or task locally before choosing a route or loading any skill.
2. Treat workflows and agents as the route layer. Treat skills as optional supporting context.
3. If the request is small and clear, execute directly. Do not start with skill discovery.
4. If the user explicitly names a workflow or agent, honor that route first.
5. If the task is multi-step, choose one primary workflow. Use `/orchestrate` only for genuinely cross-domain work.
6. Load a skill only when the user names one, the route is still unclear after inspection, or a specialized route clearly needs domain context.

## 3) Route Order

Follow this order:

1. Explicit `/workflow` or `@agent`
2. Direct execution for a simple, obvious task
3. One primary workflow for multi-step work
4. `/orchestrate` for cross-domain work
5. One narrow skill lookup only if the domain is still unclear

Codex compatibility aliases (`$workflow-*`, `$agent-*`) may be accepted as hints, but they are never the primary route surface.

## 4) Skill Loading

1. Never begin with `skill_search`.
2. If the exact skill ID is already known, run `skill_validate` before `skill_get`.
3. Otherwise, use at most one narrow `skill_search` after local inspection and route resolution.
4. Call `skill_get` with `includeReferences:false` by default.
5. Load one reference file at a time with `skill_get_reference`.
6. Do not auto-prime every specialist with a skill. Prime only when the task or route clearly needs it.
7. Never pass workflow IDs or agent IDs to skill tools.

## 5) Long-Running and Handoff Work

1. Use `/implement-track` for milestone-based work, resumable execution, or progress checkpoints.
2. Use `/orchestrate` when multiple specialties need explicit ownership or handoff.
3. Keep workflow output contracts intact when handing work between specialists, especially `milestones`, `gate_status`, and `next_handoff`.

## 6) Specialists

Codex does not spawn isolated Foundry agents. Agent-style references route work to the right specialist posture inside the current session.

Use the best specialist first:

- Backend/API/database: `@backend-specialist`, `@database-architect`
- Frontend/UI: `@frontend-specialist`
- Mobile: `@mobile-developer`
- Security: `@security-auditor`, `@penetration-tester`
- DevOps/release: `@devops-engineer`
- Testing/QA: `@test-engineer`, `@qa-automation-engineer`
- Debugging/performance: `@debugger`, `@performance-optimizer`
- Research/exploration: `@researcher`
- Validation/quality gate: `@validator`
- Cross-domain orchestration: `@orchestrator`

Orchestrator rules:

- `@orchestrator` uses the RUG (Repeat-Until-Good) pattern: it NEVER implements directly, only delegates to specialists with acceptance criteria and validates output independently.
- After each specialist delivers, route through `@validator` for independent quality gate before accepting.
- If validation fails, re-delegate to the specialist with specific feedback (max 3 iterations).

New workflow routes:

- Accessibility audit: `/accessibility` or `@frontend-specialist` with `accessibility` skill
- Technology migration: `/migrate` for framework upgrades, dependency updates, or technology transitions
- Codebase onboarding: `/onboard` for surveying unfamiliar repos and producing orientation reports

## 7) Safety and Verification

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify with focused checks before finalizing.
4. State what was not validated.
5. Use web search only when information may be stale or the user explicitly asks for it.

## 8) Maintenance

- Refresh installed rules: `cbx workflows sync-rules --platform codex --scope project`
- Diagnose setup issues: `cbx workflows doctor codex --scope project`

## 9) Managed Section Contract

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

Keep MCP context lazy and exact. Skills are supporting context, not the route layer.

1. Inspect the repo/task locally first. Do not start with `skill_search`.
2. Resolve workflows, agents, or free-text route intent with `route_resolve` before loading any skills.
3. If the route is still unresolved and local grounding leaves the domain unclear, use one narrow `skill_search`.
4. Always run `skill_validate` on the exact selected ID before `skill_get`.
5. Call `skill_get` with `includeReferences:false` by default.
6. Load at most one sidecar markdown file at a time with `skill_get_reference`.
7. Do not auto-prime every specialist with a skill. Load only what the task clearly needs.
8. Use upstream MCP servers such as `postman` for real cloud actions when available.

<!-- cbx:mcp:auto:end -->
