---
command: "/brainstorm"
description: "Generate concrete solution options and tradeoffs before committing to implementation."
triggers: ["idea", "brainstorm", "options", "tradeoff", "approach"]
---
# Brainstorm Workflow

## When to use
Use this when requirements are still fluid and architecture choices are open.

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
- Option table (pros/cons)
- Recommended option
- Known unknowns
- First implementation milestone
