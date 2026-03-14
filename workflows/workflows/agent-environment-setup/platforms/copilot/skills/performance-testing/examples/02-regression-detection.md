# Example: Automated Performance Regression Detection in CI

## Context

A team's API has been getting slower over months. They need an automated system in GitHub Actions that benchmarks every PR and blocks merges that degrade performance beyond a threshold.

## User Prompt

> Our REST API's latency keeps creeping up but we only notice when users complain. Set up automated performance regression detection in our GitHub Actions pipeline. When a PR makes things slower by more than 15%, it should fail the check and comment on the PR.

## Skill Response

### Architecture Overview

```
PR Opened
  -> GitHub Actions triggers benchmark job
  -> Run standardized benchmark suite against PR branch
  -> Fetch baseline results from main branch artifact
  -> Compare PR results vs. baseline
  -> If regression > 15%: fail check + comment on PR
  -> If merge to main: store new baseline
```

### Benchmark Script

```python
# benchmarks/api_benchmark.py
"""Standardized API benchmark suite.
Runs against a local server instance and outputs JSON results.
"""
import json
import time
import statistics
import subprocess
import sys
import requests

ENDPOINTS = [
    {"name": "GET /api/users", "method": "GET", "path": "/api/users?limit=20"},
    {"name": "GET /api/users/:id", "method": "GET", "path": "/api/users/1"},
    {"name": "POST /api/users", "method": "POST", "path": "/api/users",
     "body": {"name": "Bench User", "email": "bench@test.com"}},
    {"name": "GET /api/products", "method": "GET", "path": "/api/products?limit=50"},
]

ITERATIONS = 100
WARMUP_ITERATIONS = 10
BASE_URL = "http://localhost:3000"


def run_benchmark(endpoint: dict) -> dict:
    """Run a single endpoint benchmark, return latency statistics."""
    latencies = []

    # Warm-up: discard these results
    for _ in range(WARMUP_ITERATIONS):
        if endpoint["method"] == "GET":
            requests.get(f"{BASE_URL}{endpoint['path']}")
        else:
            requests.post(f"{BASE_URL}{endpoint['path']}",
                         json=endpoint.get("body"))

    # Measured runs
    for _ in range(ITERATIONS):
        start = time.perf_counter()
        if endpoint["method"] == "GET":
            resp = requests.get(f"{BASE_URL}{endpoint['path']}")
        else:
            resp = requests.post(f"{BASE_URL}{endpoint['path']}",
                               json=endpoint.get("body"))
        elapsed_ms = (time.perf_counter() - start) * 1000
        latencies.append(elapsed_ms)

    latencies.sort()
    return {
        "name": endpoint["name"],
        "iterations": ITERATIONS,
        "p50_ms": round(latencies[ITERATIONS // 2], 2),
        "p95_ms": round(latencies[int(ITERATIONS * 0.95)], 2),
        "p99_ms": round(latencies[int(ITERATIONS * 0.99)], 2),
        "avg_ms": round(statistics.mean(latencies), 2),
        "stddev_ms": round(statistics.stdev(latencies), 2),
    }


def main():
    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "commit": subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"]
        ).decode().strip(),
        "benchmarks": [],
    }

    for endpoint in ENDPOINTS:
        print(f"Benchmarking {endpoint['name']}...")
        result = run_benchmark(endpoint)
        results["benchmarks"].append(result)
        print(f"  p50={result['p50_ms']}ms  p95={result['p95_ms']}ms")

    output_path = "benchmarks/results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nResults written to {output_path}")
    return results


if __name__ == "__main__":
    main()
```

### Regression Comparator

```python
# benchmarks/compare_results.py
"""Compare PR benchmark results against baseline.
Exit code 1 if regression exceeds threshold.
"""
import json
import sys
import os

REGRESSION_THRESHOLD = 0.15  # 15%


def compare(baseline_path: str, current_path: str) -> dict:
    with open(baseline_path) as f:
        baseline = json.load(f)
    with open(current_path) as f:
        current = json.load(f)

    baseline_map = {b["name"]: b for b in baseline["benchmarks"]}
    report = {"regressions": [], "improvements": [], "unchanged": []}

    for bench in current["benchmarks"]:
        name = bench["name"]
        if name not in baseline_map:
            continue

        base_p95 = baseline_map[name]["p95_ms"]
        curr_p95 = bench["p95_ms"]
        change_pct = (curr_p95 - base_p95) / base_p95

        entry = {
            "name": name,
            "baseline_p95_ms": base_p95,
            "current_p95_ms": curr_p95,
            "change_pct": round(change_pct * 100, 1),
        }

        if change_pct > REGRESSION_THRESHOLD:
            report["regressions"].append(entry)
        elif change_pct < -REGRESSION_THRESHOLD:
            report["improvements"].append(entry)
        else:
            report["unchanged"].append(entry)

    return report


def format_markdown(report: dict) -> str:
    lines = ["## Performance Benchmark Results\n"]

    if report["regressions"]:
        lines.append("### Regressions Detected\n")
        lines.append("| Endpoint | Baseline p95 | Current p95 | Change |")
        lines.append("|----------|-------------|-------------|--------|")
        for r in report["regressions"]:
            lines.append(
                f"| {r['name']} | {r['baseline_p95_ms']}ms "
                f"| {r['current_p95_ms']}ms | +{r['change_pct']}% |"
            )
        lines.append("")

    if report["improvements"]:
        lines.append("### Improvements\n")
        lines.append("| Endpoint | Baseline p95 | Current p95 | Change |")
        lines.append("|----------|-------------|-------------|--------|")
        for r in report["improvements"]:
            lines.append(
                f"| {r['name']} | {r['baseline_p95_ms']}ms "
                f"| {r['current_p95_ms']}ms | {r['change_pct']}% |"
            )
        lines.append("")

    if report["unchanged"]:
        lines.append("### Within Threshold (< 15% change)\n")
        for r in report["unchanged"]:
            lines.append(f"- {r['name']}: {r['change_pct']}%")

    return "\n".join(lines)


def main():
    baseline_path = sys.argv[1]
    current_path = sys.argv[2]

    report = compare(baseline_path, current_path)
    markdown = format_markdown(report)

    # Write markdown for PR comment
    with open("benchmarks/comparison.md", "w") as f:
        f.write(markdown)

    print(markdown)

    # Exit with failure if regressions found
    if report["regressions"]:
        print(f"\nFAILED: {len(report['regressions'])} regression(s) exceed "
              f"{REGRESSION_THRESHOLD * 100}% threshold")
        sys.exit(1)
    else:
        print("\nPASSED: No regressions detected")
        sys.exit(0)


if __name__ == "__main__":
    main()
```

### GitHub Actions Workflow

```yaml
# .github/workflows/performance-check.yml
name: Performance Regression Check
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]  # Update baseline on merge

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm ci
          pip install requests

      - name: Start server
        run: npm run start:test &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: |
          for i in $(seq 1 30); do
            curl -s http://localhost:3000/health && break
            sleep 1
          done

      - name: Run benchmarks
        run: python benchmarks/api_benchmark.py

      # On PR: compare against baseline
      - name: Download baseline
        if: github.event_name == 'pull_request'
        uses: actions/download-artifact@v4
        with:
          name: benchmark-baseline
          path: benchmarks/baseline/
        continue-on-error: true  # First run has no baseline

      - name: Compare results
        if: github.event_name == 'pull_request'
        id: compare
        run: |
          if [ -f benchmarks/baseline/results.json ]; then
            python benchmarks/compare_results.py \
              benchmarks/baseline/results.json \
              benchmarks/results.json
          else
            echo "No baseline found. Skipping comparison."
          fi

      - name: Comment on PR
        if: github.event_name == 'pull_request' && always()
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: benchmarks/comparison.md

      # On main merge: store new baseline
      - name: Upload baseline
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-baseline
          path: benchmarks/results.json
          retention-days: 90

      - name: Alert on regression
        if: failure() && github.event_name == 'pull_request'
        run: |
          echo "Performance regression detected. See PR comment for details."
          echo "Review the benchmark comparison before merging."
```

### Sample PR Comment Output

```markdown
## Performance Benchmark Results

### Regressions Detected

| Endpoint | Baseline p95 | Current p95 | Change |
|----------|-------------|-------------|--------|
| GET /api/users | 45.2ms | 67.8ms | +50.0% |

### Within Threshold (< 15% change)
- GET /api/users/:id: +3.2%
- POST /api/users: -1.8%
- GET /api/products: +7.1%
```

### Key Design Decisions

1. **15% threshold** -- Accounts for benchmark noise while catching meaningful regressions. Adjust based on measurement stability.
2. **p95 as comparison metric** -- More stable than p99, more meaningful than average.
3. **Warm-up discarded** -- Eliminates JIT and cache cold-start from results.
4. **100 iterations** -- Enough for statistical stability without making CI too slow.
5. **Baseline stored as artifact** -- Simple, no external service needed. Updates on every merge to main.
