---
command: "/refactor"
description: "Improve maintainability while preserving behavior through incremental safe refactoring."
triggers: ["refactor", "cleanup", "maintainability", "debt", "modularize"]
---
# Refactor Workflow

## When to use
Use this for design improvement without intentional behavior changes.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `refactor`, `legacy-modernizer`
- Supporting skills (optional): `architecture-designer`, `code-reviewer`

## Workflow steps
1. Define behavior invariants and guardrails.
2. Isolate refactor slices with low coupling.
3. Apply changes incrementally with tests.
4. Confirm behavior parity and performance baseline.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Refactor scope and invariants
- Structural changes
- Behavior parity evidence
- Deferred technical debt items
