---
name: auth-architect
description: "Use when designing or reviewing authentication and authorization for backend systems, including sessions, tokens, OAuth or OIDC, RBAC or ABAC, passkeys, service-to-service auth, and policy enforcement boundaries."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Auth Architect

## Purpose

Use when designing or reviewing authentication and authorization for backend systems, including sessions, tokens, OAuth or OIDC, RBAC or ABAC, passkeys, service-to-service auth, and policy enforcement boundaries.

## When to Use

- Designing or reviewing login, session, token, and policy architecture.
- Choosing between session-based auth, JWTs, OAuth or OIDC, passkeys, or service credentials.
- Defining RBAC, ABAC, tenant isolation, or field-level authorization boundaries.
- Hardening auth flows in REST, GraphQL, NestJS, FastAPI, Node, or managed-platform backends.

## Instructions

1. Clarify actors, trust boundaries, clients, and the assets each flow protects.
2. Choose the credential and session model that fits the product and operational constraints.
3. Separate authentication, authorization, and audit responsibilities instead of blending them together.
4. Make token, session, policy, and recovery behavior explicit at service boundaries.
5. Verify revocation, rotation, least privilege, and failure behavior before shipping.

### Baseline standards

- Prefer server-owned sessions when revocation simplicity matters more than statelessness.
- Treat OAuth or OIDC as delegated identity plumbing, not a substitute for local authorization rules.
- Keep authorization policy close to the resource or resolver that owns the decision.
- Design service-to-service identity and secret rotation as first-class operational concerns.
- Make account recovery, MFA, and passkey fallback behavior explicit.

### Constraints

- Avoid mixing authentication and authorization into one vague middleware concept.
- Avoid issuing long-lived bearer tokens with no rotation or revocation story.
- Avoid duplicating policy rules across clients, gateways, and services with no clear owner.
- Avoid treating passkeys, sessions, or JWTs as universal defaults independent of product constraints.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/session-token-policy-checklist.md` | You need a deeper checklist for session vs token choice, OAuth or OIDC, passkeys, tenant isolation, service auth, and policy enforcement boundaries. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with auth architect best practices in this project"
- "Review my auth architect implementation for issues"
