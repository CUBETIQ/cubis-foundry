---
command: "/debug-fix"
description: "Systematic debugging from reproduction through root-cause analysis to verified fix with regression evidence."
triggers: ["debug-fix", "debug fix", "fix bug", "troubleshoot", "diagnose and fix"]
---

# Debug Fix Workflow

## Purpose

Combine fault isolation with verified remediation in a single pass. Unlike `/debug` (diagnosis-focused), this workflow carries through to a committed fix with regression proof and confirmation that the original symptom is resolved.

## When to use

Use this when a bug needs both diagnosis and a shipped fix in one workflow pass, especially when the fix must include regression tests.

## Routing

- Primary specialist: `@debugger`
- Implementation support: `@backend-specialist`, `@frontend-specialist`
- Regression support: `@test-engineer`
- Validation: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach stack traces, error logs, repro steps, recent diffs, environment details, and any hypotheses.

## Skill Routing

- Primary skills: `debugging-strategies`, `error-ux-observability`
- Supporting skills (optional): `testing-patterns`, `webapp-testing`, `playwright-e2e`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `rust-pro`, `static-analysis`
- Start with `debugging-strategies` for the reproduce-isolate-verify loop. Add `error-ux-observability` when failure involves logging or tracing gaps. Add the dominant language skill for code-path analysis. Add `testing-patterns` for regression test design.

## Steps

1. **Reproduce** — Confirm the bug with a minimal, reliable reproduction. Record expected versus actual behavior. `@debugger` owns.
2. **Isolate** — Narrow the fault domain using bisection, logging, or tracing. Identify the exact code path and conditions. `@debugger` owns.
3. **Root-cause** — Determine why the fault exists (not just where). Document the causal chain. `@debugger` owns.
4. **Fix** — Apply the smallest safe change that addresses the root cause. Prefer targeted fixes over broad refactors. `@backend-specialist` or `@frontend-specialist` owns.
5. **Regression test** — Write a test that fails before the fix and passes after. Cover the exact conditions from step 1. `@test-engineer` owns.
6. **Verify** — Re-run the original reproduction plus adjacent high-risk paths. Confirm no regressions introduced. `@validator` owns.
7. **Document** — Record root cause, fix rationale, and any remaining environmental gaps.

## Verification

- Original symptom no longer reproducible after fix.
- Regression test added and passing.
- Adjacent functionality verified with no new failures.
- Root cause documented for future reference.

## Agents Involved

- @debugger — reproduction, isolation, and root-cause analysis
- @backend-specialist — server-side fix implementation
- @frontend-specialist — client-side fix implementation
- @test-engineer — regression test design and execution
- @validator — final verification pass

## Output

```yaml
DEBUG_FIX_WORKFLOW_RESULT:
  primary_agent: debugger
  supporting_agents: [backend-specialist?, frontend-specialist?, test-engineer, validator]
  primary_skills: [debugging-strategies, error-ux-observability]
  supporting_skills: [testing-patterns, <language-skill>?, webapp-testing?, playwright-e2e?]
  reproduction:
    steps: [<string>]
    expected_vs_actual: <string>
    minimal_repro: <string>
  root_cause:
    description: <string>
    causal_chain: [<string>]
  fix:
    summary: <string>
    changed_artifacts: [<path-or-artifact>]
    risk_assessment: <string>
  regression:
    test_file: <path>
    test_name: <string>
    passes: true | false
  verification:
    original_symptom_resolved: true | false
    adjacent_checks: [<command-or-test>]
    gaps: [<string>] | []
  follow_up_items: [<string>] | []
```
