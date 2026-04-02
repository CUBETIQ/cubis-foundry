# Agent-Driven UI

## Core contract

Separate intent from rendering:

- Agent outputs structured UI intent or schema.
- Host app maps that schema onto an allowlisted component registry.
- Business actions flow through explicit events.
- Host app validates, logs, and can reject unsafe payloads.

Prefer declarative messages over raw executable code when possible.

## Safe rendering rules

- Keep a stable component registry.
- Validate schema shape and field types.
- Restrict actions to known event contracts.
- Provide safe fallbacks for unknown components.
- Never let the agent bypass authorization or sensitive host logic.
- Separate display content from privileged operations.
