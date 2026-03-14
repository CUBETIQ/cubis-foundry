---
name: systematic-debugging
description: "Systematic debugging methodology covering root cause analysis, bisection, logging strategies, debugger workflows, and post-mortem documentation. Use when diagnosing complex or elusive bugs."
---
# Systematic Debugging Methodology

## Purpose

Provide a disciplined, evidence-based framework for diagnosing and resolving software defects. This skill replaces ad-hoc "change and pray" debugging with a structured process that converges on root causes efficiently, documents findings for the team, and prevents recurrence through post-mortem analysis.

## When to Use

- A bug report cannot be explained by reading the code.
- A defect reproduces intermittently or under specific conditions.
- Multiple developers have attempted a fix without success.
- A production incident requires rapid, methodical diagnosis.
- A regression appeared but the responsible commit is unknown.
- The system behaves differently across environments.
- A post-mortem is needed to prevent recurrence.
- Debugging requires coordinating across multiple services or teams.

## Instructions

1. **Reproduce the defect reliably before investigating** -- Write down exact steps, inputs, and environment conditions that trigger the bug. Without a reliable reproduction, you cannot verify that a fix actually works.

2. **Collect and preserve all available evidence** -- Gather logs, stack traces, error messages, screenshots, and metrics from the time of the failure. Evidence degrades over time as logs rotate and state changes.

3. **Form a falsifiable hypothesis** -- State a specific, testable explanation for the bug (e.g., "The null pointer occurs because the cache returns stale entries after TTL expiry"). Vague hypotheses like "something is wrong with caching" cannot be tested.

4. **Use bisection to narrow the search space** -- Apply git bisect or manual binary search to identify the exact commit, configuration change, or input that introduced the defect. Bisection converges in O(log n) steps instead of linear scanning.

5. **Add strategic logging at boundaries** -- Insert log statements at function entry/exit, external calls, and decision points. Strategic logging reveals the actual execution path without the overhead of stepping through every line.

6. **Use a debugger for state inspection, not navigation** -- Set breakpoints at the suspected failure point and inspect variable state. Stepping through large codebases line-by-line is slow; jump directly to where the evidence points.

7. **Verify each hypothesis with a controlled experiment** -- Change one variable at a time and observe the result. Changing multiple things simultaneously makes it impossible to determine which change was effective.

8. **Trace data flow end-to-end** -- Follow the input from its origin through every transformation to the point of failure. Data corruption bugs often originate far upstream from where they manifest.

9. **Check environmental differences systematically** -- Compare OS versions, library versions, configuration files, environment variables, and network topology between working and broken environments. "Works on my machine" bugs are almost always environmental.

10. **Apply the Five Whys to reach root cause** -- Ask "why" iteratively until you reach a systemic cause, not just the proximate trigger. Fixing symptoms without addressing root causes guarantees recurrence.

11. **Write a regression test before applying the fix** -- Create a test that fails with the current code and passes with the fix. The regression test proves the fix is correct and prevents the bug from returning.

12. **Review the fix for secondary effects** -- Check that the fix does not break other functionality, introduce new edge cases, or degrade performance. Fixes under pressure often create new bugs.

13. **Search for similar patterns in the codebase** -- After identifying the root cause, search for the same pattern elsewhere. If the bug exists in one place, it likely exists in analogous code.

14. **Document the investigation in a post-mortem** -- Record the timeline, root cause, fix, impact, and prevention measures. Post-mortems convert individual debugging knowledge into organizational learning.

15. **Identify and implement prevention measures** -- Add linting rules, type constraints, monitoring alerts, or architectural guards that make the bug class impossible or immediately detectable. Prevention is cheaper than repeated debugging.

16. **Update runbooks and monitoring** -- Add the failure signature to monitoring dashboards and update operational runbooks with diagnosis steps. The next occurrence should be detected automatically and diagnosed in minutes, not hours.

## Output Format

```markdown
## Debugging Report

### Defect Summary
- **Title:** <concise description>
- **Severity:** Critical / High / Medium / Low
- **Environment:** <where it occurs>
- **Reproduction Rate:** Always / Intermittent (<percentage>)

### Reproduction Steps
1. <exact step>
2. <exact step>
3. **Expected:** <what should happen>
4. **Actual:** <what happens instead>

### Investigation Timeline
| Step | Action | Finding |
|------|--------|---------|
| 1    | ...    | ...     |
| 2    | ...    | ...     |

### Root Cause Analysis (Five Whys)
1. **Why** did <symptom> occur? Because <reason>.
2. **Why** did <reason> occur? Because <deeper reason>.
3. **Why** did <deeper reason> occur? Because <root cause>.

### Fix
- **Commit:** <hash>
- **Change:** <description>
- **Regression Test:** <test name>

### Prevention Measures
| Measure              | Type            | Status      |
|---------------------|----------------|-------------|
| ...                 | Lint rule / Monitor / Guard | Implemented / TODO |

### Post-Mortem
- **Impact:** <users affected, duration>
- **Detection:** <how it was found>
- **Resolution Time:** <from detection to fix>
- **Lessons Learned:** <1-3 takeaways>
```

## References

| Topic                | File                                    | Load When                                      |
|----------------------|-----------------------------------------|-------------------------------------------------|
| Root Cause Analysis  | `references/root-cause-analysis.md`     | Applying Five Whys and fault tree analysis      |
| Bisection            | `references/bisection.md`               | Using git bisect and binary search strategies   |
| Logging Strategies   | `references/logging-strategies.md`      | Adding diagnostic logging without noise         |
| Debugger Workflows   | `references/debugger-workflows.md`      | Using breakpoints, watches, and stepping        |
| Post-Mortem          | `references/post-mortem.md`             | Writing incident post-mortems and prevention    |

## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
