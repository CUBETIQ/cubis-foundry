# Redis Cache Patterns

- Prefer explicit key design and namespacing.
- Use write-through/write-behind intentionally.
- Prevent cache stampede with locking or jittered TTL.
