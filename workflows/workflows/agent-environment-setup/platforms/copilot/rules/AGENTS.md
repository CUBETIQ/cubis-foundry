# .github/copilot-instructions.md - Cubis Foundry Copilot Protocol

This file defines mandatory behavior for GitHub Copilot projects installed via `cbx workflows`.

## 1) Platform Paths

- Workflows: `.github/copilot/workflows`
- Agents: `.github/agents`
- Skills: `.github/skills`
- Prompt files: `.github/prompts`
- Rules file (project): `.github/copilot-instructions.md`

## Startup Transparency (Required)

Before executing workflows, agents, or code edits, publish a short `Decision Log` that is visible to the user:

1. Rule file(s) read at startup (at minimum `.github/copilot-instructions.md`, plus any additional rule files loaded).
2. Workflow decision (`/workflow` or direct mode) and why it was chosen.
3. Agent routing decision (`@agent` or direct mode) and why it was chosen.
4. Skill loading decision (skill names loaded) and why they were chosen.

If routing changes during the task, publish a `Decision Update` before continuing.
Keep this user-visible summary concise and factual; do not expose private chain-of-thought.

## 2) Workflow-First Contract

1. If the user explicitly requests a slash command, run that workflow first.
2. Otherwise choose the best workflow by intent from `.github/copilot/workflows` and reuse `.github/prompts/workflow-*.prompt.md` when available.
3. For cross-domain tasks, use `/orchestrate` and `@orchestrator`.
4. Keep one primary workflow; use others only as supporting references.

## 3) Request Classifier

1. Question/explanation requests: answer directly.
2. Survey/intel requests: inspect and summarize before editing.
3. Simple code changes: minimal edits with focused verification.
4. Complex code/design changes: plan first, then implement and verify.

## 3A) Workflow Pattern Map (Copilot)

Map intent to one primary workflow first:

- Explain codebase -> `/plan`
- Fix bug -> `/debug`
- Write test -> `/test` or `/qa`
- Prototype from screenshot -> `/create` + `@frontend-specialist`
- Iterate UI updates -> `/create` with verification loop
- Refactor safely -> `/refactor` (or `@code-archaeologist` for targeted legacy areas)
- Local code review -> `/review`
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

## 5) Copilot Schema Compatibility

When authoring custom Copilot assets, keep frontmatter schema compatible:

1. Skill files in `.github/skills/<id>/SKILL.md` must use supported top-level keys only.
2. Agent files in `.github/agents/*.md` must use supported top-level keys only.
3. If unsupported keys are detected, reinstall with overwrite to auto-normalize.

## 6) Skill Loading Policy

## MCP-first Skill Discovery Order (Required)

1. Use `skill_search` first to narrow candidate skills.
2. Use `skill_browse_category` second to inspect category-level candidates.
3. Use `skill_get` only for final selected skills that must be loaded.
4. Keep pointer-first flow; avoid loading full skill text prematurely.

## Skill Log Completion Block (Required)

After finishing skill selection/loading, publish:

- `selected_skills`: skill IDs selected for the task
- `loaded_skills`: skill IDs loaded via `skill_get`
- `skipped_skills`: considered but not loaded

Workflow boundary for this block:

- `selected_skills` / `loaded_skills` must never include workflow IDs.
- IDs like `workflow-implement-track` are workflow routes, not skills.
- Never call `skill_get` with `workflow-*`; keep workflow mentions in workflow decisions (`/workflow`) and keep skill logs skill-only.

## Context Budget Block (Required, Estimated)

Immediately after the Skill Log block, publish estimated budget fields:

- `full_catalog_est_tokens`
- `loaded_est_tokens`
- `estimated_savings_tokens`
- `estimated_savings_percent`

Mark all context/token values as deterministic estimates (not provider metering).

### Smart Skill Selection (Adaptive)

Use an adaptive load policy to control context size:

1. Q&A/explanations: do not load skills unless the user explicitly asks for one.
2. Implementation/debug/review: load at most 1 primary skill and 1 supporting skill.
3. Cross-domain orchestration: use additional skills only when domains clearly differ.
4. Explicit skill mention by user always takes precedence.

### General Loading Rules

1.  Load only skills needed for the active request.
2.  Prefer progressive disclosure: start from `SKILL.md`, then specific sections.
3.  Keep context lean; avoid loading unrelated skill documents.
4.  If a mapped skill is missing, continue with best fallback and state it.
5.  Keep user-visible decision logs concise: selected skill(s) and one-line rationale.

After the skill log is complete, append the Context Budget block in the same response/update.

## 7) Socratic Gate (Before Complex Work)

Before multi-file or architecture-impacting changes, ask targeted questions when requirements are unclear:

1. Goal and success criteria
2. Constraints and compatibility requirements
3. Validation expectations (tests, lint, release checks)

## 8) Quality and Safety Gates

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify behavior with focused checks before finalizing.
4. State what was not validated.

## 9) CBX Maintenance Commands

Use these commands to keep this setup healthy:

- Install/update bundle:
  `cbx workflows install --platform copilot --bundle agent-environment-setup --scope global --overwrite --postman --stitch --mcp-runtime docker --mcp-fallback local --mcp-tool-sync`
- Start MCP Docker runtime:
  `cbx mcp runtime up --scope global --name cbx-mcp --port 3310 --replace`
- Check MCP Docker runtime:
  `cbx mcp runtime status --scope global --name cbx-mcp`
- Stop MCP Docker runtime:
  `cbx mcp runtime down --name cbx-mcp`
- Rebuild managed routing block:
  `cbx workflows sync-rules --platform copilot --scope project`
- Diagnose setup issues:
  `cbx workflows doctor copilot --scope project`

## 10) Managed Section Contract

1. Preserve all user content outside managed markers.
2. Do not manually edit content between managed markers.
3. `cbx workflows sync-rules` is the source of truth for the managed block.

<!-- cbx:workflows:auto:start platform=copilot version=1 -->

## CBX Workflow Routing (auto-managed)

Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:

1. Match explicit slash command first.
2. Else match user intent to workflow description and triggers.
3. Prefer one primary workflow; reference others only when needed.

<!-- cbx:workflows:auto:end -->
