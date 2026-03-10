---
name: legacy-modernizer
description: "Use when planning and executing incremental migration of legacy systems using strangler fig, branch by abstraction, and feature-flag-controlled rollouts."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Legacy Modernizer

## Purpose

Use when planning and executing incremental migration of legacy systems using strangler fig, branch by abstraction, and feature-flag-controlled rollouts.

## When to Use

- Migrating legacy systems to modern architectures without big-bang rewrites.
- Designing strangler fig patterns for gradual service extraction.
- Planning incremental migrations with feature flags and canary rollouts.
- Building safety nets (characterization tests) before changing legacy behavior.
- Modernizing databases, APIs, or UI layers incrementally.

## Instructions

1. Assess the system — map dependencies, identify high-risk areas, and document current behavior.
2. Plan the migration — choose strategy (strangler fig, branch by abstraction, parallel run) and define phases.
3. Build a safety net — write characterization tests that capture current behavior before any changes.
4. Migrate incrementally — extract one bounded context at a time behind feature flags.
5. Validate and iterate — verify behavior parity, monitor for regressions, roll back if needed.
6. Decommission legacy — remove old code paths only after migration is verified and stable.

### Baseline standards

- Zero production disruption is the primary constraint.
- Maintain 80%+ test coverage on migrated paths.
- Use feature flags for all migration switches.
- Include monitoring and rollback capability for every migration step.
- Document every decision and its rationale.
- Preserve existing business logic exactly unless explicitly changing it.

### Constraints

- Never attempt big-bang rewrites — always migrate incrementally.
- Never skip characterization testing before modifying legacy behavior.
- Never deploy migration steps without rollback capability.
- Never remove legacy code until the replacement is verified in production.
- Always maintain the ability to revert to the previous system state.

## Output Format

Provide a migration plan with phases, risk assessment, rollback strategy, and verification checkpoints.

## References

No additional reference files.

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Plan a strangler fig migration for this monolithic API"
- "Design characterization tests for this legacy payment module"
- "Create a phased migration plan with feature flags and rollback"
