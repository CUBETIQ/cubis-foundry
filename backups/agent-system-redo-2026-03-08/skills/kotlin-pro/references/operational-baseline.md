## Operational baseline

Load when: coroutine ownership, modularity, testing, or production guardrails need explicit guidance.

- Keep coroutine scope ownership explicit and lifecycle-aware.
- Avoid hidden blocking on shared/default dispatchers.
- Keep shared/domain modules isolated from platform-specific details.
- Use deterministic tests for `Flow`, coroutine, and lifecycle behavior.
- Prefer structured logs and traces that show dispatcher/cancellation context.
