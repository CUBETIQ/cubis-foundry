# C4 Modeling

Load this when creating C4 diagrams at any level (Context, Container, Component, Code), choosing diagram notation, or structuring architecture diagrams.

## C4 model overview

The C4 model provides four levels of abstraction for software architecture diagrams:

| Level | Name | Shows | Audience |
|---|---|---|---|
| 1 | System Context | The system and its external actors/dependencies | Everyone: leadership, architects, developers |
| 2 | Container | Deployable units within the system boundary | Architects, developers, DevOps |
| 3 | Component | Major structural components within a container | Developers working on that container |
| 4 | Code | Classes, interfaces, modules within a component | Developers actively modifying the code |

- Always start at Level 1 and work downward.
- Level 3 and 4 are optional — only create them for complex containers that benefit from decomposition.
- Each level answers a different question: Level 1 = "What does the system connect to?", Level 2 = "What is the system made of?", Level 3 = "How is this container structured internally?"

## Level 1: System Context

Shows the system as a single box surrounded by its users and external dependencies.

```mermaid
C4Context
  title System Name - System Context

  Person(user, "End User", "Description of what this person does")
  Person(admin, "Admin", "Description of admin role")

  System(system, "System Name", "One-sentence description of what the system does")

  System_Ext(extA, "External System A", "What this system provides")
  System_Ext(extB, "External System B", "What this system provides")

  Rel(user, system, "Uses", "HTTPS")
  Rel(admin, system, "Manages", "HTTPS")
  Rel(system, extA, "Sends data to", "HTTPS/REST")
  Rel(system, extB, "Receives events from", "AMQP")
```

### Rules

- The system under discussion is always a single box at this level.
- Every external actor (person or system) must be shown.
- Relationships must include the communication protocol or mechanism.
- Do not show internal structure — that belongs at Level 2.

## Level 2: Container

Shows the deployable units inside the system boundary.

```mermaid
C4Container
  title System Name - Container Diagram

  Person(user, "End User", "")

  System_Boundary(sys, "System Name") {
    Container(web, "Web App", "React, TypeScript", "Serves the user interface")
    Container(api, "API Server", "Node.js, Express", "Handles business logic and API requests")
    ContainerDb(db, "Database", "PostgreSQL 16", "Stores application data")
    ContainerDb(cache, "Cache", "Redis 7", "Session store and query cache")
    Container(worker, "Worker", "Node.js, BullMQ", "Processes background jobs")
  }

  System_Ext(ext, "External Service", "Third-party dependency")

  Rel(user, web, "Uses", "HTTPS")
  Rel(web, api, "API calls", "HTTPS/JSON")
  Rel(api, db, "Reads/writes", "TCP/SQL")
  Rel(api, cache, "Caches queries", "TCP")
  Rel(api, worker, "Enqueues jobs", "Redis")
  Rel(worker, ext, "Calls", "HTTPS/REST")
```

### Container types

| Element | Use for |
|---|---|
| `Container` | Applications, services, serverless functions, CLI tools |
| `ContainerDb` | Databases, caches, file stores, message brokers |
| `ContainerQueue` | Message queues (if your tool supports it) |

### Rules

- Every container must have a technology label.
- Relationships must show what data flows and over what protocol.
- System_Boundary groups all internal containers.
- External systems remain outside the boundary as System_Ext.

## Level 3: Component

Shows the internal structure of a single container.

```mermaid
C4Component
  title API Server - Component Diagram

  Container_Boundary(api, "API Server") {
    Component(authMw, "Auth Middleware", "Express middleware", "Validates JWT tokens, attaches user to request")
    Component(orderCtrl, "Order Controller", "Express router", "Handles order endpoints")
    Component(orderSvc, "Order Service", "TypeScript class", "Order business logic and validation")
    Component(orderRepo, "Order Repository", "TypeScript class", "Database queries for orders")
    Component(paymentClient, "Payment Client", "HTTP client", "Wraps Stripe API calls")
  }

  ContainerDb(db, "Database", "PostgreSQL")
  System_Ext(stripe, "Stripe", "Payment processing")

  Rel(authMw, orderCtrl, "Passes authenticated request")
  Rel(orderCtrl, orderSvc, "Calls")
  Rel(orderSvc, orderRepo, "Queries")
  Rel(orderSvc, paymentClient, "Processes payment")
  Rel(orderRepo, db, "SQL queries", "TCP")
  Rel(paymentClient, stripe, "REST API calls", "HTTPS")
```

### Rules

- Only decompose containers that are complex enough to warrant it.
- Components are code-level abstractions: controllers, services, repositories, clients.
- Show dependencies between components within the container.
- External containers (database, external systems) appear outside the boundary.

## Diagram notation standards

### Required elements on every diagram

1. **Title** — describes the system and diagram level.
2. **Legend/Key** — explains shapes, colors, line styles (unless using a standard tool like Structurizr that has built-in legends).
3. **Relationship labels** — every arrow must describe what flows and how.
4. **Technology labels** — every container and component must state its technology.

### Color conventions (optional but recommended)

| Color | Meaning |
|---|---|
| Blue | Internal system containers |
| Gray | External systems and actors |
| Green | Databases and data stores |
| Orange | Message brokers and queues |

### Relationship label format

```
"[What is communicated]", "[Protocol]"
```

Examples: `"API calls", "HTTPS/JSON"` or `"Reads/writes orders", "TCP/SQL"`

## Tooling options

| Tool | Format | Rendering |
|---|---|---|
| Mermaid | Markdown code blocks | GitHub, GitLab, Docusaurus, VS Code |
| Structurizr DSL | `.dsl` files | Structurizr Lite (Docker), structurizr.com |
| PlantUML | `.puml` files | PlantUML server, IDE plugins |
| D2 | `.d2` files | CLI renderer, VS Code extension |

- Prefer Mermaid for documentation that lives in Git repositories — renders natively in GitHub/GitLab.
- Use Structurizr DSL for complex architectures where you need multiple views from a single model.
- Store diagram source files alongside the code they describe.

## Common mistakes

- **Mixing abstraction levels** — showing both system context actors and internal code classes on the same diagram.
- **Missing relationships** — every container/component must have at least one incoming or outgoing relationship. Orphaned boxes indicate incomplete documentation.
- **No technology labels** — shapes without technology labels are ambiguous and fail to communicate the stack.
- **Arrows without labels** — an unlabeled arrow could mean anything. Always state what flows and how.
- **Too many elements** — a diagram with more than 15-20 elements is too complex. Decompose into sub-diagrams at the next level.
