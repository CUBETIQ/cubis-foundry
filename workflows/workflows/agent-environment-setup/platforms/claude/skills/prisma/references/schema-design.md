# Schema Design

Load this when defining models, relations, enums, indexes, composite types, `@map`/`@@map`, or multi-schema setup.

## Model Definition

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  bio       String?                         // Nullable field
  role      UserRole @default(MEMBER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  posts Post[]

  @@index([email])
  @@map("users")
}
```

### Field Modifiers

| Modifier | Effect |
| --- | --- |
| `?` after type | Nullable (maps to SQL NULL) |
| `[]` after type | List/array relation |
| `@id` | Primary key |
| `@unique` | Unique constraint |
| `@default(value)` | Default value |
| `@map("col_name")` | Map to different database column name |
| `@updatedAt` | Auto-update timestamp on every write |

## Relations

### One-to-Many

```prisma
model User {
  id    String @id @default(cuid())
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  authorId String @map("author_id")
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
}
```

- Always add `@@index` on foreign key fields. Prisma does not create indexes automatically for foreign keys.
- Use `@relation(fields: [...], references: [...])` on the side that holds the foreign key.
- `onDelete: Cascade` deletes posts when the user is deleted. `SetNull` nullifies the FK. `Restrict` prevents deletion.

### Many-to-Many (Implicit)

```prisma
model Post {
  id   String @id @default(cuid())
  tags Tag[]
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}
```

Prisma creates a hidden `_PostToTag` join table. Use this when the join table needs no extra columns.

### Many-to-Many (Explicit)

```prisma
model Post {
  id     String     @id @default(cuid())
  tags   PostTag[]
}

model Tag {
  id     String     @id @default(cuid())
  name   String     @unique
  posts  PostTag[]
}

model PostTag {
  postId    String   @map("post_id")
  tagId     String   @map("tag_id")
  assignedAt DateTime @default(now()) @map("assigned_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}
```

Use explicit M2M when the join table has extra columns (timestamps, sort order, metadata).

### Self-Relation

```prisma
model User {
  id         String @id @default(cuid())
  managerId  String? @map("manager_id")

  manager    User?  @relation("Management", fields: [managerId], references: [id])
  reports    User[] @relation("Management")
}
```

Self-relations require a relation name to disambiguate.

## Enums

```prisma
enum UserRole {
  ADMIN
  MEMBER
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}
```

- On PostgreSQL, Prisma creates a native ENUM type. Adding new values requires a migration with `ALTER TYPE`.
- On MySQL, Prisma uses an inline ENUM on the column.
- On SQLite, Prisma uses a TEXT column with a CHECK constraint.
- Never rename or remove enum values without a data migration.

## Indexes and Constraints

```prisma
model Task {
  id         String @id @default(cuid())
  title      String
  status     TaskStatus
  assigneeId String?
  projectId  String
  dueDate    DateTime?

  // Single-column indexes
  @@index([status])
  @@index([assigneeId])
  @@index([dueDate])

  // Composite index for common query pattern
  @@index([projectId, status])

  // Unique constraint
  @@unique([projectId, title])
}
```

- Create indexes for columns used in `where`, `orderBy`, and `groupBy` clauses.
- Composite indexes follow the left-prefix rule: `@@index([projectId, status])` supports queries on `projectId` alone or `projectId + status`, but not `status` alone.
- `@@unique` creates both a uniqueness constraint and an index.

## Mapping Names

```prisma
model OrganizationMember {
  id             String @id @default(cuid())
  userId         String @map("user_id")          // Column: user_id
  organizationId String @map("organization_id")  // Column: organization_id

  @@map("organization_members")                   // Table: organization_members
}
```

- Use `@map` and `@@map` to decouple Prisma's PascalCase/camelCase from the database's snake_case.
- The TypeScript client uses the Prisma names (`userId`). The database uses the mapped names (`user_id`).

## Composite Types (MongoDB Only)

```prisma
type Address {
  street String
  city   String
  zip    String
}

model User {
  id      String  @id @map("_id") @db.ObjectId
  address Address
}
```

Composite types embed structured data inside a document. They are only available with the MongoDB provider.
