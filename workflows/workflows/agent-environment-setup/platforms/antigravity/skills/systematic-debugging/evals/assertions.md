# Systematic Debugging -- Eval Assertions

## Eval 001: Root Cause Analysis for Intermittent Null Pointer

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `reproduce` | The response must start by establishing reliable reproduction steps under load, since intermittent bugs cannot be verified as fixed without consistent reproduction. |
| 2 | contains | `hypothesis` | The response must form a specific, falsifiable hypothesis (e.g., race condition in cache initialization) rather than making random changes. |
| 3 | contains | `why` | The response must apply the Five Whys or equivalent root cause analysis to go beyond the symptom (null return) to the systemic cause. |
| 4 | contains | `thread` | The response must investigate thread safety and concurrent access as a primary suspect, given the "only under load" trigger condition. |
| 5 | contains | `regression test` | The response must recommend a regression test that verifies the fix under concurrent conditions to prevent recurrence. |

### What a Passing Response Looks Like

A passing response conducts a structured investigation that:
- Establishes reproduction by generating 100+ concurrent requests to the endpoint.
- Forms a hypothesis about why `ConcurrentHashMap.get()` returns null under load (e.g., cache is being cleared and repopulated, or a race condition during initialization).
- Applies the Five Whys: null return -> cache miss -> cache was cleared -> background refresh job -> no synchronization on refresh.
- Recommends adding strategic logging at cache read/write points.
- Proposes a fix (e.g., copy-on-write pattern, read-write lock) with a concurrent regression test.
- Suggests checking for similar unsynchronized shared state elsewhere in the codebase.

---

## Eval 002: Systematic Bisection for Deployment Regression

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `bisect` | The response must recommend git bisect or equivalent binary search to efficiently narrow 47 commits to the responsible one. |
| 2 | contains | `good` | The response must define clear good/bad criteria based on measurable response time (e.g., good = <200ms, bad = >500ms). |
| 3 | contains | `skip` | The response must address how to handle untestable commits (e.g., migration-only commits) using git bisect skip or manual workarounds. |
| 4 | contains | `log` | The response must reference logarithmic efficiency (log2(47) ~ 6 steps) or suggest using logging/measurement to evaluate each step. |
| 5 | contains | `automat` | The response must recommend automating the bisection with a test script for consistent, reproducible evaluation at each step. |

### What a Passing Response Looks Like

A passing response designs a bisection strategy that:
- Uses `git bisect start` with the bad commit (v2.4.0) and good commit (v2.3.0 or last known good).
- Defines good/bad criteria: response time under 200ms = good, over 500ms = bad.
- Creates an automated test script that measures p95 latency and exits with 0 (good) or 1 (bad).
- Handles untestable commits (e.g., partial migrations) with `git bisect skip`.
- Estimates ~6 steps to find the culprit (log2(47)).
- Recommends running the benchmark multiple times at each step to avoid noise.
- After finding the commit, performs root cause analysis on the specific change.
