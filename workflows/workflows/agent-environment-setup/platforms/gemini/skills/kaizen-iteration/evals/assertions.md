# Kaizen Iteration -- Eval Assertions

## Eval 001: Sprint Retrospective with Root Cause Analysis

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `root cause` | The response must perform root cause analysis, not just list problems. Surface-level observation without digging into causes produces ineffective improvements. |
| 2 | contains | `hypothesis` | The response must frame improvements as testable hypotheses because vague commitments like "improve communication" are unmeasurable and rarely lead to action. |
| 3 | contains | `metric` | The response must identify specific metrics to track improvement because without measurement, the team cannot determine whether the change worked. |
| 4 | contains | `owner` | The response must recommend assigning owners because shared ownership of improvements results in no ownership. |
| 5 | contains | `categor` | The response must categorize observations because patterns emerge from categories, not individual data points. |

### What a Passing Response Looks Like

A passing response:
- Categorizes all 5 observations into groups (process, tooling, quality, communication).
- Selects the top 2 issues based on impact (likely: production bugs and code review delays).
- Performs 5 Whys analysis on each, reaching actionable root causes.
- Proposes 1-2 improvement experiments with hypothesis, owner, metric, and timebox.
- Does not propose more than 2 experiments (WIP limit principle).
- Includes a format for tracking the experiment outcome at the next retrospective.

---

## Eval 002: Metrics-Driven Improvement Cycle

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `baseline` | The response must establish baseline values for each metric because improvements cannot be measured without a starting point. |
| 2 | contains | `recovery` | The response must identify MTTR as a key improvement area because at 6x the industry median, it represents the largest relative gap. |
| 3 | contains | `experiment` | The response must propose a structured experiment, not a general recommendation, because kaizen requires testable changes. |
| 4 | contains | `timebox` | The response must set a fixed evaluation period because open-ended experiments prevent evaluation and decision-making. |
| 5 | contains | `failure rate` | The response must address the change failure rate because it is above the industry median and likely contributes to the MTTR problem. |

### What a Passing Response Looks Like

A passing response:
- Presents all 4 DORA metrics with baseline values and industry comparison.
- Identifies MTTR (6 hours vs. 1 hour median) as the most impactful improvement opportunity.
- Notes the connection between change failure rate (22%) and MTTR.
- Designs an experiment with: specific change (e.g., implement runbook-based incident response), target metric (MTTR < 2 hours), timebox (4 weeks), owner, and success criteria.
- Includes a measurement plan for how to track the metric during the experiment.
- Recommends a follow-up analysis at the timebox boundary.
