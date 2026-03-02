---
command: "/create"
description: "Implement feature work with minimal blast radius and clear verification checkpoints."
triggers: ["create", "build", "implement", "feature", "develop"]
---
# Create Workflow

## When to use
Use this for net-new implementation after design is stable.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `feature-forge`, `architecture-designer`
- Supporting skills (optional): `lint-and-validate`, `test-master`

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
- Changed components/files
- Behavioral impact
- Test evidence
- Follow-up items
