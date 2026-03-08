# Service Boundary Checklist

Load this when the microservice decision needs sharper rigor.

## Boundary quality

- Prove the organizational or product reason for separate services.
- Choose seams from ownership and domain boundaries, not deployment preference.
- Keep contracts explicit, versionable, and observable.

## Interaction model

- Choose sync vs async per workflow, not by ideology.
- Make timeouts, retries, idempotency, and degraded behavior explicit.
- Minimize cross-service chat and hidden orchestration.

## Data and consistency

- Avoid shared databases masquerading as autonomy.
- Be explicit about consistency model and recovery path.
- Keep shard or partition boundaries visible where relevant.

## Operations

- Require logs, metrics, and traces as part of the design.
- Treat rollout, rollback, and incident isolation as first-class architecture concerns.
