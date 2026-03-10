# Drizzle Runtime Pairing Matrix

Load this when runtime choice or deployment model changes the Drizzle answer.

## Pairing Rules

- `postgres` or `neon-postgres` style stacks: verify connection strategy, pooling, and migration path before recommending long-lived clients.
- `supabase`: keep auth, RLS, storage, and platform policy concerns in the Supabase skill; use Drizzle only for the data-access layer.
- `sqlite` or `libsql` style stacks: keep write-concurrency and local-first limits visible.
- Serverless or edge runtimes: prefer the smallest safe adapter surface and avoid assumptions about persistent connections.

## Do Not Blur

- Engine features belong to the engine skill.
- Drizzle config, schema, and query ergonomics belong here.
- Framework-specific wiring belongs to the matching backend or frontend framework skill.
