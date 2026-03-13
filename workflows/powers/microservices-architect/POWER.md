````markdown
---
inclusion: manual
name: microservices-architect
description: "Use when decomposing systems into services, designing service boundaries, choosing sync and async integration patterns, and managing distributed-system reliability tradeoffs."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Microservices Architect

## Purpose

Use when decomposing systems into services, designing service boundaries, choosing sync and async integration patterns, and managing distributed-system reliability tradeoffs.

## When to Use

- Decomposing a monolith or clarifying service boundaries.
- Choosing sync vs async integration between services.
- Designing distributed consistency, retries, timeouts, and failure isolation.
- Reviewing whether a system is becoming a distributed monolith.

## Instructions

1. Prove the organizational or product reason for multiple services.
2. Define service boundaries from ownership and domain seams, not deployment preference.
3. Choose communication and consistency strategy per interaction.
4. Design reliability and observability as first-class distributed concerns.
5. Check whether the proposed split actually reduces coordination risk.

### Baseline standards

- Prefer clear bounded contexts over premature service count growth.
- Keep contracts explicit and versionable.
- Design for retries, timeouts, idempotency, and degraded modes.
- Treat tracing, logs, and metrics as required, not optional.
- Use async boundaries deliberately where coupling or latency demand it.

### Constraints

- Avoid splitting services without ownership clarity.
- Avoid shared databases masquerading as autonomy.
- Avoid chatty synchronous call chains with no resilience model.
- Avoid event-driven complexity when direct boundaries would be simpler.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/service-boundary-checklist.md` | You need a more detailed playbook for service seams, contracts, async boundaries, idempotency, and distributed failure modes. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with microservices architect best practices in this project"
- "Review my microservices architect implementation for issues"
````
