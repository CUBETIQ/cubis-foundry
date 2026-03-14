# Architecture Documentation Eval Assertions

## Eval 1: C4 Diagram Generation

This eval tests the ability to produce correct C4 model diagrams at System Context and Container levels with proper notation, relationships, and technology labels.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `Person` — External actor identification        | C4 requires human actors to be modeled as Person elements. Mixing users into system boxes obscures who interacts with the system. |
| 2 | contains | `System_Boundary` — Boundary delineation        | Container diagrams must show what is inside vs outside the system. Without boundaries, readers cannot tell owned from external. |
| 3 | contains | `Container` — Deployable unit modeling          | Each independently deployable unit must be a Container with a technology label. Lumping multiple services into one box hides deployment complexity. |
| 4 | contains | `Rel` — Explicit relationship definitions       | Connections between elements need labeled relationships describing protocol and purpose. Lines without labels are meaningless. |
| 5 | contains | `System_Ext` — External system identification   | Third-party integrations (Stripe, SendGrid) must be System_Ext to make integration boundaries and vendor dependencies visible. |

### What a passing response looks like

- A System Context diagram showing three Person types (end-user, admin, API consumer) and the analytics platform as a central System element.
- External systems (Stripe, SendGrid) shown as System_Ext with labeled relationships.
- A Container diagram within a System_Boundary showing: React SPA, Node.js/Express API, PostgreSQL database, Redis cache, Bull job processor.
- Each Container labeled with its technology stack (e.g., "Container(api, 'API Server', 'Node.js / Express')").
- Relationships between containers showing protocols (HTTPS, TCP, Redis protocol) and data flow direction.
- A diagram key or legend explaining the notation.

---

## Eval 2: ADR Writing

This eval tests the ability to produce a well-structured Architecture Decision Record with context, alternatives analysis, and consequence documentation.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `## Status` — Decision lifecycle tracking       | ADRs without status markers cannot be distinguished as active, superseded, or deprecated. Teams act on stale decisions. |
| 2 | contains | `## Context` — Decision drivers documented      | The context section captures the forces and constraints that drove the decision. Without it, future readers cannot evaluate if the decision still applies. |
| 3 | contains | `## Decision` — Clear statement of choice       | The decision must be stated explicitly. ADRs that discuss trade-offs without concluding leave readers uncertain about what was actually chosen. |
| 4 | contains | `## Consequences` — Impact documentation        | Both positive and negative consequences must be recorded so teams can monitor for predicted risks and verify expected benefits. |
| 5 | contains | `MongoDB` — Alternative analysis                | The ADR must discuss rejected alternatives with specific reasoning. One-sided ADRs that only describe the winner lack the trade-off analysis that gives ADRs their value. |

### What a passing response looks like

- A numbered ADR title (e.g., "ADR-001: Use PostgreSQL as Primary Database").
- Status set to "Accepted" (or "Proposed" if presented as a draft).
- Context section explaining: multi-tenant SaaS, strong relational data, flexible form submissions, team's PostgreSQL experience.
- Discussion of both PostgreSQL (with JSONB for flexible schemas) and MongoDB (native document model) with specific trade-offs.
- Decision section clearly stating the chosen option with brief rationale.
- Consequences section listing: benefits (team familiarity, ACID transactions, JSONB flexibility), risks (JSONB query complexity, potential schema rigidity), and mitigations.
