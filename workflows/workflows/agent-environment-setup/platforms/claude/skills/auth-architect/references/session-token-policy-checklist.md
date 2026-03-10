# Session, Token, And Policy Checklist

Load this when auth work needs more depth than the root skill.

## Boundary and threat framing

- List actors, clients, trust boundaries, and the assets each flow protects.
- Decide where authentication ends and authorization begins.
- Make audit and incident-response requirements explicit for privileged flows.

## Session vs token choice

- Prefer server-owned sessions when revocation, rotation simplicity, or browser ergonomics matter most.
- Prefer short-lived access tokens plus refresh controls only when stateless distribution or delegated clients justify the complexity.
- Avoid bearer-token sprawl across browser, mobile, and service clients without separate threat assumptions.

## OAuth, OIDC, and delegated identity

- Use OAuth for delegated access and OIDC for identity; do not collapse them conceptually.
- Scope tokens narrowly and document token audience, issuer, and rotation behavior.
- Keep provider callbacks, consent, and account-linking behavior explicit.

## Authorization and policy

- Keep RBAC, ABAC, tenant boundaries, and field-level policy checks close to the owning service or resolver.
- Avoid duplicating policy logic in frontend code as the only enforcement layer.
- Make authorization failure semantics predictable and observable.

## Passkeys, MFA, and recovery

- Treat passkeys as a primary sign-in option where product fit exists, not just a marketing add-on.
- Make MFA enrollment, recovery, device loss, and fallback channels explicit.
- Keep recovery flows at least as hardened as the primary sign-in flow.

## Service-to-service auth

- Use dedicated service identities, narrow scopes, and explicit secret or key rotation.
- Keep human auth, machine auth, and webhook verification separate.
- Make internal trust assumptions visible instead of implied by network location.

## Operational safety

- Log auth decisions without leaking secrets or raw tokens.
- Verify revocation, logout, secret rotation, and key rollover behavior.
- Recheck caching, GraphQL field policy, and background-job privilege boundaries before finishing.
