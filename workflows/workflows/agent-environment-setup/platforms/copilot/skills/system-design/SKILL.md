---
name: system-design
description: System design and architecture guidance covering distributed systems, scalability, reliability, CAP theorem, load balancing, and caching strategies for production infrastructure.
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# System Design

## Purpose

Provide rigorous, production-tested guidance for designing distributed systems that are scalable, reliable, and maintainable. Covers horizontal scaling strategies, data partitioning, caching layers, load balancing topologies, messaging infrastructure, consistency models, and failure handling. Enables engineers to make informed trade-off decisions backed by established distributed systems theory and industry practice.

## When to Use

- Designing a new system or service from scratch with scale requirements
- Evaluating trade-offs between consistency, availability, and partition tolerance
- Selecting caching strategies (write-through, write-behind, cache-aside)
- Planning load balancing topologies and health check configurations
- Designing data partitioning and sharding schemes
- Architecting messaging and event-driven communication between services
- Preparing for system design interviews or architecture reviews
- Reviewing an existing system for reliability and scalability gaps

## Instructions

1. **Start with requirements, not solutions** — Capture functional requirements (what the system does), non-functional requirements (latency, throughput, availability targets), and constraints (budget, team size, existing infrastructure) before proposing any architecture so that the design is driven by needs rather than preferences.

2. **Estimate scale quantitatively** — Calculate expected QPS, storage growth rate, peak-to-average traffic ratios, and read/write ratios so that capacity planning is grounded in numbers rather than intuition. See `references/scalability.md`.

3. **Apply the CAP theorem to partition decisions** — For every data store, explicitly choose between CP (consistent under partition) and AP (available under partition) and document the reasoning so that the team understands what happens when the network splits.

4. **Design for failure as the default state** — Assume every network call can fail, every server can crash, and every disk can corrupt. Build in retries with exponential backoff, circuit breakers, bulkheads, and graceful degradation so that partial failures do not cascade into total outages. See `references/reliability.md`.

5. **Select caching strategy by access pattern** — Use cache-aside for read-heavy workloads with tolerance for stale data, write-through for strong consistency needs, and write-behind for write-heavy workloads with eventual consistency tolerance so that the cache layer matches the actual data flow. See `references/caching-strategies.md`.

6. **Layer load balancing at DNS, L4, and L7** — Use DNS-based balancing for geographic distribution, L4 (TCP) balancing for raw throughput, and L7 (HTTP) balancing for content-aware routing so that each layer handles what it is optimized for.

7. **Partition data by access pattern, not by table** — Choose hash-based partitioning for uniform distribution, range-based partitioning for scan-heavy workloads, and composite keys for multi-tenant isolation so that hot spots are prevented by design. See `references/data-partitioning.md`.

8. **Choose messaging semantics explicitly** — Decide between at-most-once, at-least-once, and exactly-once delivery guarantees and design idempotent consumers for at-least-once systems so that message processing is predictable under failure conditions. See `references/messaging.md`.

9. **Define SLOs before building observability** — Set concrete Service Level Objectives (latency p50/p95/p99, availability percentage, error budget) so that monitoring, alerting, and on-call priorities are driven by user-visible impact rather than arbitrary thresholds.

10. **Design APIs as contracts with versioning** — Every inter-service API must have a schema, versioning strategy, and backward compatibility guarantee so that services can be deployed independently without coordinated releases.

11. **Use read replicas to scale read-heavy paths** — Separate read traffic from write traffic using leader-follower replication and route queries to the appropriate tier so that write latency is not degraded by read load.

12. **Plan for data migration from day one** — Design schemas with evolution in mind: additive changes only, no column renames in-place, dual-write during migration windows so that schema changes do not require downtime.

13. **Implement distributed tracing across service boundaries** — Propagate trace IDs through all inter-service calls so that end-to-end request flows are visible and latency bottlenecks can be localized to specific services.

14. **Document every architectural decision** — Record decisions in Architecture Decision Records (ADRs) with context, options considered, decision, and consequences so that future engineers understand why the system is shaped the way it is.

15. **Validate the design with back-of-envelope calculations** — Before finalizing, verify that storage estimates, bandwidth requirements, and compute costs align with the budget and scaling timeline so that the design is economically viable.

## Output Format

Deliver:

1. **Architecture diagram description** — Component topology with data flow directions, protocols, and failure domains
2. **Scale estimates** — QPS, storage, bandwidth calculations with growth projections
3. **Trade-off analysis** — Explicit CAP/PACELC choices with justification for each data store
4. **Failure mode catalog** — What fails, what degrades, what stays available, and how recovery works
5. **Technology recommendations** — Specific tools and services with rationale tied to requirements

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/scalability.md` | Task involves capacity planning, horizontal scaling, or traffic estimation. |
| `references/reliability.md` | Task involves fault tolerance, circuit breakers, retry strategies, or chaos engineering. |
| `references/caching-strategies.md` | Task involves cache selection, invalidation policies, or cache consistency patterns. |
| `references/messaging.md` | Task involves message queues, event buses, pub/sub, or delivery guarantees. |
| `references/data-partitioning.md` | Task involves sharding, replication, consistent hashing, or multi-tenant data isolation. |

## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
