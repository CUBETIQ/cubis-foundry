---
name: debug
description: "Isolate root cause quickly, apply the smallest safe remediation, and leave behind regression evidence."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "debug"
  platform: "Claude Code"
  command: "/debug"
compatibility: Claude Code
---
# debug Workflow
# Debug Workflow

## When to use

Use this when behavior is failing, inconsistent, flaky, or only reproducible under certain conditions.

## Routing

- Primary specialist: `@debugger`
- Domain implementation support: `@backend-specialist`, `@frontend-specialist`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach stack traces, request IDs, traces, repro steps, recent diffs, and environment notes when context is incomplete.

## Skill Routing

- Primary skills: `debugging-strategies`, `error-ux-observability`
- Supporting skills (optional): `testing-patterns`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `webapp-testing`, `playwright-e2e`, `skill-creator`
- Start with `debugging-strategies` for reproduce, isolate, instrument, and verify flow. Add `error-ux-observability` when the failure involves error states, logging, or tracing gaps. Add the dominant language skill for exact code-path analysis, `webapp-testing` or `playwright-e2e` when the failure lives in browser or release verification.

## Workflow steps

1. Reproduce the issue and record expected versus actual behavior.
2. Narrow the fault domain with the smallest useful evidence.
3. Fix the confirmed cause with the lowest regression risk.
4. Add or update the regression proof.
5. Document any remaining uncertainty or environment-specific gaps.

## Verification

- Re-run the failing scenario first.
- Run focused regression checks on adjacent high-risk paths.
- Call out any remaining gaps if the full environment could not be reproduced.

## Output Contract

```yaml
DEBUG_WORKFLOW_RESULT:
  primary_agent: debugger
  supporting_agents: [backend-specialist?, frontend-specialist?, test-engineer?]
  primary_skills: [debugging-strategies, error-ux-observability]
  supporting_skills: [testing-patterns?, <language-skill>?, webapp-testing?, playwright-e2e?]
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