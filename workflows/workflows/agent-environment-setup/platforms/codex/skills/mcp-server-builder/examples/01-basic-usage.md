# Example: Basic MCP Server with CRUD Tools

## Scenario

A team is building an MCP server that exposes CRUD operations for a task management system. The server should register tools for creating, reading, updating, and deleting tasks, with JSON Schema input validation on every tool. The server uses stdio transport for local development with Claude Code. Each tool returns structured output with consistent field naming so the AI agent can parse results reliably.

## Prompt

"Build an MCP server for task management with CRUD tools: create-task, list-tasks, get-task, update-task, delete-task. Use stdio transport. Validate all inputs with JSON Schema. Return structured responses with consistent fields. Include error handling for not-found and validation failures."

## Expected Output

### Server Setup

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// In-memory store (replace with database in production)
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

const tasks = new Map<string, Task>();
let nextId = 1;

const server = new McpServer({
  name: 'task-manager',
  version: '1.0.0',
});
```

### Tool Registration

```typescript
// Create Task
server.tool(
  'create-task',
  'Create a new task with a title, description, priority, and initial status.',
  {
    title: z.string().min(1).max(200).describe('Task title'),
    description: z.string().max(2000).default('').describe('Task description'),
    priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Task priority'),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo').describe('Initial status'),
  },
  async ({ title, description, priority, status }) => {
    const id = `task-${nextId++}`;
    const now = new Date().toISOString();

    const task: Task = {
      id,
      title,
      description,
      status,
      priority,
      createdAt: now,
      updatedAt: now,
    };

    tasks.set(id, task);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task,
            message: `Task "${title}" created with ID ${id}.`,
          }, null, 2),
        },
      ],
    };
  }
);

// List Tasks
server.tool(
  'list-tasks',
  'List all tasks, optionally filtered by status or priority.',
  {
    status: z.enum(['todo', 'in_progress', 'done']).optional().describe('Filter by status'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
  },
  async ({ status, priority }) => {
    let filtered = Array.from(tasks.values());

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: filtered.length,
            tasks: filtered,
          }, null, 2),
        },
      ],
    };
  }
);

// Get Task
server.tool(
  'get-task',
  'Get a single task by its ID.',
  {
    id: z.string().describe('Task ID (e.g., task-1)'),
  },
  async ({ id }) => {
    const task = tasks.get(id);

    if (!task) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Task with ID "${id}" not found.`,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, task }, null, 2),
        },
      ],
    };
  }
);

// Update Task
server.tool(
  'update-task',
  'Update an existing task. Only provided fields are changed. This modifies the task.',
  {
    id: z.string().describe('Task ID to update'),
    title: z.string().min(1).max(200).optional().describe('New title'),
    description: z.string().max(2000).optional().describe('New description'),
    status: z.enum(['todo', 'in_progress', 'done']).optional().describe('New status'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('New priority'),
  },
  async ({ id, title, description, status, priority }) => {
    const task = tasks.get(id);

    if (!task) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Task with ID "${id}" not found.`,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    task.updatedAt = new Date().toISOString();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task,
            message: `Task "${id}" updated.`,
          }, null, 2),
        },
      ],
    };
  }
);

// Delete Task
server.tool(
  'delete-task',
  'Permanently delete a task by its ID. This action cannot be undone.',
  {
    id: z.string().describe('Task ID to delete'),
  },
  async ({ id }) => {
    const task = tasks.get(id);

    if (!task) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Task with ID "${id}" not found.`,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    tasks.delete(id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Task "${task.title}" (${id}) deleted.`,
          }, null, 2),
        },
      ],
    };
  }
);
```

### Server Startup

```typescript
// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Task Manager MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
```

### Package Configuration

```json
// package.json
{
  "name": "mcp-task-manager",
  "version": "1.0.0",
  "type": "module",
  "bin": { "mcp-task-manager": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0"
  }
}
```

### Claude Code Configuration

```json
// .claude/settings.json (or ~/.claude/settings.json)
{
  "mcpServers": {
    "task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-task-manager/dist/index.js"]
    }
  }
}
```

## Key Decisions

- **Zod schemas for input validation** -- the MCP SDK accepts Zod schemas directly and converts them to JSON Schema for the protocol, providing type-safe handlers and automatic validation.
- **Structured JSON in text content** -- returning `JSON.stringify` output with consistent fields (`success`, `task`, `message`, `error`) lets agents parse results reliably and chain tool calls.
- **`isError: true` for error responses** -- signals to the agent that the tool call failed, enabling appropriate error handling in the agent's reasoning loop.
- **Descriptive tool names and descriptions** -- agents select tools based on name and description. Action-oriented names like `create-task` and `delete-task` are more discoverable than `task-crud`.
- **Explicit destructive marking** -- the delete tool's description says "cannot be undone" so agents apply appropriate caution before invoking it.
- **stdio transport** -- simplest for local development and Claude Code integration. No network configuration needed.
