## Operational baseline

Load when: async service safety, tracing, error handling, or release guardrails need explicit guidance.

- Keep error chains actionable and visible in logs/traces.
- Use `cargo fmt`, `clippy`, and focused tests as a release baseline.
- Make cancellation, queue bounds, and backpressure explicit.
- Treat `unsafe` as an exception with documented invariants.
- Profile before low-level optimization.
