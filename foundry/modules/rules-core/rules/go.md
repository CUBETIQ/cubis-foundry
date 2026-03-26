> This file extends [common.md](./common.md) with Go-specific guidance.

## Go Rules

- Keep packages cohesive and prefer explicit interfaces only where they create useful seams.
- Return errors with context and check them immediately.
- Use table-driven tests for behavior that naturally varies across cases.
