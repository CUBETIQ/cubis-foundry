---
trigger: always_on
---

# GEMINI.md - Cubis Foundry Antigravity Protocol

This file defines mandatory behavior for Antigravity projects installed via `cbx workflows`.

## 1) Platform Paths

- Workflows: `.agent/workflows`
- Agents: `.agent/agents`
- Skills: `.agent/skills`
- Rules file: `.agent/rules/GEMINI.md`

## 2) Workflow-First Contract

1. If the user explicitly requests a slash command, run that workflow first.
2. Otherwise choose the best workflow by intent from `.agent/workflows`.
3. For cross-domain tasks, use orchestrated delegation with `@orchestrator`.
4. Keep one primary workflow; use others only as supporting references.

## 3) Request Classifier

1. Question or explanation requests: answer directly, no implementation.
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

## 5) Skill Loading Policy

### Smart Skill Selection (TIER 0)

Before starting ANY task, the agent MUST:

1.  **Analyze** the user's request against the keywords in `.agent/skills/skills_index.json`.
2.  **Select** the most relevant skill(s) if a strong match is found.
3.  **Load** the selected skill's `SKILL.md` using `view_file` **BEFORE** proceeding.
4.  **Announce** the selection: "I am loading the `[Skill Name]` skill to handle your request."

### General Loading Rules

1.  Load only skills needed for the active request.
2.  Prefer progressive disclosure: start from `SKILL.md`, then specific sections.
3.  Keep context lean; avoid loading unrelated skill documents.
4.  If a mapped skill is missing, continue with best fallback and state it.

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

If Antigravity script harness exists, prefer:

- Quick checks: `python .agent/scripts/checklist.py .`
- Full checks (with URL): `python .agent/scripts/verify_all.py . --url <URL>`

## 8) CBX Maintenance Commands

Use these commands to keep this setup healthy:

- Install/update bundle:
  `cbx workflows install --platform antigravity --bundle agent-environment-setup --scope project --overwrite`
- Rebuild managed routing block:
  `cbx workflows sync-rules --platform antigravity --scope project`
- Diagnose setup issues:
  `cbx workflows doctor antigravity --scope project`

## 9) Managed Section Contract

1. Preserve all user content outside managed markers.
2. Do not manually edit content between managed markers.
3. `cbx workflows sync-rules` is the source of truth for the managed block.

<!-- cbx:workflows:auto:start platform=antigravity version=1 -->

## CBX Workflow Routing (auto-managed)

Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:

1. Match explicit slash command first.
2. Else match user intent to workflow description and triggers.
3. Prefer one primary workflow; reference others only when needed.

<!-- cbx:workflows:auto:end -->
