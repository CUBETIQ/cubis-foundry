---
name: mcp-server-builder
description: "Use when building MCP servers with spec-compliant tools, structured outputs, resource providers, transport configuration, and server testing. Anthropic compatibility aliases: mcp builder, mcp-builder."
---
# MCP Server Builder

## Purpose

Guide the design and implementation of production-grade Model Context Protocol (MCP) servers covering protocol specification compliance, tool registration with JSON Schema input validation and structured output, resource providers for dynamic context injection, transport layer selection and configuration (stdio, streamable HTTP, SSE), prompt template authoring, and comprehensive server testing with mock clients.

## When to Use

- Building a new MCP server to expose tools, resources, or prompts to AI agents.
- Registering tools with input validation schemas and structured output.
- Implementing resource providers that supply dynamic context to language models.
- Choosing and configuring transport layers for local or remote deployment.
- Writing prompt templates that guide AI agents through multi-step workflows.
- Testing MCP servers with mock clients, protocol compliance checks, and integration tests.

## Instructions

1. **Read the MCP specification before designing your server** because the protocol defines strict message formats, capability negotiation, and lifecycle semantics that non-compliant servers violate silently, causing agent failures.

2. **Choose the transport layer based on deployment context** because stdio is simplest for local CLI tools, streamable HTTP enables remote multi-tenant access, and SSE provides server-push for long-running operations. Each has different authentication and scaling characteristics.

3. **Register tools with descriptive names, clear descriptions, and JSON Schema input validation** because AI agents select and invoke tools based on their descriptions, and schema validation prevents malformed inputs from reaching your handler logic.

4. **Use action-oriented tool names that describe what the tool does, not what it is** because agents match user intent to tool names, and names like `search-issues` are more discoverable than `issue-manager` or `github-tool`.

5. **Return structured output from tools with consistent field naming** because agents parse tool results to continue reasoning, and inconsistent or unstructured output forces the agent to guess the result format.

6. **Mark destructive tools explicitly in their description** because agents must distinguish read-only operations from operations that modify state, and clear labeling prevents accidental mutations during exploratory reasoning.

7. **Implement resource providers for data that agents need as context but should not modify** because resources are read-only context (files, database schemas, documentation) that agents reference during reasoning, distinct from tools that perform actions.

8. **Use URI templates for resource providers that serve parameterized content** because URI templates let agents request specific resources (e.g., `file:///path/{filename}`) without the server enumerating every possible resource upfront.

9. **Author prompt templates for multi-step workflows** because prompts encode expert knowledge about how to use the server's tools and resources together, reducing the number of trial-and-error tool calls an agent needs.

10. **Implement capability negotiation in the server's `initialize` response** because clients use the capabilities object to discover which features the server supports, and missing capabilities cause clients to skip available tools or resources.

11. **Handle request cancellation and progress reporting for long-running tools** because agents and users expect responsiveness, and tools that block without progress updates appear frozen. Use the protocol's progress notification mechanism.

12. **Validate all tool inputs against the declared JSON Schema before processing** because schema declarations are advisory to some clients, and server-side validation is the only guarantee against malformed inputs reaching business logic.

13. **Log every tool invocation with input, output, duration, and error details** because MCP servers are called by autonomous agents, and debugging agent failures requires a complete audit trail of tool interactions.

14. **Write integration tests using a mock MCP client that exercises the full protocol lifecycle** because unit tests on handler functions miss protocol-level issues like capability negotiation failures, transport serialization bugs, and lifecycle ordering problems.

15. **Test error handling paths with malformed inputs, timeouts, and resource unavailability** because agents retry failed tool calls, and servers that crash or hang on errors cause agent loops. Return structured error responses with actionable messages.

16. **Version your server and tools to support backward-compatible evolution** because deployed agents depend on specific tool signatures, and breaking changes without versioning cause silent failures across all connected clients.

## Output Format

```
## Server Architecture
[Transport choice, tool/resource/prompt inventory, capability matrix]

## Tool Implementation
[Registration code, input schema, handler logic, structured output]

## Resource Providers
[URI templates, content generation, caching strategy]

## Testing
[Mock client setup, protocol compliance checks, integration test suite]
```

## References

| File                                | Load when                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `references/tool-design-patterns.md` | Understanding MCP tool contracts, schema design, output shape, or resource-oriented server structure. |
| `references/transport-configuration.md` | Choosing or configuring stdio, HTTP, or SSE transport layers.                       |
| `references/testing-mcp-servers.md` | Writing mock client tests, protocol compliance checks, or integration tests.             |

## Examples

- "Build an MCP server that exposes file system tools with read, write, and search capabilities."
- "Add a resource provider that serves database schema documentation to connected agents."
- "Test an MCP server's tool registration and error handling with a mock client."

## Compatibility Aliases

Anthropic upstream compatibility names for this skill: `mcp builder`, `mcp-builder`.
Treat requests that use those names as equivalent to this canonical Foundry skill.

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
