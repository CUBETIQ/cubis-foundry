# Example: MCP Server with Streaming, Resources, and Auth

## Scenario

A team is building an MCP server for a database administration tool that connects to a PostgreSQL database. The server exposes tools for running queries (with progress reporting for long operations), resource providers for database schema documentation, and prompt templates for common database tasks. It uses streamable HTTP transport for remote access by multiple agents, includes API key authentication, and implements comprehensive logging.

## Prompt

"Build an MCP server for database administration with: (1) query tool with progress reporting for long-running operations, (2) resource providers for table schemas and ERD documentation, (3) prompt templates for common SQL tasks, (4) streamable HTTP transport with API key authentication, (5) structured error handling and audit logging."

## Expected Output

### Server with HTTP Transport and Auth

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { Pool } from 'pg';
import { logger } from './logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const server = new McpServer({
  name: 'db-admin',
  version: '1.0.0',
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
});
```

### Authentication Middleware

```typescript
// src/auth.ts
import { Request, Response, NextFunction } from 'express';

const VALID_API_KEYS = new Set(
  (process.env.MCP_API_KEYS ?? '').split(',').filter(Boolean)
);

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    logger.warn('Authentication failed', {
      ip: req.ip,
      path: req.path,
      hasKey: !!apiKey,
    });
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  next();
}
```

### Query Tool with Progress Reporting

```typescript
// Tool: run-query
server.tool(
  'run-query',
  'Execute a read-only SQL query against the database. Returns results as JSON. This is a read-only operation.',
  {
    sql: z.string().min(1).describe('SQL query to execute (SELECT only)'),
    limit: z.number().int().min(1).max(1000).default(100).describe('Maximum rows to return'),
  },
  async ({ sql, limit }, { sendNotification }) => {
    const startTime = Date.now();

    // Safety: reject non-SELECT queries
    const normalized = sql.trim().toLowerCase();
    if (!normalized.startsWith('select') && !normalized.startsWith('with') && !normalized.startsWith('explain')) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Only SELECT, WITH, and EXPLAIN queries are allowed.',
          }),
        }],
        isError: true,
      };
    }

    try {
      // Report progress: starting
      await sendNotification({
        method: 'notifications/progress',
        params: { progressToken: 'query', progress: 0, total: 100, message: 'Executing query...' },
      });

      const result = await pool.query(`${sql} LIMIT $1`, [limit]);

      // Report progress: complete
      await sendNotification({
        method: 'notifications/progress',
        params: { progressToken: 'query', progress: 100, total: 100, message: 'Query complete' },
      });

      const duration = Date.now() - startTime;

      logger.info('Query executed', {
        sql: sql.substring(0, 200),
        rowCount: result.rowCount,
        durationMs: duration,
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            rowCount: result.rowCount,
            columns: result.fields.map(f => f.name),
            rows: result.rows,
            durationMs: duration,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      logger.error('Query failed', { sql: sql.substring(0, 200), error: error.message });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            hint: error.hint ?? null,
            position: error.position ?? null,
          }, null, 2),
        }],
        isError: true,
      };
    }
  }
);

// Tool: describe-table
server.tool(
  'describe-table',
  'Get the column definitions, constraints, and indexes for a specific table.',
  {
    table: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_.]*$/).describe('Table name (schema.table or just table)'),
  },
  async ({ table }) => {
    const [schema, tableName] = table.includes('.')
      ? table.split('.')
      : ['public', table];

    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default,
             character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName]);

    const indexesResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2
    `, [schema, tableName]);

    if (columnsResult.rowCount === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: false, error: `Table "${table}" not found.` }),
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          table: `${schema}.${tableName}`,
          columns: columnsResult.rows,
          indexes: indexesResult.rows,
        }, null, 2),
      }],
    };
  }
);

// Tool: analyze-slow-queries (long-running with progress)
server.tool(
  'analyze-slow-queries',
  'Analyze the database for slow queries using pg_stat_statements. Returns the top N slowest queries.',
  {
    topN: z.number().int().min(1).max(50).default(10).describe('Number of slow queries to return'),
  },
  async ({ topN }, { sendNotification }) => {
    await sendNotification({
      method: 'notifications/progress',
      params: { progressToken: 'analyze', progress: 10, total: 100, message: 'Querying pg_stat_statements...' },
    });

    const result = await pool.query(`
      SELECT query, calls, mean_exec_time, total_exec_time, rows
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT $1
    `, [topN]);

    await sendNotification({
      method: 'notifications/progress',
      params: { progressToken: 'analyze', progress: 100, total: 100, message: 'Analysis complete' },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          slowQueries: result.rows.map(r => ({
            query: r.query.substring(0, 500),
            calls: r.calls,
            avgTimeMs: Math.round(r.mean_exec_time * 100) / 100,
            totalTimeMs: Math.round(r.total_exec_time * 100) / 100,
            avgRows: r.rows / r.calls,
          })),
        }, null, 2),
      }],
    };
  }
);
```

### Resource Providers

```typescript
// Resource: database schema overview
server.resource(
  'schema-overview',
  'db://schema/overview',
  'Complete database schema overview with all tables, their row counts, and sizes.',
  async () => {
    const result = await pool.query(`
      SELECT
        schemaname || '.' || relname AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);

    const content = result.rows.map(r =>
      `| ${r.table_name} | ${r.row_count.toLocaleString()} rows | ${r.total_size} |`
    ).join('\n');

    return {
      contents: [{
        uri: 'db://schema/overview',
        mimeType: 'text/markdown',
        text: `# Database Schema Overview\n\n| Table | Rows | Size |\n|-------|------|------|\n${content}`,
      }],
    };
  }
);

// Resource template: table details
server.resource(
  'table-schema',
  'db://schema/table/{tableName}',
  'Detailed schema for a specific table including columns, types, constraints, and indexes.',
  async (uri) => {
    const tableName = uri.pathname.split('/').pop()!;
    const [schema, table] = tableName.includes('.')
      ? tableName.split('.')
      : ['public', tableName];

    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, table]);

    const text = columns.rows.map(c =>
      `- **${c.column_name}**: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ` DEFAULT ${c.column_default}` : ''}`
    ).join('\n');

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: `# Table: ${schema}.${table}\n\n## Columns\n\n${text}`,
      }],
    };
  }
);
```

### Prompt Templates

```typescript
// Prompt: optimize-query
server.prompt(
  'optimize-query',
  'Analyze and optimize a slow SQL query using EXPLAIN ANALYZE output.',
  [
    { name: 'query', description: 'The SQL query to optimize', required: true },
  ],
  async ({ query }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Analyze this SQL query for performance issues and suggest optimizations.

Query:
\`\`\`sql
${query}
\`\`\`

Steps:
1. Use the describe-table tool to understand the table schemas involved.
2. Use the run-query tool with EXPLAIN ANALYZE to see the execution plan.
3. Identify bottlenecks (sequential scans, nested loops, missing indexes).
4. Suggest specific optimizations (indexes, query rewrites, schema changes).
5. Estimate the expected improvement for each suggestion.`,
        },
      },
    ],
  })
);
```

### HTTP Transport Setup

```typescript
// src/http-server.ts
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateRequest } from './auth.js';

const app = express();

app.use(authenticateRequest);

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport('/mcp');
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

app.get('/mcp', async (req, res) => {
  // SSE endpoint for server-to-client notifications
  const transport = new StreamableHTTPServerTransport('/mcp');
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

const port = process.env.PORT ?? 3100;
app.listen(port, () => {
  logger.info(`DB Admin MCP server listening on port ${port}`);
});
```

### Audit Logger

```typescript
// src/logger.ts
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: Record<string, any>;
}

export const logger = {
  info(message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data,
    };
    console.error(JSON.stringify(entry));
  },

  warn(message: string, data?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message, data }));
  },

  error(message: string, data?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message, data }));
  },
};
```

## Key Decisions

- **Read-only query validation** -- the `run-query` tool only allows SELECT, WITH, and EXPLAIN queries, preventing destructive operations from agent errors. Separate write tools would require explicit confirmation.
- **Progress notifications for long operations** -- `analyze-slow-queries` and `run-query` send progress updates so the agent and user know the operation is active, preventing premature timeout or retry.
- **Resources for schema documentation** -- database schema is read-only context that agents reference during reasoning. Using resources (not tools) signals that this data informs the agent without side effects.
- **URI templates for per-table resources** -- `db://schema/table/{tableName}` lets agents request schema for specific tables without the server enumerating all tables upfront.
- **Prompt templates for workflows** -- the `optimize-query` prompt encodes expert knowledge about the sequence of tool calls needed for query optimization, reducing the agent's trial-and-error exploration.
- **Streamable HTTP transport** -- enables remote access from multiple agents simultaneously, unlike stdio which is limited to a single client process. Supports SSE for server-push notifications.
- **API key authentication** -- simple but effective for server-to-server access. The middleware runs before MCP protocol handling, rejecting unauthenticated requests at the HTTP layer.
- **Structured logging to stderr** -- MCP uses stdout for protocol messages, so all logging goes to stderr. JSON format enables log aggregation and search in production.
