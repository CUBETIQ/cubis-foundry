---
name: postman
description: Automate API testing and collection management with Postman MCP. Use for workspace, collection, environment, and mock operations.
---

# Postman MCP

Use this skill when you need to work with Postman through MCP tools.

## Required Environment Variables

- `POSTMAN_API_KEY_<PROFILE>` for authenticated Postman access.

## Notes

- Use environment variables for secrets. Do not inline API keys.
- Prefer tool discovery (`getEnabledTools`) before making assumptions about available tool sets.
