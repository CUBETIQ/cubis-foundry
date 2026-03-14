# Example: Creating C4 Model Documentation

## Scenario

A team is documenting the architecture of an e-commerce platform. The system consists of a React SPA, a Node.js API gateway, microservices for orders, inventory, and payments, a PostgreSQL database, a Redis cache, and integrations with Stripe and a third-party shipping provider. The documentation needs to serve both engineering leadership (for architecture reviews) and the development team (for onboarding).

## Prompt

"Create C4 model documentation for our e-commerce platform. Include System Context (Level 1) and Container (Level 2) diagrams in Mermaid syntax. The system has a React SPA, Node.js API gateway, order/inventory/payment services, PostgreSQL, Redis, and external integrations with Stripe and ShipCo. Show all relationships with protocols."

## Expected Output

### Document Index

| Document | Level | Audience |
|---|---|---|
| System Context Diagram | C4 Level 1 | Leadership, architects, new engineers |
| Container Diagram | C4 Level 2 | Engineers, DevOps, architects |
| Deployment View | Infrastructure | DevOps, SRE |

---

### C4 Level 1: System Context Diagram

```mermaid
C4Context
  title E-Commerce Platform - System Context

  Person(customer, "Customer", "Browses products, places orders, tracks shipments")
  Person(admin, "Admin User", "Manages inventory, processes refunds, views analytics")

  System(ecommerce, "E-Commerce Platform", "Allows customers to browse, purchase, and track orders")

  System_Ext(stripe, "Stripe", "Payment processing and subscription management")
  System_Ext(shipco, "ShipCo API", "Shipping rate calculation and label generation")
  System_Ext(email, "SendGrid", "Transactional email delivery")

  Rel(customer, ecommerce, "Browses and purchases", "HTTPS")
  Rel(admin, ecommerce, "Manages inventory and orders", "HTTPS")
  Rel(ecommerce, stripe, "Processes payments", "HTTPS/REST")
  Rel(ecommerce, shipco, "Gets shipping rates, creates labels", "HTTPS/REST")
  Rel(ecommerce, email, "Sends order confirmations", "HTTPS/REST")
```

#### Context Diagram Narrative

The E-Commerce Platform serves two primary actors: customers who browse and purchase products, and admin users who manage inventory and process orders. The system depends on three external services: Stripe for payment processing, ShipCo for shipping logistics, and SendGrid for transactional email. All external communications occur over HTTPS.

---

### C4 Level 2: Container Diagram

```mermaid
C4Container
  title E-Commerce Platform - Container Diagram

  Person(customer, "Customer", "")
  Person(admin, "Admin User", "")

  System_Boundary(ecommerce, "E-Commerce Platform") {
    Container(spa, "Web Application", "React, TypeScript", "Single-page application serving the storefront and admin dashboard")
    Container(gateway, "API Gateway", "Node.js, Express", "Routes requests, handles auth, rate limiting")
    Container(orderSvc, "Order Service", "Node.js, TypeScript", "Order lifecycle management, checkout flow")
    Container(inventorySvc, "Inventory Service", "Node.js, TypeScript", "Stock levels, reservations, warehouse sync")
    Container(paymentSvc, "Payment Service", "Node.js, TypeScript", "Payment processing, refunds, webhook handling")
    ContainerDb(postgres, "Database", "PostgreSQL 16", "Orders, products, users, inventory")
    ContainerDb(redis, "Cache", "Redis 7", "Session store, product catalog cache, rate limit counters")
    Container(worker, "Background Worker", "Node.js, BullMQ", "Async jobs: email, inventory sync, report generation")
  }

  System_Ext(stripe, "Stripe", "Payment processing")
  System_Ext(shipco, "ShipCo API", "Shipping logistics")
  System_Ext(email, "SendGrid", "Email delivery")

  Rel(customer, spa, "Uses", "HTTPS")
  Rel(admin, spa, "Uses", "HTTPS")
  Rel(spa, gateway, "API calls", "HTTPS/JSON")
  Rel(gateway, orderSvc, "Routes order requests", "HTTP/JSON")
  Rel(gateway, inventorySvc, "Routes inventory requests", "HTTP/JSON")
  Rel(gateway, paymentSvc, "Routes payment requests", "HTTP/JSON")
  Rel(orderSvc, postgres, "Reads/writes orders", "TCP/SQL")
  Rel(inventorySvc, postgres, "Reads/writes inventory", "TCP/SQL")
  Rel(paymentSvc, postgres, "Reads/writes payments", "TCP/SQL")
  Rel(gateway, redis, "Session lookup, rate limiting", "TCP")
  Rel(inventorySvc, redis, "Catalog cache", "TCP")
  Rel(paymentSvc, stripe, "Charges, refunds", "HTTPS/REST")
  Rel(orderSvc, shipco, "Shipping rates, labels", "HTTPS/REST")
  Rel(worker, email, "Sends emails", "HTTPS/REST")
  Rel(worker, postgres, "Reads job data", "TCP/SQL")
  Rel(orderSvc, worker, "Enqueues jobs", "Redis/BullMQ")
```

#### Container Diagram Narrative

The platform is composed of eight containers within the system boundary:

1. **Web Application (React SPA)** — serves the customer storefront and admin dashboard. Communicates exclusively with the API Gateway.
2. **API Gateway (Express)** — authenticates requests, enforces rate limits, and routes to domain services. No business logic resides here.
3. **Order Service** — manages the order lifecycle from cart to fulfillment. Enqueues async jobs (email, shipping labels) to the background worker.
4. **Inventory Service** — tracks stock levels, handles reservations during checkout, and caches the product catalog in Redis.
5. **Payment Service** — wraps Stripe API interactions. Handles webhooks for payment confirmations and refund processing.
6. **PostgreSQL Database** — shared relational store for all domain data. Schema-per-service ownership boundaries enforced by convention.
7. **Redis Cache** — serves three purposes: session storage, product catalog caching, and rate limit counters at the gateway level.
8. **Background Worker (BullMQ)** — processes async jobs including email dispatch, inventory synchronization, and report generation.

---

### Technology Decisions Summary

| Container | Technology | Rationale |
|---|---|---|
| Web Application | React + TypeScript | Team expertise, component ecosystem |
| API Gateway | Express | Lightweight, middleware-oriented |
| Domain Services | Node.js + TypeScript | Shared language with frontend, strong typing |
| Database | PostgreSQL 16 | ACID compliance, JSONB for flexible data |
| Cache | Redis 7 | Sub-millisecond reads, native pub/sub for BullMQ |
| Job Queue | BullMQ | Redis-backed, built-in retry and backoff |

### Diagram Key

| Shape | Meaning |
|---|---|
| Person | External human actor |
| Container | A deployable unit (application, service, database) |
| ContainerDb | A data store (database, cache, file system) |
| System_Boundary | The boundary of the system being documented |
| System_Ext | An external system outside our control |
| Rel (solid arrow) | A runtime dependency with protocol label |

## Key Decisions

- **Mermaid C4 syntax** — renders in GitHub, GitLab, and most documentation tools without external dependencies.
- **Protocols on all relationships** — every arrow is labeled with the communication protocol, removing ambiguity.
- **Narrative accompanies each diagram** — diagrams show structure, narratives explain intent and constraints.
- **System boundary clearly drawn** — distinguishes internal containers from external dependencies.
- **Technology labels on every container** — enables infrastructure and security teams to assess the stack at a glance.
