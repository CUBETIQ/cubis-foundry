# Example: Basic Schema Design

## Scenario

A startup is building a SaaS task management application. They need a PostgreSQL database schema to support users, workspaces, projects, and tasks. Users can belong to multiple workspaces with different roles. Tasks have assignees, due dates, and status tracking. The team expects moderate traffic (100-500 concurrent users) and wants a clean, normalized design they can evolve over time.

## Prompt

"Design a PostgreSQL schema for a task management app. Users can join multiple workspaces with roles (owner, admin, member). Workspaces contain projects. Projects contain tasks with assignees, statuses, and due dates. Include constraints, indexes for common queries, and migration scripts."

## Expected Output

### Entity-Relationship Summary

```
User ──< WorkspaceMember >── Workspace
                                  │
                                  └──< Project ──< Task >── User (assignee)
```

### DDL Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- Workspaces
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- Workspace membership (M:N with role)
CREATE TABLE workspace_members (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL DEFAULT 'member'
               CHECK (role IN ('owner', 'admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX ix_workspace_members_workspace ON workspace_members(workspace_id);

-- Projects
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  archived     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ
);

CREATE INDEX ix_projects_workspace ON projects(workspace_id);

-- Task status enum
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'done', 'cancelled');

-- Tasks
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  status       task_status NOT NULL DEFAULT 'backlog',
  priority     SMALLINT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 4),
  assignee_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ
);

CREATE INDEX ix_tasks_project ON tasks(project_id);
CREATE INDEX ix_tasks_assignee ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX ix_tasks_project_status ON tasks(project_id, status);
```

### Migration Script

```sql
-- UP
BEGIN;
-- Execute all CREATE statements above in order
COMMIT;

-- DOWN
BEGIN;
DROP TABLE IF EXISTS tasks;
DROP TYPE IF EXISTS task_status;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;
COMMIT;
```

### Common Query Patterns and Their Indexes

| Query Pattern | Index Used |
|---|---|
| Fetch all projects in a workspace | `ix_projects_workspace` |
| Fetch tasks for a project filtered by status | `ix_tasks_project_status` (composite) |
| Fetch all tasks assigned to a user | `ix_tasks_assignee` (partial, non-null) |
| List members of a workspace | `workspace_members` PK + `ix_workspace_members_workspace` |

## Key Decisions

- **UUID primary keys** — safe for distributed ID generation, no sequence contention, URL-friendly.
- **Composite primary key on junction table** — enforces one membership per user-workspace pair and doubles as the clustered index.
- **CHECK constraint on role** — database-level enforcement prevents invalid roles without relying on application validation.
- **Partial index on assignee** — skips NULL rows, reducing index size by the proportion of unassigned tasks.
- **Composite index on (project_id, status)** — serves the most common query (filtered task list) with a single index scan.
- **TIMESTAMPTZ over TIMESTAMP** — stores UTC and handles timezone conversion at query time, preventing timezone bugs.
