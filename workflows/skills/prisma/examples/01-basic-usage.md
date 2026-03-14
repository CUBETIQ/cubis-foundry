# Example: Multi-Tenant Schema with Relations, Enums, and Migration Workflow

## Scenario

A team is building a project management SaaS with Prisma 6 and PostgreSQL. Organizations have members with roles, projects with tasks, and tasks with priority and status enums. The team needs a schema that enforces uniqueness constraints, includes performance indexes, and follows a proper migration workflow from initial setup through additive feature changes.

## Prompt

"Design a Prisma schema for a multi-tenant project management app. Organizations have members (users belong to multiple orgs with roles). Projects belong to organizations. Tasks have an assignee, priority (low/medium/high/urgent), status (todo/in_progress/review/done), and due date. Add indexes for common queries. Show the migration commands for initial setup and for adding a labels feature."

## Expected Output

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  memberships    OrganizationMember[]
  assignedTasks  Task[]               @relation("TaskAssignee")

  @@map("users")
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  members  OrganizationMember[]
  projects Project[]

  @@map("organizations")
}

model OrganizationMember {
  id             String     @id @default(cuid())
  role           MemberRole @default(MEMBER)
  joinedAt       DateTime   @default(now()) @map("joined_at")

  userId         String     @map("user_id")
  organizationId String     @map("organization_id")

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("organization_members")
}

model Project {
  id             String   @id @default(cuid())
  name           String
  description    String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organizationId String   @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  tasks Task[]

  @@index([organizationId])
  @@map("projects")
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  priority    TaskPriority @default(MEDIUM)
  status      TaskStatus   @default(TODO)
  dueDate     DateTime?    @map("due_date")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  projectId  String  @map("project_id")
  assigneeId String? @map("assignee_id")

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?   @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  labels TaskLabel[]

  @@index([status])
  @@index([assigneeId])
  @@index([dueDate])
  @@index([projectId])
  @@map("tasks")
}

model Label {
  id             String @id @default(cuid())
  name           String
  color          String @default("#6B7280")

  organizationId String @map("organization_id")

  tasks TaskLabel[]

  @@unique([name, organizationId])
  @@index([organizationId])
  @@map("labels")
}

model TaskLabel {
  taskId  String @map("task_id")
  labelId String @map("label_id")

  task  Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
  @@map("task_labels")
}
```

### Migration Workflow

```bash
# Initial setup: generate and apply the first migration
npx prisma migrate dev --name init

# Review the generated SQL before committing
cat prisma/migrations/20260101000000_init/migration.sql

# After adding the Label and TaskLabel models:
npx prisma migrate dev --name add-labels

# Regenerate the Prisma Client to pick up new types
npx prisma generate

# In CI/CD and production: apply pending migrations without generating new ones
npx prisma migrate deploy

# Seed the database with initial data
npx prisma db seed
```

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Acme Corp",
      slug: "acme-corp",
      members: {
        create: {
          role: "OWNER",
          user: {
            create: {
              email: "admin@acme.com",
              name: "Admin User",
            },
          },
        },
      },
      projects: {
        create: {
          name: "Website Redesign",
          description: "Redesign the company website",
        },
      },
    },
  });

  console.log(`Seeded organization: ${org.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

## Key Decisions

- **`@@unique([userId, organizationId])`** -- prevents duplicate memberships at the database level. Application-level checks race under concurrent requests.
- **`@map` and `@@map`** -- decouples PascalCase/camelCase Prisma names from snake_case database conventions, making the TypeScript client idiomatic while preserving existing database naming.
- **Enums in schema** -- `TaskPriority` and `TaskStatus` generate Postgres ENUM types, enforcing valid values at the database layer where direct SQL access cannot bypass validation.
- **`@@index([status])`, `@@index([assigneeId])`, `@@index([dueDate])`** -- covers the three most common task query patterns (filter by status, filter by assignee, sort by due date).
- **`onDelete: Cascade` vs `onDelete: SetNull`** -- deleting an organization cascades to all its data. Deleting a user sets task `assigneeId` to null rather than deleting the task.
- **Two-step migration** -- `init` creates the base schema, `add-labels` adds the labels feature. Each migration is a separate reviewed SQL file in version control.
