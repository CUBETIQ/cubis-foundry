````markdown
---
inclusion: manual
name: "saas-builder"
description: "Build or review production-ready multi-tenant SaaS systems on AWS serverless architecture with React + TypeScript frontend, tenant-isolated DynamoDB data models, JWT/RBAC authorization, Stripe subscriptions, and usage-based billing. Use for SaaS architecture design, implementation planning, API/Lambda patterns, billing workflows, and tenant isolation audits."
---

# SaaS Builder

Implement multi-tenant SaaS systems with serverless-first architecture, strict tenant isolation, and billing-grade data handling.

## Core Workflow

1. Define tenant model, subscription tiers, quotas, and billable events before API design.
2. Set repository layout using `steering/repository-structure.md`.
3. Implement authentication first: Lambda authorizer, tenant claims, and role extraction.
4. Implement tenant-scoped data access: all keys prefixed by tenant ID.
5. Implement API endpoints with validation, RBAC checks, and tenant-aware logging.
6. Implement billing integration: idempotent payment operations, webhook verification, usage metering.
7. Implement frontend tenant context, quota handling, and feature-flagged UI.
8. Validate cross-tenant isolation, billing edge cases, and operational monitoring before release.

## Load Steering Files On Demand

- `steering/architecture-principles.md`
Purpose: Multi-tenancy, cost model, auth/authorization, compliance, and scalability constraints.
Load when: Defining architecture decisions and non-functional requirements.

- `steering/implementation-patterns.md`
Purpose: API conventions, Lambda function sequence, DynamoDB keys, frontend/backend code style.
Load when: Implementing endpoints, handlers, data access, and UI integration.

- `steering/billing-and-payments.md`
Purpose: Money representation, webhook/idempotency rules, subscription lifecycle, invoicing, tax, fraud, and testing.
Load when: Implementing payments, usage metering, and financial reporting.

- `steering/repository-structure.md`
Purpose: Target monorepo layout and ownership boundaries for frontend/backend/schema/infrastructure.
Load when: Bootstrapping or refactoring project structure.

## Non-Negotiable Guardrails

### Tenant Isolation

- Read tenant ID only from authorizer claims, never from request body.
- Prefix all partition keys with tenant context.
- Reject any operation that can return cross-tenant data.
- Enforce RBAC checks at function entry for sensitive operations.

### Money and Billing

- Store money as integer cents only.
- Attach currency code to every monetary value.
- Use idempotency keys for charge/refund/subscription mutations.
- Verify webhook signatures and support retry-safe processing.

### API and Lambda

- Use versioned REST endpoints and proper HTTP status codes.
- Validate request inputs at API boundary.
- Keep handlers thin and move business logic into shared modules.
- Log failures with tenant context while avoiding sensitive data leaks.

### Security and Compliance

- Use managed authentication providers (Cognito/Auth0).
- Never store card numbers; use provider tokens only.
- Encrypt data at rest and in transit.
- Keep immutable financial audit trails.

## MCP Setup

Use `mcp.json` as baseline MCP configuration:

- Set `AWS_PROFILE` and `AWS_REGION` for `awslabs.aws-serverless-mcp`.
- Enable `stripe` (`"disabled": false`) when payment integration is required.
- Enable `playwright` when browser automation tests are required.

## Output Expectations

When producing architecture or implementation deliverables, include:

1. Tenant isolation strategy and key schema.
2. API contract plan (or OpenAPI updates).
3. Billing flow and failure-handling behavior.
4. Security/compliance controls.
5. Testing plan including cross-tenant leakage and billing edge cases.
````
