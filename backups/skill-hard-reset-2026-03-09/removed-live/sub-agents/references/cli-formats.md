# CLI Formats for Sub-Agents

This reference defines the expected invocation style per CLI target.

## codex
- Mode: non-interactive command execution.
- Preferred output: structured markdown or JSON when requested.
- Use explicit cwd and deterministic prompts.

## claude
- Mode: prompt-first invocation.
- Keep task boundary narrow and include acceptance checks.

## gemini
- Mode: concise instruction with explicit constraints.
- Include required output sections to reduce drift.

## cursor-agent
- Mode: task delegation with repository-aware context.
- Provide concrete files, checks, and done criteria.

## Common requirements
- Always include: goal, scope, constraints, expected output.
- Avoid hidden assumptions; pass critical context explicitly.
- Request machine-readable output when parsing is required.
