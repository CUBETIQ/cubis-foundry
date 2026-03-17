---
name: tech-doc
description: "Use when writing technical documentation including API references, operational runbooks, onboarding guides, decision logs, and changelog standards."
---
# Technical Documentation

## Purpose

Guide the creation of production-grade technical documentation including API references, operational runbooks, onboarding guides, decision logs, and changelog standards. Ensures documentation is accurate, maintainable, audience-appropriate, and integrated into the development workflow.

## When to Use

- Writing or updating API documentation (REST, GraphQL, gRPC).
- Creating operational runbooks for incident response or routine procedures.
- Building onboarding guides for new engineers joining a team or project.
- Establishing decision log conventions to capture technical choices.
- Defining changelog standards for release communication.
- Auditing existing documentation for completeness, accuracy, or staleness.
- Setting up documentation tooling and CI/CD integration.

## Instructions

1. **Identify the audience before writing a single line.** Determine whether the reader is an API consumer, an on-call engineer, a new hire, or a stakeholder because documentation written for the wrong audience either over-explains the obvious or omits critical context.

2. **Use a consistent template for each document type.** API docs follow OpenAPI structure, runbooks follow the incident-response template, onboarding follows the progressive-disclosure pattern because inconsistent formats force readers to learn a new structure for every document.

3. **Write API documentation from the consumer's perspective.** Start with what the endpoint does and why a consumer would call it, then cover authentication, request format, response format, error codes, and rate limits because developer experience degrades when docs are organized by implementation rather than use case.

4. **Include working request/response examples for every API endpoint.** Provide curl commands or SDK snippets that can be copy-pasted and executed because abstract parameter tables without examples leave consumers guessing at correct usage.

5. **Document error responses with the same rigor as success responses.** List every error code, its meaning, common causes, and recommended resolution because undocumented errors force consumers to reverse-engineer behavior from production failures.

6. **Write runbooks as step-by-step procedures, not prose.** Each step must be a single actionable instruction with the expected outcome and what to do if the outcome differs because on-call engineers reading runbooks at 3 AM cannot parse paragraphs of context.

7. **Include prerequisites, escalation paths, and rollback steps in every runbook.** Document what access, tools, and permissions are needed before starting, who to contact if the procedure fails, and how to undo changes because missing prerequisites waste time and missing rollback steps turn incidents into outages.

8. **Structure onboarding guides as progressive disclosure.** Start with what the new hire needs on day one (access, environment setup), then week one (architecture overview, first contribution), then month one (deeper systems, on-call rotation) because front-loading everything overwhelms and back-loading critical setup blocks productivity.

9. **Maintain a decision log with date, participants, context, and outcome.** Record why a technology, pattern, or trade-off was chosen, not just what was chosen because decisions without recorded reasoning get reversed or relitigated when context is lost.

10. **Follow a changelog standard that separates audience concerns.** Use categories (Added, Changed, Deprecated, Removed, Fixed, Security) and write entries from the user's perspective because changelogs organized by commit message or file path are meaningless to consumers.

11. **Integrate documentation into the CI/CD pipeline.** Validate that API docs match the implementation (OpenAPI spec linting, contract tests), that runbooks reference existing infrastructure, and that links are not broken because documentation that drifts from reality is worse than no documentation.

12. **Add metadata to every document.** Include author, last-updated date, review cycle, and owner team because documents without ownership rot fastest, and undated documents cannot be assessed for staleness.

13. **Write in active voice with short sentences.** Prefer imperative mood for instructions ("Run the migration script") over passive voice ("The migration script should be run") because active voice is faster to read and less ambiguous under stress.

14. **Use diagrams and tables for structured information.** Replace paragraphs that describe relationships, flows, or comparisons with visual representations because a well-labeled diagram communicates structure faster than any paragraph.

15. **Test documentation by following it literally.** Have someone unfamiliar with the system execute the runbook, API guide, or onboarding doc step by step because documentation that only works when you already know the system provides no value.

16. **Establish a review cadence and staleness policy.** Flag documents not reviewed in 90 days, assign ownership for each document category, and include documentation review in sprint ceremonies because documentation without a maintenance process decays to fiction.

## Output Format

Provide documentation as Markdown files with consistent structure. Include:

- API documentation with endpoint tables, authentication details, request/response examples, and error catalogs.
- Runbooks with numbered steps, expected outcomes, escalation contacts, and rollback procedures.
- Onboarding guides organized by time horizon (day one, week one, month one).
- Decision log entries with date, context, alternatives considered, and outcome.
- Changelog entries categorized by type (Added, Changed, Fixed, etc.).

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/api-documentation-patterns.md` | Writing or reviewing API documentation, choosing OpenAPI/AsyncAPI structure, or setting up API doc tooling. |
| `references/writing-style-guide.md` | Establishing writing conventions, tone guidelines, or reviewing documentation for consistency and clarity. |
| `references/documentation-tooling.md` | Choosing documentation platforms, setting up CI/CD validation, or configuring linting and link checking. |

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
