# Example: Saga Pattern for Order Fulfillment

## Prompt

> Design a saga for our order fulfillment flow. It spans OrderService, PaymentService, InventoryService, ShippingService, and NotificationService. Each can fail independently. Show the orchestrator design, compensating actions, timeout handling, and at least two failure scenarios.

## Response

### Saga State Machine

```
  ┌─────────┐
  │ CREATED │
  └────┬────┘
       │ CreateOrder
       ▼
  ┌────────────┐
  │ORDER_CREATED│
  └────┬───────┘
       │ ChargePayment
       ▼
  ┌───────────────┐
  │PAYMENT_CHARGED│──── failure ──► COMPENSATING
  └────┬──────────┘                     │
       │ ReserveInventory               │ RefundPayment
       ▼                                ▼
  ┌──────────────────┐            ┌───────────────┐
  │INVENTORY_RESERVED│            │PAYMENT_REFUNDED│
  └────┬─────────────┘            └────┬──────────┘
       │ ScheduleShipment              │ CancelOrder
       ▼                               ▼
  ┌──────────────────┐            ┌──────────┐
  │SHIPMENT_SCHEDULED│            │  FAILED  │
  └────┬─────────────┘            └──────────┘
       │ SendConfirmation
       ▼
  ┌───────────┐
  │ COMPLETED │
  └───────────┘
```

### Orchestrator Design

The saga orchestrator is a dedicated service with persistent state:

```typescript
interface SagaState {
  sagaId: string;
  orderId: string;
  status: SagaStatus;
  currentStep: number;
  steps: StepRecord[];
  createdAt: Date;
  updatedAt: Date;
  idempotencyKey: string;
}

interface StepRecord {
  name: string;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  requestId: string; // idempotency key for this step
  completedAt?: Date;
  error?: string;
  timeoutMs: number;
}

enum SagaStatus {
  STARTED = 'STARTED',
  ORDER_CREATED = 'ORDER_CREATED',
  PAYMENT_CHARGED = 'PAYMENT_CHARGED',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  SHIPMENT_SCHEDULED = 'SHIPMENT_SCHEDULED',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  FAILED = 'FAILED',
}
```

### Step Definitions with Compensating Actions

| Step | Forward Action | Compensating Action | Timeout |
|------|---------------|---------------------|---------|
| 1. CreateOrder | Create order record with status `pending` | Cancel order, set status `cancelled` | 5s |
| 2. ChargePayment | Charge customer via payment gateway | Refund the charged amount | 30s |
| 3. ReserveInventory | Decrement stock, create reservation | Release reservation, restore stock | 10s |
| 4. ScheduleShipment | Create shipment with carrier API | Cancel shipment with carrier | 30s |
| 5. SendConfirmation | Send email/push notification | No compensation (notification is terminal) | 10s |

### Idempotency

Every step (forward and compensating) is idempotent:

```typescript
async function chargePayment(sagaId: string, orderId: string, amount: number, requestId: string) {
  // Check if already processed
  const existing = await db.query(
    'SELECT * FROM payment_transactions WHERE idempotency_key = $1',
    [requestId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0]; // Already charged, return existing result
  }

  // Process payment
  const result = await paymentGateway.charge({ amount, idempotencyKey: requestId });

  // Record the transaction
  await db.query(
    'INSERT INTO payment_transactions (idempotency_key, saga_id, order_id, amount, status) VALUES ($1, $2, $3, $4, $5)',
    [requestId, sagaId, orderId, amount, result.status]
  );

  return result;
}
```

### Timeout Handling

Each step has a timeout. When a step exceeds its timeout:

1. Orchestrator marks the step as `failed` with reason `timeout`.
2. Orchestrator transitions to `COMPENSATING` state.
3. Compensation runs in reverse order for all completed steps.
4. If a compensation step also times out, it is retried up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s).
5. If compensation exhausts retries, the saga enters `FAILED` state and alerts the on-call team for manual intervention.

### Failure Scenario 1: Inventory Reservation Fails

The warehouse is out of stock for the requested product.

```
Step 1: CreateOrder      ✅ completed
Step 2: ChargePayment    ✅ completed ($49.99 charged)
Step 3: ReserveInventory ❌ failed (insufficient stock)
  → Begin compensation
Step 2 compensation: RefundPayment  ✅ ($49.99 refunded)
Step 1 compensation: CancelOrder    ✅ (status → cancelled)
  → Saga status: FAILED
  → Customer notified: "Sorry, the item is out of stock. Your payment has been refunded."
```

### Failure Scenario 2: Shipping Service Times Out

The carrier API is experiencing an outage and does not respond within 30 seconds.

```
Step 1: CreateOrder      ✅ completed
Step 2: ChargePayment    ✅ completed ($49.99 charged)
Step 3: ReserveInventory ✅ completed (3 units reserved)
Step 4: ScheduleShipment ⏱️ timeout after 30s
  → Begin compensation
Step 3 compensation: ReleaseInventory ✅ (3 units released)
Step 2 compensation: RefundPayment    ✅ ($49.99 refunded)
Step 1 compensation: CancelOrder      ✅ (status → cancelled)
  → Saga status: FAILED
  → Alert: shipping-service timeout, saga_id=abc123
  → Customer notified: "We're having trouble processing your order. Your payment has been refunded."
```

### Saga State Persistence

```sql
CREATE TABLE sagas (
  saga_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL,
  status         TEXT NOT NULL DEFAULT 'STARTED',
  current_step   INT NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saga_steps (
  id             SERIAL PRIMARY KEY,
  saga_id        UUID REFERENCES sagas(saga_id),
  step_name      TEXT NOT NULL,
  step_order     INT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  request_id     TEXT UNIQUE NOT NULL,
  timeout_ms     INT NOT NULL,
  completed_at   TIMESTAMPTZ,
  error_message  TEXT,
  UNIQUE(saga_id, step_order)
);
```

### Observability

- Saga ID propagated as correlation ID in all service calls and log entries.
- Distributed trace span per saga step (forward and compensation).
- Dashboard: saga completion rate, average duration, failure rate by step, compensation success rate.
- Alerts: saga failure rate > 1%, compensation failure (requires manual intervention), saga stuck in COMPENSATING > 5 minutes.
