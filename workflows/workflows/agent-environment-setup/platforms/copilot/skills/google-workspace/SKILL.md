---
name: google-workspace
description: "Use when integrating Google Workspace APIs: Gmail sending and search, Drive file management and sharing, Calendar event operations, Sheets data reading and writing, OAuth2 and service account authentication, and batch request optimization."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Google Workspace API Integration

## Purpose

Guide the design and implementation of production-grade Google Workspace API integrations covering Gmail (sending, searching, label management), Drive (file CRUD, sharing, permissions), Calendar (event creation, availability queries, recurring events), Sheets (reading, writing, formula preservation), OAuth2 user authentication, service account delegation, and batch request patterns for throughput optimization.

## When to Use

- Authenticating users with OAuth2 for Google Workspace API access.
- Setting up service accounts with domain-wide delegation for server-to-server operations.
- Sending, searching, or processing Gmail messages programmatically.
- Managing Google Drive files, folders, permissions, and shared drives.
- Creating, updating, or querying Google Calendar events and free/busy data.
- Reading from and writing to Google Sheets with formula and formatting preservation.
- Optimizing API throughput with batch requests and quota management.

## Instructions

1. **Configure OAuth2 consent screen and scopes before writing integration code** because Google requires scope approval for sensitive APIs, and requesting overly broad scopes triggers extended review that blocks production deployment for weeks.

2. **Request the narrowest possible OAuth2 scopes for each integration** because narrow scopes (e.g., `gmail.send` instead of `gmail.modify`) reduce the security surface, simplify consent screen review, and increase user trust during the authorization flow.

3. **Implement OAuth2 with PKCE for web and mobile clients** because the authorization code flow with PKCE prevents authorization code interception attacks without requiring a client secret, which cannot be kept confidential in public clients.

4. **Use service accounts with domain-wide delegation for automated server-side operations** because service accounts do not require user interaction for authorization, and domain-wide delegation lets them act on behalf of any user in the Google Workspace domain.

5. **Store OAuth2 refresh tokens encrypted in your database, never in local files** because refresh tokens grant long-lived access to user data, and storing them in plaintext or in application files risks unauthorized access if the storage is compromised.

6. **Handle token refresh transparently with the Google client library's built-in credential management** because access tokens expire after one hour, and manual refresh logic is error-prone. The client libraries handle refresh, retry, and caching automatically.

7. **Use the Gmail API's `users.messages.send` with RFC 2822 formatted messages** because the Gmail API requires base64url-encoded RFC 2822 messages, and constructing them correctly with headers, MIME parts, and attachments avoids silent delivery failures.

8. **Implement Gmail search with the `q` parameter using Gmail search operators** because the Gmail API supports the same search syntax as the Gmail web UI (from:, to:, subject:, has:attachment, after:, before:), enabling complex queries without client-side filtering.

9. **Use Drive API v3 with `fields` parameter to request only needed metadata** because Drive API responses include dozens of fields by default, and specifying fields reduces response size, latency, and quota consumption.

10. **Manage shared drive permissions with the `supportsAllDrives` parameter** because shared drives have different permission semantics than personal drives, and omitting this parameter causes permission operations to fail silently or return incomplete results.

11. **Read and write Sheets data with `valueRenderOption` and `valueInputOption` set explicitly** because the default render option returns formatted strings instead of raw values, and the default input option may reinterpret data as dates or formulas unexpectedly.

12. **Use batch requests to combine multiple API calls into a single HTTP request** because Google Workspace APIs enforce per-user and per-project quota limits, and batch requests reduce HTTP overhead and count as a single quota unit for up to 100 sub-requests.

13. **Implement exponential backoff for quota errors (HTTP 429) and server errors (HTTP 500, 503)** because Google APIs enforce strict rate limits, and aggressive retries without backoff trigger longer lockouts and cascading failures.

14. **Use Google Calendar's `freebusy` endpoint for availability checks** because querying individual events and computing availability client-side is slow, permission-sensitive, and error-prone. The freebusy API returns aggregated availability without exposing event details.

15. **Preserve Sheets formulas and formatting when writing data** because overwriting cells with raw values destroys formulas that other cells depend on. Use `valueInputOption: "USER_ENTERED"` when the input should be parsed as formulas, and `"RAW"` for literal values.

16. **Create webhook push notifications with the Drive and Calendar watch APIs** because polling for changes wastes quota and introduces latency. Push notifications deliver changes in near-real-time to your registered webhook endpoint.

## Output Format

```
## Authentication Setup
[OAuth2 or service account configuration, scopes, token storage]

## API Integration
[Implementation code with error handling, pagination, and field selection]

## Batch Operations
[Batch request construction, quota management, retry logic]

## Testing Plan
[Mock strategies, test account setup, quota-safe test patterns]
```

## References

| File                            | Load when                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `references/auth-and-scopes.md` | Configuring OAuth2 consent, PKCE flows, service accounts, scopes, or token management.     |
| `references/sheets-api-patterns.md` | Reading, writing, formatting, or batch-updating Google Sheets data.                    |
| `references/workspace-automation.md` | Coordinating Drive, Gmail, Sheets, and Calendar automations with quota awareness.      |

## Examples

- "Set up OAuth2 with PKCE for a web app that reads user Google Drive files."
- "Batch-update 500 rows in a Google Sheet with formula preservation and error handling."
- "Send templated Gmail messages with attachments using a service account."

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
