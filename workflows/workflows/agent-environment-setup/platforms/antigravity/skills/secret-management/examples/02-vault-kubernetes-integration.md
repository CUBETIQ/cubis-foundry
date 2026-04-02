# Example 2: HashiCorp Vault Integration with Kubernetes

## User Prompt

> We are migrating from Kubernetes Secrets (base64) to HashiCorp Vault for our production cluster. We have 3 namespaces (production, staging, dev) with about 15 services total. Services need PostgreSQL credentials, API keys, and some need TLS certificates for internal mTLS. We prefer the sidecar injection pattern. Design the integration.

## Expected Response

### Vault-Kubernetes Integration Architecture

#### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                  │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │ Vault Server (HA, 3 replicas)    │               │
│  │  - Kubernetes Auth Method        │               │
│  │  - Database Secret Engine        │               │
│  │  - KV v2 Secret Engine           │               │
│  │  - PKI Secret Engine             │               │
│  │  - Audit Logging (stdout + file) │               │
│  └──────────┬───────────────────────┘               │
│             │                                        │
│  ┌──────────▼───────────────────────┐               │
│  │ Vault Agent Injector (Mutating   │               │
│  │ Webhook)                         │               │
│  └──────────┬───────────────────────┘               │
│             │                                        │
│  ┌──────────▼────────┐  ┌───────────────────┐      │
│  │ production ns      │  │ staging ns         │      │
│  │  [pod + sidecar]   │  │  [pod + sidecar]   │      │
│  │  [pod + sidecar]   │  │  [pod + sidecar]   │      │
│  └────────────────────┘  └───────────────────┘      │
│                                                      │
│  ┌────────────────────┐                             │
│  │ dev ns             │                             │
│  │  [pod + sidecar]   │                             │
│  └────────────────────┘                             │
└─────────────────────────────────────────────────────┘
```

#### Step 1: Deploy Vault on Kubernetes

```bash
# Install Vault via Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --namespace vault \
  --set "server.ha.enabled=true" \
  --set "server.ha.replicas=3" \
  --set "injector.enabled=true" \
  --set "server.auditStorage.enabled=true"
```

Initialize and unseal:
```bash
kubectl exec -n vault vault-0 -- vault operator init -key-shares=5 -key-threshold=3
kubectl exec -n vault vault-0 -- vault operator unseal <key1>
kubectl exec -n vault vault-0 -- vault operator unseal <key2>
kubectl exec -n vault vault-0 -- vault operator unseal <key3>
```

#### Step 2: Configure Kubernetes Auth Method

```bash
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443" \
  token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
```

Create roles per namespace and service:
```bash
# Production namespace — order-service
vault write auth/kubernetes/role/production-order-service \
  bound_service_account_names=order-service \
  bound_service_account_namespaces=production \
  policies=production-order-service \
  ttl=1h

# Staging namespace — order-service (different policy)
vault write auth/kubernetes/role/staging-order-service \
  bound_service_account_names=order-service \
  bound_service_account_namespaces=staging \
  policies=staging-order-service \
  ttl=1h
```

#### Step 3: Configure Secret Engines

**KV v2 — Static secrets (API keys, config):**
```bash
vault secrets enable -path=kv kv-v2

# Store API keys per environment
vault kv put kv/production/order-service \
  STRIPE_API_KEY=sk_live_... \
  SENDGRID_API_KEY=SG...

vault kv put kv/staging/order-service \
  STRIPE_API_KEY=sk_test_... \
  SENDGRID_API_KEY=SG...
```

**Database — Dynamic PostgreSQL credentials:**
```bash
vault secrets enable database

vault write database/config/production-postgres \
  plugin_name=postgresql-database-plugin \
  allowed_roles="production-order-service-db,production-user-service-db" \
  connection_url="postgresql://{{username}}:{{password}}@postgres.production:5432/appdb" \
  username="vault_admin" \
  password="vault_admin_password"

vault write database/roles/production-order-service-db \
  db_name=production-postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON orders, order_items TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

**PKI — mTLS certificates:**
```bash
vault secrets enable pki
vault secrets tune -max-lease-ttl=8760h pki

# Generate root CA
vault write pki/root/generate/internal \
  common_name="internal.cluster.local" \
  ttl=8760h

# Enable intermediate PKI for issuing
vault secrets enable -path=pki_int pki
vault write pki_int/roles/internal-mtls \
  allowed_domains="svc.cluster.local" \
  allow_subdomains=true \
  max_ttl="72h"
```

#### Step 4: Define Vault Policies

```hcl
# production-order-service policy
path "kv/data/production/order-service" {
  capabilities = ["read"]
}

path "database/creds/production-order-service-db" {
  capabilities = ["read"]
}

path "pki_int/issue/internal-mtls" {
  capabilities = ["update"]
}
```

```hcl
# staging-order-service policy (different path)
path "kv/data/staging/order-service" {
  capabilities = ["read"]
}

path "database/creds/staging-order-service-db" {
  capabilities = ["read"]
}
```

**Policy principle:** Each service gets read access to only its own secrets. No service can list or read another service's secrets. No staging service can access production secrets.

#### Step 5: Configure Sidecar Injection

Annotate pod deployments to trigger Vault Agent injection:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: production
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "production-order-service"
        vault.hashicorp.com/agent-inject-secret-config: "kv/data/production/order-service"
        vault.hashicorp.com/agent-inject-secret-db: "database/creds/production-order-service-db"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "kv/data/production/order-service" -}}
          STRIPE_API_KEY={{ .Data.data.STRIPE_API_KEY }}
          SENDGRID_API_KEY={{ .Data.data.SENDGRID_API_KEY }}
          {{- end }}
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "database/creds/production-order-service-db" -}}
          DB_USERNAME={{ .Data.username }}
          DB_PASSWORD={{ .Data.password }}
          {{- end }}
    spec:
      serviceAccountName: order-service
      containers:
        - name: order-service
          image: order-service:latest
          # Secrets rendered to /vault/secrets/config and /vault/secrets/db
```

The Vault Agent sidecar:
1. Authenticates to Vault using the pod's Kubernetes service account
2. Fetches secrets and renders them to files in `/vault/secrets/`
3. Automatically renews database credentials before TTL expiry
4. Re-renders templates when secrets change

#### Step 6: Enable Audit Logging

```bash
vault audit enable file file_path=/vault/logs/audit.log
vault audit enable stdout
```

All secret access events (read, write, delete, authentication) are logged with:
- Timestamp, client identity (service account + namespace)
- Secret path accessed
- Response status

Forward logs to your SIEM for monitoring and alerting.

#### Migration Checklist

- [ ] Deploy Vault HA cluster in dedicated namespace
- [ ] Configure Kubernetes auth method
- [ ] Set up KV, database, and PKI secret engines
- [ ] Write policies per service per namespace
- [ ] Create Kubernetes auth roles per service
- [ ] Enable audit logging
- [ ] Migrate one service (canary) to Vault sidecar injection
- [ ] Validate secrets are rendered correctly
- [ ] Migrate remaining services in rolling fashion
- [ ] Remove old Kubernetes Secrets
- [ ] Set up monitoring and alerting for Vault health
