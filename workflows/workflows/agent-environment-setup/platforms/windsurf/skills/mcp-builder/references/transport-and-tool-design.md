# MCP Transport And Tool Design

Load this when the server contract is still being shaped.

## Minimum Design Questions

- Is this local stdio, remote HTTP, or another deployment shape?
- What auth or secret boundary exists?
- Which workflows need high-level tools versus composable low-level tools?
- What should be a tool, a resource, or a prompt template?

## Tool Rules

- Prefer action-oriented names.
- Keep each tool focused and discoverable.
- Use explicit input validation and structured output where possible.
- Mark destructive or non-idempotent behavior clearly.
