# Google Workspace Eval Assertions

## Eval 1: OAuth2 Flow with Drive API

This eval tests OAuth2 with PKCE for Google Drive access: scope selection, token management, encrypted storage, and Drive API file listing.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `drive.readonly` — Narrow scope selection        | Requesting the full `drive` scope when only read access is needed grants unnecessary write permissions, increasing the security surface and triggering stricter consent review. |
| 2 | contains | `code_verifier` — PKCE implementation            | PKCE prevents authorization code interception attacks that are possible when the code is transmitted through browser redirects on public clients. |
| 3 | contains | `refresh_token` — Token persistence              | Refresh tokens provide long-lived access without re-authorization. Without storing them, users must re-authenticate on every session, degrading the experience. |
| 4 | contains | `encrypt` — Token encryption at rest             | Refresh tokens grant access to user data. Storing them in plaintext means a database breach exposes every user's Google Drive to the attacker. |
| 5 | contains | `files.list` — Drive API file listing            | The files.list endpoint with the `fields` parameter retrieves file metadata efficiently. Without field selection, the API returns all 30+ fields per file, wasting bandwidth. |

### What a passing response looks like

- OAuth2 configuration with `drive.readonly` scope and PKCE code challenge generation.
- Authorization URL construction with `code_challenge`, `code_challenge_method=S256`, and `access_type=offline`.
- Token exchange endpoint that validates the code_verifier and stores the encrypted refresh token.
- Transparent token refresh using the Google client library's credential management.
- Drive API call using `files.list` with `fields: "files(id, name, mimeType, modifiedTime)"` for efficient metadata retrieval.

---

## Eval 2: Sheets API Batch Operations

This eval tests Sheets API batch operations: reading with proper render options, batch writing with value input control, service account auth, and quota management.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `valueRenderOption` — Read value control         | Without explicitly setting valueRenderOption, the API returns formatted strings by default, which corrupts numeric data with currency symbols, percentages, and locale-specific formatting. |
| 2 | contains | `batchUpdate` — Batch write operation            | Writing 10,000+ cells individually exhausts the per-minute quota in seconds. Batch updates combine multiple writes into a single API call, respecting quota and reducing latency. |
| 3 | contains | `valueInputOption` — Write value control         | Without setting valueInputOption, the API defaults to RAW, which means formulas are stored as text instead of being evaluated. USER_ENTERED parses formulas correctly. |
| 4 | contains | `ServiceAccountCredentials` — Service account auth | Automated server-to-server operations require service account authentication because there is no user present to complete the OAuth2 consent flow. |
| 5 | contains | `spreadsheets.readonly` — Appropriate scopes     | Reading and writing operations require different scopes. Using the narrowest scope for each operation follows least privilege and simplifies service account configuration. |

### What a passing response looks like

- Service account credentials loaded from a JSON key file or environment variable.
- Read operation with `valueRenderOption: "UNFORMATTED_VALUE"` to get raw numbers without formatting.
- Data processing logic that aggregates sales by month from the raw values.
- Batch write using `spreadsheets.values.batchUpdate` with multiple value ranges and `valueInputOption: "USER_ENTERED"`.
- Error handling for quota exhaustion (HTTP 429) with exponential backoff and retry.
