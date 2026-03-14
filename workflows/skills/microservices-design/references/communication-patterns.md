# Communication Patterns

## Pattern Selection Matrix

| Pattern | Coupling | Latency | Reliability | Use when |
|---------|---------|---------|-------------|----------|
| **Synchronous HTTP/REST** | High | Low | Caller fails if callee fails | Simple CRUD, real-time queries |
| **Synchronous gRPC** | High | Very low | Caller fails if callee fails | Internal high-perf communication |
| **Async messaging (queue)** | Low | Higher | Messages buffered during outage | Commands that tolerate delay |
| **Async events (pub/sub)** | Very low | Higher | Events buffered during outage | Domain events, notifications |
| **Request-reply (async)** | Medium | Higher | Correlation-based response | Long-running operations |

## Synchronous Communication

### REST over HTTP

```
Service A ──HTTP GET /products/123──► Service B
Service A ◄──200 OK { product }────── Service B
```

When to use:
- Public-facing APIs consumed by browsers or mobile apps
- Simple CRUD operations with immediate response needs
- Stateless, cacheable reads

When to avoid:
- Long chains of synchronous calls (A → B → C → D)
- Commands where the caller does not need an immediate result
- High-throughput internal communication (HTTP overhead is significant)

### gRPC

```
Service A ──gRPC GetProduct(id=123)──► Service B
Service A ◄──Product { ... }────────── Service B
```

Advantages over REST:
- Binary serialization (Protobuf) — 3-10x smaller payloads
- HTTP/2 multiplexing — multiple requests over one connection
- Streaming — server-side, client-side, and bidirectional streams
- Code generation — typed clients and servers from .proto files

When to use:
- Internal service-to-service communication
- High-throughput, low-latency requirements
- When strong typing between services matters

### Service Mesh

A service mesh (Istio, Linkerd) handles cross-cutting communication concerns:

| Concern | Without mesh | With mesh |
|---------|-------------|-----------|
| mTLS encryption | Each service implements TLS | Mesh handles automatically |
| Retries | Each service implements retry logic | Mesh retries with configurable policy |
| Circuit breaking | Each service implements circuit breaker | Mesh circuit breaker per route |
| Load balancing | Client-side or external LB | Mesh sidecar proxy handles |
| Observability | Each service instruments traces | Mesh emits traces automatically |
| Traffic splitting | Application-level routing | Mesh traffic rules (canary, A/B) |

Architecture:
```
┌───────────┐     ┌───────────┐
│ Service A │     │ Service B │
│           │     │           │
│ ┌───────┐ │     │ ┌───────┐ │
│ │ App   │ │     │ │ App   │ │
│ └───┬───┘ │     │ └───┬───┘ │
│     │     │     │     │     │
│ ┌───▼───┐ │     │ ┌───▼───┐ │
│ │Sidecar│ │◄───►│ │Sidecar│ │
│ │ Proxy │ │     │ │ Proxy │ │
│ └───────┘ │     │ └───────┘ │
└───────────┘     └───────────┘
```

The sidecar proxy (Envoy) intercepts all inbound and outbound traffic. The application code communicates with localhost; the proxy handles everything else.

## API Gateway

The API gateway is the single entry point for external traffic:

```
External clients
      │
      ▼
┌──────────────────────────────┐
│         API Gateway          │
│                              │
│  ┌─────────────────────────┐ │
│  │ Authentication (JWT)    │ │
│  │ Rate limiting           │ │
│  │ Request routing         │ │
│  │ Protocol translation    │ │
│  │ Response aggregation    │ │
│  │ TLS termination         │ │
│  │ Request/response logging│ │
│  └─────────────────────────┘ │
└──────────┬───────────────────┘
           │
     ┌─────┼─────────┐
     │     │         │
     ▼     ▼         ▼
  Svc A  Svc B    Svc C
```

### Gateway Anti-Patterns

- **Business logic in the gateway:** The gateway routes; it does not process. Move business logic to services.
- **Gateway as orchestrator:** Do not have the gateway call multiple services and merge results. Use a dedicated aggregation service or BFF (Backend-for-Frontend).
- **Single gateway for all consumers:** Mobile, web, and internal consumers have different needs. Consider separate gateways or BFF per client type.

## Asynchronous Communication

### Command via Queue

One producer, one consumer group. The message is a command to perform an action:

```
Order Service ──"ProcessPayment"──► Payment Queue ──► Payment Consumer
```

The command is consumed once. The consumer performs the action and may publish a result event.

### Event via Topic

One producer, multiple consumer groups. The message is a notification that something happened:

```
Order Service ──"OrderPlaced"──► Orders Topic ──► Payment Consumer
                                              ──► Inventory Consumer
                                              ──► Notification Consumer
                                              ──► Analytics Consumer
```

Each consumer group processes the event independently. The producer does not know or care who consumes.

### Request-Reply (Async)

For long-running operations where the caller needs a result:

```
1. Client sends request with correlation_id and reply_to topic
2. Server processes (may take seconds to minutes)
3. Server publishes result to reply_to topic with same correlation_id
4. Client matches response by correlation_id
```

Use for: Report generation, data exports, batch processing, AI inference.

## Communication Pattern Decisions

### Choreography vs. Orchestration

| Aspect | Choreography | Orchestration |
|--------|-------------|---------------|
| Control flow | Decentralized (each service reacts to events) | Centralized (orchestrator manages sequence) |
| Coupling | Very loose (services know events, not each other) | Medium (orchestrator knows all services) |
| Visibility | Hard to see end-to-end flow | Easy to see flow in orchestrator |
| Debugging | Trace events across services | Debug the orchestrator |
| Best for | Simple flows (< 4 steps), loosely related services | Complex flows (4+ steps), strict sequencing |

### Choosing Sync vs. Async

```
Decision tree:
  1. Does the caller NEED the result RIGHT NOW?
     Yes → Synchronous (HTTP/gRPC)
     No  → Continue
  2. Can the operation fail and be retried later?
     Yes → Async via message queue
     No  → Synchronous with retry
  3. Do multiple services need to react?
     Yes → Async event (pub/sub)
     No  → Async command (queue)
```

## Resilience Patterns

### Retry with Backoff

```
attempt 1: immediate
attempt 2: wait 1s
attempt 3: wait 2s
attempt 4: wait 4s
give up → fallback or error
```

### Circuit Breaker

```
CLOSED → requests pass through, track failure rate
  failure rate > 50% for 10 requests → OPEN
OPEN → requests fail immediately, return fallback
  after 30s → HALF-OPEN
HALF-OPEN → allow 1 probe request
  success → CLOSED
  failure → OPEN
```

### Bulkhead

Isolate resources per downstream service:

```
Payment calls:     10 concurrent max (semaphore)
Inventory calls:   10 concurrent max (semaphore)
Notification calls: 5 concurrent max (semaphore)
```

If Payment calls exhaust their semaphore, Inventory and Notification calls are unaffected.

### Timeout Cascade

Each layer has a shorter timeout than its caller:

```
API Gateway:  10s timeout
  └── Order Service: 8s timeout
       └── Payment Service: 5s timeout
            └── External Payment Gateway: 3s timeout
```

### Fallback

When a downstream service fails, return a degraded but useful response:

| Service down | Fallback behavior |
|-------------|-------------------|
| Recommendation engine | Show popular items instead of personalized |
| Search service | Show cached results, disable autocomplete |
| Payment service | Queue the charge, confirm order tentatively |
| Notification service | Log the notification, retry later (no user impact) |
