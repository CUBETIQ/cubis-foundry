# Root Cause Analysis Reference

Load this when investigating recurring problems or systemic issues.

---

## The 5 Whys Technique

### How It Works

Ask "why?" iteratively until you reach a root cause that is actionable (typically 3-5 levels deep).

### Example

**Problem:** Production outage lasted 6 hours.

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why did the outage last 6 hours? | The on-call engineer could not find the failing service. |
| 2 | Why couldn't they find it? | There was no runbook or dashboard for the service. |
| 3 | Why was there no runbook? | The service was deployed without operational readiness review. |
| 4 | Why was the review skipped? | There is no deployment checklist that requires operational readiness. |
| 5 | **Root cause:** | The deployment process does not include an operational readiness gate. |

### Rules for Good 5 Whys

1. **Stay factual.** Each answer must be verifiable, not speculative.
2. **Avoid blame.** "Because Bob didn't do X" is not a root cause. "Because the process does not require X" is.
3. **Stop at actionable.** If the answer is "because physics" or "because that's how the framework works," you've gone too deep. Back up one level.
4. **Branch when needed.** Sometimes a "why" has multiple valid answers. Follow each branch to its own root cause.

---

## Fishbone (Ishikawa) Diagram

### When to Use Instead of 5 Whys

Use fishbone when the problem has multiple contributing factors and 5 Whys would oversimplify.

### Structure

```
                                    Problem
                                   /   |   \
                          People   Process   Technology
                         /    |    /    |    /    |
                   cause  cause  cause  cause  cause  cause
```

### Standard Categories (6M)

| Category | Covers |
|----------|--------|
| **Methods** | Processes, procedures, workflows |
| **Machines** | Tools, infrastructure, hardware |
| **Materials** | Data, dependencies, inputs |
| **Measurements** | Metrics, monitoring, observability |
| **Milieu** | Environment, culture, organizational context |
| **Manpower** | Skills, staffing, knowledge |

### Example

**Problem:** High change failure rate (22%).

```
                                    CFR 22%
                       /        /        \        \
              Methods      Machines     Materials    Measurements
             /    \        /    \         /   \        /    \
     No staging   Manual   Flaky CI   Shared    No spec   No smoke
     environment  deploys            test DB   review    tests
```

Root causes identified:
1. No staging environment for pre-production testing.
2. Manual deployment process allows human error.
3. Shared test database causes non-deterministic test results.

---

## Fault Tree Analysis

### When to Use

When you need to trace backward from a specific failure to all possible causes with logical AND/OR relationships.

### Structure

```
                    System Failure
                         |
                    [OR Gate]
                   /         \
           Cause A          Cause B
              |                |
         [AND Gate]       [OR Gate]
         /       \        /       \
    Sub-A1   Sub-A2   Sub-B1   Sub-B2
```

- **OR gate:** Failure occurs if ANY child is true.
- **AND gate:** Failure occurs only if ALL children are true.

### Example

```
             Production Data Loss
                    |
               [OR Gate]
              /         \
     Database failure   Human error
          |                |
     [AND Gate]       [OR Gate]
     /       \        /       \
  Disk      No     Wrong    No backup
  fails   replica  delete   verified
                   command
```

This analysis reveals: data loss requires EITHER (disk failure AND no replica) OR (human error via wrong command OR unverified backup). The cheapest fix is adding a replica (blocks the AND gate).

---

## Root Cause vs. Contributing Factor

| Concept | Definition | Test |
|---------|-----------|------|
| **Root cause** | The fundamental reason the problem exists | If eliminated, the problem cannot recur in this form |
| **Contributing factor** | Something that made the problem worse | If eliminated, the problem would still occur but with less impact |

**Example:**
- Root cause: No automated tests for the payment module.
- Contributing factor: The on-call engineer was new and unfamiliar with the service.

Fixing the root cause (adding tests) prevents the bug. Fixing the contributing factor (training the engineer) helps but doesn't prevent the underlying defect.

---

## From Root Cause to Improvement

Every root cause should produce an improvement experiment:

| Root Cause | Improvement Hypothesis | Metric |
|-----------|----------------------|--------|
| No deployment checklist | If we add a pre-deploy checklist, then change failure rate decreases by 30% | Change failure rate |
| No runbooks | If we create runbooks for top 5 incidents, then MTTR decreases by 50% | Mean time to recovery |
| Manual deploys | If we automate deployments, then deployment errors drop to near zero | Manual deploy error count |

---

## Anti-Patterns in Root Cause Analysis

### Stopping at the Symptom

"Why did the deployment fail?" -> "Because the config was wrong." STOP.

This is a symptom, not a root cause. Continue: Why was the config wrong? -> Because there's no config validation step in the pipeline.

### Blame as Root Cause

"The deployment failed because Alice made a mistake." This is blame, not analysis. Humans make mistakes; systems should catch them. Continue: Why did the system allow a misconfigured deployment?

### Single Root Cause Assumption

Complex failures rarely have a single root cause. Use fishbone or fault tree to identify multiple contributing causes. Address the highest-impact causes first.

### Analysis Paralysis

5 Whys should take 15-30 minutes, not hours. If the analysis exceeds 30 minutes, the problem is too broad. Split it into sub-problems and analyze each separately.
