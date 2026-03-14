# CI Integration for Performance Tests

## Why Automate Performance Testing in CI

Manual performance testing happens sporadically, misses regressions, and delays feedback. Automated performance testing in CI:

- Catches regressions on the same day they are introduced.
- Provides objective pass/fail criteria for every PR.
- Creates a historical record of performance over time.
- Removes the "we'll test performance later" anti-pattern.

## Integration Strategies

### Tier 1: Microbenchmarks on Every PR

Run lightweight benchmarks (< 2 minutes) on every pull request. These catch algorithmic regressions and allocation changes.

```yaml
# .github/workflows/benchmark.yml
name: Benchmarks
on: [pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run bench -- --reporter=json > bench-results.json
      - uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: bench-results.json
          alert-threshold: '115%'
          comment-on-alert: true
          fail-on-alert: true
```

### Tier 2: Load Tests on Merge to Main

Run full load tests (5-15 minutes) when code merges to main. These catch throughput and latency regressions under realistic load.

```yaml
name: Load Test
on:
  push:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start application
        run: |
          docker compose -f docker-compose.test.yml up -d
          ./scripts/wait-for-healthy.sh http://localhost:3000/health 30

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/baseline.js
          flags: --out json=results.json

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results-${{ github.sha }}
          path: results.json

      - name: Check thresholds
        run: |
          python scripts/check-performance-thresholds.py results.json
```

### Tier 3: Soak Tests on Schedule

Run extended tests (1-4 hours) on a schedule to detect slow leaks and degradation.

```yaml
name: Soak Test
on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM

jobs:
  soak-test:
    runs-on: [self-hosted, performance]
    timeout-minutes: 300
    steps:
      - uses: actions/checkout@v4
      - name: Deploy test environment
        run: ./scripts/deploy-perf-env.sh
      - name: Run 4-hour soak test
        run: k6 run --duration 4h --vus 100 load-tests/soak.js
      - name: Analyze results
        run: python scripts/analyze-soak.py
      - name: Notify on failure
        if: failure()
        run: ./scripts/notify-slack.sh "Soak test failed"
```

## Baseline Management

### Storage Options

| Option | Pros | Cons |
|--------|------|------|
| CI artifacts | Simple, built-in | Limited retention, no querying |
| Git repository | Version controlled, transparent | Bloats repo with data files |
| Database (InfluxDB, PostgreSQL) | Queryable, scalable | Extra infrastructure |
| Cloud service (Grafana Cloud, Datadog) | Visualization, alerting built-in | Cost, vendor dependency |

### Baseline Update Strategy

```
PR opened:
  1. Fetch baseline from main branch.
  2. Run benchmarks on PR branch.
  3. Compare PR results vs. baseline.
  4. Report diff in PR comment.
  5. Fail if regression exceeds threshold.

PR merged to main:
  1. Run benchmarks on updated main.
  2. Store results as the new baseline.
```

### Handling Baseline Drift

When infrastructure changes (CI runner specs, Docker images, dependencies) cause baseline shifts:

1. Acknowledge the shift and document the cause.
2. Re-establish the baseline from the current main branch.
3. Record the reset event so historical comparisons account for it.

## Threshold Configuration

### Static Thresholds

Fixed values based on SLOs:

```javascript
// k6 thresholds
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### Relative Thresholds

Compare against baseline with a tolerance margin:

```python
# scripts/check-performance-thresholds.py
RELATIVE_THRESHOLD = 0.15  # 15% degradation allowed

baseline_p95 = load_baseline()['p95_ms']
current_p95 = load_current()['p95_ms']

change = (current_p95 - baseline_p95) / baseline_p95
if change > RELATIVE_THRESHOLD:
    print(f"REGRESSION: p95 increased by {change * 100:.1f}%")
    sys.exit(1)
```

### Adaptive Thresholds

Use statistical methods to account for measurement variance:

```python
import numpy as np

baseline_runs = [142, 138, 145, 139, 141]  # Historical p95 values
current_p95 = 165

mean = np.mean(baseline_runs)
std = np.std(baseline_runs)

# Flag if current exceeds mean + 3 standard deviations
threshold = mean + 3 * std
if current_p95 > threshold:
    print(f"REGRESSION: {current_p95}ms exceeds threshold {threshold:.1f}ms")
```

## Reporting

### PR Comments

Post a structured summary on every PR:

```markdown
## Performance Report

| Metric | Baseline | Current | Change | Status |
|--------|----------|---------|--------|--------|
| p50 Latency | 45ms | 48ms | +6.7% | PASS |
| p95 Latency | 120ms | 118ms | -1.7% | PASS |
| p99 Latency | 350ms | 410ms | +17.1% | FAIL |
| Throughput | 850 rps | 820 rps | -3.5% | PASS |
| Error Rate | 0.02% | 0.03% | +50% | PASS |

**1 threshold violated.** p99 latency regression exceeds 15% threshold.
```

### Trend Dashboards

Track metrics over time using Grafana, Datadog, or custom charts:

```
p95 Latency Over Last 30 Days
  |
  |     *
  |   *   *
  |  *     *  *
  | *       **  *****
  |*                  *****
  +-------------------------> commits
  Jan 15        Feb 15        Mar 14
```

Trend lines reveal gradual degradation that single-point comparisons miss.

## CI Runner Considerations

### Dedicated Performance Runners

General-purpose CI runners share resources with other jobs. For reliable benchmarks:

- Use self-hosted runners with dedicated hardware.
- Or use CI service tiers with guaranteed resources.
- Never benchmark on shared runners without acknowledging the variance.

### Runner Specification Locking

Document and lock the runner specification:

```yaml
# Label your performance runner
runs-on: [self-hosted, perf-runner, linux-4cpu-16gb]
```

If runner specs change, re-establish the baseline.

### Warm-Up and Cooldown

```yaml
- name: Warm up application
  run: k6 run --duration 1m --vus 10 load-tests/warmup.js

- name: Run benchmark (measurements start here)
  run: k6 run load-tests/benchmark.js

- name: Cooldown
  run: sleep 10  # Let system stabilize before teardown
```

## Flaky Performance Tests

Performance tests are inherently noisier than functional tests. Reduce flakiness by:

1. **Multiple runs** -- Take the median of 3-5 runs instead of a single measurement.
2. **Wider thresholds** -- Allow 15-20% margin for CI noise. Tighter thresholds cause too many false alarms.
3. **Exclude outliers** -- Discard the highest and lowest measurements (trimmed mean).
4. **Consistent environment** -- Same runner, same OS, same Docker images.
5. **Stable test data** -- Use deterministic data generation with fixed seeds.
