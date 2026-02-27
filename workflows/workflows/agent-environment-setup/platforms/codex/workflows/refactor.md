---
command: "/refactor"
description: "Improve maintainability while preserving behavior through incremental safe refactoring."
triggers: ["refactor", "cleanup", "maintainability", "debt", "modularize"]
---
# Refactor Workflow

Use this for design improvement without intentional behavior changes.

## Steps
1. Define behavior invariants and guardrails.
2. Isolate refactor slices with low coupling.
3. Apply changes incrementally with tests.
4. Confirm behavior parity and performance baseline.

## Output Contract
- Refactor scope and invariants
- Structural changes
- Behavior parity evidence
- Deferred technical debt items
