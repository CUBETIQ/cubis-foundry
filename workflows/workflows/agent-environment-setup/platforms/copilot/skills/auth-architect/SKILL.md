---
name: "auth-architect"
description: "Use when designing or reviewing authentication and authorization for backend systems, including sessions, tokens, OAuth or OIDC, RBAC or ABAC, passkeys, service-to-service auth, and policy enforcement boundaries."
license: MIT
metadata:
  version: "3.0.0"
  domain: "security"
  role: "specialist"
  stack: "auth"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "modern auth for web and service platforms"
  tags: ["auth", "authorization", "oauth", "oidc", "rbac", "abac", "sessions", "jwt", "passkeys", "security"]
---
# Auth Architect

## When to use

- Designing or reviewing login, session, token, and policy architecture.
- Choosing between session-based auth, JWTs, OAuth or OIDC, passkeys, or service credentials.
- Defining RBAC, ABAC, tenant isolation, or field-level authorization boundaries.
- Hardening auth flows in REST, GraphQL, NestJS, FastAPI, Node, or managed-platform backends.

## When not to use

- Generic vulnerability review with no auth or policy surface.
- Pure API contract work where auth semantics are already fixed.
- Database-only tuning or schema design without identity or permission impact.

## Core workflow

1. Clarify actors, trust boundaries, clients, and the assets each flow protects.
2. Choose the credential and session model that fits the product and operational constraints.
3. Separate authentication, authorization, and audit responsibilities instead of blending them together.
4. Make token, session, policy, and recovery behavior explicit at service boundaries.
5. Verify revocation, rotation, least privilege, and failure behavior before shipping.

## Baseline standards

- Prefer server-owned sessions when revocation simplicity matters more than statelessness.
- Treat OAuth or OIDC as delegated identity plumbing, not a substitute for local authorization rules.
- Keep authorization policy close to the resource or resolver that owns the decision.
- Design service-to-service identity and secret rotation as first-class operational concerns.
- Make account recovery, MFA, and passkey fallback behavior explicit.

## Avoid

- Mixing authentication and authorization into one vague middleware concept.
- Issuing long-lived bearer tokens with no rotation or revocation story.
- Duplicating policy rules across clients, gateways, and services with no clear owner.
- Treating passkeys, sessions, or JWTs as universal defaults independent of product constraints.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/session-token-policy-checklist.md` | You need a deeper checklist for session vs token choice, OAuth or OIDC, passkeys, tenant isolation, service auth, and policy enforcement boundaries. |
