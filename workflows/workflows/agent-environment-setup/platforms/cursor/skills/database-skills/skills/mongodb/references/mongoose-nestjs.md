# MongoDB — Mongoose and NestJS Patterns

## Repository pattern with Mongoose + NestJS

Keep data access behind a repository class — don't scatter `Model.find()` calls across services.

```ts
// order.repository.ts
@Injectable()
export class OrderRepository {
  constructor(@InjectModel(Order.name) private model: Model<Order>) {}

  async findByUser(userId: string, limit = 20, afterId?: string): Promise<Order[]> {
    const query: FilterQuery<Order> = { userId };
    if (afterId) query._id = { $gt: new Types.ObjectId(afterId) };
    return this.model
      .find(query)
      .sort({ _id: 1 })
      .limit(limit)
      .lean()   // return plain JS objects — skip Mongoose hydration overhead
      .exec();
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.model.create(dto);
  }
}
```

## Schema index definition

Define indexes on the schema, not as ad-hoc calls. This makes them part of your codebase and reviewable.

```ts
@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ type: [{ sku: String, qty: Number, price: Number }] })
  lineItems: LineItem[];
}

// Compound index — define at schema level
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 });

// TTL index — auto-delete after 90 days
OrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
```

Always track index definitions in migration scripts when adding to existing collections.

## Lean reads and projection

- `lean()` returns plain JS objects instead of Mongoose Document instances — no hydration overhead, no change tracking. Use for read paths.
- Always project only what you need to reduce transfer size.

```ts
// Lean + projection for list endpoints
this.model
  .find({ userId })
  .select('status createdAt total')   // project only needed fields
  .lean()
  .exec();

// Full document with Mongoose methods only when saving/updating
const doc = await this.model.findById(id).exec();
doc.status = 'complete';
await doc.save();
```

## Transactions (MongoDB 4.0+ replica set or sharded cluster)

```ts
const session = await this.connection.startSession();
session.startTransaction();
try {
  await this.orderModel.create([orderData], { session });
  await this.inventoryModel.updateOne(
    { sku: orderData.sku },
    { $inc: { qty: -1 } },
    { session }
  );
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

Transactions are only needed for multi-document atomicity. Single-document operations are always atomic in MongoDB.

## Aggregation pipeline in NestJS

```ts
const result = await this.model.aggregate([
  { $match: { userId, status: 'complete' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
]);
```

Use `.aggregate()` for reporting/analytics. For regular queries, prefer `.find()` so Mongoose can apply schema type casting.

## Connection and pool setup (NestJS module)

```ts
MongooseModule.forRoot(uri, {
  maxPoolSize: 10,          // default 5 — tune to app concurrency
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
```

## Common mistakes

- Calling `Model.find()` directly in service/controller — bypasses repository, untestable.
- Forgetting `.lean()` on list endpoints — returns Mongoose Documents with full overhead.
- Defining compound indexes ad-hoc in `onModuleInit` — use schema-level definition instead.
- Not projecting fields on list queries — transfers full documents when only 3 fields are needed.
- Using `new Model(data).save()` in a loop — batch with `Model.insertMany()` instead.

## Sources
- Mongoose documentation: https://mongoosejs.com/docs/
- MongoDB index strategies: https://www.mongodb.com/docs/manual/indexes/
- MongoDB data modeling: https://www.mongodb.com/docs/manual/data-modeling/
- MongoDB transactions: https://www.mongodb.com/docs/manual/core/transactions/
