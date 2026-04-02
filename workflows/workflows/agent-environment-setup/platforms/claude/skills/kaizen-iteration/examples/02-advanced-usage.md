# Example: Quarterly Improvement Plan with DORA Metrics

## Context

An engineering manager wants to create a quarterly improvement plan based on the team's DORA metrics. The team has been tracking metrics for 6 months and has two quarters of data. Previous improvement experiments are documented in the improvement backlog.

## User Prompt

> Create a quarterly improvement plan. Here are our DORA metrics:
>
> Q3: Deployment frequency: 1/week, Lead time: 12 days, Change failure rate: 25%, MTTR: 8 hours
> Q4: Deployment frequency: 2/week, Lead time: 8 days, Change failure rate: 22%, MTTR: 6 hours
>
> Previous experiments:
> - KZ-001: CI parallelization (Q4) -- Adopted. Reduced lead time from 12 to 8 days.
> - KZ-002: Pre-merge automated tests (Q4) -- Adopted. Reduced change failure rate from 25% to 22%.
> - KZ-003: Daily standups shortened to 10 min (Q4) -- Discarded. No measurable impact on any metric.
>
> Design the Q1 improvement plan with at most 3 experiments.

## Skill Response

### Metrics Baseline and Trend Analysis

| Metric | Q3 | Q4 | Delta | Industry Median | Gap |
|--------|----|----|-------|-----------------|-----|
| Deployment frequency | 1/week | 2/week | +100% | 1/week | Above median |
| Lead time for changes | 12 days | 8 days | -33% | 1 week | At median |
| Change failure rate | 25% | 22% | -12% | 15% | 7 points above |
| MTTR | 8 hours | 6 hours | -25% | 1 hour | 6x above median |

### What the Data Tells Us

1. **Deployment frequency is strong.** The team deploys 2x/week, above the industry median. No experiment needed here.

2. **Lead time improved significantly** thanks to KZ-001 (CI parallelization). Now at industry median. Maintain, do not optimize further unless it regresses.

3. **Change failure rate improved modestly** from 25% to 22% with KZ-002 (automated tests). Still 7 points above median. The improvement trend is positive but slow.

4. **MTTR is the critical gap.** At 6 hours vs. 1-hour median, this is the largest relative gap (6x). MTTR also compounds with change failure rate -- every failed deployment costs 6 hours of recovery.

### Combined Impact Model

```
Current cost of failures per week:
  2 deployments x 22% failure rate x 6 hours MTTR = 2.64 hours/week lost

If MTTR drops to 2 hours:
  2 x 22% x 2 = 0.88 hours/week lost  (savings: 1.76 hours/week)

If change failure rate drops to 15%:
  2 x 15% x 6 = 1.8 hours/week lost   (savings: 0.84 hours/week)

MTTR improvement has 2x the impact of failure rate improvement.
```

### Q1 Improvement Experiments

#### Experiment 1: Incident Runbooks (Priority: Highest)

| Field | Value |
|-------|-------|
| **Hypothesis** | If we create runbooks for the top 5 incident types and practice them in tabletop exercises, then MTTR will decrease from 6 hours to 2 hours. |
| **Owner** | @carol (on-call lead) |
| **Metric** | Mean time to recovery (measured from PagerDuty) |
| **Baseline** | 6 hours (Q4 average) |
| **Target** | 2 hours |
| **Timebox** | 6 weeks (mid-quarter checkpoint) |
| **Activities** | 1. Analyze Q4 incidents to identify top 5 types. 2. Write runbook for each. 3. Run 2 tabletop exercises. 4. Measure MTTR weekly. |
| **Success criteria** | MTTR < 3 hours for 3 consecutive weeks |

#### Experiment 2: Contract Testing for API Changes (Priority: High)

| Field | Value |
|-------|-------|
| **Hypothesis** | If we add contract tests between frontend and backend services, then change failure rate will decrease from 22% to 15% because 60% of our Q4 production bugs were API contract violations. |
| **Owner** | @bob (backend lead) |
| **Metric** | Change failure rate (measured from deployment logs) |
| **Baseline** | 22% (Q4) |
| **Target** | 15% (industry median) |
| **Timebox** | Full quarter (12 weeks) |
| **Activities** | 1. Audit Q4 failures to confirm API contract root cause. 2. Set up Pact or similar tool. 3. Add contract tests for top 3 API surfaces. 4. Track failure rate weekly. |
| **Success criteria** | Change failure rate < 18% by mid-quarter, < 15% by end of quarter |

#### Experiment 3: Post-Incident Learning Reviews (Priority: Medium)

| Field | Value |
|-------|-------|
| **Hypothesis** | If we conduct a 30-minute blameless learning review after every production incident, then we will identify and fix systemic issues that reduce both change failure rate and MTTR. |
| **Owner** | @alice (engineering manager) |
| **Metric** | Number of repeat incident types (same root cause) |
| **Baseline** | 3 repeat incidents in Q4 |
| **Target** | 0 repeat incidents in Q1 |
| **Timebox** | Full quarter (12 weeks) |
| **Activities** | 1. Define review template. 2. Conduct review within 48 hours of each incident. 3. Track action items from reviews. 4. Track repeat incidents. |
| **Success criteria** | Zero incidents with the same root cause as a previous incident |

### Improvement Backlog (Updated)

| ID | Improvement | Status | Impact |
|----|------------|--------|--------|
| KZ-001 | CI parallelization | Adopted (Q4) | Lead time -33% |
| KZ-002 | Pre-merge automated tests | Adopted (Q4) | CFR -12% |
| KZ-003 | 10-min standups | Discarded (Q4) | No impact |
| KZ-004 | Incident runbooks | **Experimenting (Q1)** | Target: MTTR -67% |
| KZ-005 | Contract testing | **Experimenting (Q1)** | Target: CFR -32% |
| KZ-006 | Post-incident reviews | **Experimenting (Q1)** | Target: 0 repeats |

### Quarterly Review Checkpoints

- **Week 6:** Mid-quarter check. Evaluate KZ-004 (runbooks). Decision: adopt/extend/discard.
- **Week 12:** End-of-quarter retrospective. Evaluate all 3 experiments. Update metrics table. Plan Q2.
