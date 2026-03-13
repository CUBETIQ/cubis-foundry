````markdown
---
inclusion: manual
name: sre-engineer
description: Apply site reliability engineering practices including SLOs, error budgets, capacity planning, chaos engineering, and incident management for production systems.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# SRE Engineer

## Purpose

Apply Site Reliability Engineering practices to build and maintain reliable production systems. Define service level objectives, manage error budgets, plan capacity, and establish operational excellence.

## When to Use

- Defining SLOs, SLIs, and SLAs for a new or existing service
- Managing error budgets and reliability trade-offs
- Capacity planning and scaling decisions
- Designing for graceful degradation and resilience
- Conducting chaos engineering experiments
- Building on-call procedures and runbooks
- Postmortem analysis and reliability improvements

## Instructions

### Step 1 — Define Service Level Indicators (SLIs)

SLIs are the metrics that matter to users:

| SLI Category | Measures                        | Example                                  |
| ------------ | ------------------------------- | ---------------------------------------- |
| Availability | System is accepting requests    | Successful requests / total requests     |
| Latency      | Response time for good requests | p99 < 300ms                              |
| Throughput   | System handles expected load    | Requests/sec at peak without degradation |
| Correctness  | Responses are accurate          | Successful data validations / total      |
| Freshness    | Data is up to date              | Time since last successful sync < 1 min  |

**Choose 3–5 SLIs per service** — too many dilutes focus.

### Step 2 — Set Service Level Objectives (SLOs)

SLOs are targets for SLIs:

```
Availability SLO: 99.9% of requests succeed (43.8 min downtime/month)
Latency SLO: 99% of requests complete in < 200ms
```

**SLO calibration**:
| Target | Monthly Downtime | Error Budget |
|--------|-----------------|--------------|
| 99.0% | 7.3 hours | 1% of requests can fail |
| 99.9% | 43.8 minutes | 0.1% of requests can fail |
| 99.95% | 21.9 minutes | 0.05% of requests can fail |
| 99.99% | 4.3 minutes | 0.01% of requests can fail |

**Rules**:

- SLO must be achievable with current architecture
- SLO must be measurable with existing instrumentation
- SLO should be tighter than the SLA (contract with users)
- Start conservative, tighten as reliability improves

### Step 3 — Manage Error Budgets

Error budget = 100% − SLO target

**When budget is healthy** (> 50% remaining):

- Ship features aggressively
- Run chaos experiments
- Take on technical debt reduction

**When budget is burning** (< 25% remaining):

- Slow down feature releases
- Prioritize reliability work
- Increase review rigor

**When budget is exhausted** (0%):

- Freeze non-critical changes
- All engineering effort on reliability
- Root cause analysis on budget-burning incidents

### Step 4 — Design for Resilience

**Failure modes and mitigations**:

| Failure               | Mitigation                                              |
| --------------------- | ------------------------------------------------------- |
| Single instance crash | Multiple replicas, health checks, auto-restart          |
| Dependency timeout    | Circuit breakers, timeouts, fallback responses          |
| Traffic spike         | Auto-scaling, rate limiting, load shedding              |
| Data center outage    | Multi-region deployment, DNS failover                   |
| Data corruption       | Immutable audit logs, point-in-time recovery, checksums |
| Cascading failure     | Bulkheads, retry budgets, backpressure                  |

**Graceful degradation**:

- Serve cached/stale data when the database is slow
- Disable non-critical features under load
- Return partial results instead of failing completely
- Queue work for later processing when at capacity

### Step 5 — Operational Readiness

**Production readiness checklist**:

- [ ] SLOs defined and dashboarded
- [ ] Alerting on SLO burn rate (not just raw metrics)
- [ ] Runbooks for every alert
- [ ] On-call rotation established
- [ ] Rollback procedure documented and tested
- [ ] Disaster recovery plan tested within last quarter
- [ ] Dependency failures handled (circuit breakers, timeouts)
- [ ] Load testing performed at 2x expected peak

## Output Format

```
## Reliability Assessment
[current state and risk level]

## SLO Definitions
[SLI → SLO mappings with error budgets]

## Recommendations
[priority-ordered reliability improvements]

## Operational Procedures
[runbooks, on-call procedures, escalation paths]
```

## Examples

**User**: "Define SLOs for our payment processing API"

**Response approach**: High-reliability target (99.99% availability for financial operations). SLIs: availability, latency (p99 < 500ms), correctness (transaction accuracy). Error budget: 4.3 min/month. Alerting on 1-hour burn rate. Circuit breaker on downstream payment provider.

**User**: "Our service keeps going down during traffic spikes"

**Response approach**: Analyze the failure mode (OOM? connection pool exhaustion? cold starts?). Recommend auto-scaling with pre-warming, rate limiting per client, load shedding for non-critical endpoints. Define SLO for acceptable degradation under load.
````
