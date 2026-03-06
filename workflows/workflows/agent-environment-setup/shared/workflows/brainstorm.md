---
command: "/brainstorm"
description: "Generate concrete solution options and tradeoffs before committing to implementation."
triggers: ["idea", "brainstorm", "options", "tradeoff", "approach"]
---
# Brainstorm Workflow

# CHANGED: routing — added explicit primary and supporting specialists — prevents route manifest fallback to orchestrator for ideation work.
# CHANGED: output contract — converted free-form bullets into structured YAML — keeps option handoff machine-readable across platforms.

## When to use
Use this when requirements are still fluid and architecture choices are open.

## Routing
- Primary specialist: `@project-planner`
- Scope and user-value framing: `@product-manager`
- Technical tradeoff review: `@backend-specialist`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `brainstorming`, `feature-forge`
- Supporting skills (optional): `plan-writing`

## Workflow steps
1. Restate problem, constraints, and success metrics.
2. Produce 2-4 options with architecture shape.
3. Compare complexity, risk, and implementation speed.
4. Recommend one option and justify rejection of others.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
BRAINSTORM_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [product-manager?, backend-specialist?]
  primary_skills: [brainstorming, feature-forge]
  supporting_skills: [plan-writing?]
  options:
    - id: <string>
      summary: <string>
      pros: [<string>]
      cons: [<string>]
      risks: [<string>]
  recommended_option: <option-id>
  known_unknowns: [<string>] | []
  first_milestone: <string>
  next_handoff:
    plan_handoff: <PLAN_HANDOFF|null>
```
