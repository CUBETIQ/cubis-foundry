# Technical Documentation Eval Assertions

## Eval 1: API Documentation Generation

This eval tests the ability to produce comprehensive API documentation with endpoint descriptions, authentication details, request/response examples, and error catalogs.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `Bearer` — Authentication format specification  | API consumers need the exact authorization header format. Vague "use a token" instructions cause integration failures. |
| 2 | contains | `curl` — Working request examples               | Copy-pasteable curl commands are the fastest way for consumers to test endpoints. Abstract parameter tables without examples leave guessing. |
| 3 | contains | `400` — Validation error documentation          | HTTP 400 is the most common error consumers encounter. Undocumented validation rules force trial-and-error debugging. |
| 4 | contains | `401` — Authentication error documentation      | HTTP 401 responses need clear documentation because authentication failures are the first blocker for new API consumers. |
| 5 | contains | `application/json` — Content type specification | Explicit content types prevent mismatched headers, which produce cryptic parsing errors that are hard to diagnose remotely. |

### What a passing response looks like

- An overview section explaining the API purpose, base URL, and versioning strategy.
- Authentication section specifying JWT Bearer token format with header example.
- Each endpoint documented with: HTTP method, path, description, request body schema, response schema, and status codes.
- Working curl examples for each endpoint showing headers, request body, and expected response.
- Error catalog listing 400, 401, 403, 404, and 422 responses with descriptions and example payloads.
- Rate limiting section with limits, headers (X-RateLimit-Limit, X-RateLimit-Remaining), and retry guidance.

---

## Eval 2: Runbook Writing

This eval tests the ability to produce an operational runbook with prerequisites, step-by-step procedures, verification, rollback, and escalation paths.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `## Prerequisites` — Pre-procedure requirements | Missing prerequisites discovered mid-procedure cause failures and wasted time. They must be checked before step one. |
| 2 | contains | `## Rollback` — Revert procedure                | Production procedures without rollback plans turn partial failures into full outages. Every destructive step needs an undo path. |
| 3 | contains | `snapshot` — Backup before destructive changes  | Database upgrades must start with a snapshot or backup. This is the non-negotiable safety net for any data-touching operation. |
| 4 | contains | `## Verification` — Success confirmation steps  | Procedures without verification leave ambiguous outcomes. Specific checks (query test, health endpoint, metric dashboard) confirm success. |
| 5 | contains | `Escalat` — Escalation path documentation       | On-call engineers need to know when and who to escalate to. Runbooks without escalation contacts leave operators stranded during failures. |

### What a passing response looks like

- A title and metadata section with last-updated date, owner team, and estimated duration.
- Prerequisites listing: AWS console access, RDS modify permissions, read replica status, current version confirmation, maintenance window confirmation.
- Numbered step-by-step procedure: create snapshot, create read replica on target version, verify replica, promote replica, update connection strings, verify application health.
- Verification section: run test queries, check application error rates, verify connection pool metrics, confirm replication lag is zero.
- Rollback section: revert connection strings to original instance, verify application reconnects, document the failure for post-mortem.
- Escalation section: DBA team contact, AWS support case creation criteria, management notification threshold.
