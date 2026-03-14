# MCP Server Builder Eval Assertions

## Eval 1: Tool Registration with Validation

This eval tests MCP tool registration: JSON Schema input validation, action-oriented naming, destructive tool labeling, and capability negotiation.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `inputSchema` — JSON Schema validation           | Tools without input schemas accept any input, causing runtime errors deep in handler logic. Schema validation rejects malformed inputs at the protocol layer with clear error messages. |
| 2 | contains | `list-issues` — Action-oriented naming           | AI agents match user intent to tool names. Action-oriented names like `list-issues` are immediately understandable, while abstract names like `issue-manager` require the agent to read the full description. |
| 3 | contains | `capabilities` — Capability negotiation          | The initialize response must declare capabilities so clients know which features are available. Omitting capabilities causes clients to skip tool discovery entirely. |
| 4 | contains | `destructive` — Write operation labeling         | Agents must distinguish read-only from state-modifying operations. Without clear labeling, an agent exploring options may accidentally create or modify issues. |
| 5 | contains | `required` — Required field declaration          | JSON Schema `required` arrays ensure agents provide mandatory parameters. Without them, agents may omit the issue title or number, causing cryptic handler failures. |

### What a passing response looks like

- Server with `initialize` handler returning capabilities object with `tools: {}`.
- Four tools registered: `list-issues`, `get-issue`, `create-issue`, `update-issue`.
- Each tool with `inputSchema` containing `type: "object"`, `properties`, and `required` arrays.
- `create-issue` and `update-issue` descriptions containing "destructive" or "modifies state" language.
- Filter parameters on `list-issues` (state, labels, assignee) as optional properties with enum constraints.

---

## Eval 2: Resource Provider Implementation

This eval tests MCP resource providers: resource listing, URI templates for parameterized content, MIME type declarations, and protocol-compliant response format.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `resources/list` — Resource discovery            | Without resources/list, clients cannot discover what resources the server offers. They would need prior knowledge of every URI, defeating the purpose of dynamic context. |
| 2 | contains | `uri` — Resource URI declaration                 | URIs are the primary identifier for resources in the MCP protocol. Omitting them makes resources unaddressable by clients. |
| 3 | contains | `mimeType` — Content type declaration            | MIME types tell clients how to render content. A markdown resource displayed as plain text loses formatting; a JSON resource without the type cannot be parsed. |
| 4 | contains | `resourceTemplates` — Parameterized resources    | URI templates enable a single resource definition to serve many instances (any table schema, any API endpoint) without enumerating every possible URI at registration time. |
| 5 | contains | `contents` — Response format compliance          | The MCP protocol requires resource read responses to include a `contents` array with URI, MIME type, and content. Non-compliant responses are silently dropped by clients. |

### What a passing response looks like

- `resources/list` handler returning static resources (README, changelog) and resource templates (API docs, schema).
- Static resources with fixed URIs like `docs://project/readme` and `docs://project/changelog`.
- Resource templates with URI patterns like `docs://api/{endpoint}` and `schema://database/{table}`.
- Each resource declaring `mimeType: "text/markdown"` or appropriate content type.
- `resources/read` handler returning `{ contents: [{ uri, mimeType, text }] }` format.
