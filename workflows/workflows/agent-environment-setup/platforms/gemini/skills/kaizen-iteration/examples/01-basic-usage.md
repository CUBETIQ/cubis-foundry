# Example: Running a Sprint Retrospective

## Context

A 4-person engineering team just completed a 2-week sprint. They shipped 2 of 3 planned features and had one production incident. The team lead wants to run a structured retrospective.

## User Prompt

> Run a retrospective for our sprint. Team feedback: Alice says code reviews take too long and block her PRs for days. Bob says the design specs were incomplete, causing him to guess at edge cases. Carol says the deployment pipeline is flaky and she had to retry 4 times on Tuesday. Dan says the sprint planning overcommitted -- we planned 3 features but only shipped 2.

## Skill Response

### Categorized Observations

| # | Team Member | Observation | Category | Impact |
|---|------------|------------|----------|--------|
| 1 | Alice | Code reviews block PRs for days | Process | High |
| 2 | Bob | Design specs incomplete, guessing at edge cases | Communication | High |
| 3 | Carol | Deployment pipeline flaky, 4 retries | Tooling | Medium |
| 4 | Dan | Sprint overcommitted: 3 planned, 2 shipped | Process | High |

### Pattern Analysis

Two observations relate to **process** (code review delays and overcommitment). One relates to **communication** (spec quality). One relates to **tooling** (pipeline reliability). The process category has the highest concentration, suggesting systemic process issues.

### Root Cause Analysis: Code Review Delays

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why do code reviews take days? | Reviewers are busy with their own feature work. |
| 2 | Why are reviewers too busy? | Everyone is assigned to feature work during the sprint. |
| 3 | Why is there no dedicated review time? | Sprint planning does not allocate capacity for reviews. |
| 4 | Why doesn't planning include review capacity? | We plan based on feature output, not total work including reviews. |
| 5 | **Root cause:** | Sprint capacity planning does not account for review workload, creating an implicit backlog. |

### Root Cause Analysis: Sprint Overcommitment

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why did we plan 3 features but only ship 2? | The third feature took longer than estimated. |
| 2 | Why was the estimate wrong? | We didn't account for the incomplete design spec (Bob's feedback). |
| 3 | Why was the spec incomplete? | Design review happened before all edge cases were identified. |
| 4 | Why were edge cases not identified earlier? | No technical review of specs before sprint planning. |
| 5 | **Root cause:** | Specs enter sprint planning without technical review, causing hidden complexity that inflates estimates. |

### Improvement Experiments

| # | Hypothesis | Owner | Metric | Timebox |
|---|-----------|-------|--------|---------|
| 1 | If we reserve 20% of sprint capacity for code review, then average PR review time will drop from 4 days to 1 day. | Alice | Average PR review time (measured in Jira/GitHub) | 2 sprints |
| 2 | If we add a 30-minute technical spec review before sprint planning, then story point accuracy will improve from 67% to 85%. | Bob | Planned vs. delivered story points | 2 sprints |

### Next Steps

1. Alice tracks PR review time starting next sprint.
2. Bob schedules technical spec review for next sprint planning.
3. Revisit both experiments at the retrospective after 2 sprints.
4. Carol's pipeline issue goes into the engineering backlog as a tech debt item (not an experiment -- it is a bug fix).
