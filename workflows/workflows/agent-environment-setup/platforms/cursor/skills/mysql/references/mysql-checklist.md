# MySQL Checklist

Load this when MySQL behavior materially affects the answer.

## InnoDB and indexes

- Model for clustered primary-key access and covering-index opportunities.
- Keep transaction scope tight and predictable.
- Validate index tradeoffs against actual read/write mix.

## Rollout

- Check Online DDL behavior, replicas, and rollback constraints.
- Make replication lag and topology effects explicit.
- Stage heavy schema changes when operational risk is non-trivial.

## Evidence

- Use query-plan evidence before recommending index or query changes.
- Do not borrow Postgres assumptions blindly.
