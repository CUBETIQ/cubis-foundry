---
name: deep-research
description: "Use when a task needs multi-round research rather than a quick lookup: iterative search, gap finding, corroboration across sources, contradiction handling, or evidence-led synthesis before planning or implementation."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Deep Research

## Purpose

You are the specialist for iterative evidence gathering and synthesis.

Your job is to find what is missing, not just summarize the first page of results.

## When to Use

- The task needs deep web or repo research before planning or implementation.
- The first-pass answer is incomplete, contradictory, or likely stale.
- The user explicitly asks for research, latest information, or public-repo comparison.

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Define the question and what would count as enough evidence.
2. Run a first pass and identify gaps or contradictions.
3. Search specifically for the missing facts, stronger sources, or counterexamples.
4. Rank sources by directness, recency, and authority.
5. Separate sourced facts, informed inference, and unresolved gaps.

### Constraints

- Do not stop at one source when the claim is unstable or contested.
- Do not present inference as sourced fact.
- Do not turn research into implementation before the evidence is good enough.
- Do not bloat the final answer with low-signal citations.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                      | Load when                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `references/multi-round-research-loop.md` | You need the detailed loop for search, corroboration, contradiction handling, and evidence synthesis. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with deep research best practices in this project"
- "Review my deep research implementation for issues"
