# Schema Definition

Load this when defining or refactoring Drizzle table schemas, column types, constraints, relations, or type inference patterns.

## Table definition patterns

### Postgres

```typescript
import {
  pgTable, serial, text, varchar, integer, boolean,
  timestamp, uuid, pgEnum, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// Enum definition (Postgres native ENUM)
export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    bio: text("bio"),  // nullable by default
    role: roleEnum("role").notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ix_users_email").on(table.email),
  ]
);
```

### SQLite

```typescript
import {
  sqliteTable, integer, text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["admin", "member", "viewer"] })
    .notNull()
    .default("member"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

- Postgres uses `pgTable`, SQLite uses `sqliteTable`, MySQL uses `mysqlTable`. Never mix them.
- SQLite has no native boolean or timestamp. Use `integer` with `mode` to get type-safe wrappers.
- Column names in quotes are the database column names. The object key is the TypeScript property name.

## Type inference

```typescript
// Infer types directly from schema — never define interfaces manually
export type User = typeof users.$inferSelect;        // SELECT result type
export type NewUser = typeof users.$inferInsert;      // INSERT input type

// Use with function signatures
async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Partial updates
type UserUpdate = Partial<Omit<NewUser, "id" | "createdAt">>;
```

- `$inferSelect` includes all columns with their nullability.
- `$inferInsert` omits columns with defaults (serial, defaultNow, etc.) and makes them optional.
- Never create manual `interface User { ... }`. It will drift from the schema.

## Relations

```typescript
import { relations } from "drizzle-orm";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  teamId: integer("team_id").references(() => teams.id),
});

// Relation declarations (separate from table definitions)
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));
```

### Relation rules

- `one()` = many-to-one or one-to-one. Requires `fields` and `references`.
- `many()` = one-to-many. No `fields`/`references` needed (inferred from the other side).
- Relations are declared separately from tables. They do NOT create database constraints.
- Foreign keys (`.references()`) create database constraints. Relations are for the query API.
- You need BOTH: `.references()` on the column for database integrity, `relations()` for the query API.

## Many-to-many with junction table

```typescript
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
});

export const usersToProjects = pgTable(
  "users_to_projects",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
  },
  (table) => [
    // Composite primary key
    { primaryKey: { columns: [table.userId, table.projectId] } },
  ]
);

export const usersToProjectsRelations = relations(
  usersToProjects,
  ({ one }) => ({
    user: one(users, {
      fields: [usersToProjects.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [usersToProjects.projectId],
      references: [projects.id],
    }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(usersToProjects),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(usersToProjects),
}));
```

- Drizzle does not have implicit M2M like Prisma. You always define the junction table.
- Query through the junction: `db.query.users.findMany({ with: { projects: { with: { project: true } } } })`.

## Constraints and indexes

```typescript
import { primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: integer("entity_id").notNull(),
    tenantId: integer("tenant_id").notNull(),
    action: varchar("action", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ix_audit_entity").on(table.entityType, table.entityId),
    uniqueIndex("ix_audit_tenant_entity").on(
      table.tenantId, table.entityType, table.entityId
    ),
  ]
);
```

- Always name indexes and constraints explicitly. Autogenerated names differ across databases.
- Use composite indexes for queries that filter on multiple columns together.

## UUID primary keys

```typescript
import { uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 300 }).notNull(),
});
```

- `defaultRandom()` generates UUID v4 at the database level.
- For time-sortable UUIDs (UUID v7), use `$defaultFn(() => uuidv7())` with a library.

## Schema organization

```
src/
  db/
    schema/
      users.ts        # users table + relations
      teams.ts        # teams table + relations
      projects.ts     # projects table + relations
      index.ts        # re-exports all tables and relations
    index.ts          # drizzle() instance
    migrate.ts        # migration runner
drizzle/
  migrations/         # generated migration SQL files
drizzle.config.ts     # drizzle-kit configuration
```

- One file per domain entity (table + its relations).
- Re-export from `schema/index.ts` so drizzle-kit can find all tables.
- Keep the `drizzle()` instance in a separate file from schema definitions.
