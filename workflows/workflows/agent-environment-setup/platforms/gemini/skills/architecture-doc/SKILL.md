---
name: architecture-doc
description: "Use when creating architecture documentation including C4 model diagrams, Architecture Decision Records, system context views, deployment diagrams, and quality attribute specifications."
---
# Architecture Documentation

## Purpose

Guide the creation of architecture documentation that communicates system structure, design decisions, deployment topology, and quality attributes to both technical and non-technical stakeholders. Covers C4 model diagrams, Architecture Decision Records (ADRs), system context diagrams, deployment views, and quality attribute trees.

## When to Use

- Creating or updating C4 model diagrams (Context, Container, Component, Code).
- Writing Architecture Decision Records for significant design choices.
- Documenting system context and external integration boundaries.
- Producing deployment view diagrams for infrastructure and operations teams.
- Specifying quality attributes (performance, security, availability) with measurable targets.
- Onboarding new team members who need to understand system architecture.
- Preparing architecture review or governance documentation.

## Instructions

1. **Start with a System Context diagram (C4 Level 1).** Identify the system boundary, all external actors (users, services, third-party systems), and the relationships between them because context diagrams prevent teams from designing internal details before understanding what the system connects to.

2. **Define Container diagrams (C4 Level 2) for each deployable unit.** Show applications, databases, message brokers, and file stores as containers with technology labels and communication protocols because container diagrams are the most frequently referenced architecture artifact and must be accurate.

3. **Decompose into Component diagrams (C4 Level 3) only for complex containers.** Show major structural components, their responsibilities, and interactions within a single container because component diagrams for simple services add noise without value.

4. **Use consistent notation and a diagram key.** Every diagram must include a legend explaining shapes, colors, line styles, and arrow semantics because diagrams without keys are ambiguous and interpreted differently by each reader.

5. **Write ADRs for every architecturally significant decision.** Use the standard ADR format (Title, Status, Context, Decision, Consequences) and number them sequentially because undocumented decisions get relitigated when team members rotate.

6. **Capture the context and constraints that drove each decision.** Document what alternatives were considered, what trade-offs were evaluated, and what constraints (budget, timeline, team skills) influenced the choice because the reasoning matters more than the conclusion.

7. **Record the status lifecycle of each ADR.** Mark ADRs as Proposed, Accepted, Deprecated, or Superseded with links to successor ADRs because stale decisions without status markers mislead new team members.

8. **Document deployment views with environment-specific details.** Show how containers map to infrastructure (servers, containers, serverless functions, CDNs) for each environment (dev, staging, production) because deployment topology affects performance, cost, and failure modes.

9. **Specify quality attributes with measurable acceptance criteria.** Define targets for latency (p50, p95, p99), availability (SLA percentage), throughput (requests/second), and security requirements (encryption, auth) because vague quality goals like "fast" or "secure" cannot be tested or enforced.

10. **Create a quality attribute utility tree.** Prioritize quality attributes by business importance (High/Medium/Low) and implementation difficulty (High/Medium/Low) because this forces explicit trade-off conversations instead of treating all qualities as equally important.

11. **Link architecture documentation to the codebase.** Reference specific modules, packages, or repositories in diagrams and ADRs because documentation that drifts from code becomes fiction and erodes trust.

12. **Version architecture documents alongside code.** Store diagrams-as-code (Structurizr DSL, Mermaid, PlantUML) in the repository rather than in external tools because co-located documentation gets reviewed in PRs and stays synchronized with implementation.

13. **Include a document map or index.** Provide a table of contents that links context diagrams, container diagrams, ADRs, deployment views, and quality specifications because architecture documentation scattered across files without an index is effectively undiscoverable.

14. **Review architecture documentation for staleness quarterly.** Add a "Last reviewed" date to each document and flag any section older than 90 days for re-validation because outdated architecture docs cause worse decisions than no docs at all.

15. **Write for multiple audiences.** Provide executive summaries for leadership, detailed views for engineers, and operational runbooks for SRE teams because a single document that tries to serve all audiences serves none of them well.

## Output Format

Provide architecture documentation as Markdown with embedded diagrams. Include:

- C4 diagrams in Mermaid or Structurizr DSL syntax with rendering instructions.
- ADRs in the standard numbered format (NNNN-title.md).
- Quality attribute tables with measurable criteria.
- Deployment view diagrams showing environment-to-infrastructure mappings.
- A document index linking all architecture artifacts.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/c4-modeling.md` | Creating C4 diagrams at any level (Context, Container, Component, Code) or choosing diagram notation. |
| `references/adr-templates.md` | Writing or reviewing Architecture Decision Records, or setting up ADR conventions for a new project. |
| `references/documentation-automation.md` | Choosing lightweight architecture documentation workflows, diagrams-as-code practices, or review automation. |

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file: `.gemini/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
