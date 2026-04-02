# Transport Configuration

Load this when choosing or configuring stdio, HTTP, or SSE transport layers for MCP servers.

## Transport Overview

| Transport | Use When | Clients | Scaling |
|-----------|----------|---------|---------|
| **stdio** | Local CLI tools, single user | Claude Code, local agents | Single process |
| **Streamable HTTP** | Remote servers, multi-tenant | Any HTTP client | Horizontal |
| **SSE** | Server-push, legacy support | Browsers, older clients | Single server |

## stdio Transport

The simplest transport. Communication happens over stdin/stdout of the server process.

### Server

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

// Register tools, resources, prompts...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Client Configuration (Claude Code)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgres://localhost/mydb"
      }
    }
  }
}
```

### stdio Characteristics

- One client per server process. The client spawns and owns the process.
- No network configuration needed. Works behind firewalls.
- Environment variables passed via the client configuration.
- Logging must go to stderr (stdout is reserved for MCP messages).
- Process lifecycle is managed by the client. Server exits when the client disconnects.

### Debugging stdio Servers

```bash
# Run the server manually to see stderr output
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | node dist/index.js
```

- All `console.log` output goes to stdout and corrupts MCP messages. Use `console.error` for logging.
- Attach a debugger with `--inspect` flag: `node --inspect dist/index.js`.

## Streamable HTTP Transport

The recommended transport for remote, multi-tenant MCP servers.

### Server

```typescript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
const server = new McpServer({ name: 'my-server', version: '1.0.0' });

// Register tools, resources, prompts...

// Handle MCP requests
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport('/mcp');
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

// Handle SSE for server-to-client notifications (progress, etc.)
app.get('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport('/mcp');
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  // Session cleanup
  res.status(200).end();
});

app.listen(3100);
```

### Client Connection

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3100/mcp'),
  {
    requestInit: {
      headers: { 'x-api-key': 'your-api-key' },
    },
  }
);

const client = new Client({ name: 'my-client', version: '1.0.0' });
await client.connect(transport);
```

### HTTP Transport Characteristics

- Multiple clients connect to a single server.
- Supports server-push via SSE for progress notifications and resource updates.
- Standard HTTP infrastructure (load balancers, TLS, auth middleware) applies.
- Stateless request handling enables horizontal scaling.

## Authentication Patterns

### API Key (Simple)

```typescript
function authenticate(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'];
  if (!key || !validKeys.has(key as string)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/mcp', authenticate);
```

### Bearer Token (OAuth2)

```typescript
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const token = auth.slice(7);
  try {
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Per-Tool Authorization

```typescript
server.tool(
  'admin-reset',
  'Reset system state. Requires admin privileges.',
  { target: z.string() },
  async (params, context) => {
    // Check user role from the authenticated context
    if (context.meta?.role !== 'admin') {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Admin access required' }) }],
        isError: true,
      };
    }
    // Perform admin operation
  }
);
```

## CORS Configuration

For browser-based MCP clients:

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));
```

## TLS / HTTPS

Always use HTTPS in production:

```typescript
import https from 'https';
import fs from 'fs';

const httpsServer = https.createServer(
  {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
  },
  app
);

httpsServer.listen(3100);
```

- In practice, use a reverse proxy (nginx, Caddy) or cloud load balancer for TLS termination.
- Never expose MCP servers with write tools over unencrypted HTTP in production.

## Session Management

For stateful servers that maintain per-client state:

```typescript
const sessions = new Map<string, SessionState>();

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  let session = sessions.get(sessionId);

  if (!session) {
    session = createNewSession();
    sessions.set(sessionId, session);
  }

  // Use session state in tool handlers
  const transport = new StreamableHTTPServerTransport('/mcp');
  await server.connect(transport);
  await transport.handleRequest(req, res);
});
```

- Use the `mcp-session-id` header for session correlation.
- Clean up sessions on the DELETE endpoint or with a TTL-based expiration.
- For stateless servers, avoid sessions entirely and resolve state from the database on each request.

## Health Check

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'my-server',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});
```

- Essential for load balancer health probes and monitoring.
- Do not put the health check behind authentication.
