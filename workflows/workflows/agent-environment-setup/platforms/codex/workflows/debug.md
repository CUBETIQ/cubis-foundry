---
command: "/debug"
description: "Isolate root cause quickly, apply the smallest safe remediation, and leave behind regression evidence."
triggers: ["debug", "bug", "error", "incident", "stack trace"]
---

# Debug Workflow

## When to use

Use this when behavior is failing, inconsistent, flaky, or only reproducible under certain conditions.

## Routing

- Primary specialist: `the debugger posture`
- Domain implementation support: `the backend-specialist posture`, `the frontend-specialist posture`
- Verification support: `the test-engineer posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach stack traces, request IDs, traces, repro steps, recent diffs, and environment notes when context is incomplete.

## Skill Routing

- Primary skills: `systematic-debugging`, `observability`
- Supporting skills (optional): `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`, `csharp-best-practices`, `kotlin-best-practices`, `rust-best-practices`, `integration-testing`, `playwright-interactive`, `skill-creator`
- Start with `systematic-debugging` for reproduce, isolate, instrument, and verify flow. Add `observability` when the failure involves error states, logging, or tracing gaps. Add the dominant language skill for exact code-path analysis, `integration-testing` or `playwright-interactive` when the failure lives in browser or release verification.

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
  primary_skills: [systematic-debugging, observability]
  supporting_skills: [unit-testing?, <language-skill>?, integration-testing?, playwright-interactive?]
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

> **Codex note:** Prefer native Codex delegation when the host exposes it. Otherwise follow AGENTS.md specialist postures inline while keeping the same routing and verification contract.
