# MongoDB Checklist

Load this when MongoDB document behavior is the main concern.

## Document shape

- Choose embed vs reference from update and read behavior.
- Keep schema validation explicit even in flexible models.
- Avoid unbounded document growth.

## Queries and aggregation

- Design compound indexes from real filters and sorts.
- Treat aggregation as a deliberate tool, not default glue.
- Make shard-key implications explicit before scaling decisions harden.

## Operations

- Re-check validation, index coverage, and fan-out before shipping.
- Do not use “schema-less” as an excuse to skip lifecycle design.
