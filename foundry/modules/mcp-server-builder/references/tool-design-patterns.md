# Tool Design Patterns

Load this when registering tools, defining JSON Schema inputs, structuring tool output, or naming tools for agent discoverability.

## Naming Conventions

### Action-Oriented Names

Tools should be named as verb-noun pairs that describe what the tool does.

| Good | Bad | Why |
|------|-----|-----|
| `search-issues` | `issue-manager` | Agents match intent to action, not to entity |
| `create-user` | `user-tool` | Specific action is more discoverable |
| `run-query` | `database` | Ambiguous: read? write? schema? |
| `get-file-contents` | `file` | Multiple operations need distinct tools |

### Grouping Related Tools

Use consistent prefixes for related tools:

```
project-list
project-create
project-update
project-delete
project-search
```

This helps agents discover related operations and understand the domain model.

## Input Schema Design

### Use Zod with the MCP SDK

```typescript
import { z } from 'zod';

server.tool(
  'search-issues',
  'Search for issues by query, status, or assignee.',
  {
    query: z.string().optional().describe('Free-text search query'),
    status: z.enum(['open', 'closed', 'in_progress']).optional().describe('Filter by status'),
    assignee: z.string().optional().describe('Filter by assignee username'),
    limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
  },
  async (params) => { /* handler */ }
);
```

### Schema Best Practices

- **Add `.describe()` to every field** -- agents use descriptions to decide what values to pass.
- **Set sensible defaults** -- `limit: z.number().default(20)` prevents agents from fetching unbounded results.
- **Constrain ranges** -- `.min(1).max(100)` prevents edge-case values that break your handler.
- **Use enums for fixed options** -- `z.enum(['open', 'closed'])` tells agents the valid values.
- **Make optional fields explicit** -- `.optional()` lets agents skip fields they do not need.
- **Validate server-side even if schema is declared** -- some clients skip schema validation. Always validate in your handler.

### Complex Input Types

```typescript
server.tool(
  'create-record',
  'Create a new record with nested data.',
  {
    name: z.string().min(1),
    tags: z.array(z.string()).max(10).default([]).describe('Tags for categorization'),
    metadata: z.object({
      source: z.string().optional(),
      priority: z.number().int().min(1).max(5).default(3),
    }).optional().describe('Additional metadata'),
  },
  async (params) => { /* handler */ }
);
```

- Keep nesting shallow. Deeply nested schemas are harder for agents to construct correctly.
- Prefer flat parameters with clear names over nested objects when possible.

## Output Structure

### Consistent Response Format

```typescript
// Success response
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      success: true,
      data: result,
      message: 'Operation completed.',
    }, null, 2),
  }],
};

// Error response
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      success: false,
      error: 'Record not found.',
      code: 'NOT_FOUND',
    }, null, 2),
  }],
  isError: true,
};
```

- Always include `success: true/false` for agents to check programmatically.
- Use `isError: true` on the MCP response to signal failure to the agent framework.
- Include an actionable `message` or `error` that the agent can relay to the user.
- Use `code` fields for machine-readable error categorization.

### Multiple Content Types

```typescript
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify({ success: true, chartData: data }),
    },
    {
      type: 'image',
      data: base64PngData,
      mimeType: 'image/png',
    },
  ],
};
```

- Tool responses can include multiple content blocks.
- Use `text` for structured data and `image` for visualizations.

## Destructive vs Read-Only Tools

### Marking Destructive Tools

```typescript
server.tool(
  'delete-record',
  'Permanently delete a record by ID. This action cannot be undone and will remove all associated data.',
  { id: z.string() },
  async ({ id }) => { /* handler */ }
);
```

- Include "cannot be undone", "permanently", or "destructive" in descriptions.
- Agents use these signals to request user confirmation before invoking.
- Consider requiring a `confirm: true` parameter for destructive operations.

### Soft Delete Pattern

```typescript
server.tool(
  'archive-record',
  'Archive a record. The record will no longer appear in searches but can be restored.',
  { id: z.string() },
  async ({ id }) => { /* handler */ }
);
```

- Prefer soft delete (archive) tools over hard delete tools when possible.
- Provide a separate `restore-record` tool for recovery.

## Pagination

```typescript
server.tool(
  'list-records',
  'List records with pagination. Returns a cursor for the next page.',
  {
    cursor: z.string().optional().describe('Pagination cursor from previous response'),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async ({ cursor, limit }) => {
    const { records, nextCursor } = await db.listRecords({ cursor, limit });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          records,
          pagination: {
            nextCursor,
            hasMore: !!nextCursor,
          },
        }, null, 2),
      }],
    };
  }
);
```

- Use cursor-based pagination, not offset-based. Cursors are stable across concurrent modifications.
- Always return `hasMore` so agents know whether to request another page.
- Set a reasonable default limit to prevent agents from fetching entire datasets.

## Error Handling Patterns

```typescript
async function toolHandler(params) {
  try {
    const result = await performOperation(params);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }) }] };
  } catch (error: any) {
    // Structured error with actionable message
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          code: error.code ?? 'INTERNAL_ERROR',
          suggestion: getSuggestion(error),
        }),
      }],
      isError: true,
    };
  }
}

function getSuggestion(error: any): string | null {
  if (error.code === 'NOT_FOUND') return 'Check the ID and try list-records to find valid IDs.';
  if (error.code === 'VALIDATION') return 'Check the input parameters against the schema.';
  if (error.code === 'RATE_LIMIT') return 'Wait a moment and retry the request.';
  return null;
}
```

- Never let tools crash the server. Always catch and return structured errors.
- Include suggestions that tell the agent what to try next.
- Agents retry on errors. Make sure your tools are idempotent for safe retries.
