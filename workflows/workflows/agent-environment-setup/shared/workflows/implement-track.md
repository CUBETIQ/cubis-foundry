---
command: "/implement-track"
description: "Execute large work in milestones with explicit quality gates and status updates."
triggers: ["track", "milestone", "delivery", "progress", "execution"]
---
# Implement Track Workflow

## When to use
Use this for medium/large efforts where progress visibility is required.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `plan-writing`, `feature-forge`
- Supporting skills (optional): `lint-and-validate`, `test-master`

## Workflow steps
1. Split into milestone-sized deliverables.
2. Define done criteria per milestone.
3. Execute one milestone at a time.
4. Validate before moving forward.
5. Publish progress and remaining risks.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Milestone board (done/in-progress/next)
- Gate status
- Blockers and dependencies
- ETA confidence
