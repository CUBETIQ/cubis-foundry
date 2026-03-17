---
name: microservices-design
description: Microservices architecture patterns covering service decomposition, API gateways, service mesh, saga pattern, event sourcing, and deployment strategies for distributed applications.
allowed-tools: Read Grep Glob
user-invocable: true
argument-hint: "Service boundary, communication pattern, or architecture concern"
---

# Microservices Design

## Purpose

Provide systematic guidance for designing, building, and operating microservices architectures. Covers service boundary identification, inter-service communication patterns, distributed transaction management, observability instrumentation, and deployment strategies. Ensures that microservices deliver on their promise of independent deployability and team autonomy without introducing unmanageable operational complexity.

## When to Use

- Decomposing a monolith into independently deployable services
- Defining service boundaries using domain-driven design techniques
- Choosing between synchronous and asynchronous communication patterns
- Implementing distributed transactions with saga orchestration or choreography
- Designing API gateways, service meshes, or sidecar proxy configurations
- Planning observability across a multi-service architecture
- Establishing deployment pipelines for independent service releases
- Evaluating whether microservices are the right architecture for a given system

## Instructions

1. **Validate the need for microservices before decomposing** — Verify that the system has independent scaling requirements, separate team ownership boundaries, or distinct deployment cadences that justify the operational overhead of distribution so that complexity is added only where it pays for itself.

2. **Identify service boundaries using bounded contexts** — Apply domain-driven design to discover bounded contexts where each context owns a cohesive set of domain concepts, data, and business rules so that services are aligned with business capabilities rather than technical layers. See `references/decomposition.md`.

3. **Design each service around a single business capability** — A service should own one capability end-to-end (data store, business logic, API) so that changes to one capability do not require coordinated deployments across multiple services.

4. **Choose communication patterns by coupling tolerance** — Use synchronous HTTP/gRPC for queries requiring immediate responses and asynchronous messaging for commands that tolerate eventual consistency so that coupling between services is explicit and intentional. See `references/communication-patterns.md`.

5. **Implement an API gateway as the single entry point** — Route external traffic through a gateway that handles authentication, rate limiting, request routing, and protocol translation so that cross-cutting concerns are centralized rather than duplicated in every service.

6. **Use the saga pattern for distributed transactions** — Replace two-phase commits with sagas (orchestration for complex workflows, choreography for simple ones) with compensating actions for rollback so that transactions span service boundaries without distributed locks. See `references/saga-pattern.md`.

7. **Design events as first-class contracts** — Define event schemas with versioning, publish events to a durable log, and let consumers process them independently so that services can react to domain changes without direct coupling to the producer.

8. **Deploy a service mesh for operational concerns** — Offload mTLS, retries, circuit breaking, and traffic shaping to the mesh infrastructure (Istio, Linkerd) so that service code focuses on business logic rather than network resilience.

9. **Instrument every service with distributed tracing** — Propagate correlation IDs across all service calls, emit spans with timing data, and aggregate traces centrally so that end-to-end request flows are visible and latency bottlenecks can be isolated. See `references/observability.md`.

10. **Enforce independent deployability as an architectural constraint** — Every service must be deployable without coordinating with other services. If a change requires simultaneous deployment of two services, the boundary is wrong and must be refactored.

11. **Implement health checks and readiness probes** — Expose `/health` (liveness) and `/ready` (readiness) endpoints that check dependencies so that orchestrators can route traffic only to healthy instances and restart stuck ones.

12. **Use contract testing to prevent integration breakage** — Write consumer-driven contract tests (Pact, Spring Cloud Contract) instead of relying solely on end-to-end tests so that API compatibility is verified early and cheaply without requiring all services to be running.

13. **Design for graceful degradation** — When a downstream service is unavailable, return cached data, default values, or a reduced feature set rather than propagating the failure so that user-facing functionality degrades proportionally rather than catastrophically.

14. **Version APIs explicitly from day one** — Use URL path versioning (v1, v2) or header-based versioning and maintain backward compatibility for at least one previous version so that consumers can migrate at their own pace. See `references/deployment.md`.

15. **Automate canary deployments and rollback** — Deploy new versions to a small traffic percentage first, monitor error rates and latency, and auto-rollback if SLOs are breached so that bad deployments are caught before they affect all users.

16. **Centralize configuration management** — Use a configuration server or environment-specific secret stores (Vault, AWS Secrets Manager) rather than config files baked into images so that configuration changes do not require redeployment.

## Output Format

Deliver:

1. **Service boundary map** — List of services with owned capabilities, data stores, and team ownership
2. **Communication topology** — Sync vs. async patterns between each service pair with protocol choices
3. **Saga design** — Transaction flow with compensating actions for each failure point
4. **Observability plan** — Metrics, traces, and logs for each service with alerting thresholds
5. **Deployment strategy** — Pipeline stages, canary configuration, and rollback triggers

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/decomposition.md` | Task involves identifying service boundaries, bounded contexts, or domain modeling. |
| `references/communication-patterns.md` | Task involves sync vs. async patterns, API gateways, or protocol selection. |
| `references/saga-pattern.md` | Task involves distributed transactions, compensation logic, or orchestration vs. choreography. |
| `references/observability.md` | Task involves distributed tracing, metrics collection, log aggregation, or alerting. |
| `references/deployment.md` | Task involves CI/CD pipelines, canary releases, blue-green deployments, or rollback strategies. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents in `.claude/agents/*.md` support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules: `.claude/rules/*.md` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
