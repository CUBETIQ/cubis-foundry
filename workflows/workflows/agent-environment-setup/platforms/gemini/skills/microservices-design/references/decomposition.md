# Service Decomposition

## When to Decompose

Microservices add operational complexity. Decompose only when the benefits outweigh the costs:

| Signal that decomposition helps | Signal that a monolith is fine |
|-------------------------------|-------------------------------|
| Different parts scale independently (catalog reads vs. payment writes) | Uniform scaling needs across the system |
| Multiple teams need to deploy independently | Single team owns the entire codebase |
| Different technology stacks are optimal for different parts | One stack serves all needs well |
| Compliance requires isolation (PCI scope for payments) | No regulatory isolation requirements |
| Parts have fundamentally different availability needs | Uniform availability target |

## Domain-Driven Design Process

### Step 1: Event Storming

Gather domain experts and map out the business events:

```
Timeline of events for an e-commerce order:
  Customer searches catalog
  Customer adds item to cart
  Customer places order         ← domain event: OrderPlaced
  System validates payment      ← domain event: PaymentAuthorized
  System reserves inventory     ← domain event: InventoryReserved
  Warehouse picks items
  Carrier picks up package      ← domain event: ShipmentDispatched
  Customer receives package     ← domain event: ShipmentDelivered
  Customer submits review       ← domain event: ReviewSubmitted
```

### Step 2: Identify Aggregates

Group related events around the entities they affect:

```
Order aggregate:     OrderPlaced, OrderConfirmed, OrderCancelled
Payment aggregate:   PaymentAuthorized, PaymentCaptured, PaymentRefunded
Inventory aggregate: InventoryReserved, InventoryReleased, StockDepleted
Shipment aggregate:  ShipmentCreated, ShipmentDispatched, ShipmentDelivered
```

### Step 3: Draw Bounded Context Boundaries

Group aggregates that share a ubiquitous language into bounded contexts:

```
┌─ Order Context ──────────────┐  ┌─ Payment Context ──────────┐
│ Order, OrderLine, OrderStatus │  │ Payment, Refund, Method    │
│ "Order" means a purchase      │  │ "Order" means a payment ref│
└───────────────────────────────┘  └────────────────────────────┘

┌─ Catalog Context ────────────┐  ┌─ Inventory Context ────────┐
│ Product, Category, Price      │  │ StockLevel, Reservation    │
│ "Product" means catalog entry │  │ "Product" means stock unit │
└───────────────────────────────┘  └────────────────────────────┘
```

Key insight: the same word ("Product," "Order") means different things in different contexts. This is expected and healthy.

### Step 4: Define Context Maps

Document how bounded contexts relate:

| Relationship | Description | Example |
|-------------|-------------|---------|
| **Customer-Supplier** | Upstream provides data, downstream consumes | Catalog (supplier) → Order (customer) |
| **Shared Kernel** | Two contexts share a subset of the model | Identity shared between all contexts (user ID) |
| **Anti-Corruption Layer** | Downstream translates upstream's model | Legacy billing system → Payment context adapter |
| **Conformist** | Downstream accepts upstream's model as-is | Analytics conforms to event schemas from all contexts |
| **Published Language** | Shared schema for inter-context communication | Event schemas in Avro/Protobuf |

## Service Boundary Validation

After identifying boundaries, validate each one:

### The Team Test
Can a single team (5-8 people) own this service end-to-end? If a service requires coordination across multiple teams, the boundary is wrong.

### The Independent Deployment Test
Can this service be deployed without deploying any other service? If a change requires coordinated deployment, the coupling is too tight.

### The Data Ownership Test
Does this service own all the data it needs? If it shares a database table with another service, the boundary cuts through data ownership.

### The Failure Isolation Test
If this service goes down, does it take other services with it? If yes, the coupling is too tight or the failure handling is missing.

### The Business Capability Test
Does this service map to a business capability that a non-technical person could describe? "Payment processing" makes sense. "Database access layer" does not.

## Decomposition Anti-Patterns

### Distributed Monolith

Services that must be deployed together, share a database, or cannot function without calling each other synchronously. You get the complexity of distribution with none of the benefits.

Signs:
- Every feature change touches 3+ services
- Deployment order matters
- Shared database tables between services
- High fan-out: one request triggers 10+ inter-service calls

Fix: Merge tightly coupled services. Decompose along different boundaries.

### Entity Service

Services defined around database entities rather than business capabilities: UserService, ProductService, OrderService each as thin CRUD wrappers.

Signs:
- Services are anemic (no business logic, just pass-through to database)
- Business logic lives in the caller, not the service
- Changes to a business process touch every entity service

Fix: Define services around capabilities (Checkout, Fulfillment, Search) not entities.

### Nano-Services

Services that are too small to justify their operational overhead.

Signs:
- Service has < 500 lines of code
- Service has a single API endpoint
- Service team is < 2 people
- Service deployment pipeline is more complex than the service itself

Fix: Merge with the related service. Not everything needs to be a separate deployable.

## Shared Data Strategies

When two services need access to the same data:

| Strategy | How | When |
|----------|-----|------|
| **API call** | Service A calls Service B's API | Infrequent access, real-time needed |
| **Event propagation** | Service B publishes events, Service A stores a local copy | Frequent access, eventual consistency OK |
| **Data replication** | Service B publishes change events, Service A maintains a read model | High-frequency reads, low-frequency writes |
| **Shared reference data** | Common data (countries, currencies) in a library or config | Rarely changes, needed everywhere |

Never: Share a database between services. This creates hidden coupling that defeats the purpose of microservices.

## Migration Strategy: Strangler Fig

### Phases

```
Phase 1: Proxy
  External traffic → API Gateway → Monolith
  (Gateway routes everything to monolith)

Phase 2: Extract first service
  External traffic → API Gateway ──→ New Service (one capability)
                              └──→ Monolith (everything else)

Phase 3: Extract more services
  External traffic → API Gateway ──→ Service A
                              ├──→ Service B
                              ├──→ Service C
                              └──→ Monolith (shrinking)

Phase 4: Decommission monolith
  External traffic → API Gateway ──→ Service A
                              ├──→ Service B
                              ├──→ Service C
                              └──→ Service D
```

### Migration Rules

1. **Extract the easiest context first** — lowest coupling, clearest boundary (often notifications or search).
2. **Dual-write during migration** — write to both old and new data stores, verify consistency.
3. **Feature flags on every extraction** — instant rollback to monolith behavior.
4. **Shadow mode before cut-over** — run both paths, compare results, alert on divergence.
5. **One service per migration phase** — never extract multiple services simultaneously.
6. **Verify before proceeding** — confirm the extracted service is stable for 2+ weeks before starting the next extraction.
