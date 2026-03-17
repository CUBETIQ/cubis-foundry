---
name: kaizen-iteration
description: "Use when running retrospectives, analyzing team metrics, performing root-cause analysis, and driving incremental process improvement."
---
# Kaizen Iteration

## Purpose

Provide a structured, metrics-driven framework for continuous improvement in software development workflows. This skill applies kaizen principles -- small, incremental improvements validated by measurement -- to engineering processes, code quality, team dynamics, and delivery performance. Every improvement is hypothesized, measured, and either adopted or discarded based on evidence.

## When to Use

- Running a sprint or project retrospective and need structured facilitation.
- Analyzing team velocity, cycle time, or defect rate trends to find improvement opportunities.
- Investigating recurring problems that have not been resolved by ad-hoc fixes.
- Establishing metrics baselines for a new team or project.
- Designing experiments to test process changes before committing to them.
- Evaluating whether a previously adopted improvement is still delivering value.
- Preparing a quarterly improvement plan with measurable goals.
- Coaching team members on root cause analysis techniques.

## Instructions

1. **Establish a metrics baseline before proposing any change** -- Measure current state with quantitative data (cycle time, defect escape rate, deployment frequency, change failure rate). Without a baseline, you cannot determine whether an improvement actually improved anything.

2. **Classify observations into categories before analyzing** -- Sort retrospective observations into: process, tooling, communication, technical debt, and external dependencies. Categories reveal systemic patterns that individual observations miss.

3. **Use the 5 Whys technique for root cause analysis** -- For each significant problem, ask "why?" iteratively until you reach a root cause that is actionable. Surface symptoms are tempting to fix but will recur if the root cause remains unaddressed.

4. **Formulate improvements as testable hypotheses** -- State each improvement as "If we [change], then [metric] will improve by [amount] within [timeframe]." Hypothesis framing forces specificity and prevents vague commitments like "communicate better."

5. **Limit work-in-progress to one or two improvements per cycle** -- Attempting too many changes simultaneously makes it impossible to attribute metric changes to specific improvements. One change at a time creates clear cause-and-effect evidence.

6. **Assign a single owner to each improvement experiment** -- Shared ownership means no ownership. One person drives the experiment, tracks the metric, and reports results at the next retrospective.

7. **Set a timebox for every experiment** -- Every improvement gets a fixed evaluation period (typically one sprint or two weeks). At the end, decide: adopt permanently, extend the experiment, or discard. Open-ended experiments create process debt.

8. **Measure the outcome, not the activity** -- Track whether the improvement changed the target metric, not whether the team performed the improvement activities. A team can religiously follow a new process that produces zero metric improvement.

9. **Run a retrospective at the end of every iteration** -- Retrospectives are the feedback loop that makes kaizen work. Skipping them means improvements are never evaluated and failures are never learned from.

10. **Use a structured retrospective format** -- Apply Start-Stop-Continue, 4Ls (Liked, Learned, Lacked, Longed for), or Sailboat (wind, anchors, rocks, island) formats. Structured formats prevent retrospectives from becoming complaint sessions or status updates.

11. **Track the improvement backlog across iterations** -- Maintain a living list of identified improvements, their status (proposed, experimenting, adopted, discarded), and their measured impact. The backlog provides continuity between retrospectives.

12. **Celebrate measurable wins to sustain momentum** -- When an improvement demonstrably moves a metric, acknowledge it explicitly. Teams that see their improvements working continue to invest in the process.

13. **Revisit adopted improvements periodically** -- An improvement that worked six months ago may no longer be relevant. Schedule quarterly reviews of all adopted improvements to prune those that have outlived their usefulness.

14. **Distinguish between local and systemic improvements** -- Some improvements help one team but harm the organization (local optimization). Always check whether an improvement creates downstream problems before adopting it.

15. **Document the improvement journey, not just outcomes** -- Record what was tried, what was measured, what worked, and what did not. This institutional knowledge prevents future teams from re-running failed experiments.

## Output Format

```markdown
## Kaizen Iteration Report

### Metrics Baseline
| Metric | Current Value | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Cycle time | X days | Y days | Jira/Linear analytics |
| Defect escape rate | X% | Y% | Bug reports per release |

### Retrospective Findings
| Category | Observation | Impact | Frequency |
|----------|------------|--------|-----------|
| Process | ... | High/Medium/Low | Recurring/One-time |

### Root Cause Analysis
| Problem | Why 1 | Why 2 | Why 3 | Why 4 | Why 5 (Root Cause) |
|---------|-------|-------|-------|-------|---------------------|

### Improvement Experiments
| # | Hypothesis | Owner | Metric | Timebox | Status |
|---|-----------|-------|--------|---------|--------|
| 1 | If we [change], then [metric] improves by [amount] | @name | ... | 2 weeks | Proposed |

### Improvement Backlog
| ID | Improvement | Status | Impact (measured) |
|----|------------|--------|-------------------|
| KZ-001 | ... | Adopted | Cycle time -15% |
| KZ-002 | ... | Discarded | No measurable impact |
```

## References

| Topic                    | File                                     | Load When                                           |
|--------------------------|------------------------------------------|-----------------------------------------------------|
| Retrospective Formats    | `references/retrospective-formats.md`    | Facilitating a retrospective or choosing a format   |
| Metrics Framework        | `references/metrics-framework.md`        | Establishing baselines or selecting metrics         |
| Root Cause Analysis      | `references/root-cause-analysis.md`      | Investigating recurring problems or systemic issues |

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file: `.gemini/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
