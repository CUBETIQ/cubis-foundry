# Testing MCP Servers

Load this when writing mock client tests, protocol compliance checks, or integration tests for MCP servers.

## Testing Strategy

### Test Layers

| Layer | What to Test | Tool |
|-------|-------------|------|
| **Unit** | Individual tool handlers, input validation, output formatting | Jest, Vitest |
| **Integration** | Full protocol lifecycle, tool invocation via MCP client | MCP Client SDK |
| **Protocol** | Capability negotiation, error responses, edge cases | Custom assertions |

## Unit Testing Tool Handlers

Extract handler logic into testable functions:

```typescript
// src/handlers/tasks.ts
export async function createTask(params: {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}): Promise<{ id: string; title: string }> {
  // Business logic here
  const task = await db.tasks.create(params);
  return { id: task.id, title: task.title };
}
```

```typescript
// src/handlers/__tests__/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTask } from '../tasks.js';

describe('createTask', () => {
  it('creates a task with required fields', async () => {
    const result = await createTask({
      title: 'Test task',
      priority: 'medium',
    });

    expect(result).toMatchObject({
      id: expect.stringMatching(/^task-/),
      title: 'Test task',
    });
  });

  it('rejects empty titles', async () => {
    await expect(
      createTask({ title: '', priority: 'low' })
    ).rejects.toThrow('Title must not be empty');
  });
});
```

## Integration Testing with MCP Client

### Test Setup

```typescript
// tests/integration/setup.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../src/server.js';

export async function createTestClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}> {
  const server = createServer(); // Your server factory function

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}
```

### Tool Invocation Tests

```typescript
// tests/integration/tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './setup.js';

describe('MCP Server Tools', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterEach(async () => {
    await cleanup();
  });

  it('lists available tools', async () => {
    const { tools } = await client.listTools();

    expect(tools).toContainEqual(
      expect.objectContaining({
        name: 'create-task',
        description: expect.stringContaining('Create'),
      })
    );
  });

  it('creates a task with valid input', async () => {
    const result = await client.callTool('create-task', {
      title: 'Integration test task',
      priority: 'high',
    });

    expect(result.isError).toBeFalsy();
    const content = JSON.parse(result.content[0].text);
    expect(content.success).toBe(true);
    expect(content.task.title).toBe('Integration test task');
    expect(content.task.priority).toBe('high');
  });

  it('returns error for missing required field', async () => {
    const result = await client.callTool('create-task', {
      // title is missing
      priority: 'low',
    });

    expect(result.isError).toBe(true);
  });

  it('handles not-found gracefully', async () => {
    const result = await client.callTool('get-task', {
      id: 'nonexistent-id',
    });

    expect(result.isError).toBe(true);
    const content = JSON.parse(result.content[0].text);
    expect(content.success).toBe(false);
    expect(content.error).toContain('not found');
  });
});
```

### Resource Provider Tests

```typescript
describe('MCP Server Resources', () => {
  it('lists available resources', async () => {
    const { resources } = await client.listResources();

    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0]).toHaveProperty('uri');
    expect(resources[0]).toHaveProperty('name');
  });

  it('reads a resource by URI', async () => {
    const result = await client.readResource('db://schema/overview');

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe('text/markdown');
    expect(result.contents[0].text).toContain('# Database Schema');
  });

  it('handles unknown resource URI', async () => {
    await expect(
      client.readResource('db://schema/nonexistent')
    ).rejects.toThrow();
  });
});
```

### Prompt Template Tests

```typescript
describe('MCP Server Prompts', () => {
  it('lists available prompts', async () => {
    const { prompts } = await client.listPrompts();

    expect(prompts).toContainEqual(
      expect.objectContaining({
        name: 'optimize-query',
      })
    );
  });

  it('generates a prompt with parameters', async () => {
    const result = await client.getPrompt('optimize-query', {
      query: 'SELECT * FROM users WHERE name LIKE "%test%"',
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content.text).toContain('SELECT * FROM users');
    expect(result.messages[0].content.text).toContain('EXPLAIN ANALYZE');
  });
});
```

## Protocol Compliance Tests

### Capability Negotiation

```typescript
it('negotiates capabilities correctly', async () => {
  const { client } = await createTestClient();

  // Server should declare its capabilities
  const serverCapabilities = client.getServerCapabilities();

  expect(serverCapabilities).toHaveProperty('tools');
  expect(serverCapabilities).toHaveProperty('resources');
});
```

### Error Response Format

```typescript
it('returns valid JSON-RPC error for invalid method', async () => {
  try {
    await client.request({ method: 'nonexistent/method' });
    throw new Error('Should have thrown');
  } catch (error: any) {
    expect(error.code).toBeDefined();
    expect(error.message).toBeDefined();
  }
});
```

## End-to-End Testing

### Testing with Claude Code (Manual)

```bash
# Start the server
node dist/index.js

# In another terminal, use Claude Code with the server configured
# Then manually test tool invocations through conversation
```

### Testing with MCP Inspector

```bash
# Use the MCP Inspector for visual protocol debugging
npx @modelcontextprotocol/inspector node dist/index.js
```

- MCP Inspector provides a web UI for invoking tools, reading resources, and inspecting protocol messages.
- Useful for debugging capability negotiation and message format issues.

## Test Fixtures and Mocking

### Database Mocking

```typescript
import { beforeEach, vi } from 'vitest';

// Mock the database module
vi.mock('../../src/db.js', () => ({
  db: {
    tasks: {
      create: vi.fn().mockResolvedValue({ id: 'task-1', title: 'Mock Task' }),
      findById: vi.fn().mockResolvedValue(null), // simulate not found
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));
```

### Environment Setup

```typescript
// tests/setup.ts
process.env.DATABASE_URL = 'postgres://test:test@localhost/test_db';
process.env.MCP_API_KEYS = 'test-key-1,test-key-2';
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test MCP Server
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

- Run integration tests in CI to catch protocol-level regressions.
- For servers with database dependencies, use Docker Compose or testcontainers for a real database in CI.
- Test with multiple Node.js versions if your server supports them.
