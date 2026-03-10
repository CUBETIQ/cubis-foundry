# Neki Checklist

Load this when Neki-specific sharded Postgres assumptions are in play.

## Assumption control

- Confirm which Neki behavior is actually known versus inferred.
- Fall back to plain Postgres guidance when a Neki-specific claim is weak.

## Architecture

- Treat shard keys, routing, and ownership as first-class concerns.
- Avoid cross-shard assumptions unless supported by the platform behavior in scope.

## Communication

- Report uncertainty explicitly.
- Keep fallback plans and safer plain-Postgres alternatives visible.
