---
command: "/refactor"
description: "Improve maintainability while preserving behavior through incremental safe refactoring."
triggers: ["refactor", "cleanup", "maintainability", "debt", "modularize"]
---
# Refactor Workflow

# CHANGED: routing — added explicit refactor ownership and regression support — prevents fallback routing and makes the preservation strategy clear.
# CHANGED: output contract — converted free-form bullets into structured YAML — makes invariant and parity reporting machine-readable.

## When to use
Use this for design improvement without intentional behavior changes.

## Routing
- Primary specialist: `@code-archaeologist`
- Domain implementation support: `@backend-specialist`
- Regression verification: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Supporting skills (optional): `skill-creator`
- Refactors should stay anchored to the dominant language in scope. Use `skill-creator` only when refactoring skill packages, generators, or mirror wiring.

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
```yaml
REFACTOR_WORKFLOW_RESULT:
  primary_agent: code-archaeologist
  supporting_agents: [backend-specialist?, test-engineer?]
  primary_skills: [refactor, legacy-modernizer]
  supporting_skills: [architecture-designer?, code-reviewer?]
  scope:
    summary: <string>
    invariants: [<string>]
  structural_changes: [<string>]
  behavior_parity_evidence: [<command or test>]
  deferred_technical_debt: [<string>] | []
  next_handoff:
    plan_handoff: <PLAN_HANDOFF|null>
```
