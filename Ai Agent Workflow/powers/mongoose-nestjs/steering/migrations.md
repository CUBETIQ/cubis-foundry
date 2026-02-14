# MongoDB Migrations with Mongoose

> Reference for: Mongoose NestJS
> Load when: Schema versioning, data migrations, field renaming, collection restructuring

---

## Overview

MongoDB's flexible schema doesn't require migrations for adding fields, but migrations are essential for:

- Renaming fields or collections
- Transforming existing data
- Adding required fields with default values
- Restructuring documents
- Creating/dropping indexes

---

## Migration Tool Setup

### Using migrate-mongo

```bash
# Install migrate-mongo
npm install migrate-mongo --save-dev

# Initialize (creates config and migrations folder)
npx migrate-mongo init
```

### Configuration

```javascript
// migrate-mongo-config.js
const config = {
  mongodb: {
    url: process.env.MONGO_URL || "mongodb://localhost:27017",
    databaseName: process.env.MONGO_DB || "oneup",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
```

### TypeScript Configuration

```javascript
// migrate-mongo-config.js (for TypeScript projects)
require("ts-node/register");

const config = {
  mongodb: {
    url: process.env.MONGO_URL || "mongodb://localhost:27017",
    databaseName: process.env.MONGO_DB || "oneup",
  },
  migrationsDir: "src/database/migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".ts",
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
```

---

## Creating Migrations

### Generate Migration File

```bash
# Create new migration
npx migrate-mongo create add-user-timezone

# Creates: migrations/20250129120000-add-user-timezone.js
```

### Migration Template

```typescript
// src/database/migrations/20250129120000-add-user-timezone.ts
import { Db } from "mongodb";

export async function up(db: Db): Promise<void> {
  // Migration logic here
}

export async function down(db: Db): Promise<void> {
  // Rollback logic here
}
```

---

## Common Migration Patterns

### Add Field with Default Value

```typescript
// Add timezone field to all users
export async function up(db: Db): Promise<void> {
  await db
    .collection("users")
    .updateMany(
      { timezone: { $exists: false } },
      { $set: { timezone: "Asia/Bangkok" } },
    );
}

export async function down(db: Db): Promise<void> {
  await db.collection("users").updateMany({}, { $unset: { timezone: "" } });
}
```

### Rename Field

```typescript
// Rename 'name' to 'fullName'
export async function up(db: Db): Promise<void> {
  await db
    .collection("users")
    .updateMany({ name: { $exists: true } }, { $rename: { name: "fullName" } });
}

export async function down(db: Db): Promise<void> {
  await db
    .collection("users")
    .updateMany(
      { fullName: { $exists: true } },
      { $rename: { fullName: "name" } },
    );
}
```

### Transform Data

```typescript
// Convert role string to array of roles
export async function up(db: Db): Promise<void> {
  const cursor = db.collection("users").find({ role: { $type: "string" } });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc) {
      await db
        .collection("users")
        .updateOne(
          { _id: doc._id },
          { $set: { roles: [doc.role] }, $unset: { role: "" } },
        );
    }
  }
}

export async function down(db: Db): Promise<void> {
  const cursor = db.collection("users").find({ roles: { $type: "array" } });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc && doc.roles?.length > 0) {
      await db
        .collection("users")
        .updateOne(
          { _id: doc._id },
          { $set: { role: doc.roles[0] }, $unset: { roles: "" } },
        );
    }
  }
}
```

### Add Index

```typescript
// Add compound index for attendance queries
export async function up(db: Db): Promise<void> {
  await db
    .collection("attendance")
    .createIndex(
      { organizationId: 1, userId: 1, checkInDateTime: -1 },
      { name: "idx_org_user_checkin", background: true },
    );
}

export async function down(db: Db): Promise<void> {
  await db.collection("attendance").dropIndex("idx_org_user_checkin");
}
```

### Restructure Embedded Documents

```typescript
// Flatten nested address to top-level fields
export async function up(db: Db): Promise<void> {
  const cursor = db.collection("organizations").find({
    "address.street": { $exists: true },
  });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc?.address) {
      await db.collection("organizations").updateOne(
        { _id: doc._id },
        {
          $set: {
            street: doc.address.street,
            city: doc.address.city,
            country: doc.address.country,
          },
          $unset: { address: "" },
        },
      );
    }
  }
}

export async function down(db: Db): Promise<void> {
  const cursor = db.collection("organizations").find({
    street: { $exists: true },
  });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc) {
      await db.collection("organizations").updateOne(
        { _id: doc._id },
        {
          $set: {
            address: {
              street: doc.street,
              city: doc.city,
              country: doc.country,
            },
          },
          $unset: { street: "", city: "", country: "" },
        },
      );
    }
  }
}
```

### Split Collection

```typescript
// Move profile data from users to separate profiles collection
export async function up(db: Db): Promise<void> {
  const cursor = db.collection("users").find({
    "profile.name": { $exists: true },
  });

  const profiles: any[] = [];

  while (await cursor.hasNext()) {
    const user = await cursor.next();
    if (user?.profile) {
      profiles.push({
        userId: user._id,
        ...user.profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (profiles.length > 0) {
    await db.collection("profiles").insertMany(profiles);
    await db
      .collection("users")
      .updateMany(
        { "profile.name": { $exists: true } },
        { $unset: { profile: "" } },
      );
  }
}

export async function down(db: Db): Promise<void> {
  const cursor = db.collection("profiles").find({});

  while (await cursor.hasNext()) {
    const profile = await cursor.next();
    if (profile) {
      const { userId, createdAt, updatedAt, _id, ...profileData } = profile;
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { profile: profileData } });
    }
  }

  await db.collection("profiles").drop();
}
```

---

## Running Migrations

### CLI Commands

```bash
# Run all pending migrations
npx migrate-mongo up

# Rollback last migration
npx migrate-mongo down

# Check migration status
npx migrate-mongo status
```

### NPM Scripts

```json
{
  "scripts": {
    "migrate:up": "migrate-mongo up",
    "migrate:down": "migrate-mongo down",
    "migrate:status": "migrate-mongo status",
    "migrate:create": "migrate-mongo create"
  }
}
```

### Programmatic Execution

```typescript
// src/database/migration.runner.ts
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { database, up, status } from "migrate-mongo";

@Injectable()
export class MigrationRunner implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunner.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get("RUN_MIGRATIONS") !== "true") {
      return;
    }

    try {
      const { db, client } = await database.connect();

      // Check pending migrations
      const pendingMigrations = await status(db);
      const pending = pendingMigrations.filter(
        (m) => m.appliedAt === "PENDING",
      );

      if (pending.length > 0) {
        this.logger.log(`Running ${pending.length} pending migrations...`);
        const migrated = await up(db, client);
        migrated.forEach((m) => this.logger.log(`Migrated: ${m}`));
      } else {
        this.logger.log("No pending migrations");
      }

      await client.close();
    } catch (error) {
      this.logger.error("Migration failed", error);
      throw error;
    }
  }
}
```

---

## Large Dataset Migrations

### Batch Processing

```typescript
// Process large collections in batches
export async function up(db: Db): Promise<void> {
  const batchSize = 1000;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const docs = await db
      .collection("attendance")
      .find({ workingHours: { $exists: false } })
      .limit(batchSize)
      .toArray();

    if (docs.length === 0) {
      hasMore = false;
      continue;
    }

    const bulkOps = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            workingHours: calculateWorkingHours(
              doc.checkInDateTime,
              doc.checkOutDateTime,
            ),
          },
        },
      },
    }));

    await db.collection("attendance").bulkWrite(bulkOps);
    processed += docs.length;
    console.log(`Processed ${processed} documents...`);
  }

  console.log(`Migration complete. Total processed: ${processed}`);
}

function calculateWorkingHours(checkIn?: number, checkOut?: number): number {
  if (!checkIn || !checkOut) return 0;
  return (checkOut - checkIn) / (1000 * 60 * 60);
}
```

### Parallel Processing with Aggregation

```typescript
// Use aggregation pipeline for complex transformations
export async function up(db: Db): Promise<void> {
  await db
    .collection("attendance")
    .aggregate([
      {
        $match: {
          checkOutDateTime: { $exists: true },
          workingHours: { $exists: false },
        },
      },
      {
        $addFields: {
          workingHours: {
            $divide: [
              { $subtract: ["$checkOutDateTime", "$checkInDateTime"] },
              3600000, // Convert ms to hours
            ],
          },
        },
      },
      {
        $merge: {
          into: "attendance",
          whenMatched: "merge",
        },
      },
    ])
    .toArray();
}
```

---

## Zero-Downtime Migration Strategy

### Phase 1: Add New Field (Backward Compatible)

```typescript
// Migration 1: Add new field, keep old field
export async function up(db: Db): Promise<void> {
  // Add new field with data from old field
  await db
    .collection("users")
    .updateMany({ fullName: { $exists: false }, name: { $exists: true } }, [
      { $set: { fullName: "$name" } },
    ]);
}
```

### Phase 2: Update Application Code

```typescript
// Update schema to use both fields during transition
@Schema()
export class User {
  @Prop() // Old field (deprecated)
  name?: string;

  @Prop() // New field
  fullName?: string;
}

// Service reads from new field, falls back to old
getName(user: UserDocument): string {
  return user.fullName || user.name || '';
}
```

### Phase 3: Remove Old Field

```typescript
// Migration 2: Remove old field after code is updated
export async function up(db: Db): Promise<void> {
  await db
    .collection("users")
    .updateMany({ name: { $exists: true } }, { $unset: { name: "" } });
}
```

---

## Testing Migrations

```typescript
// src/database/migrations/__tests__/add-user-timezone.spec.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { up, down } from "../20250129120000-add-user-timezone";

describe("add-user-timezone migration", () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongod.getUri());
    db = client.db("test");
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await db.collection("users").deleteMany({});
  });

  it("should add timezone to users without one", async () => {
    // Setup
    await db
      .collection("users")
      .insertMany([
        { username: "user1" },
        { username: "user2", timezone: "UTC" },
      ]);

    // Execute
    await up(db);

    // Verify
    const users = await db.collection("users").find({}).toArray();
    expect(users[0].timezone).toBe("Asia/Bangkok");
    expect(users[1].timezone).toBe("UTC"); // Unchanged
  });

  it("should remove timezone on rollback", async () => {
    // Setup
    await db
      .collection("users")
      .insertOne({ username: "user1", timezone: "Asia/Bangkok" });

    // Execute
    await down(db);

    // Verify
    const user = await db.collection("users").findOne({ username: "user1" });
    expect(user?.timezone).toBeUndefined();
  });
});
```

---

## Best Practices

### DO

- Always write `down` migrations for rollback
- Test migrations on a copy of production data
- Use batch processing for large collections
- Run migrations during low-traffic periods
- Keep migrations idempotent (safe to run multiple times)
- Version control migration files

### DON'T

- Modify existing migration files after deployment
- Run untested migrations in production
- Delete migration files (keep history)
- Assume migrations are instant (plan for duration)
- Skip the changelog collection

---

## CI/CD Integration

```yaml
# .github/workflows/deploy.yml
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run migrations
        env:
          MONGO_URL: ${{ secrets.MONGO_URL }}
        run: |
          npm ci
          npm run migrate:up

      - name: Verify migration status
        run: npm run migrate:status
```

---

## Related Steering Files

- `schema-design.md` - Schema patterns
- `repository-pattern.md` - Data access
- `transactions.md` - ACID operations
