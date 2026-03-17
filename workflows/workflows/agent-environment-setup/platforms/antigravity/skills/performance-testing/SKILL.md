---
name: performance-testing
description: "Performance testing and benchmarking covering load testing, stress testing, profiling, and bottleneck identification. Use when evaluating system performance or detecting regressions."
---
# Performance Testing and Benchmarking

## Purpose

Provide a systematic methodology for designing, executing, and interpreting performance tests that reveal throughput limits, latency characteristics, and resource bottlenecks. This skill ensures performance is measured objectively, regressions are detected early, and optimization efforts target the actual bottleneck rather than guesswork.

## When to Use

- Designing load test scenarios for a new feature or service.
- Establishing baseline performance metrics before optimization.
- Running stress tests to find the breaking point of a system.
- Profiling application code to identify CPU, memory, or I/O hotspots.
- Investigating a reported performance regression.
- Integrating performance benchmarks into CI/CD pipelines.
- Capacity planning for expected traffic growth.
- Validating that an optimization actually improved performance.

## Instructions

1. **Define performance objectives with SLOs** -- Establish quantitative targets (p50 < 200ms, p99 < 1s, throughput > 500 rps) before testing. Without targets, results are just numbers with no pass/fail criteria.

2. **Characterize the workload profile** -- Identify realistic user patterns, request distributions, and data volumes. Synthetic workloads that don't match production produce misleading results.

3. **Establish a baseline before changing anything** -- Record current performance metrics under controlled conditions. A baseline is the only way to measure whether a change helped, hurt, or had no effect.

4. **Design load tests with a ramp-up pattern** -- Gradually increase concurrent users or request rate rather than slamming full load instantly. Ramp-ups reveal the load level where degradation begins.

5. **Run stress tests beyond expected capacity** -- Push the system past its limits to discover failure modes, resource exhaustion points, and recovery behavior. Knowing the ceiling prevents surprise outages.

6. **Use representative test data** -- Populate databases with production-scale data volumes and distributions. Performance on empty tables or small datasets hides query plan issues and cache behavior.

7. **Profile before optimizing** -- Use CPU profilers, memory profilers, and tracing tools to find actual hotspots. Optimizing without profiling wastes effort on code paths that don't matter.

8. **Measure latency at meaningful percentiles** -- Report p50, p90, p95, and p99 latency, not just averages. Averages hide tail latency that affects real users.

9. **Isolate the variable under test** -- Change one thing at a time and measure the effect. Simultaneous changes make it impossible to attribute improvement or degradation to a specific cause.

10. **Monitor resource utilization during tests** -- Track CPU, memory, disk I/O, network, and connection pools alongside request metrics. Resource saturation explains why throughput plateaus or latency spikes.

11. **Account for warm-up effects** -- Discard initial measurements affected by JIT compilation, cache population, and connection pool initialization. Cold-start metrics don't represent steady-state performance.

12. **Automate benchmarks in CI/CD** -- Run a standardized benchmark suite on every commit or pull request. Automated benchmarks catch regressions before they reach production.

13. **Compare results statistically** -- Use multiple runs, confidence intervals, and statistical tests rather than single-run comparisons. A single run can be an outlier that leads to wrong conclusions.

14. **Test under realistic network conditions** -- Introduce representative latency, bandwidth limits, and packet loss for distributed systems. LAN-only testing hides performance issues that appear in production.

15. **Document findings with reproducible methodology** -- Record tool versions, configuration, environment specs, and exact commands. Undocumented benchmarks cannot be reproduced or trusted.

16. **Feed results back into capacity planning** -- Use test data to model resource requirements for projected growth. Performance testing without capacity planning leaves the team reactive instead of prepared.

## Output Format

```markdown
## Performance Test Report

### Objectives
| SLO Metric       | Target       | Result       | Status  |
|------------------|-------------|-------------|---------|
| p50 Latency      | < 200ms     | ...         | PASS/FAIL |
| p99 Latency      | < 1000ms    | ...         | PASS/FAIL |
| Throughput        | > 500 rps   | ...         | PASS/FAIL |
| Error Rate        | < 0.1%      | ...         | PASS/FAIL |

### Load Profile
- **Tool:** k6 / Artillery / JMeter / Locust
- **Duration:** <total time>
- **Ramp-up:** <pattern>
- **Peak Concurrent Users:** <number>

### Latency Distribution
| Percentile | Latency (ms) |
|-----------|-------------|
| p50       | ...         |
| p90       | ...         |
| p95       | ...         |
| p99       | ...         |

### Resource Utilization
| Resource    | Peak     | Average  | Saturation? |
|------------|---------|---------|-------------|
| CPU        | ...     | ...     | Yes/No      |
| Memory     | ...     | ...     | Yes/No      |
| Disk I/O   | ...     | ...     | Yes/No      |
| Network    | ...     | ...     | Yes/No      |

### Bottleneck Analysis
| Bottleneck       | Evidence              | Recommendation        |
|-----------------|----------------------|----------------------|
| ...             | ...                  | ...                  |

### Methodology
- **Environment:** <specs>
- **Data Volume:** <description>
- **Commands:** <exact commands to reproduce>
```

## References

| Topic                | File                                  | Load When                                        |
|----------------------|---------------------------------------|-------------------------------------------------|
| Load Testing         | `references/load-testing.md`          | Designing and running load test scenarios        |
| Profiling            | `references/profiling.md`             | Using CPU, memory, and I/O profilers             |
| Benchmarking         | `references/benchmarking.md`          | Writing and interpreting microbenchmarks          |
| Bottleneck Analysis  | `references/bottleneck-analysis.md`   | Identifying and resolving performance hotspots   |
| CI Integration       | `references/ci-integration.md`        | Automating performance tests in pipelines        |

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
