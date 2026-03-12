---
name: documentation-templates
description: Create API documentation, architecture decision records, runbooks, onboarding guides, and technical writing using proven templates and standards.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---
# Documentation Templates

## Purpose

Provide templates and guidance for technical documentation: API docs, architecture decision records (ADRs), runbooks, README files, onboarding guides, and inline code documentation.

## When to Use

- Writing or improving a project README
- Creating API documentation
- Recording architecture decisions (ADRs)
- Building operational runbooks
- Writing onboarding guides for new team members
- Documenting complex systems or workflows

## Instructions

### Step 1 — Choose the Right Template

| Document Type    | Audience                          | When                       |
| ---------------- | --------------------------------- | -------------------------- |
| README           | New contributors, users           | Every project              |
| API docs         | API consumers (internal/external) | Every API                  |
| ADR              | Future developers                 | Every significant decision |
| Runbook          | On-call engineers                 | Every production system    |
| Onboarding guide | New team members                  | Every team                 |
| RFC / Design doc | Reviewers before implementation   | Complex features           |

### Step 2 — README Template

```markdown
# Project Name

One-line description of what this project does.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Feature 1: brief description
- Feature 2: brief description

## Architecture

Brief overview or link to architecture docs.

## Development

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 15

### Setup

Step-by-step local development setup.

### Testing

How to run tests.

### Deployment

How to deploy (or link to deployment docs).

## Contributing

Link to CONTRIBUTING.md or brief guidelines.

## License

MIT (or appropriate license)
```

### Step 3 — Architecture Decision Record (ADR)

```markdown
# ADR-001: Use PostgreSQL for primary datastore

## Status

Accepted | Proposed | Deprecated | Superseded by ADR-xxx

## Context

What is the problem? What constraints exist?

## Decision

What did we decide and why?

## Consequences

What are the trade-offs? What becomes easier/harder?

## Alternatives Considered

What else did we evaluate and why did we reject it?
```

**Rules**:

- ADRs are immutable — supersede, don't edit
- Number sequentially (ADR-001, ADR-002)
- Title should be a decision, not a question
- Keep it short (1-2 pages max)

### Step 4 — Runbook Template

```markdown
# Runbook: [System/Alert Name]

## Overview

What this system does and why it matters.

## Alerts

| Alert           | Severity | Meaning                   |
| --------------- | -------- | ------------------------- |
| high_error_rate | Critical | Error rate > 5% for 5 min |
| high_latency    | Warning  | p95 > 2s for 10 min       |

## Diagnosis Steps

1. Check dashboards: [link]
2. Check logs: `kubectl logs -l app=service-name --tail=100`
3. Check dependencies: [list of upstream services]

## Common Fixes

### High error rate

1. Check recent deployments: `git log --since="2 hours ago"`
2. If recent deploy caused it: rollback with `./deploy rollback`
3. If not deployment-related: check database connections

### High latency

1. Check database slow query log
2. Check connection pool saturation
3. Scale up if under heavy load: `kubectl scale --replicas=5`

## Escalation

- L1: On-call engineer (PagerDuty)
- L2: Service owner (@team-backend)
- L3: Infrastructure team (@team-infra)
```

### Step 5 — API Documentation

**Document every endpoint with**:

```markdown
## POST /api/users

Create a new user account.

### Request

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

**Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| name | string | Yes | Full name (2-100 chars) |
| role | string | No | "user" (default) or "admin" |

**Example**:
\`\`\`json
{ "email": "alice@example.com", "name": "Alice Smith" }
\`\`\`

### Response

**201 Created**:
\`\`\`json
{ "id": "usr_abc123", "email": "alice@example.com", "name": "Alice Smith", "role": "user" }
\`\`\`

**400 Bad Request**:
\`\`\`json
{ "error": { "code": "VALIDATION_ERROR", "message": "Email already registered" } }
\`\`\`

**401 Unauthorized**:
\`\`\`json
{ "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired token" } }
\`\`\`
```

## Output Format

Use the appropriate template from above, filled in with project-specific details. Always include examples with realistic (not lorem ipsum) content.

## Examples

**User**: "Write a README for our API project"

**Response approach**: Use the README template. Fill in actual project details. Include quick start with real commands. Link to API docs. Add architecture overview if the system has multiple components.

**User**: "We need to document why we chose MongoDB over PostgreSQL"

**Response approach**: Use the ADR template. Document the context (data model flexibility needs), decision (MongoDB for document storage), consequences (eventual consistency trade-off), and alternatives considered (PostgreSQL with JSONB).
