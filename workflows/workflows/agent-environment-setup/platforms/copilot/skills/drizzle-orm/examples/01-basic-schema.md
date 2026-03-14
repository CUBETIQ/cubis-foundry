# Example: Basic Schema Definition and Queries

## Scenario

A team is building a project management API with Drizzle ORM and PostgreSQL. They need a schema for users, teams, and projects with basic CRUD queries. The application runs on Node.js with the `postgres` driver.

## Prompt

"Help me set up a Drizzle schema for a project management app. I need users, teams, and projects tables. Users belong to teams, and projects belong to teams. Include basic queries for creating users, fetching a team's projects, and updating a project name."

## Expected Output

### Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Schema Definitions

```typescript
// src/db/schema/teams.ts
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
  projects: many(projects),
}));
```

```typescript
// src/db/schema/users.ts
import { pgTable, serial, varchar, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { teams } from "./teams";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    teamId: integer("team_id").references(() => teams.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ix_users_email").on(table.email)]
);

export const usersRelations = relations(users, ({ one }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));
```

```typescript
// src/db/schema/projects.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { teams } from "./teams";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  teamId: integer("team_id").notNull().references(() => teams.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
}));
```

```typescript
// src/db/schema/index.ts
export * from "./teams";
export * from "./users";
export * from "./projects";
```

### Database Instance

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Basic Queries

```typescript
import { db } from "./db";
import { users, teams, projects } from "./db/schema";
import { eq } from "drizzle-orm";

// Create a user
const [newUser] = await db.insert(users).values({
  email: "alice@example.com",
  displayName: "Alice",
  teamId: 1,
}).returning();

// Fetch a team with its projects using relational query API
const teamWithProjects = await db.query.teams.findFirst({
  where: eq(teams.id, 1),
  with: { projects: true },
});

// Update a project name
await db.update(projects)
  .set({ name: "New Project Name", updatedAt: new Date() })
  .where(eq(projects.id, 5));

// Type inference
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
```

## Key Decisions

- **`serial` for primary keys** — simpler than UUID for a non-distributed system, avoids index fragmentation.
- **`relations()` declared separately from tables** — required for the relational query API (`db.query.*`).
- **`$inferSelect` and `$inferInsert`** — derived types from the schema eliminate manual interface drift.
- **`withTimezone: true` on timestamps** — prevents timezone-related bugs when the server and database are in different zones.
- **Schema organized per entity** — one file per domain table with its relations, re-exported from `index.ts`.
