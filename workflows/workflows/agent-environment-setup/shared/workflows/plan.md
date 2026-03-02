---
command: "/plan"
description: "Build a decision-complete implementation plan with interfaces, failure modes, and acceptance criteria."
triggers: ["plan", "spec", "design", "roadmap", "acceptance"]
---
# Plan Workflow

## When to use
Use this when execution needs a stable specification.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `plan-writing`, `architecture-designer`
- Supporting skills (optional): `feature-forge`, `api-designer`

## Workflow steps
1. Lock scope and non-goals.
2. Define architecture, boundaries, and data flow.
3. Specify interfaces and validation rules.
4. Document failure modes and mitigations.
5. Define tests and release acceptance criteria.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Implementation phases
- API/data/interface details
- Edge cases and risk matrix
- Verification and rollout checklist
