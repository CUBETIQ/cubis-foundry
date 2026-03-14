# Eval Assertions — Secret Management

## Eval 1: Secret Rotation Strategy

**ID:** `secret-rotation-strategy`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `Vault\|vault\|AWS Secrets Manager\|GCP Secret Manager\|secret.*manager` | Must recommend a proper secrets management platform to replace base64-encoded Kubernetes Secrets. |
| 2 | content_matches_regex | `rotation\|rotate\|schedule\|frequenc\|interval\|30.*day\|90.*day` | Must define specific rotation schedules for different secret types based on risk profile. |
| 3 | content_matches_regex | `zero.downtime\|graceful\|dual.credential\|rolling\|overlap` | Must address zero-downtime rotation strategy since shared credentials across services require coordination. |
| 4 | content_matches_regex | `dynamic.*secret\|short.lived\|ephemeral\|per.request\|lease` | Must recommend dynamic secrets for database credentials to eliminate long-lived shared passwords. |
| 5 | content_matches_regex | `TLS\|certificate\|cert.manager\|auto.renew\|PKI\|Let.*Encrypt` | Must urgently address TLS certificate automation given the 2-month expiry timeline. |

## Eval 2: Vault Integration Pattern

**ID:** `secret-vault-integration`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `Kubernetes auth\|kubernetes.*method\|auth.*method\|service.account` | Must configure Kubernetes authentication for Vault to leverage existing pod identity. |
| 2 | content_matches_regex | `vault.agent\|sidecar\|inject\|annotation\|vault.hashicorp` | Must describe the Vault Agent sidecar injection pattern for transparent secret delivery to pods. |
| 3 | content_matches_regex | `polic\|role\|namespace\|path\|capabilities` | Must define namespace-scoped Vault policies to enforce least-privilege access per service. |
| 4 | content_matches_regex | `database.*engine\|dynamic.*credential\|database.*role\|secret.*engine` | Must configure database secret engines for PostgreSQL and MongoDB dynamic credentials. |
| 5 | content_matches_regex | `PKI\|pki.*engine\|certificate\|mTLS\|mutual.*TLS` | Must address PKI engine setup for mTLS certificate generation as specified in requirements. |
