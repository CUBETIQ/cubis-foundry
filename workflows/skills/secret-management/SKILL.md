---
name: secret-management
description: "Design and implement secret and credential management strategies including vault integration, environment variable handling, rotation policies, secret scanning, and zero-trust credential distribution."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Secret Management

## Purpose

Guide the design and implementation of robust secret and credential management systems. This skill covers vault architecture, environment-based configuration, automated rotation strategies, pre-commit secret scanning, and zero-trust distribution patterns to prevent credential leaks and minimize blast radius when breaches occur.

## When to Use

- Setting up a secrets vault (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
- Designing environment variable management for multi-stage deployments
- Implementing automated secret rotation for databases, API keys, or certificates
- Configuring pre-commit hooks and CI pipelines to detect leaked secrets
- Migrating from hardcoded secrets to a managed solution
- Adopting zero-trust patterns for service-to-service authentication

## Instructions

1. **Audit the current secret landscape** — Inventory all secrets (API keys, database credentials, TLS certificates, OAuth tokens, encryption keys) and where they are stored today because you cannot secure what you do not know exists.

2. **Classify secrets by sensitivity and scope** — Categorize each secret as infrastructure, application, or user-level and assign a sensitivity tier (critical, high, standard) because classification drives storage requirements and rotation frequency.

3. **Select a vault backend appropriate to the environment** — Choose HashiCorp Vault for multi-cloud or self-hosted, AWS Secrets Manager for AWS-native, GCP Secret Manager for GCP-native, or Azure Key Vault for Azure-native because platform-aligned vaults reduce operational overhead and latency.

4. **Design the vault architecture** — Define namespaces, secret engines (KV, database, PKI, transit), access policies, and audit logging configuration because a well-structured vault prevents secret sprawl and enables fine-grained access control.

5. **Implement environment-based secret injection** — Configure secrets to be injected at runtime via environment variables, mounted volumes, or sidecar agents rather than baked into images or config files because runtime injection prevents secrets from persisting in artifacts.

6. **Establish secret rotation policies** — Define rotation schedules (database passwords: 30 days, API keys: 90 days, TLS certificates: before expiry) and implement automated rotation using vault dynamic secrets or custom rotation lambdas because stale credentials accumulate risk over time.

7. **Configure dynamic secrets where possible** — Use vault database secret engines or cloud IAM to generate short-lived, per-request credentials because dynamic secrets eliminate the risk of long-lived credential compromise.

8. **Set up pre-commit secret scanning** — Install gitleaks, trufflehog, or detect-secrets as pre-commit hooks and in CI pipelines because catching secrets before they reach version control is orders of magnitude cheaper than rotating after exposure.

9. **Implement secret zero-trust distribution** — Use workload identity (Kubernetes service accounts, cloud IAM roles, SPIFFE/SPIRE) instead of static tokens for service-to-service authentication because identity-based access eliminates shared secret management entirely.

10. **Configure audit logging for all secret access** — Enable vault audit backends, cloud trail logging, and application-level access logs because audit trails are essential for breach investigation and compliance attestation.

11. **Design break-glass procedures** — Document emergency access workflows for when the vault is unavailable, including sealed vault recovery, backup decryption keys, and fallback credential paths because operational resilience requires planning for vault outages.

12. **Implement least-privilege access policies** — Write vault policies and IAM roles that grant each service access to only the specific secrets it needs because overly broad policies increase blast radius when any single service is compromised.

13. **Test secret rotation end-to-end** — Verify that rotation does not cause downtime by testing with graceful credential reload, connection pool refresh, and dual-credential windows because untested rotation procedures fail during the worst possible moments.

14. **Establish secret lifecycle governance** — Define ownership, review cadence, deprecation, and deletion procedures for each secret category because orphaned secrets become unrotated, unmonitored attack vectors.

15. **Document the secret management architecture** — Produce runbooks for common operations (add secret, rotate, revoke, break-glass) and architecture diagrams showing secret flow because undocumented systems degrade into insecure systems as team members change.

## Output Format

```
## Secret Management Assessment

### Current State
[Inventory of secrets, current storage locations, identified risks]

### Architecture Design
[Vault backend, namespace structure, secret engines, access policies]

### Rotation Strategy
| Secret Type | Current Rotation | Target Rotation | Method |
|-------------|-----------------|-----------------|--------|
| DB passwords | Manual/never | 30 days | Vault dynamic secrets |
| API keys | Manual | 90 days | Rotation lambda |
| TLS certs | Manual | Auto-renew at 80% | Vault PKI engine |

### Implementation Plan
[Priority-ordered steps with effort estimates]

### Scanning Configuration
[Pre-commit hooks, CI integration, tool configuration]

### Zero-Trust Migration Path
[Current auth method → target identity-based method per service]

### Runbooks
[Add, rotate, revoke, break-glass procedures]
```

## References

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Vault Patterns | `references/vault-patterns.md` | Designing or configuring vault infrastructure |
| Rotation Strategies | `references/rotation-strategies.md` | Implementing automated secret rotation |
| Secret Scanning | `references/secret-scanning.md` | Setting up pre-commit or CI scanning |
| Environment Management | `references/env-management.md` | Configuring runtime secret injection |
| Zero-Trust Patterns | `references/zero-trust.md` | Implementing identity-based service auth |
