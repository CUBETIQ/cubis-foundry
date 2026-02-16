# AGENTS.md - Cubis Foundry Copilot Protocol

This file defines mandatory behavior for GitHub Copilot projects installed via `cbx workflows`.

## 1) Platform Paths

- Workflows: `.github/copilot/workflows`
- Agents: `.github/agents`
- Skills: `.github/skills`
- Rules file (project): `AGENTS.md` (fallback may be `.github/copilot-instructions.md`)

## 2) Workflow-First Contract

1. If the user explicitly requests a slash command, run that workflow first.
2. Otherwise choose the best workflow by intent from `.github/copilot/workflows`.
3. For cross-domain tasks, use `/orchestrate` and `@orchestrator`.
4. Keep one primary workflow; use others only as supporting references.

## 3) Request Classifier

1. Question/explanation requests: answer directly.
2. Survey/intel requests: inspect and summarize before editing.
3. Simple code changes: minimal edits with focused verification.
4. Complex code/design changes: plan first, then implement and verify.

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

1. Load only skills needed for the active request.
2. Prefer progressive disclosure: start from `SKILL.md`, then specific sections.
3. Keep context lean; avoid loading unrelated skill documents.
4. If a mapped skill is missing, continue with best fallback and state it.

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
  `cbx workflows install --platform copilot --bundle agent-environment-setup --scope project --overwrite`
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
