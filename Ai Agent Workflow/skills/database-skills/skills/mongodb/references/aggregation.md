# MongoDB — Aggregation Pipeline

## Pipeline basics

The aggregation pipeline is a sequence of stages, each transforming the document stream. Stages execute in order.

```js
db.orders.aggregate([
  { $match: { status: 'complete', userId: 'u42' } },  // filter early
  { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
  { $project: { category: '$_id', total: 1, count: 1, _id: 0 } }
])
```

**Critical rule**: Put `$match` as early as possible to reduce documents flowing through subsequent stages. MongoDB can use indexes for `$match` at the start of a pipeline.

## Common stages

| Stage | Purpose |
| --- | --- |
| `$match` | Filter documents (use early, supports indexes) |
| `$group` | Group by key, apply accumulators (`$sum`, `$avg`, `$min`, `$max`, `$push`, `$addToSet`) |
| `$project` | Reshape documents (include/exclude/rename/compute fields) |
| `$sort` | Sort (can use index when at start, before `$group`) |
| `$limit` / `$skip` | Pagination (prefer range-based — see below) |
| `$lookup` | Left outer join to another collection |
| `$unwind` | Flatten an array field into individual documents |
| `$addFields` | Add computed fields without removing existing |
| `$facet` | Run multiple sub-pipelines in parallel (for multi-category aggregation) |
| `$bucket` | Group into ranges (histogram) |
| `$count` | Count documents |
| `$out` / `$merge` | Write results to a collection |

## $group accumulators

```js
{ $group: {
  _id: '$category',
  total:    { $sum: '$amount' },           // sum
  average:  { $avg: '$amount' },           // average
  max:      { $max: '$amount' },           // max
  min:      { $min: '$amount' },           // min
  count:    { $sum: 1 },                   // count rows
  products: { $push: '$productId' },       // array of all values (duplicates kept)
  unique:   { $addToSet: '$productId' },   // array of unique values
  first:    { $first: '$createdAt' },      // first value in group
}}
```

## $lookup — joins

```js
// Left join orders with users
db.orders.aggregate([
  { $match: { status: 'complete' } },
  { $lookup: {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: 'user'
  }},
  { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  { $project: { total: 1, 'user.name': 1, 'user.email': 1 } }
])
```

`$lookup` is expensive on large collections — **prefer embedding** if data is always accessed together. Always filter with `$match` before `$lookup` to minimize joined documents.

Pipeline-style `$lookup` (MongoDB 3.6+) for filtered joins:
```js
{ $lookup: {
  from: 'orderItems',
  let: { orderId: '$_id' },
  pipeline: [
    { $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } },
    { $project: { sku: 1, qty: 1, _id: 0 } }
  ],
  as: 'items'
}}
```

## $unwind

Flattens array fields — generates one output document per array element:

```js
// Input: { _id: 1, tags: ['a', 'b', 'c'] }
{ $unwind: '$tags' }
// Output: { _id: 1, tags: 'a' }, { _id: 1, tags: 'b' }, { _id: 1, tags: 'c' }
```

Watch out: `$unwind` on an array of 1000 elements turns 1 doc into 1000. Use `preserveNullAndEmptyArrays: true` to keep docs with missing/empty arrays.

## Pagination in aggregation

Avoid `$skip` for deep pagination — it scans all skipped docs.

```js
// BAD: $skip is O(N)
db.orders.aggregate([
  { $sort: { createdAt: -1 } },
  { $skip: 10000 },
  { $limit: 20 }
])

// GOOD: range-based pagination
db.orders.aggregate([
  { $match: { createdAt: { $lt: lastSeenDate }, _id: { $lt: lastSeenId } } },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: 20 }
])
```

## $facet — parallel aggregations

Run multiple sub-pipelines against the same input in one pass:

```js
db.products.aggregate([
  { $match: { active: true } },
  { $facet: {
    byCategory: [
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ],
    priceRange: [
      { $bucket: { groupBy: '$price', boundaries: [0, 50, 100, 200, 500], default: '500+' } }
    ],
    total: [
      { $count: 'count' }
    ]
  }}
])
```

## Performance tips

- **Index for `$match` and `$sort`**: the pipeline can use an index only for `$match` and `$sort` stages that appear before any `$group`/`$project`/`$unwind`.
- **Use `allowDiskUse: true`** for large aggregations that exceed the 100MB in-memory sort limit.
- **`$project` early** to reduce document size flowing through the pipeline.
- **Avoid `$lookup` on hot paths** — cache results or redesign schema to embed.
- **Use `$merge` to pre-compute** expensive aggregations into a results collection, then query that.

```js
// Run explain on aggregation
db.orders.explain('executionStats').aggregate([...])
```

## Sources
- Aggregation pipeline: https://www.mongodb.com/docs/manual/aggregation/
- Pipeline stages reference: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
- Aggregation performance: https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/
