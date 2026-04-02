# Vault Patterns Reference

## Overview

This reference covers architecture patterns for secrets vaults including HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, and Azure Key Vault. It provides guidance on vault selection, deployment topology, secret engine configuration, and operational patterns.

## Vault Selection Guide

| Requirement | HashiCorp Vault | AWS Secrets Manager | GCP Secret Manager | Azure Key Vault |
|-------------|----------------|--------------------|--------------------|-----------------|
| Multi-cloud | Excellent | AWS only | GCP only | Azure only |
| Self-hosted option | Yes | No | No | No |
| Dynamic secrets | Excellent | Limited | No | No |
| PKI/certificate management | Built-in | Via ACM | Via CAS | Built-in |
| Kubernetes native | Excellent | Via CSI driver | Via CSI driver | Via CSI driver |
| Operational overhead | High | Low | Low | Low |
| Cost | Free (OSS) / Paid (Enterprise) | Per-secret + API call | Per-secret + API call | Per-operation |
| HSM support | Yes (Enterprise) | Default (AWS KMS) | Default (Cloud KMS) | Default (Azure HSM) |

## HashiCorp Vault Architecture

### Deployment Topology — High Availability

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │ Vault Node 1│ │ Vault Node 2│ │ Vault Node 3│
     │  (Active)   │ │  (Standby)  │ │  (Standby)  │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            │                │                │
     ┌──────▼────────────────▼────────────────▼──────┐
     │              Storage Backend                    │
     │    (Raft / Consul / DynamoDB / Integrated)     │
     └────────────────────────────────────────────────┘
```

### Storage Backend Selection

| Backend | Consistency | HA Support | Operational Complexity |
|---------|-----------|------------|----------------------|
| Integrated Raft | Strong | Yes | Low (recommended) |
| Consul | Strong | Yes | Medium (separate cluster) |
| DynamoDB | Eventual | Yes | Low (managed) |
| PostgreSQL | Strong | No | Medium |
| Filesystem | N/A | No | Low (dev/test only) |

### Secret Engines

| Engine | Purpose | Use Case |
|--------|---------|----------|
| KV v2 | Static key-value secrets | API keys, config values |
| Database | Dynamic database credentials | Per-request DB passwords |
| PKI | Certificate management | TLS certs, mTLS, code signing |
| Transit | Encryption as a service | Encrypt data without storing keys |
| AWS/GCP/Azure | Cloud dynamic credentials | IAM roles, service accounts |
| SSH | SSH certificate signing | SSH access management |
| TOTP | Time-based OTP | MFA seed management |

### KV v2 Namespace Design

```
kv/
├── production/
│   ├── auth-service/
│   │   ├── database          # DB connection string
│   │   ├── jwt-keys          # JWT signing keys
│   │   └── third-party       # External API keys
│   ├── payment-service/
│   │   ├── database
│   │   ├── stripe
│   │   └── encryption-keys
│   └── shared/
│       ├── smtp              # Shared email config
│       └── cdn               # Shared CDN credentials
├── staging/
│   └── ... (mirrors production structure)
└── development/
    └── ... (mirrors production structure)
```

### Database Secret Engine Configuration

```bash
# Enable engine
vault secrets enable -path=database database

# Configure PostgreSQL connection
vault write database/config/production-postgres \
  plugin_name=postgresql-database-plugin \
  allowed_roles="web-app,analytics" \
  connection_url="postgresql://{{username}}:{{password}}@db.internal:5432/appdb?sslmode=require" \
  username="vault_root" \
  password="root_password" \
  password_policy="postgres-policy"

# Create role with time-limited credentials
vault write database/roles/web-app \
  db_name=production-postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  revocation_statements="REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Request credentials
vault read database/creds/web-app
# Returns: username=v-web-app-abc123, password=random, lease_id, lease_duration
```

### PKI Engine Configuration

```bash
# Enable PKI engine
vault secrets enable pki

# Configure root CA (or import existing)
vault write pki/root/generate/internal \
  common_name="MyOrg Root CA" \
  ttl=87600h  # 10 years

# Enable intermediate CA
vault secrets enable -path=pki_int pki

# Generate intermediate CSR
vault write pki_int/intermediate/generate/internal \
  common_name="MyOrg Intermediate CA"

# Sign intermediate with root
vault write pki/root/sign-intermediate \
  csr=@intermediate.csr \
  ttl=43800h  # 5 years

# Create issuing role
vault write pki_int/roles/web-server \
  allowed_domains="example.com,internal.local" \
  allow_subdomains=true \
  max_ttl=720h  # 30 days
  key_type=ec \
  key_bits=256

# Issue certificate
vault write pki_int/issue/web-server \
  common_name="api.example.com" \
  ttl=168h  # 7 days
```

## Access Patterns

### Sidecar Pattern (Kubernetes)

The Vault Agent sidecar runs alongside the application, handles authentication, fetches secrets, and renders them to files.

```yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "web-app"
  vault.hashicorp.com/agent-inject-secret-db: "database/creds/web-app"
  vault.hashicorp.com/agent-inject-template-db: |
    {{- with secret "database/creds/web-app" -}}
    postgresql://{{ .Data.username }}:{{ .Data.password }}@db:5432/app
    {{- end }}
```

### Direct API Pattern

Applications call the Vault API directly using their authentication token.

```javascript
const vault = require('node-vault')({ endpoint: process.env.VAULT_ADDR });

// Authenticate with Kubernetes service account
await vault.kubernetesLogin({
  role: 'web-app',
  jwt: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8')
});

// Read secret
const secret = await vault.read('kv/data/production/web-app/database');
const dbUrl = secret.data.data.connection_string;
```

### CSI Driver Pattern

Mount Vault secrets as Kubernetes volumes using the Secrets Store CSI Driver.

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-db-creds
spec:
  provider: vault
  parameters:
    roleName: web-app
    vaultAddress: https://vault.internal:8200
    objects: |
      - objectName: "db-password"
        secretPath: "database/creds/web-app"
        secretKey: "password"
```

## Operational Patterns

### Seal/Unseal

Vault starts in a sealed state. Unsealing requires a threshold of key shares (Shamir's Secret Sharing).

**Auto-unseal options:**
- AWS KMS
- GCP Cloud KMS
- Azure Key Vault
- HSM (PKCS#11)

**Recommendation:** Use auto-unseal in production. Manual unsealing is a single point of failure.

### Audit Logging

```bash
# Enable file audit
vault audit enable file file_path=/var/log/vault/audit.log

# Enable syslog audit
vault audit enable syslog tag="vault"

# All secret access is logged with:
# - Timestamp
# - Client identity (auth method, policies)
# - Operation (read, write, delete)
# - Path accessed
# - Response status
```

### Break-Glass Procedure

1. Store emergency root token recovery keys offline (safe deposit box)
2. Document the unseal procedure for vault-down scenarios
3. Maintain a fallback credential set for critical services (encrypted, access-logged)
4. Test break-glass procedure quarterly
5. Rotate root token after every emergency use
