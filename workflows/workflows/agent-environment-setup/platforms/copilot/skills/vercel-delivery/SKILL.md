---
name: vercel-delivery
description: "Canonical Vercel delivery skill covering deployments, domains, flags, and CLI-driven release operations."
metadata:
  deprecated: false
  replaced_by: null
  removal_target: null
---
# Vercel Delivery

## Purpose

Run reliable Vercel release operations end-to-end: build/deploy lifecycle, environment promotion, domain management, feature-flag rollout, and CLI automation.

## Use This For

- Deployment pipelines and promotion policy
- Preview/production environment controls
- Custom domains, DNS/SSL readiness
- Controlled rollouts with feature flags
- Vercel CLI operational workflows

## Decision Flow

1. Lock release target and rollback checkpoint.
2. Choose rollout strategy (direct, staged, flag-gated).
3. Verify domain/certificate/environment integrity.
4. Execute release with post-deploy checks.

## Verification

- Deployment health is green in target environment.
- Domain resolution and TLS are valid.
- Rollback command/path is tested and documented.

## Related Skills

- `vercel-platform`
- `vercel-runtime`
- `vercel-security`
- `devops-engineer`
