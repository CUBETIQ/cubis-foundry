# MCP Testing And Evals

Load this when the server exists or is close to shipping.

## Required Checks

- Build or type-check the server.
- Exercise tools through the intended MCP client path or inspector.
- Confirm error messages are actionable and do not leak secrets.
- Verify structured outputs match what downstream agents need.

## Evaluation Loop

1. Pick realistic read-only tasks first.
2. Confirm the model can discover the right tools.
3. Check whether tool descriptions, schemas, or result shape cause misuse.
4. Tighten naming, auth, or output structure before broadening coverage.
