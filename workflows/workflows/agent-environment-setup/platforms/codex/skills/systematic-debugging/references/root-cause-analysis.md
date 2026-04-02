# Root Cause Analysis

## The Five Whys Technique

The Five Whys is an iterative questioning technique that drills from a surface symptom to the underlying systemic cause. The name suggests five iterations, but the actual number varies -- stop when you reach a cause that is actionable and systemic.

### How to Apply

1. Start with the observable problem statement.
2. Ask "Why did this happen?"
3. For each answer, ask "Why?" again.
4. Continue until you reach a systemic cause (a process, design, or organizational issue).
5. Verify each "because" statement with evidence, not assumptions.

### Example: Production Outage

```
Problem: Users received 500 errors for 15 minutes.

Why 1: Why did users receive 500 errors?
  Because the API server returned Internal Server Error on all requests.

Why 2: Why did the API server return errors?
  Because the database connection pool was exhausted.

Why 3: Why was the connection pool exhausted?
  Because a new feature introduced a query that held connections for 30+ seconds.

Why 4: Why did the query hold connections for 30 seconds?
  Because it performed a full table scan on a 50M row table without an index.

Why 5: Why was there no index?
  Because the PR review did not include a query plan check for new database queries.

Root Cause: No query plan review requirement in the PR review checklist.
Action: Add "EXPLAIN ANALYZE for new queries" to the PR review template.
```

### Common Pitfalls

| Pitfall | Example | Fix |
|---------|---------|-----|
| Stopping too early | "The server crashed because of a bug" | Keep asking why: what caused the bug? |
| Blaming people | "Because Bob wrote bad code" | Focus on process: why did the review not catch it? |
| Unsupported answers | "Because the network is flaky" | Verify with evidence: logs, metrics, packet captures |
| Single branch | Only exploring one causal path | Consider multiple contributing causes |

## Fault Tree Analysis

For complex incidents with multiple contributing factors, use a fault tree. The top event is the failure. Below it, arrange contributing causes as AND/OR gates.

```
                    [Production Outage]
                          |
                    [AND: both required]
                    /              \
        [Slow Query]          [No Circuit Breaker]
            |                        |
    [Missing Index]          [Not Implemented]
            |                        |
    [No Review Check]        [Not in Requirements]
```

**AND gates:** All child events must occur for the parent to happen.
**OR gates:** Any child event can cause the parent.

Fault trees are especially useful for incidents where "this shouldn't have caused an outage" -- the tree reveals which safety nets were missing.

## Ishikawa (Fishbone) Diagram

Organize potential causes into categories:

```
People --------+
               |
Process -------+-------> [Defect]
               |
Technology ----+
               |
Environment ---+
```

### Categories for Software Defects

| Category | Common Causes |
|----------|--------------|
| **Code** | Logic errors, missing validation, race conditions, off-by-one |
| **Configuration** | Wrong environment variable, missing feature flag, incorrect threshold |
| **Infrastructure** | Network partition, disk full, certificate expired, DNS failure |
| **Data** | Corrupted records, schema mismatch, encoding issues, stale cache |
| **Dependencies** | Library bug, API change, version incompatibility |
| **Process** | Missing review, inadequate testing, deployment without canary |

## Evidence-Based Root Cause

### The Evidence Chain

Every root cause claim must be supported by evidence:

```
Claim: The cache returns stale data after TTL expiry.

Evidence needed:
1. Log entry showing cache hit after TTL should have expired.
2. Cache configuration showing TTL value.
3. Timestamp comparison: entry creation time + TTL < current time.
4. Code review showing TTL is not enforced on read.
```

If any link in the evidence chain is missing, the root cause is unverified.

### Differential Diagnosis

Borrowed from medicine: list all plausible causes, then systematically eliminate them.

```markdown
## Differential Diagnosis: Intermittent 503 Errors

| Hypothesis | Evidence For | Evidence Against | Status |
|-----------|-------------|-----------------|--------|
| Database overload | Slow query log spike | DB CPU at 30% | Unlikely |
| Memory leak | RSS growing over time | No OOM kills | Possible |
| Rate limiting | Errors correlate with traffic | Rate limiter disabled | Eliminated |
| DNS resolution failure | Errors from specific pod | Other pods also affected | Eliminated |
| Thread pool exhaustion | Thread dump shows waiting | Pool metrics show headroom | Unlikely |
| Upstream service timeout | Error logs show timeout | Upstream metrics normal | **Confirmed** |
```

Eliminate hypotheses with evidence, not assumptions.

## Root Cause vs. Contributing Factors

A single incident usually has:
- **Root cause:** The primary trigger that initiated the failure chain.
- **Contributing factors:** Conditions that allowed the failure to escalate or persist.

```
Root cause: A deployment included an unindexed query.
Contributing factors:
  - No circuit breaker on the database connection pool.
  - Alerting threshold was set too high (triggered after 10 minutes).
  - On-call engineer was in a meeting with notifications silenced.
```

Fix the root cause to prevent recurrence. Fix contributing factors to reduce blast radius.

## Documenting Root Cause Analysis

### Standard Format

```markdown
## Root Cause Analysis

### Problem Statement
[Clear, specific description of the defect or incident]

### Impact
[Users affected, duration, severity]

### Timeline
| Time | Event |
|------|-------|
| 14:00 | Deployment of v2.5.0 |
| 14:15 | First error alert triggered |
| 14:20 | Investigation started |
| 14:35 | Root cause identified |
| 14:40 | Fix deployed |
| 14:42 | Error rate returned to normal |

### Five Whys
1. Why: [Symptom] -> [Proximate cause]
2. Why: [Proximate cause] -> [Deeper cause]
3. Why: [Deeper cause] -> [Root cause]

### Root Cause
[One sentence describing the systemic issue]

### Contributing Factors
1. [Factor 1]
2. [Factor 2]

### Corrective Actions
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Fix the bug] | Dev team | Immediate | Done |
| [Add missing test] | Dev team | This sprint | TODO |
| [Update review checklist] | Lead | This week | TODO |
| [Add monitoring alert] | SRE | This sprint | TODO |
```

## Prevention Hierarchy

After identifying a root cause, apply prevention measures in order of effectiveness:

| Level | Type | Example | Effectiveness |
|-------|------|---------|--------------|
| 1 | **Eliminate** | Remove the vulnerable code path entirely | Highest |
| 2 | **Prevent** | Type system constraint makes the bug impossible | High |
| 3 | **Detect** | Automated test catches the bug before deploy | Medium |
| 4 | **Mitigate** | Circuit breaker limits blast radius | Medium |
| 5 | **Monitor** | Alert fires when the symptom appears | Low |
| 6 | **Document** | Runbook describes how to fix when it recurs | Lowest |

Always aim for level 1-3. Levels 4-6 are supplementary, not sufficient on their own.
