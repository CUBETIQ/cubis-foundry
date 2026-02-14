# Antigravity Agent Environment (CBX Template)

This file is the operating protocol for AG-kit-style Antigravity setup with Cubis skills.

## Specialist Roster

Agents available in `.agent/agents`:
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

## Workflow Rule

1. If a slash workflow is explicitly requested, run it first.
2. Otherwise pick the best-fit workflow by intent.
3. For cross-domain work, use orchestrated delegation.

## Skills Rule

Skills are installed in `.agent/skills`.
Each agent should prefer mapped Cubis skills first and keep context focused.

<!-- cbx:workflows:auto:start platform=antigravity version=1 -->
## CBX Workflow Routing (auto-managed)
Use the following workflows proactively when task intent matches:

- No installed workflows found yet.

Selection policy:
1. Match explicit slash command first.
2. Else match user intent to workflow description and triggers.
3. Prefer one primary workflow; reference others only when needed.

<!-- cbx:workflows:auto:end -->
