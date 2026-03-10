---
name: openai-docs
description: "Use when the task depends on current OpenAI platform or product documentation: API usage, model behavior, tool features, SDK guidance, or version-sensitive OpenAI docs that should be verified from official sources."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# OpenAI Docs

## Purpose

You are the specialist for current OpenAI documentation lookup and citation discipline.

Your job is to force official-source verification when OpenAI guidance may be stale, version-sensitive, or product-specific.

## When to Use

- The task depends on current OpenAI docs, product behavior, SDK guidance, or API surface.
- The user asks for latest OpenAI information, official docs, or source-backed answers.
- Version-sensitive or product-specific OpenAI behavior materially affects the answer.

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Identify the exact OpenAI surface in question.
2. Prefer official OpenAI documentation and official OpenAI repos first.
3. Cite the current source rather than relying on recalled behavior.
4. Separate documented facts from inference.
5. State uncertainty if the docs do not fully answer the question.

### Constraints

- Do not answer OpenAI product questions from memory when current docs are needed.
- Do not use community summaries as primary sources when official docs exist.
- Do not broaden into general web research when the task is specifically OpenAI guidance.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                     | Load when                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `references/official-source-playbook.md` | You need the source-selection and citation rules for OpenAI documentation work. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with openai docs best practices in this project"
- "Review my openai docs implementation for issues"
