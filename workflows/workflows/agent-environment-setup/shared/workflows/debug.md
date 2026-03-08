---
command: "/debug"
description: "Isolate root cause quickly and apply the smallest safe remediation with verification."
triggers: ["debug", "bug", "error", "incident", "stack trace"]
---
# Debug Workflow

# CHANGED: routing — added explicit debug ownership and supporting specialists — prevents route manifest fallback to orchestrator during bug work.
# CHANGED: output contract — converted free-form bullets into structured YAML — makes root-cause handoff deterministic.

## When to use
Use this when behavior is failing or inconsistent.

## Routing
- Primary specialist: `@debugger`
- Domain implementation support: `@backend-specialist`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`
- Supporting skills (optional): `skill-creator`
- Pick the language skill that matches the failing path. Use `skill-creator` only when the bug is in a skill package or generator surface.

## Workflow steps
1. Reproduce issue and collect evidence.
2. Narrow fault domain and identify root cause.
3. Apply focused fix with low regression risk.
4. Verify resolution and monitor for recurrence.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
DEBUG_WORKFLOW_RESULT:
  primary_agent: debugger
  supporting_agents: [backend-specialist?, test-engineer?]
  primary_skills: [systematic-debugging, find-bugs]
  supporting_skills: [monitoring-expert?, error-ux-observability?]
  reproduction:
    steps: [<string>]
    expected_vs_actual: <string>
  root_cause: <string>
  remediation:
    summary: <string>
    changed_artifacts: [<path-or-artifact>]
  regression_checks: [<command or test>]
  follow_up_items: [<string>] | []
```
