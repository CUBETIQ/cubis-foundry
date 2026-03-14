# Saga Pattern

## Overview

A saga is a sequence of local transactions in different services where each step has a compensating action that undoes its effect if a later step fails. Sagas replace distributed transactions (2PC) which are impractical in microservices.

## Saga Types

### Orchestration

A central **saga orchestrator** controls the flow:

```
                    ┌──────────────┐
                    │    Saga      │
                    │ Orchestrator │
                    └──────┬───────┘
                           │
         ┌─────────┬───────┼───────┬──────────┐
         │         │       │       │          │
         ▼         ▼       ▼       ▼          ▼
      ┌─────┐  ┌─────┐ ┌─────┐ ┌─────┐  ┌─────┐
      │Order│  │Pay  │ │Inv  │ │Ship │  │Notif│
      │Svc  │  │Svc  │ │Svc  │ │Svc  │  │Svc  │
      └─────┘  └─────┘ └─────┘ └─────┘  └─────┘
```

The orchestrator:
1. Knows the sequence of steps
2. Calls each service in order
3. Receives success/failure responses
4. Triggers compensating actions on failure
5. Maintains the saga state machine

| Pro | Con |
|-----|-----|
| Easy to understand the flow | Single point of coordination (but not failure — it is stateless) |
| Easy to add new steps | Orchestrator can become a "god service" if not careful |
| Easy to implement timeouts | Slightly higher coupling (orchestrator knows all services) |
| Easy to test end-to-end | More code to maintain |

### Choreography

Each service listens for events and reacts independently:

```
OrderSvc ──OrderPlaced──► PaymentSvc ──PaymentCharged──► InventorySvc
                                                              │
                                                     InventoryReserved
                                                              │
                                                              ▼
                                                         ShippingSvc
                                                              │
                                                     ShipmentScheduled
                                                              │
                                                              ▼
                                                       NotificationSvc
```

| Pro | Con |
|-----|-----|
| No central coordinator | Hard to see the full flow |
| Loose coupling between services | Hard to implement timeouts |
| Each service is autonomous | Compensation logic is scattered |
| Natural fit for event-driven systems | Debugging requires tracing across services |

### When to Choose

| Criteria | Orchestration | Choreography |
|----------|-------------|--------------|
| Number of steps | 4+ steps | 2-3 steps |
| Compensating actions | Complex, order-dependent | Simple, independent |
| Timeout requirements | Per-step timeouts needed | Global timeout sufficient |
| Team structure | One team owns the workflow | Different teams own each step |
| Debugging needs | Must trace exact step failures | Event tracing is acceptable |

## Designing Compensating Actions

### Properties

Every compensating action must be:

1. **Semantically reversing:** Undoes the business effect of the forward action (refund reverses charge).
2. **Idempotent:** Can be called multiple times safely (retry of a refund does not double-refund).
3. **Commutative with retries:** The order of compensating actions should not matter (if possible).

### Compensation Table

| Forward Action | Compensating Action | Notes |
|---------------|-------------------|-------|
| Create Order | Cancel Order | Set status to cancelled, soft delete |
| Charge Payment | Refund Payment | Full refund via payment gateway |
| Reserve Inventory | Release Inventory | Restore stock count |
| Schedule Shipment | Cancel Shipment | Cancel with carrier API |
| Send Notification | No compensation | Notifications are informational; send a correction if needed |
| Create Account | Deactivate Account | Soft delete, do not hard delete (audit trail) |
| Publish Event | Publish Compensation Event | e.g., OrderCancelled reverses OrderPlaced |

### Actions Without Compensation

Some actions cannot be undone:
- Emails sent cannot be unsent (but a correction email can be sent)
- External API calls may not support reversal
- Physical actions (warehouse picking) may be irreversible

For these, place them last in the saga sequence so that they execute only after all reversible steps have succeeded.

## State Machine

The saga orchestrator is a state machine:

```
States:
  STARTED           → Initial state
  ORDER_CREATED     → After CreateOrder succeeds
  PAYMENT_CHARGED   → After ChargePayment succeeds
  INVENTORY_RESERVED→ After ReserveInventory succeeds
  SHIPMENT_SCHEDULED→ After ScheduleShipment succeeds
  COMPLETED         → After all steps succeed
  COMPENSATING      → A step failed, running compensations
  FAILED            → All compensations complete (or exhausted retries)

Transitions:
  STARTED → ORDER_CREATED           (on CreateOrder success)
  ORDER_CREATED → PAYMENT_CHARGED   (on ChargePayment success)
  PAYMENT_CHARGED → INVENTORY_RESERVED (on ReserveInventory success)
  INVENTORY_RESERVED → SHIPMENT_SCHEDULED (on ScheduleShipment success)
  SHIPMENT_SCHEDULED → COMPLETED    (on SendNotification success)

  Any state → COMPENSATING          (on step failure or timeout)
  COMPENSATING → FAILED             (all compensations done)
```

## Persistence

The saga state must be persisted so that recovery is possible after an orchestrator crash:

```sql
CREATE TABLE saga_instances (
  saga_id         UUID PRIMARY KEY,
  saga_type       TEXT NOT NULL,          -- e.g., 'order-fulfillment'
  current_state   TEXT NOT NULL,          -- e.g., 'PAYMENT_CHARGED'
  payload         JSONB NOT NULL,         -- saga data (order_id, amounts, etc.)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  version         INT NOT NULL DEFAULT 1  -- optimistic locking
);

CREATE TABLE saga_step_log (
  id              SERIAL PRIMARY KEY,
  saga_id         UUID REFERENCES saga_instances(saga_id),
  step_name       TEXT NOT NULL,
  step_type       TEXT NOT NULL,          -- 'forward' or 'compensate'
  status          TEXT NOT NULL,          -- 'pending', 'completed', 'failed'
  idempotency_key UUID NOT NULL UNIQUE,
  request_payload JSONB,
  response_payload JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);
```

### Recovery After Crash

When the orchestrator starts up:
1. Query `saga_instances` for sagas in non-terminal states (not COMPLETED, not FAILED).
2. For each, read the `saga_step_log` to determine the last completed step.
3. Resume from the next step (forward or compensating, depending on state).
4. Because all steps are idempotent, re-executing a completed step is safe.

## Timeout Handling

Each step has a timeout. When exceeded:

```
Step timeout configuration:
  CreateOrder:       5s  (local DB operation)
  ChargePayment:    30s  (external payment gateway)
  ReserveInventory: 10s  (internal service)
  ScheduleShipment: 30s  (external carrier API)
  SendNotification: 10s  (internal service, fire-and-forget)
```

On timeout:
1. Mark the step as `failed` with reason `TIMEOUT`.
2. Transition saga to `COMPENSATING`.
3. Run compensating actions for all completed steps in reverse order.
4. If a compensating action also times out, retry with exponential backoff (up to 5 retries).
5. If compensation exhausts retries, mark saga as `FAILED` and alert for manual intervention.

## Testing Sagas

### Unit Tests

Test the state machine transitions:
- Happy path: all steps succeed → COMPLETED
- Failure at each step: verify correct compensations run
- Timeout at each step: verify timeout triggers compensation
- Idempotency: call each step twice, verify no duplicate effects

### Integration Tests

- Deploy all services and run the full saga end-to-end
- Inject failures (kill a service, add latency) and verify compensation
- Verify saga recovery after orchestrator restart

### Contract Tests

- Each service's forward action and compensating action must be contract-tested
- Verify that the orchestrator's expected request/response matches the service's actual API

## Observability

| Metric | What to monitor |
|--------|----------------|
| Saga completion rate | Percentage of sagas reaching COMPLETED state |
| Saga failure rate | Percentage of sagas reaching FAILED state |
| Average saga duration | Time from STARTED to COMPLETED |
| Step failure distribution | Which steps fail most often |
| Compensation success rate | Percentage of compensations that succeed |
| Stuck sagas | Sagas in non-terminal state for > 5 minutes |

Dashboard: Show saga throughput, failure rate by step, and average duration over time. Alert on failure rate > 1% or stuck sagas.
