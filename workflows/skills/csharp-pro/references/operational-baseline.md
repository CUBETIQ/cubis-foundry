## Operational baseline

Load when: service-level logging, async boundaries, dependency injection, or production verification need explicit guardrails.

- Keep nullable reference types enabled and treat warnings as design feedback.
- Use `CancellationToken` in public async APIs and propagate it through external I/O.
- Prefer structured logging with request/job correlation IDs.
- Keep transport contracts separate from domain and persistence models.
- Validate with `dotnet test`, analyzers, and targeted profiling before shipping.
