# Common Engineering Rules

These rules apply to every projected runtime unless a platform file narrows them explicitly.

## Correctness

- Do not mutate incoming inputs when a pure alternative is practical.
- Fail fast with meaningful errors instead of silently swallowing invalid state.
- Prefer narrow, well-named changes over broad rewrites.

## File Hygiene

- Warn when a source file grows beyond roughly 300 lines; split it before it becomes a dumping ground.
- Treat roughly 600 lines as a hard stop unless the file is generated or structurally justified.
- Keep comments rare and useful. Explain non-obvious intent, not obvious syntax.

## Testing

- New or changed behavior should have verification proportional to risk.
- Favor focused tests over broad snapshot coverage.
- Do not claim verification that was not actually run.

## Security

- Never commit secrets or security-sensitive tokens.
- Validate untrusted input at the boundary.
- Prefer parameterized queries and structured escaping over string-built commands.

## Change Discipline

- Keep commits atomic and use conventional, descriptive commit messages when committing.
- Do not revert unrelated user work.
- Surface assumptions, blockers, and residual risk explicitly.
