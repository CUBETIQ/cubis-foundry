---
name: code-review
description: "Use when conducting code reviews, building review checklists, calibrating review depth, providing structured feedback, or establishing team review practices. Covers review methodology, feedback patterns, automated checks, and batch review strategies."
---
# Code Review

## Purpose

Elevate code review from a gatekeeping ritual into a high-value quality practice. This skill provides a systematic methodology for reviewing code at the right depth, delivering actionable feedback, and scaling review practices across teams without creating bottlenecks.

## When to Use

- Reviewing a pull request for correctness, security, performance, and maintainability
- Building or refining a code review checklist for a team or project
- Calibrating review depth based on change risk and size
- Writing review feedback that is specific, actionable, and constructive
- Conducting batch reviews when multiple PRs are queued
- Setting up automated review checks to reduce manual review burden
- Establishing team review practices, SLAs, and CODEOWNERS configuration
- Training new reviewers on effective review methodology
- Resolving disagreements during code review

## Instructions

1. **Read the PR description first** — understand the stated intent before reading code, because reviewing without context leads to irrelevant feedback and wasted cycles.
2. **Check the linked issue or spec** — verify that the PR actually solves the stated problem, because the most common review miss is code that works but does not address the requirement.
3. **Assess change risk** — classify the PR as low, medium, or high risk based on what it touches (data layer, auth, public API, infrastructure), because risk determines how deep the review should go.
4. **Start with architecture** — review the overall approach and file structure before line-level code, because catching a wrong approach early saves everyone from debating implementation details of a solution that should not exist.
5. **Check correctness systematically** — verify edge cases, error handling, null/undefined states, boundary values, and race conditions, because correctness bugs that reach production are 10x more expensive to fix.
6. **Evaluate security surface** — check for injection vectors, auth bypass, secret exposure, PII leaks, and unsafe deserialization, because security bugs caught in review are the cheapest to fix.
7. **Assess performance impact** — look for N+1 queries, unbounded loops, missing pagination, unnecessary re-renders, and unindexed queries, because performance issues compound silently until they become outages.
8. **Verify test coverage** — confirm that new behavior has tests, critical paths have assertions, and edge cases identified in steps 5-7 are covered, because untested code is code that will break undetected.
9. **Check maintainability** — evaluate naming clarity, function size, abstraction level, and consistency with existing patterns, because code is read far more often than it is written.
10. **Write feedback with the WHAT-WHY-HOW pattern** — state what the issue is, why it matters, and how to fix it, because vague feedback ("this looks wrong") creates confusion and frustration.
11. **Categorize feedback by severity** — mark each comment as blocking (must fix), suggestion (should fix), or nit (optional), because mixing severity levels causes authors to treat all feedback as optional.
12. **Batch related comments** — group feedback about the same concern into a single thread rather than scattering individual comments across files, because fragmented feedback is harder to address and track.
13. **Approve when good enough** — do not block on style preferences or alternative approaches that are equally valid, because perfectionism in review destroys team velocity.
14. **Set a review SLA** — complete first-pass review within 4 business hours, because stale PRs compound and create merge conflicts that make the next review harder.
15. **Automate what humans should not review** — delegate formatting, lint violations, type errors, and dependency audits to CI, because human reviewers should focus on logic, design, and correctness.

## Output Format

When conducting a code review, provide:

1. **Summary** — one-paragraph assessment of the PR's overall quality and approach
2. **Blocking issues** — issues that must be fixed before merge, with WHAT-WHY-HOW for each
3. **Suggestions** — improvements that should be made but do not block merge
4. **Nits** — minor style or preference items that are optional
5. **Positive callouts** — at least one specific thing done well, to reinforce good practices
6. **Verdict** — Approve, Request Changes, or Comment, with clear rationale

## References

| File | Purpose |
|------|---------|
| `references/review-checklist.md` | Comprehensive checklist covering correctness, security, performance, maintainability, and architecture |
| `references/feedback-patterns.md` | Patterns for writing actionable, constructive review feedback with examples |
| `references/depth-calibration.md` | How to calibrate review depth based on change risk, size, and author experience |
| `references/automation.md` | Automated review tools, CI checks, and bot configuration to reduce manual review burden |
| `references/team-practices.md` | Team-level review practices, CODEOWNERS, SLAs, and review culture guidelines |

## Gemini Platform Notes

- Use `activate_skill` to invoke skills by name from Gemini CLI or Gemini Code Assist.
- Skill files are stored under `.gemini/skills/` in the project root.
- Gemini does not support `context: fork` — all skill execution is inline.
- User arguments are passed as natural language in the activation prompt.
- Reference files are loaded relative to the skill directory under `.gemini/skills/<skill-id>/`.
