# Strangler Fig Pattern

Use this pattern to migrate from legacy Express routes to NestJS incrementally without a big-bang rewrite.

## Goal

Move route groups from legacy to NestJS in controlled slices while preserving behavior and uptime.

## Migration Flow

1. Keep legacy and NestJS running side by side.
2. Add an edge router that forwards requests by route prefix.
3. Migrate one bounded module at a time.
4. Verify parity with contract tests and traffic shadowing.
5. Shift traffic gradually.
6. Remove legacy routes after sustained stability.

## Routing Strategy

- Legacy example: `/api/users/*` -> Express
- New module: `/api/v2/users/*` -> NestJS
- Optional cutover: keep same route and switch backend behind gateway flags

## Safety Gates Per Slice

- Contract tests pass against both implementations.
- Error rates and latency remain within agreed SLO bounds.
- Rollback is immediate by flipping router rules.
- Data migrations are idempotent and reversible when possible.

## Common Risks

- Hidden shared state in legacy middleware.
- Inconsistent auth/session behavior across stacks.
- Schema drift between old and new DTO/validation layers.

## Required Controls

- Single source of truth for auth/session policy.
- Structured logging with correlation IDs across both paths.
- Feature flags for route-level cutovers.
- Post-cutover monitoring window before route deletion.

## Related

- `references/migration-from-express.md`
- `references/authentication.md`
