---
command: "/create"
description: "Implement feature work with minimal blast radius and clear verification checkpoints."
triggers: ["create", "build", "implement", "feature", "develop"]
---
# Create Workflow

# CHANGED: routing — added explicit implementation owners by domain — prevents fallback routing and clarifies which specialist leads execution.
# CHANGED: output contract — converted free-form bullets into structured YAML — makes create results consumable by downstream workflows.
# CHANGED: skill routing — added `skill-authoring` as the canonical support skill for skill package work — lets skill creation and repair route cleanly without blind startup search.

## When to use
Use this for net-new implementation after design is stable.

## Routing
- Primary coordinator: `@orchestrator`
- Backend implementation: `@backend-specialist`
- Frontend implementation: `@frontend-specialist`
- Mobile implementation: `@mobile-developer`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `feature-forge`, `architecture-designer`
- Supporting skills (optional): `skill-authoring`, `lint-and-validate`, `test-master`
- If the task is creating or repairing a skill package, load `skill-authoring` directly before generic supporting skills.

## Workflow steps
1. Confirm target files and contracts.
2. Implement smallest coherent increment.
3. Validate behavior with focused tests.
4. Capture remaining gaps and follow-ups.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
CREATE_WORKFLOW_RESULT:
  primary_agent_id: "orchestrator"
  supporting_agent_ids: ["backend-specialist", "frontend-specialist", "mobile-developer", "test-engineer"]
  primary_skill_ids: ["feature-forge", "architecture-designer"]
  supporting_skill_ids: ["lint-and-validate", "test-master"]
  implemented_scope:
    summary: "Describe the implemented increment"
    changed_artifacts: ["<path-or-artifact>"]
  behavioral_impact: ["Describe user-visible or system-level changes"]
  verification:
    checks_run: ["<command-or-test>"]
    evidence: ["Describe the strongest verification evidence"]
    gaps: []
  follow_up_items: []
  next_handoff:
    plan_handoff: null
```
