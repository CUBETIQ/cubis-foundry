# Vitess — Sharding and VSchema Design

## Core concept

The **VSchema** tells VTGate how to route queries. It defines which tables belong to which keyspace, which column determines shard placement (the **primary vindex**), and how tables relate across shards.

## Shard routing types

| Routing | Condition | Performance |
| --- | --- | --- |
| **Single-shard** | `WHERE` on primary vindex with `=` | Best |
| **Multi-shard (targeted)** | `WHERE` with `IN` on primary vindex | Good |
| **Scatter** | No primary vindex filter | Expensive — hits all shards |

Always include the primary vindex column in `WHERE` clauses to avoid scatter queries.

## Choosing a primary vindex column

Pick the column that:
1. Appears in your highest-QPS `WHERE` clauses.
2. Enables join co-location — tables frequently joined should shard on the same column.
3. Keeps transactions within a single shard.
4. Has high cardinality for even distribution.
5. Is immutable — changing it after insert requires a data migration.

Common choices: `user_id`, `tenant_id`, `org_id`, `account_id`.

## Vindex types

| Type | When to use |
| --- | --- |
| `xxhash` | Any column type — most common |
| `unicode_loose_xxhash` | Text columns needing case-insensitive hashing |
| `binary_md5` | MD5-based alternative for any column type |

## VSchema structure (sharded keyspace)

```json
{
  "sharded": true,
  "vindexes": {
    "xxhash": { "type": "xxhash" }
  },
  "tables": {
    "orders": {
      "column_vindexes": [
        { "column": "customer_id", "name": "xxhash" }
      ],
      "auto_increment": {
        "column": "id",
        "sequence": "unsharded_keyspace.orders_seq"
      }
    }
  }
}
```

## Sequences — replacing AUTO_INCREMENT

Per-shard `AUTO_INCREMENT` produces duplicate IDs across shards. Use Vitess Sequences instead.

1. Create in an **unsharded** keyspace:
   ```sql
   CREATE TABLE orders_seq (id BIGINT, next_id BIGINT, cache BIGINT, PRIMARY KEY(id))
     COMMENT 'vitess_sequence';
   INSERT INTO orders_seq (id, next_id, cache) VALUES (0, 1, 1000);
   ```
2. Register in unsharded VSchema: `{ "orders_seq": { "type": "sequence" } }`
3. Link to sharded table via `auto_increment` in sharded VSchema (see above).

Sequence gaps from caching/restarts are expected and harmless.

## Lookup vindexes (secondary routing)

Lookup vindexes let you route by non-primary-vindex columns without scatter. They are backed by a separate mapping table. **They are expensive** — avoid unless scatter on the column is genuinely a problem.

```json
"customer_email_lookup": {
  "type": "consistent_lookup",
  "params": {
    "table": "product.customer_email_lookup",
    "from": "email",
    "to": "keyspace_id"
  },
  "owner": "customer"
}
```

Use `consistent_lookup_unique` only when uniqueness across shards must be enforced at the DB level (this is a scalability anti-pattern — prefer app-level enforcement).

## Discover existing VSchema

```bash
vtctldclient GetVSchema <keyspace>                     # full JSON
vtctldclient GetVSchema <keyspace> | jq '.vindexes'   # just vindexes
```

```sql
SHOW VSCHEMA TABLES;        -- tables known to VTGate
SHOW VSCHEMA VINDEXES;      -- vindexes and types
```

## Troubleshoot scatter queries

```sql
VEXPLAIN PLAN SELECT * FROM orders WHERE customer_id = 42;
-- Look for Route variant: EqualUnique (single-shard) vs Scatter (all shards)

VEXPLAIN ALL SELECT ...;    -- includes MySQL plans from each tablet
VEXPLAIN TRACE SELECT ...;  -- shows row counts passed between query parts
```

If a query scatters:
1. Is `WHERE` filtering on the primary vindex column? If not, add it.
2. Is a lookup vindex configured for that column? If needed, add one.
3. Primary vindex column updates are blocked — use `MoveTables` to re-shard if needed.

## Reference tables

Small, rarely-changing lookup data (countries, currencies, enums) can use `"type": "reference"` — they are replicated to all shards and never scatter.

## Sources
- VSchema guide: https://vitess.io/docs/user-guides/vschema-guide/
- Vindexes reference: https://vitess.io/docs/reference/features/vschema/
- Sharding key selection: https://vitess.io/docs/faq/advanced-configuration/vschema/how-do-you-select-your-sharding-key-for-vitess/
