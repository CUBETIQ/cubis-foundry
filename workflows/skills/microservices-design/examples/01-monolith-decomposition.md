# Example: Monolith-to-Microservices Decomposition

## Prompt

> We have a monolithic e-commerce platform (Node.js, PostgreSQL) handling users, products, orders, payments, inventory, and shipping. We want to break it into microservices without a big-bang rewrite. How do we identify boundaries, handle shared data, and migrate incrementally?

## Response

### Bounded Context Identification

Using domain-driven design event storming, we identify 7 bounded contexts aligned with business capabilities:

| Bounded Context | Core Entities | Key Events | Team |
|----------------|---------------|------------|------|
| **Identity** | User, Role, Session | user.registered, user.authenticated | Platform team |
| **Catalog** | Product, Category, Brand | product.created, product.updated | Catalog team |
| **Order** | Order, OrderLine, OrderStatus | order.placed, order.confirmed, order.cancelled | Commerce team |
| **Payment** | Payment, Refund, PaymentMethod | payment.charged, payment.refunded | Payments team |
| **Inventory** | StockLevel, Reservation, Warehouse | stock.reserved, stock.released, stock.depleted | Supply chain team |
| **Shipping** | Shipment, TrackingEvent, Carrier | shipment.created, shipment.delivered | Logistics team |
| **Notification** | Template, Channel, DeliveryLog | notification.sent, notification.failed | Platform team |

### Data Ownership Rules

Each service owns its data exclusively. Cross-context data access is handled through:

1. **API calls** for synchronous queries (e.g., Order service calls Catalog service to get product details for order confirmation).
2. **Events** for asynchronous state propagation (e.g., Catalog publishes `product.updated`, Order service caches relevant product data locally).
3. **Data replication** for read-heavy cross-context needs (e.g., Order service maintains a read-only projection of product names and prices to avoid synchronous calls during checkout).

**Anti-pattern avoided:** No shared database. The monolith's single PostgreSQL database will be split so each service has its own schema or database instance.

### Communication Patterns

```
  External clients
        │
        ▼
  ┌──────────┐
  │   API    │  Authentication, rate limiting,
  │ Gateway  │  request routing, TLS termination
  └────┬─────┘
       │
  ┌────┼────────────────────────────────────┐
  │    │         Service Mesh (Istio)       │
  │    │    mTLS, retries, circuit breaking │
  │    │                                    │
  │  ┌─▼──┐  sync   ┌──────┐              │
  │  │Order│────────►│Catalog│              │
  │  │     │         └──────┘              │
  │  └──┬──┘                               │
  │     │ event: order.placed              │
  │     ▼                                  │
  │  ┌──────┐  event: payment.charged      │
  │  │Payment│──────────────────┐          │
  │  └──────┘                   ▼          │
  │                         ┌────────┐     │
  │                         │Inventory│     │
  │                         └───┬────┘     │
  │                             │ event     │
  │                             ▼          │
  │                         ┌────────┐     │
  │                         │Shipping│     │
  │                         └───┬────┘     │
  │                             │ event     │
  │                             ▼          │
  │                         ┌──────────┐   │
  │                         │Notification│  │
  │                         └──────────┘   │
  └────────────────────────────────────────┘
```

- **Synchronous (gRPC):** Order -> Catalog (product lookup during checkout). Low latency, circuit breaker protected.
- **Asynchronous (Kafka events):** Order -> Payment -> Inventory -> Shipping -> Notification. Decoupled, at-least-once delivery.

### API Gateway Configuration

The API gateway provides a stable external API while internal boundaries evolve:

- `/api/v1/products/*` -> Catalog Service
- `/api/v1/orders/*` -> Order Service
- `/api/v1/users/*` -> Identity Service
- Authentication: JWT validation at the gateway, user context forwarded as headers.
- Rate limiting: per-API-key and per-endpoint limits.

### Migration Strategy: Strangler Fig

**Phase 1 (Month 1-2): Extract Notification service**
- Lowest coupling to other domains (no synchronous callers depend on it).
- Create Notification service, deploy alongside monolith.
- Monolith publishes events to Kafka instead of sending notifications directly.
- Notification service consumes events and sends emails/push/SMS.
- Rollback: re-enable notification sending in monolith, stop consumer.

**Phase 2 (Month 3-4): Extract Catalog service**
- High read traffic but low write coupling.
- Stand up Catalog service with its own PostgreSQL.
- Migrate product data using dual-write (monolith writes to both old and new DB).
- Gateway routes `/products/*` to new service.
- Verify data consistency, cut over reads, then stop dual-write.

**Phase 3 (Month 5-7): Extract Payment service**
- Compliance and PCI scope benefit from isolation.
- Payment service owns payment tables, exposes charge/refund API.
- Order flow in monolith calls Payment service instead of internal payment module.

**Phase 4 (Month 8-10): Extract Inventory and Shipping**
- These are tightly coupled; extract together or in quick succession.
- Event-driven: Order -> Payment -> Inventory -> Shipping.

**Phase 5 (Month 11-12): Extract Order and Identity**
- These are the core of the monolith and the last to leave.
- At this point, the monolith is thin enough to replace entirely.

### Risk Mitigations

- **Feature flags** on every extraction to enable instant rollback to monolith behavior.
- **Shadow mode** for new services: run both paths, compare outputs, alert on divergence.
- **Contract tests** between each service pair before cutting over.
- **Shared nothing** from day one: no service reads another service's database tables.
