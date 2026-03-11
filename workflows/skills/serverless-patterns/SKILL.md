---
name: serverless-patterns
description: Design serverless architectures with Lambda, Edge Functions, event-driven patterns, cold start optimization, and cost management strategies.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Serverless Patterns

## Purpose

Guide serverless architecture design and implementation. Covers function design, event-driven patterns, cold start optimization, edge computing, cost management, and common pitfalls.

## When to Use

- Designing serverless applications (Lambda, Cloud Functions, Edge Functions)
- Choosing between serverless and traditional server architectures
- Optimizing cold starts and execution time
- Implementing event-driven workflows (queues, streams, triggers)
- Managing costs and avoiding serverless anti-patterns
- Building API backends with serverless functions

## Instructions

### Step 1 — Choose the Right Compute Model

| Model                                            | Best For                                | Latency                | Cost Model                |
| ------------------------------------------------ | --------------------------------------- | ---------------------- | ------------------------- |
| AWS Lambda / Cloud Functions                     | Event-driven, variable load             | Cold start: 100ms-2s   | Per-invocation + duration |
| Edge Functions (Cloudflare Workers, Vercel Edge) | Low latency, geographically distributed | < 50ms (no cold start) | Per-request               |
| Long-running containers (ECS, Cloud Run)         | Steady load, WebSockets, > 15 min tasks | No cold start          | Per-second                |

**Serverless fits when**:

- Traffic is bursty or unpredictable
- Functions complete in < 30 seconds
- Stateless request/response pattern
- Event-driven processing (queue consumers, webhooks)

**Serverless doesn't fit when**:

- Persistent connections (WebSockets, long polling)
- Heavy computation (> 15 min)
- Steady high-throughput workloads (always-on is cheaper)
- Complex local state management

### Step 2 — Design Functions

**Single-responsibility**: one function per operation

```
api/
├── users/
│   ├── create.ts      (POST /users)
│   ├── get.ts         (GET /users/:id)
│   └── list.ts        (GET /users)
├── orders/
│   ├── create.ts      (POST /orders)
│   └── process.ts     (SQS consumer)
└── shared/
    ├── db.ts           (connection pooling)
    └── auth.ts         (token validation)
```

**Rules**:

- Keep functions small (< 200 lines)
- Initialize expensive resources outside the handler (connection pools, SDK clients)
- Handle one event type per function
- Return early for validation failures

### Step 3 — Optimize Cold Starts

**Cold start happens when**:

- First invocation after deployment
- Scaling up to handle more concurrent requests
- Function hasn't been invoked for ~15 minutes

**Optimization strategies**:
| Strategy | Impact |
|----------|--------|
| Smaller bundle size | Fewer bytes to load = faster start |
| Fewer dependencies | Less initialization code |
| Lazy-load non-critical modules | Only import what the handler needs |
| Provisioned concurrency | Pre-warm instances (costs more) |
| Edge functions | No cold start (Cloudflare Workers) |
| Choose lighter runtimes | Node.js > Python > Java for cold start |

**Connection pooling**:

```typescript
// Initialize OUTSIDE the handler (reused across invocations)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

export async function handler(event) {
  const client = await pool.connect();
  try {
    // use client
  } finally {
    client.release(); // return to pool, don't close
  }
}
```

### Step 4 — Event-Driven Patterns

| Pattern              | Use Case                               | Services                           |
| -------------------- | -------------------------------------- | ---------------------------------- |
| Queue consumer       | Decoupled async processing             | SQS, Cloud Tasks                   |
| Fan-out              | Parallel processing of events          | SNS + Lambda, EventBridge          |
| Saga / Step Function | Multi-step workflows with compensation | Step Functions, Temporal           |
| CRON                 | Scheduled tasks                        | EventBridge rules, Cloud Scheduler |
| Stream processing    | Real-time event processing             | Kinesis, Kafka                     |
| Webhook receiver     | Third-party event handling             | API Gateway + Lambda               |

**Error handling in async functions**:

- Use dead-letter queues (DLQ) for failed messages
- Implement idempotency (same message processed twice = same result)
- Retry with exponential backoff
- Alert on DLQ depth

### Step 5 — Manage Costs

**Cost drivers**:

- Number of invocations
- Execution duration × memory allocated
- Data transfer (egress)
- Provisioned concurrency (if used)

**Optimization**:

- Right-size memory (sometimes more memory = faster = cheaper)
- Minimize execution time (return early, batch operations)
- Use reserved concurrency to cap costs
- Compress responses to reduce data transfer
- Monitor with cost allocation tags

## Output Format

```
## Architecture
[serverless design with function layout and event flows]

## Implementation
[function code with cold start optimization]

## Infrastructure
[IaC for deployment (CDK, Terraform, serverless.yml)]

## Cost Estimate
[projected costs based on expected traffic]
```

## Examples

**User**: "Build a serverless API for our mobile app"

**Response approach**: API Gateway + Lambda per endpoint. JWT auth at the gateway. DynamoDB or RDS Proxy for data. Optimize cold starts with minimal dependencies. Show CDK or Serverless Framework config.

**User**: "Our Lambda functions have 3-second cold starts"

**Response approach**: Audit bundle size and dependencies. Lazy-load non-critical modules. Move initialization outside handler. Consider provisioned concurrency for latency-sensitive functions. Evaluate edge functions for the hottest paths.
