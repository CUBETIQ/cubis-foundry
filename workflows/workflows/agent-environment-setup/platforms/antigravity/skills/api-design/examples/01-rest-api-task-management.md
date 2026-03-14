# Example: REST API for Task Management System

## Prompt

> Design a REST API for a task management app with workspaces, projects, tasks, and comments. Tasks have assignees, due dates, priorities, and statuses. Include pagination, filtering, error responses, and an OpenAPI spec for the core endpoints.

## Response

### Resource Hierarchy

```
/v1/workspaces
/v1/workspaces/{workspaceId}/projects
/v1/workspaces/{workspaceId}/projects/{projectId}/tasks
/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments
```

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/workspaces` | List workspaces for the authenticated user |
| POST | `/v1/workspaces` | Create a new workspace |
| GET | `/v1/workspaces/{id}` | Get workspace details |
| GET | `/v1/workspaces/{wid}/projects` | List projects in a workspace |
| POST | `/v1/workspaces/{wid}/projects` | Create a project |
| GET | `/v1/workspaces/{wid}/projects/{pid}/tasks` | List tasks with filtering and pagination |
| POST | `/v1/workspaces/{wid}/projects/{pid}/tasks` | Create a task |
| PATCH | `/v1/workspaces/{wid}/projects/{pid}/tasks/{tid}` | Update task fields |
| DELETE | `/v1/workspaces/{wid}/projects/{pid}/tasks/{tid}` | Delete a task |
| POST | `/v1/workspaces/{wid}/projects/{pid}/tasks/bulk` | Bulk update tasks |

### Pagination: Cursor-Based

Request:
```
GET /v1/workspaces/ws_1/projects/proj_1/tasks?cursor=eyJpZCI6MTAwfQ&limit=25
```

Response:
```json
{
  "data": [ ... ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTI1fQ",
    "has_more": true,
    "limit": 25
  }
}
```

The cursor is an opaque base64-encoded token containing the last item's sort key. This maintains page stability when tasks are created or deleted between requests.

### Filtering

```
GET /v1/workspaces/ws_1/projects/proj_1/tasks?filter[status]=in_progress,review&filter[priority]=high,urgent&filter[assignee]=user_abc&filter[due_before]=2025-12-31&sort=-priority,due_date
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter[status]` | comma-separated enum | Filter by status: todo, in_progress, review, done |
| `filter[priority]` | comma-separated enum | Filter by priority: low, medium, high, urgent |
| `filter[assignee]` | user ID | Filter by assigned user |
| `filter[due_before]` | ISO 8601 date | Tasks due before this date |
| `filter[due_after]` | ISO 8601 date | Tasks due after this date |
| `sort` | comma-separated fields | Sort order. Prefix with `-` for descending |
| `q` | string | Full-text search across task title and description |

### Error Response: RFC 9457 Problem Details

All errors use `application/problem+json` content type:

```json
{
  "type": "https://api.taskflow.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains 2 validation errors.",
  "instance": "/v1/workspaces/ws_1/projects/proj_1/tasks",
  "errors": [
    {
      "field": "title",
      "message": "Title is required and must be between 1 and 200 characters.",
      "code": "FIELD_REQUIRED"
    },
    {
      "field": "priority",
      "message": "Priority must be one of: low, medium, high, urgent.",
      "code": "INVALID_ENUM"
    }
  ]
}
```

| HTTP Status | Problem Type | When |
|-------------|-------------|------|
| 400 | `bad-request` | Malformed JSON, invalid query parameters |
| 401 | `unauthorized` | Missing or invalid authentication token |
| 403 | `forbidden` | Authenticated but lacks permission |
| 404 | `not-found` | Resource does not exist |
| 409 | `conflict` | Concurrent modification detected |
| 422 | `validation-failed` | Request body fails validation |
| 429 | `rate-limited` | Too many requests |

### OpenAPI 3.1 Specification (Core)

```yaml
openapi: "3.1.0"
info:
  title: TaskFlow API
  version: "1.0.0"
  description: Task management API with workspaces, projects, and tasks.

servers:
  - url: https://api.taskflow.com/v1

paths:
  /workspaces/{workspaceId}/projects/{projectId}/tasks:
    get:
      operationId: listTasks
      summary: List tasks with filtering and pagination
      parameters:
        - name: workspaceId
          in: path
          required: true
          schema: { type: string }
        - name: projectId
          in: path
          required: true
          schema: { type: string }
        - name: cursor
          in: query
          schema: { type: string }
        - name: limit
          in: query
          schema: { type: integer, default: 25, maximum: 100 }
        - name: "filter[status]"
          in: query
          schema: { type: string }
        - name: "filter[priority]"
          in: query
          schema: { type: string }
      responses:
        "200":
          description: Task list with pagination
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TaskListResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"

    post:
      operationId: createTask
      summary: Create a new task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateTaskRequest"
      responses:
        "201":
          description: Task created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Task"
        "422":
          $ref: "#/components/responses/ValidationError"

components:
  schemas:
    Task:
      type: object
      required: [id, title, status, priority, createdAt]
      properties:
        id: { type: string, example: "task_abc123" }
        title: { type: string, example: "Implement cursor pagination" }
        description: { type: string, nullable: true }
        status:
          type: string
          enum: [todo, in_progress, review, done]
        priority:
          type: string
          enum: [low, medium, high, urgent]
        assigneeId: { type: string, nullable: true }
        dueDate: { type: string, format: date, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    CreateTaskRequest:
      type: object
      required: [title]
      properties:
        title: { type: string, minLength: 1, maxLength: 200 }
        description: { type: string, maxLength: 5000 }
        status: { type: string, enum: [todo, in_progress, review, done], default: todo }
        priority: { type: string, enum: [low, medium, high, urgent], default: medium }
        assigneeId: { type: string }
        dueDate: { type: string, format: date }

    TaskListResponse:
      type: object
      properties:
        data:
          type: array
          items: { $ref: "#/components/schemas/Task" }
        pagination:
          $ref: "#/components/schemas/Pagination"

    Pagination:
      type: object
      properties:
        nextCursor: { type: string, nullable: true }
        hasMore: { type: boolean }
        limit: { type: integer }

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/problem+json:
          schema: { $ref: "#/components/schemas/ProblemDetail" }
    ValidationError:
      description: Request validation failed
      content:
        application/problem+json:
          schema: { $ref: "#/components/schemas/ProblemDetail" }

    ProblemDetail:
      type: object
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
```

### Rate Limiting Headers

Every response includes:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1710432000
```
