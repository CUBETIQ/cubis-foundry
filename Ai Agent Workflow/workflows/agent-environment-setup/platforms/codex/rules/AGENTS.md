# Codex Agent Environment (CBX Template)

This file is the operating protocol for a full AG-kit-style Codex setup, mapped to Cubis skills.

## 1) Operating Goals

1. Ship working code fast without reducing safety.
2. Keep decisions explicit, testable, and reversible.
3. Route each task to the best specialist instead of one generic flow.

## 2) Primary Workflow Rule

1. If user explicitly names a workflow command, run that workflow first.
2. If no command is provided, select one by intent from `.agents/workflows`.
3. If task spans multiple domains, use `/orchestrate` and delegate.
4. Keep one primary workflow; use others only as supporting references.

## 3) Full Specialist Roster

Agents available in `.agents/agents`:
- `@backend-specialist`
- `@code-archaeologist`
- `@database-architect`
- `@debugger`
- `@devops-engineer`
- `@documentation-writer`
- `@explorer-agent`
- `@frontend-specialist`
- `@game-developer`
- `@mobile-developer`
- `@orchestrator`
- `@penetration-tester`
- `@performance-optimizer`
- `@product-manager`
- `@product-owner`
- `@project-planner`
- `@qa-automation-engineer`
- `@security-auditor`
- `@seo-specialist`
- `@test-engineer`

## 4) Routing Matrix

1. Backend APIs/services/data contracts -> `@backend-specialist`
2. Legacy code understanding/refactor safety -> `@code-archaeologist`
3. Schema/query/migration design -> `@database-architect`
4. Root-cause analysis and failure isolation -> `@debugger`
5. Deployment/release/rollback -> `@devops-engineer`
6. Technical docs and runbooks -> `@documentation-writer`
7. Codebase discovery and architecture mapping -> `@explorer-agent`
8. UI/UX/frontend architecture -> `@frontend-specialist`
9. Mobile app implementation -> `@mobile-developer`
10. Security assessment/remediation -> `@security-auditor`
11. Offensive validation -> `@penetration-tester`
12. Performance bottleneck removal -> `@performance-optimizer`
13. Test strategy and execution -> `@test-engineer` or `@qa-automation-engineer`
14. Product scope and acceptance criteria -> `@product-manager` / `@product-owner`
15. Cross-domain execution -> `@orchestrator`

## 5) Skill Support Policy

Installed Cubis skills are in `.agents/skills`.

Policy:
1. Each agent should prefer its mapped Cubis skills first.
2. If multiple skills match, pick one primary and keep others supportive.
3. Keep context minimal: load only skills needed for current task.
4. If a referenced skill is missing, continue with best fallback and report it.

## 6) Execution Contract

For substantial tasks, output must include:
1. Assumptions and constraints
2. Plan or milestone sequence
3. Concrete changes made
4. Verification evidence (tests/checks)
5. Residual risks and follow-up

## 7) Quality Gates

Before finalizing:
1. Verify requested behavior is implemented.
2. Run focused checks where practical.
3. State what was not validated.
4. Explicitly note migration/compatibility impacts.

## 8) Optional Conductor Integration

If conductor artifacts exist (spec/plan/tasks), use them as supporting context.
Do not require conductor for normal operation.

<!-- cbx:workflows:auto:start platform=codex version=1 -->
## CBX Workflow Routing (auto-managed)
Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:
1. Match explicit slash command first.
2. Else match user intent to workflow description and triggers.
3. Prefer one primary workflow; reference others only when needed.

<!-- cbx:workflows:auto:end -->
