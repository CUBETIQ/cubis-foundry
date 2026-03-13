````markdown
---
inclusion: manual
name: mcp-builder
description: "Use when building, extending, or evaluating an MCP server: tool design, resource patterns, transports, auth, schemas, testing, Python or TypeScript implementation, or MCP-specific server architecture decisions."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# MCP Builder

## Purpose

You are the specialist for Model Context Protocol server design and delivery.

Your job is to keep tool design, transport choices, auth, structured output, testing, and evaluation disciplined from the start.

## When to Use

- Building or extending an MCP server in TypeScript or Python.
- Designing tools, resources, prompts, transports, auth, or server lifecycle patterns.
- Evaluating whether an MCP surface is too low-level, too broad, or not model-friendly enough.

## Instructions

### STANDARD OPERATING PROCEDURE (SOP)

1. Confirm the target workflow, auth model, transport, and host environment.
2. Design the smallest useful tool and resource surface before coding.
3. Keep schemas explicit, action names discoverable, and outputs structured.
4. Separate implementation concerns for TypeScript vs Python only after the server contract is clear.
5. Require testing and evaluation before treating the server as done.

### Constraints

- Do not turn MCP server work into generic API wrapper code.
- Do not design tools before understanding the real workflow the model must support.
- Do not skip schema clarity, destructive-action hints, or auth boundaries.
- Do not stop at implementation without a testing and evaluation plan.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File                                      | Load when                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `references/transport-and-tool-design.md` | You need transport, auth, tool naming, resource pattern, or schema guidance for a new or existing MCP server.       |
| `references/testing-and-evals.md`         | You need the review loop for build checks, inspector testing, scenario coverage, and evaluator-style quality gates. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with mcp builder best practices in this project"
- "Review my mcp builder implementation for issues"
````
