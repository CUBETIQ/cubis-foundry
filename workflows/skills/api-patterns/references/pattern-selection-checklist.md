# Pattern Selection Checklist

Load this when API pattern choice is the core decision.

## Pick the shape from the problem

- REST when broad compatibility, cache semantics, and public familiarity matter.
- GraphQL when clients need flexible graph reads and schema-first evolution is justified.
- Type-safe RPC when clients and server share a typed codebase and internal velocity is the main constraint.

## Standardize the surface

- Keep one response and error vocabulary per API family.
- Make auth, rate limit, and retry semantics explicit.
- Decide pagination and filtering style before implementation spreads.

## Evolution

- Write versioning policy up front.
- Separate internal transport shortcuts from public contract guarantees.
- Keep operational protections part of the API decision, not separate work.
