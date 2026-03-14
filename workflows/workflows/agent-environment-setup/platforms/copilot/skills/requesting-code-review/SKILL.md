---
name: requesting-code-review
description: "Use when preparing code for review, writing PR descriptions, selecting reviewers, structuring changes for easy review, or managing review timelines."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---
# Requesting Code Review

## Purpose

Maximize the value of every code review by preparing changes for easy, efficient review. This skill turns review requests from a passive "please look at my code" into a structured communication that gives reviewers the context they need to provide fast, high-quality feedback — reducing review cycles, minimizing back-and-forth, and shipping changes faster with fewer defects.

## When to Use

- Preparing a pull request for review and writing a clear, complete PR description
- Deciding who to assign as reviewers based on domain expertise and availability
- Structuring commits and file changes so reviewers can follow the logic progressively
- Managing review timelines when changes are urgent or blocking other work
- Determining whether to use draft PRs, stacked PRs, or ready-for-review workflows
- Adding self-review annotations and inline comments to reduce reviewer cognitive load

## Instructions

1. **Self-review before requesting** — walk through your own diff line by line before assigning reviewers, because catching obvious issues yourself (typos, debug logs, accidental file inclusions) prevents wasted reviewer cycles and builds trust that your PRs are worth reviewing carefully.

2. **Write clear PR descriptions with context** — include what changed, why it changed, how it was tested, and any risks or trade-offs, because reviewers who understand the intent behind changes give more relevant feedback and catch issues that a context-free review would miss.

3. **Keep PRs small and focused** — limit each PR to a single logical change (one feature, one bug fix, one refactor), because PRs over 400 lines get slower, shallower reviews with more missed defects, while PRs under 200 lines get reviewed 3x faster with higher-quality feedback.

4. **Add inline comments on tricky decisions** — annotate your own PR with comments on non-obvious choices, workarounds, and known complexity, because proactive explanation prevents reviewers from wasting time asking "why?" on decisions you can explain upfront.

5. **Select appropriate reviewers** — choose reviewers based on domain expertise, recent context with the affected code, and current workload, because assigning the right person gets you faster, more relevant feedback while assigning too many people diffuses responsibility.

6. **Provide context about testing approach** — describe what was tested, how it was tested (manual, unit, integration, E2E), and what was deliberately not tested and why, because reviewers who understand the testing approach can focus their review on untested areas and skip re-verifying covered paths.

7. **Highlight areas needing careful review** — explicitly call out the sections of your change that carry the most risk, complexity, or uncertainty, because directing reviewer attention to high-value areas produces better feedback than hoping they independently identify what matters most.

8. **Manage review timelines and urgency** — communicate the urgency level (blocking deployment, time-sensitive fix, routine feature) and desired review timeline, because reviewers prioritize based on perceived urgency and silent PRs sit at the bottom of the queue.

9. **Structure commits for progressive review** — organize commits in a logical sequence (refactor first, then feature, then tests) so reviewers can follow the evolution of the change, because commit-by-commit review reveals the reasoning behind the final diff better than reviewing the squashed result.

10. **Document known limitations** — explicitly state what this PR does not do, what technical debt it introduces, and what follow-up work is planned, because undocumented limitations become forgotten debt and reviewers who know the scope can evaluate completeness accurately.

11. **Include screenshots for UI changes** — add before/after screenshots, GIFs, or screen recordings for any user-facing visual changes, because reviewers cannot assess UI correctness from code alone and visual evidence eliminates an entire category of back-and-forth.

12. **Link related issues** — reference the issue, ticket, or discussion that motivated the change using closing keywords (Fixes #123, Closes #456), because traceability from PR to requirement enables reviewers to verify the change addresses the original problem and automates issue lifecycle.

13. **Use draft vs ready-for-review intentionally** — open a draft PR when you want early directional feedback on an incomplete approach, and mark ready-for-review only when the change is complete and self-reviewed, because mixing these signals wastes reviewer time on unfinished work or delays feedback on work that needs early course-correction.

14. **Set review expectations** — specify what kind of feedback you need (architecture direction, security audit, quick sanity check, full deep review), because reviewers who know the expected depth can calibrate their effort and provide the specific type of feedback you actually need.

## Output Format

When preparing a review request, provide:

1. **PR title** — concise summary of the change in imperative mood (under 72 characters)
2. **Description** — what changed, why, and how, structured with clear headings
3. **Testing summary** — what was tested, how, and what was not tested
4. **Risk assessment** — areas of highest risk or uncertainty that need careful review
5. **Reviewer recommendation** — who should review and why, with urgency level
6. **Review guidance** — what type of feedback is needed and any specific areas to focus on

## References

| File | Purpose |
|------|---------|
| `references/pr-description-patterns.md` | Templates and examples for writing effective PR descriptions across different change types |
| `references/reviewer-selection.md` | How to select the right reviewers based on expertise, workload, and change characteristics |
| `references/self-review-checklist.md` | Step-by-step checklist for self-reviewing your changes before requesting external review |

## Copilot Platform Notes

- Skill files are stored under `.github/prompts/` (prompt files) and `.github/instructions/` (instruction files).
- Copilot does not support subagent spawning — all skill guidance executes within the current conversation context.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context`, `agent`, and `allowed-tools` are not supported; guidance is advisory only.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
