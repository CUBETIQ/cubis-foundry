---
name: vercel-security
description: "Canonical Vercel security skill covering WAF, rate limiting, bot controls, and traffic-protection policy."
metadata:
  deprecated: false
  replaced_by: null
  removal_target: null
---
# Vercel Security

## Purpose

Secure Vercel deployments with enforceable edge protections: WAF policy, rate limiting, bot filtering, and abuse mitigation tied to observability signals.

## Use This For

- WAF and custom firewall rules
- Rate-limit and abuse protection controls
- Bot management and traffic filtering
- Security hardening for public endpoints

## Decision Flow

1. Identify threat surface and high-risk routes.
2. Apply least-disruptive controls first.
3. Add strict controls for abusive patterns.
4. Validate against false positives and critical user paths.

## Verification

- Attack traffic is blocked/challenged as expected.
- Legitimate traffic remains unaffected on critical paths.
- Security alerts and logs are correlated in observability tools.

## Related Skills

- `security-reviewer`
- `secure-code-guardian`
- `vercel-observability`
