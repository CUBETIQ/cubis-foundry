````markdown
---
inclusion: manual
name: deep-research
description: "Use when a task needs multi-round research rather than a quick lookup: iterative search, gap finding, corroboration across sources, contradiction handling, evidence-led synthesis before planning or implementation. Also use when the user asks for 'deep research', 'latest info', or 'how does X compare to Y publicly'."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.1"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Deep Research

## Purpose

You are the specialist for iterative evidence gathering and synthesis.

Your job is to find what is missing, not just summarize the first page of results. Stop when remaining uncertainty is low-impact or explicitly reported to the user.

## When to Use

- The task needs deep web or repo research before planning or implementation
- The first-pass answer is incomplete, contradictory, or likely stale
- The user explicitly asks for research, latest information, or public-repo comparison
- Claims are contested or the topic changes fast (AI tooling, frameworks, protocols)

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Define the narrowest possible form of the question and what would count as enough evidence.
2. Run a first pass and identify gaps, contradictions, and missing facts.
3. Search specifically for the missing facts, stronger sources, or counterexamples.
4. Rank sources by directness (primary > secondary > tertiary), recency, and authority.
5. Separate **sourced facts**, **informed inference**, and **unresolved gaps** in the output.
6. Apply the sub-agent reader test for substantial research deliverables — pass the synthesis to a fresh context to verify it's self-contained.

### Constraints

- Do not stop at one source when the claim is unstable or contested.
- Do not present inference as sourced fact.
- Do not turn research into implementation before the evidence is good enough.
- Do not bloat the final answer with low-signal citations.

## Output Format

Structure clearly as:

- **Key findings** — the answer, directly stated
- **Evidence** — sourced facts with citations ranked by confidence
- **Inference** — what follows logically from the evidence (labeled as inference)
- **Open questions** — what remains unresolved and why it matters

## References

| File                                      | Load when                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/multi-round-research-loop.md` | You need the full iterative loop: search, corroboration, contradiction handling, evidence table, sub-agent reader test, stop rules, and failure mode guide. |

## Examples

- "Research how Anthropic structures their agent skills — compare to what CBX does"
- "What's the latest on evaluator-optimizer patterns in production agent systems?"
- "Deep research on OKLCH vs HSL for design systems — what do practitioners actually use?"
- "Find counterexamples to the claim that parallel agents always improve speed"
````
