# Reliability

## Failure Modes

In distributed systems, partial failure is the normal state. Design for five categories:

| Failure mode | Example | Mitigation |
|-------------|---------|------------|
| **Crash failure** | Server process dies | Health checks, auto-restart, redundant instances |
| **Omission failure** | Network packet dropped, response never arrives | Timeouts, retries |
| **Timing failure** | Response arrives but too late | Deadlines, circuit breakers |
| **Response failure** | Response arrives but is incorrect | Input validation, checksums, idempotency |
| **Byzantine failure** | Node behaves arbitrarily (corruption, compromise) | Consensus protocols, checksums, authentication |

## Retry Strategies

### Exponential Backoff with Jitter

```
attempt 1: wait 1s   + random(0, 500ms)
attempt 2: wait 2s   + random(0, 500ms)
attempt 3: wait 4s   + random(0, 500ms)
attempt 4: wait 8s   + random(0, 500ms)
attempt 5: wait 16s  + random(0, 500ms)  ← max backoff cap
```

**Jitter is critical.** Without jitter, all clients that failed at the same time retry at the same time, creating a thundering herd. Full jitter randomizes the entire wait interval.

### Retry Configuration

| Parameter | Recommendation | Why |
|-----------|---------------|-----|
| Max retries | 3-5 | Beyond 5, the service is likely down, not transiently failing |
| Initial interval | 100ms-1s | Depends on expected transient failure duration |
| Max interval | 15-30s | Beyond 30s, the request is stale |
| Backoff multiplier | 2x | Doubles wait time per attempt |
| Jitter | Full jitter (0 to max interval) | Prevents synchronized retries |
| Retry conditions | 5xx errors, timeouts, connection refused | Never retry 4xx (client errors) |

### Idempotency for Safe Retries

Retries are only safe if the operation is idempotent. For non-idempotent operations:

1. Client generates a unique `Idempotency-Key` (UUID v7).
2. Server stores the key and result on first execution.
3. On retry with the same key, server returns the stored result without re-executing.

## Circuit Breaker

The circuit breaker prevents cascading failures by stopping calls to a failing service:

```
States:
  CLOSED  → Normal operation. Requests pass through. Track failure rate.
  OPEN    → Service is failing. Reject immediately. Return fallback.
  HALF-OPEN → After timeout, allow one probe request. If it succeeds → CLOSED. If it fails → OPEN.

Thresholds:
  Failure rate to OPEN:     50% in last 60 seconds (minimum 10 requests)
  Open duration:            30 seconds before trying HALF-OPEN
  Successes to CLOSE:       3 consecutive successes in HALF-OPEN
```

### Configuration Guidelines

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Failure threshold | 50% | Allows for some transient errors without tripping |
| Minimum requests | 10 | Prevents tripping on low-traffic services |
| Open timeout | 30s | Long enough for transient issues to resolve |
| Half-open successes | 3 | Confirms recovery is stable, not a fluke |
| Monitored exceptions | Timeouts, 5xx, connection errors | Not 4xx (client errors are not service failures) |

## Bulkhead Pattern

Isolate failure domains so that a problem in one component cannot consume all resources:

```
Thread pool bulkheads:
  Payment service calls:    dedicated pool (20 threads)
  Inventory service calls:  dedicated pool (20 threads)
  Notification calls:       dedicated pool (10 threads)
  Default pool:             remaining threads

If the payment service hangs, it exhausts its 20-thread pool
but inventory and notification continue operating normally.
```

Implementation approaches:
- **Thread pool isolation:** Separate thread/goroutine pools per downstream service.
- **Semaphore isolation:** Limit concurrent requests per downstream with a semaphore (lower overhead).
- **Process isolation:** Run critical services in separate processes/containers.

## Graceful Degradation

Design the system to shed non-critical functionality under load:

| Load level | Behavior |
|-----------|----------|
| Normal | Full functionality, all features active |
| Elevated | Disable recommendation engine, serve cached suggestions |
| High | Disable search autocomplete, simplify UI, reduce image quality |
| Critical | Read-only mode, disable writes except critical paths (checkout) |
| Emergency | Static maintenance page, queue requests for replay |

Degradation must be:
- **Automated:** Triggered by metrics (CPU > 80%, error rate > 5%, latency p99 > 2s)
- **Reversible:** When metrics recover, restore full functionality automatically
- **Visible:** Dashboard shows current degradation level, affected features, and restore conditions

## Timeouts

### Timeout Hierarchy

```
Client-side timeout:     10s (total request budget)
  └── Load balancer:     8s (slightly less than client)
       └── API gateway:  6s (slightly less than LB)
            └── Service: 4s (internal deadline)
                 └── DB: 2s (query timeout)
```

Each layer has a shorter timeout than its caller. This ensures the caller receives a timeout error (which it can handle) rather than the connection hanging indefinitely.

### Deadline Propagation

Pass remaining deadline through the call chain:

```
Client sends request with deadline: now + 10s
  → API gateway receives, remaining: 9.5s, sets own deadline: 8s
    → Service receives, remaining: 7s, sets own deadline: 5s
      → DB query: remaining: 3s, sets timeout: 2s
```

If remaining deadline < minimum required time, fail fast without attempting the call.

## Chaos Engineering

Proactively inject failures to verify resilience:

| Experiment | What it tests | Tools |
|-----------|---------------|-------|
| Kill random instances | Auto-recovery, health checks, load balancer detection | Chaos Monkey, `kill -9` |
| Add network latency | Timeout handling, circuit breakers | tc netem, Toxiproxy |
| Partition network | Split-brain handling, CAP behavior | iptables rules, Blockade |
| Fill disk | Graceful handling of storage exhaustion | dd, stress-ng |
| Exhaust connections | Connection pool limits, backpressure | Custom load generator |
| Clock skew | Timestamp-dependent logic, certificate validation | `faketime`, NTP manipulation |

### Principles

1. **Start in staging.** Do not run chaos experiments in production until you have high confidence in staging.
2. **Have a hypothesis.** "We believe that killing one of three replicas will not cause errors visible to users."
3. **Blast radius control.** Affect a small percentage of traffic first.
4. **Abort conditions.** Auto-stop if error rate exceeds threshold.
5. **Game days.** Schedule periodic team exercises to practice incident response.

## SLOs, SLIs, and Error Budgets

| Term | Definition | Example |
|------|-----------|---------|
| **SLI** (Indicator) | The metric being measured | Latency p99, error rate, availability |
| **SLO** (Objective) | The target for the SLI | p99 latency < 200ms, availability > 99.9% |
| **SLA** (Agreement) | The contractual promise (with consequences) | 99.9% uptime, credit for breaches |
| **Error budget** | The allowed failure margin | 0.1% = 43.8 min/month of downtime |

### Setting SLOs

| SLO | Monthly budget | Weekly budget |
|-----|---------------|---------------|
| 99% | 7.3 hours | 1.7 hours |
| 99.5% | 3.6 hours | 50 minutes |
| 99.9% | 43.8 minutes | 10 minutes |
| 99.95% | 21.9 minutes | 5 minutes |
| 99.99% | 4.4 minutes | 1 minute |

Rules:
- Set SLOs based on user expectations, not engineering ambition.
- Track error budget consumption in real time.
- When error budget is exhausted, freeze feature development and focus on reliability.
- Review and adjust SLOs quarterly based on actual performance and user feedback.
