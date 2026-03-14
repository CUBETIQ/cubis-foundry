# Logging Strategies for Debugging

## Strategic vs. Noise Logging

The goal of diagnostic logging is to make the system's behavior observable without overwhelming operators with noise. Every log line should answer a question that someone will eventually ask during debugging.

## Log Levels and When to Use Them

| Level | Purpose | Example | Production Default |
|-------|---------|---------|-------------------|
| **ERROR** | Unexpected failure requiring attention | Database connection failed, payment processing error | Always on |
| **WARN** | Degraded but recoverable condition | Retry attempt 2 of 3, cache miss fallback to DB | Always on |
| **INFO** | Significant business events | User registered, order completed, deployment started | Always on |
| **DEBUG** | Detailed technical context | Function entry/exit with parameters, cache hit/miss | Off (enable per-component) |
| **TRACE** | Exhaustive detail | Every HTTP header, full request/response bodies | Off (enable temporarily) |

### Common Mistake: Everything at INFO

```
// BAD: all of these at INFO level
info("Entering getUserById")           // This is DEBUG
info("Cache miss for user 123")        // This is DEBUG
info("Query returned 1 row")           // This is DEBUG
info("User 123 found: Alice")          // This is DEBUG
info("Returning user object")          // This is DEBUG
```

In production, this produces thousands of lines per second with no value. Reserve INFO for events that operators and stakeholders need to see.

## Structured Logging

### JSON Log Format

```json
{
  "timestamp": "2025-03-14T10:23:45.123Z",
  "level": "error",
  "service": "order-service",
  "traceId": "abc-123-def-456",
  "userId": "user_789",
  "message": "Payment processing failed",
  "error": "CardDeclinedError",
  "orderId": "order_555",
  "amount": 99.99,
  "currency": "USD",
  "duration_ms": 1523
}
```

### Why Structured

- Machine-parseable: tools (Elasticsearch, Datadog, Loki) can index and query fields.
- Consistent format: every log entry has the same structure.
- Correlation: `traceId` links logs across services for a single request.

### Implementation

```typescript
// Node.js with pino
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Usage with structured context
logger.info(
  { orderId: order.id, userId: user.id, amount: order.total },
  'Order created successfully'
);

logger.error(
  { orderId: order.id, error: err.message, stack: err.stack },
  'Payment processing failed'
);
```

```python
# Python with structlog
import structlog

logger = structlog.get_logger()

logger.info(
    "order_created",
    order_id=order.id,
    user_id=user.id,
    amount=order.total,
)

logger.error(
    "payment_failed",
    order_id=order.id,
    error=str(e),
    exc_info=True,
)
```

## Diagnostic Logging Patterns

### Function Boundary Logging

Log at entry and exit of significant functions:

```typescript
async function processOrder(orderId: string): Promise<Order> {
  logger.debug({ orderId }, 'processOrder: started');
  const startTime = Date.now();

  try {
    const order = await fetchOrder(orderId);
    const result = await chargePayment(order);

    logger.info(
      { orderId, duration_ms: Date.now() - startTime },
      'processOrder: completed successfully'
    );
    return result;
  } catch (error) {
    logger.error(
      { orderId, error: error.message, duration_ms: Date.now() - startTime },
      'processOrder: failed'
    );
    throw error;
  }
}
```

### Decision Point Logging

Log the inputs and outcomes of conditional logic:

```typescript
function calculateShipping(order: Order): number {
  if (order.total > 100) {
    logger.debug({ orderId: order.id, total: order.total }, 'Free shipping applied');
    return 0;
  }

  if (order.isExpressShipping) {
    const cost = order.weight * 2.5;
    logger.debug({ orderId: order.id, weight: order.weight, cost }, 'Express shipping calculated');
    return cost;
  }

  const cost = order.weight * 1.0;
  logger.debug({ orderId: order.id, weight: order.weight, cost }, 'Standard shipping calculated');
  return cost;
}
```

### External Call Logging

Log before and after every external service call:

```typescript
async function callPaymentGateway(charge: ChargeRequest): Promise<ChargeResponse> {
  logger.debug(
    { gateway: 'stripe', amount: charge.amount, currency: charge.currency },
    'Calling payment gateway'
  );

  const startTime = Date.now();
  try {
    const response = await stripe.charges.create(charge);
    logger.info(
      { gateway: 'stripe', chargeId: response.id, duration_ms: Date.now() - startTime },
      'Payment gateway call succeeded'
    );
    return response;
  } catch (error) {
    logger.error(
      { gateway: 'stripe', error: error.message, duration_ms: Date.now() - startTime },
      'Payment gateway call failed'
    );
    throw error;
  }
}
```

## Correlation and Tracing

### Request ID Propagation

Assign a unique ID to each request and include it in every log line:

```typescript
// Middleware: generate or extract request ID
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.requestId);

  // Attach to logger context
  req.log = logger.child({ requestId: req.requestId });
  next();
});

// In handlers: use req.log
app.get('/api/orders/:id', async (req, res) => {
  req.log.info({ orderId: req.params.id }, 'Fetching order');
  // All logs from this request share the same requestId
});
```

### Distributed Trace ID

For microservices, propagate the trace ID across service boundaries:

```
Frontend -> API Gateway (traceId: abc-123)
  -> Order Service (traceId: abc-123, spanId: span-1)
    -> Payment Service (traceId: abc-123, spanId: span-2)
    -> Inventory Service (traceId: abc-123, spanId: span-3)
```

Use OpenTelemetry or similar for automatic propagation.

## Dynamic Log Level Control

### Runtime Level Changes

Change log levels without restarting the application:

```typescript
// Expose an admin endpoint
app.put('/admin/log-level', (req, res) => {
  const { level, component } = req.body;
  if (component) {
    logger.child({ component }).level = level;
  } else {
    logger.level = level;
  }
  res.json({ message: `Log level set to ${level}` });
});
```

### Environment-Based Configuration

```bash
# Default: INFO for all
LOG_LEVEL=info

# Debug a specific component
LOG_LEVEL_DATABASE=debug
LOG_LEVEL_AUTH=debug
LOG_LEVEL_PAYMENT=trace  # Investigating payment issue
```

## Log Retention and Rotation

| Environment | Retention | Format | Storage |
|------------|-----------|--------|---------|
| Development | Current session | Pretty-printed text | stdout |
| Staging | 7 days | JSON | File + log aggregator |
| Production | 30-90 days | JSON | Centralized (ELK, Datadog, Loki) |

### Rotation Configuration (logrotate)

```
/var/log/app/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Logging sensitive data | PII, passwords, tokens in logs | Sanitize before logging |
| Logging inside tight loops | Millions of log lines per second | Log aggregates or sample |
| No context in error logs | "Error occurred" with no details | Include IDs, inputs, state |
| String concatenation | Performance overhead even when level is off | Use structured logging |
| Logging and swallowing errors | `catch (e) { log(e); }` hides failures | Log AND rethrow or handle |
