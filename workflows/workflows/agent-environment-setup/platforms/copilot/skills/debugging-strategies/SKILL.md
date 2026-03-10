---
name: debugging-strategies
description: "Use when isolating bugs, regressions, flaky tests, or cross-layer failures with an evidence-first reproduce, narrow, verify workflow."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Debugging Strategies

## Purpose

Use when isolating bugs, regressions, flaky tests, or cross-layer failures with an evidence-first reproduce, narrow, verify workflow.

## When to Use

- Reproducing and isolating a bug, regression, intermittent failure, or flaky test.
- Narrowing a problem that crosses frontend, backend, database, or deployment boundaries.
- Designing the smallest safe fix and the right regression proof.
- Turning vague failure reports into a concrete root-cause investigation plan.

## Instructions

1. Lock down reproduction steps and expected-versus-actual behavior before changing code.
2. Narrow the fault domain with logs, traces, feature flags, bisecting, or minimal reproductions.
3. Instrument only enough to prove the hypothesis.
4. Fix the smallest confirmed cause, not the loudest symptom.
5. Leave behind regression proof and a short explanation of why the bug existed.

### Baseline standards

- Prefer evidence over intuition and one-variable changes over bundle fixes.
- Separate symptom, trigger, root cause, and prevention.
- Use the strongest artifact available: trace, stack, query plan, diff, or deterministic reproduction.
- Check adjacent surfaces for the same class of bug after the first fix lands.
- Remove temporary debugging code once the regression proof exists.

### Constraints

- Avoid making multiple speculative changes before you can reproduce the issue.
- Avoid treating flaky behavior as random when a hidden dependency probably exists.
- Avoid patching over production bugs with retries or timeouts before understanding the failure.
- Avoid closing the bug without a clear verification path.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/reproduce-isolate-verify-checklist.md` | You need a deeper checklist for reproduction, narrowing the fault domain, instrumenting safely, regression-proofing, or handling flaky and cross-layer failures. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with debugging strategies best practices in this project"
- "Review my debugging strategies implementation for issues"
