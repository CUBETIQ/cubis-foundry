# Example: Advanced Migrations and Relations

## Scenario

A SaaS application needs to evolve its Drizzle schema. The team must add a multi-tenant structure with organizations, handle a many-to-many relationship between users and organizations with roles, create a custom enum, and write a data migration that backfills existing users into a default organization. The team uses PostgreSQL and `drizzle-kit` for migrations.

## Prompt

"I need to add multi-tenancy to my Drizzle app. Create an organizations table, a junction table linking users to organizations with roles, add a custom status enum, and show me how to write a migration that backfills existing users into a default org. I want both the drizzle-kit workflow and a custom data migration."

## Expected Output

### New Schema Additions

```typescript
// src/db/schema/organizations.ts
import {
  pgTable, serial, varchar, timestamp, pgEnum, integer, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orgStatusEnum = pgEnum("org_status", ["active", "suspended", "archived"]);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: orgStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(orgMemberships),
}));
```

```typescript
// src/db/schema/org-memberships.ts
import {
  pgTable, integer, varchar, timestamp, primaryKey, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { organizations } from "./organizations";

export const orgMemberships = pgTable(
  "org_memberships",
  {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orgId: integer("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.orgId] }),
    index("ix_org_memberships_org").on(table.orgId),
  ]
);

export const orgMembershipsRelations = relations(orgMemberships, ({ one }) => ({
  user: one(users, { fields: [orgMemberships.userId], references: [users.id] }),
  organization: one(organizations, { fields: [orgMemberships.orgId], references: [organizations.id] }),
}));
```

### Step 1: Generate the structural migration

```bash
# Generate migration from schema diff
npx drizzle-kit generate

# This creates a file like: drizzle/migrations/0003_add_organizations.sql
# containing CREATE TYPE, CREATE TABLE, and index statements.
```

### Step 2: Review the generated migration

```sql
-- drizzle/migrations/0003_add_organizations.sql (auto-generated, reviewed)
CREATE TYPE "org_status" AS ENUM ('active', 'suspended', 'archived');

CREATE TABLE "organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "status" "org_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone
);

CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" ("slug");

CREATE TABLE "org_memberships" (
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "role" varchar(20) DEFAULT 'member' NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("user_id", "org_id")
);

CREATE INDEX "ix_org_memberships_org" ON "org_memberships" ("org_id");
```

### Step 3: Write a custom data migration

```typescript
// scripts/migrate-backfill-default-org.ts
import { db } from "../src/db";
import { organizations, orgMemberships } from "../src/db/schema";
import { users } from "../src/db/schema";

async function backfillDefaultOrg() {
  await db.transaction(async (tx) => {
    // 1. Create the default organization
    const [defaultOrg] = await tx
      .insert(organizations)
      .values({ name: "Default Organization", slug: "default" })
      .returning();

    // 2. Fetch all existing users
    const allUsers = await tx.select({ id: users.id }).from(users);

    // 3. Batch insert memberships (500 at a time to avoid parameter limits)
    const batchSize = 500;
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      await tx.insert(orgMemberships).values(
        batch.map((u) => ({
          userId: u.id,
          orgId: defaultOrg.id,
          role: "member" as const,
        }))
      );
    }

    console.log(`Backfilled ${allUsers.length} users into default org.`);
  });
}

backfillDefaultOrg().catch(console.error).finally(() => process.exit());
```

### Step 4: Apply and verify

```bash
# Apply the structural migration
npx drizzle-kit migrate

# Run the data backfill
npx tsx scripts/migrate-backfill-default-org.ts

# Verify: check migration status
npx drizzle-kit check
```

### Querying many-to-many relations

```typescript
// Fetch a user with all their organizations
const userWithOrgs = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    memberships: {
      with: { organization: true },
    },
  },
});

// Access: userWithOrgs.memberships[0].organization.name
// Access: userWithOrgs.memberships[0].role

// Fetch all members of an organization
const orgMembers = await db.query.organizations.findFirst({
  where: eq(organizations.id, orgId),
  with: {
    memberships: {
      with: { user: true },
    },
  },
});
```

## Key Decisions

- **`pgEnum` for status** — uses PostgreSQL native ENUM, enforced at the database level, fully typed in Drizzle.
- **Composite primary key on junction table** — prevents duplicate memberships and serves as the clustered index.
- **Separate data migration script** — drizzle-kit auto-generated migrations handle DDL but not data transformations. Custom scripts wrapped in `db.transaction()` ensure atomicity.
- **Batch inserts in data migration** — PostgreSQL has a parameter limit (~65535). Batching prevents exceeding it for large user tables.
- **`onDelete: "cascade"` on junction foreign keys** — removing a user or org automatically cleans up memberships.
- **`drizzle-kit generate` then review** — never run `drizzle-kit push` in production. Always generate, review, then apply.
