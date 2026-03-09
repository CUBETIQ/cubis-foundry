---
name: "debugging-strategies"
description: "Use when isolating bugs, regressions, flaky tests, or cross-layer failures with an evidence-first reproduce, narrow, verify workflow."
license: MIT
metadata:
  version: "1.0.0"
  domain: "quality"
  role: "specialist"
  stack: "cross-stack"
  category: "workflow-specialists"
  layer: "workflow-specialists"
  canonical: true
  maturity: "stable"
  baseline: "evidence-first debugging across browser, service, and data paths"
  tags: ["debugging", "bugs", "triage", "root-cause", "regression", "flaky-tests", "investigation"]
---

# Debugging Strategies

## When to use

- Reproducing and isolating a bug, regression, intermittent failure, or flaky test.
- Narrowing a problem that crosses frontend, backend, database, or deployment boundaries.
- Designing the smallest safe fix and the right regression proof.
- Turning vague failure reports into a concrete root-cause investigation plan.

## When not to use

- Building new features where no failure is being investigated.
- Pure testing strategy work where the issue is missing coverage rather than an active bug.
- Security review where exploitability assessment is primary.

## Core workflow

1. Lock down reproduction steps and expected-versus-actual behavior before changing code.
2. Narrow the fault domain with logs, traces, feature flags, bisecting, or minimal reproductions.
3. Instrument only enough to prove the hypothesis.
4. Fix the smallest confirmed cause, not the loudest symptom.
5. Leave behind regression proof and a short explanation of why the bug existed.

## Baseline standards

- Prefer evidence over intuition and one-variable changes over bundle fixes.
- Separate symptom, trigger, root cause, and prevention.
- Use the strongest artifact available: trace, stack, query plan, diff, or deterministic reproduction.
- Check adjacent surfaces for the same class of bug after the first fix lands.
- Remove temporary debugging code once the regression proof exists.

## Avoid

- Making multiple speculative changes before you can reproduce the issue.
- Treating flaky behavior as random when a hidden dependency probably exists.
- Patching over production bugs with retries or timeouts before understanding the failure.
- Closing the bug without a clear verification path.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/reproduce-isolate-verify-checklist.md` | You need a deeper checklist for reproduction, narrowing the fault domain, instrumenting safely, regression-proofing, or handling flaky and cross-layer failures. |
