# MongoDB — Modeling, Indexing, and Pagination

## Data modeling philosophy

MongoDB is schema-flexible at the storage layer, but **your schema is defined by your queries, not by your data shape**. Model documents for the queries you actually run.

### Embed vs reference

| Embed | Reference (DBRef / manual) |
| --- | --- |
| Data is always accessed together | Data is accessed independently |
| 1-to-1 or bounded 1-to-few | 1-to-many with unbounded growth |
| Child data has no standalone identity | Child data is queried on its own |
| Written/updated together | Updated at different rates |

```js
// Embed: order with line items (always fetched together, bounded count)
{ _id: ..., userId: ..., lineItems: [ { sku, qty, price }, ... ] }

// Reference: user with orders (orders accessed independently, unbounded)
{ _id: ..., name: "Alice" }   // users collection
{ _id: ..., userId: <ref>, total: 99 }  // orders collection
```

Avoid embedding unbounded arrays — document size limit is 16MB and large docs slow query/update performance.

## Index types and when to use them

| Type | Use for |
| --- | --- |
| **Single field** | Equality, range, sort on one field |
| **Compound** | Combined equality + range + sort — column order matters |
| **Multikey** | Fields that are arrays (auto-detected by MongoDB) |
| **Text** | Full-text search on string fields |
| **Wildcard** | Arbitrary field access patterns |
| **2dsphere** | Geospatial queries |
| **TTL** | Auto-delete documents after expiry |

## Compound index design

Same leftmost-prefix rule as SQL — **equality fields first, then range, then sort**:

```js
// Query: find open orders for a user, sorted by date
db.orders.find({ userId: X, status: "open" }).sort({ createdAt: -1 })

// Correct index: equality fields lead, sort field last
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 })

// Wrong: sort field before filter — doesn't eliminate docs efficiently
db.orders.createIndex({ createdAt: -1, userId: 1, status: 1 })
```

## Reading query plans with explain()

```js
db.orders.find({ userId: 1 }).explain("executionStats")
```

Key things to check:
- `winningPlan.stage`: `COLLSCAN` = full scan (bad on large collections), `IXSCAN` = index scan (good).
- `executionStats.totalDocsExamined` vs `nReturned`: should be close. Large ratio = poor index coverage.
- `executionStats.executionTimeMillis`: baseline to compare before/after index changes.

## Avoid deep skip() pagination

`skip(N)` makes MongoDB scan and discard N documents. On large collections this is O(N).

```js
// BAD: skip-based pagination
db.orders.find().sort({ _id: 1 }).skip(10000).limit(20)

// GOOD: range-based pagination using last seen _id (or cursor field)
db.orders.find({ _id: { $gt: lastSeenId } }).sort({ _id: 1 }).limit(20)

// For composite sort keys
db.orders.find({
  $or: [
    { createdAt: { $lt: lastDate } },
    { createdAt: lastDate, _id: { $lt: lastId } }
  ]
}).sort({ createdAt: -1, _id: -1 }).limit(20)
```

## Common modeling mistakes

- **Storing growing arrays in a document**: the document grows without bound → move to a child collection.
- **Using `$lookup` as a substitute for embedding**: `$lookup` is expensive; redesign the schema if you always join.
- **Not projecting fields**: always project only needed fields to reduce document transfer size.
- **Missing index on high-cardinality filter fields**: every `find()` cold path should have an index.

## Sources
- Explain plans: https://www.mongodb.com/docs/manual/reference/method/db.collection.explain/
- `skip()` caveats: https://www.mongodb.com/docs/manual/reference/method/cursor.skip/
- Query plans: https://www.mongodb.com/docs/manual/core/query-plans/
- Data modeling guide: https://www.mongodb.com/docs/manual/data-modeling/
