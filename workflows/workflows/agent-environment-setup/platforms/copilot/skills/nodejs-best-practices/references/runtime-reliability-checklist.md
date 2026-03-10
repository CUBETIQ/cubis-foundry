# Runtime And Reliability Checklist

Load this when Node service work needs deeper operational discipline.

## Runtime shape

- Confirm whether the process is serverless, edge, worker, or long-lived server.
- Match the framework and concurrency model to latency, I/O, and deployment constraints.
- Keep transport, domain logic, and persistence boundaries explicit.

## Workers, queues, and edge boundaries

- Use worker threads only when CPU-bound work must stay in-process.
- Use queues or separate workers for durable, slow, or retry-heavy jobs.
- Keep edge runtimes free of Node-only assumptions such as unrestricted filesystem or native modules.
- Make cancellation, timeout, and retry behavior explicit for background work.

## Safety controls

- Validate input at the boundary with explicit schemas.
- Add deadlines, retries, and cancellation rules for networked dependencies.
- Keep secrets, auth decisions, and privilege boundaries explicit.

## Production posture

- Add health checks, graceful shutdown, and readiness semantics.
- Use correlation IDs and structured logging.
- Make failure behavior obvious for queues, jobs, and background work.

## Performance

- Avoid blocking CPU work in request paths.
- Measure heap, event-loop delay, and I/O hotspots before optimizing.
- Prefer one high-signal optimization at a time.
