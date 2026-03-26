---
name: research-core
description: Research workflow guidance for turning vague questions into scoped,
  source-backed findings with clear confidence and evidence labeling.
triggers:
  - research core
  - research
  - source-backed findings
  - evidence labeling
  - investigating public APIs
  - platform behavior
  - product comparisons
  - source-backed answer
domains:
  - research
whenToUse: When the task needs structured evidence gathering, especially when
  freshness, source quality, or synthesis matters.
priority: secondary
compatibility:
  - codex
  - claude
  - copilot
  - gemini
  - antigravity
---

# Research Core

## Purpose

Provide the shared operating model for research work in Foundry: repo first, authoritative external sources second, and explicit separation between evidence and inference.

## When to Use

- Investigating public APIs, platform behavior, or product comparisons
- Building a source-backed answer for a decision or implementation path
- Capturing evidence quality and recency explicitly

## Instructions

1. Narrow the question before gathering sources.
2. Prefer official or primary sources when the fact can change over time.
3. Label inference clearly and keep citations close to claims.

## Anti-patterns

- Do not mix speculation with source-backed facts.
- Do not over-collect sources when a smaller high-quality set is enough.

## Output Format

Return the research question, source list, evidence-backed findings, and remaining uncertainty.

## References

- `../deep-research/SKILL.md`
