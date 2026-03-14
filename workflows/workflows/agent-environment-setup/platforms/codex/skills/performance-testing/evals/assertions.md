# Performance Testing -- Eval Assertions

## Eval 001: Load Test Scenario Design for E-Commerce Checkout

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `ramp` | The response must define a ramp-up pattern that gradually increases load from normal (50 users) to flash-sale levels (500 users), revealing the degradation threshold. |
| 2 | contains | `SLO` | The response must define specific Service Level Objectives with quantitative thresholds (e.g., p95 < 500ms, error rate < 1%) as pass/fail criteria. |
| 3 | contains | `percentile` | The response must measure latency at meaningful percentiles (p50, p90, p95, p99) rather than relying on averages that hide tail latency. |
| 4 | contains | `CPU` | The response must include resource monitoring for CPU, memory, or other infrastructure metrics alongside request-level measurements. |
| 5 | contains | `scenario` | The response must model realistic user scenarios with sequential steps (browse, cart, checkout, payment) and think times between actions. |

### What a Passing Response Looks Like

A passing response designs a load test that:
- Models the checkout flow as a multi-step scenario: browse -> add to cart -> checkout -> payment.
- Defines a ramp-up from 50 to 500 concurrent users over a reasonable period (e.g., 5-10 minutes).
- Sets SLOs for p95 latency, throughput, and error rate with specific numeric targets.
- Reports latency at p50, p90, p95, and p99 percentiles.
- Monitors server-side CPU, memory, and connection pool usage during the test.
- Includes think times between steps to simulate real user behavior.

---

## Eval 002: Performance Regression Detection in CI

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `baseline` | The response must describe a baseline management strategy for storing historical benchmark results and comparing against them. |
| 2 | contains | `threshold` | The response must define regression thresholds (e.g., >10% degradation) that trigger build failures to prevent slow merges. |
| 3 | contains | `CI` | The response must integrate into the CI pipeline (GitHub Actions or equivalent) to run automatically on every PR. |
| 4 | contains | `compar` | The response must describe how current benchmark results are compared against stored baselines using statistical or threshold methods. |
| 5 | contains | `alert` | The response must include alerting or notification when a regression is detected so the team can act immediately. |

### What a Passing Response Looks Like

A passing response designs a regression detection system that:
- Stores baseline benchmark results in a persistent location (artifact storage, git, or database).
- Runs a standardized benchmark suite on every PR in GitHub Actions.
- Compares PR results against the baseline using a configurable threshold (e.g., 10% degradation = failure).
- Fails the build and posts a comment on the PR when regression is detected.
- Updates the baseline when a PR merges to main, keeping the reference current.
- Handles statistical noise through multiple runs or confidence intervals.
