# Microservices Design Eval Assertions

## Eval 1: Service Decomposition Strategy

This eval tests the ability to identify service boundaries using domain-driven design, define data ownership, and plan an incremental migration from a monolith.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `bounded context` — DDD-driven boundaries | Service boundaries must align with business domains, not technical layers. Bounded contexts ensure each service owns a cohesive domain model with clear interfaces to other contexts. |
| 2 | contains | `data ownership` — Per-service data stores | A shared database is the number one cause of microservices failure. Each service must own its data and expose it only through APIs or events. Without this, services cannot deploy independently. |
| 3 | contains | `strangler` — Incremental migration pattern | Big-bang rewrites have a high failure rate. The strangler fig pattern extracts services one at a time behind a routing layer, allowing the monolith to shrink incrementally with rollback capability. |
| 4 | contains | `event` — Asynchronous communication | Synchronous-only communication between services creates tight coupling and cascading failures. Event-driven patterns decouple producers from consumers and enable eventual consistency. |
| 5 | contains | `API gateway` — External traffic routing | An API gateway provides a stable external interface while internal service boundaries evolve. It also centralizes authentication, rate limiting, and request routing. |

### What a passing response looks like

- 5-7 bounded contexts identified: User/Identity, Catalog, Order, Payment, Inventory, Shipping, Notification.
- Each service owns its data store (User service owns user table, Order service owns orders table).
- Cross-service data access via API calls or events, no shared database.
- Strangler fig migration: start with the least-coupled context (e.g., Notification), route via gateway, extract one service per sprint/quarter.
- Event-driven communication for order-placed, payment-completed, shipment-created events.
- API gateway routes external traffic, authenticates requests, and fans out to internal services.
- Team ownership model: one team per 1-2 services with full autonomy over their deployment pipeline.

---

## Eval 2: Saga Orchestration Pattern

This eval tests the ability to design a saga with proper step sequencing, compensating actions, timeout handling, and failure recovery for a multi-service distributed transaction.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `compensat` — Compensating action design | Every forward step in a saga must have a reverse (compensating) action. Without compensation, a failed saga leaves the system in an inconsistent state with charged payments and no order. |
| 2 | contains | `orchestrat` — Central orchestrator pattern | Complex multi-step workflows need a central orchestrator to manage the saga state machine. Pure choreography becomes unmanageable beyond 3-4 steps and makes debugging nearly impossible. |
| 3 | contains | `timeout` — Step-level timeout handling | A downstream service that hangs indefinitely blocks the entire saga. Each step must have a timeout after which the orchestrator triggers compensation for already-completed steps. |
| 4 | contains | `idempoten` — Idempotent actions and compensations | Network retries mean both forward and compensating actions may execute multiple times. Without idempotency, retries create duplicate charges, double inventory releases, or ghost shipments. |
| 5 | contains | `state` — Persistent saga state tracking | If the orchestrator crashes mid-saga, it must recover by reading persisted state. Without durable state, in-flight sagas are lost and the system ends up in an unrecoverable inconsistent state. |

### What a passing response looks like

- Saga orchestrator as a dedicated service with a state machine (states: STARTED, PAYMENT_CHARGED, INVENTORY_RESERVED, SHIPMENT_SCHEDULED, COMPLETED, COMPENSATING, FAILED).
- Forward steps: CreateOrder -> ChargePayment -> ReserveInventory -> ScheduleShipment -> SendNotification.
- Compensating actions: CancelOrder, RefundPayment, ReleaseInventory, CancelShipment (notification has no compensation — it is the last step).
- Failure scenario 1: InventoryService fails -> refund payment -> cancel order.
- Failure scenario 2: ShippingService times out after 30s -> release inventory -> refund payment -> cancel order.
- Saga state persisted in a database table with step status, timestamps, and idempotency keys.
- Idempotency: each step checks if already completed before executing, compensations check if already reversed.
- Observability: saga ID in all log entries, trace spans per step, dashboard for saga completion rates and failure reasons.
