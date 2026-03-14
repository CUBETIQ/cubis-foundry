# Zero-Trust Secret Distribution Reference

## Overview

Zero-trust secret distribution replaces static shared secrets with identity-based authentication. Instead of services sharing long-lived credentials, each service proves its identity and receives short-lived, scoped credentials. The principle: never trust, always verify.

## Core Principles

| Principle | Traditional | Zero-Trust |
|-----------|------------|------------|
| Authentication | Shared password/API key | Workload identity (certificate, JWT, IAM role) |
| Credential lifetime | Long-lived (months/years) | Short-lived (minutes/hours) |
| Credential scope | Broad access | Minimum required access |
| Credential sharing | Same credential across services | Unique credential per service |
| Trust model | Network perimeter | Per-request verification |
| Rotation | Manual, infrequent | Automatic, continuous |

## Workload Identity Platforms

### Kubernetes Service Accounts

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  namespace: production
  annotations:
    # AWS IAM role binding
    eks.amazonaws.com/role-arn: arn:aws:iam::123456:role/payment-service
    # GCP workload identity
    iam.gke.io/gcp-service-account: payment@project.iam.gserviceaccount.com
```

Each pod automatically receives a signed JWT token that proves its identity:
```bash
# Token is mounted at:
/var/run/secrets/kubernetes.io/serviceaccount/token

# Contains claims:
{
  "iss": "https://kubernetes.default.svc.cluster.local",
  "sub": "system:serviceaccount:production:payment-service",
  "aud": ["vault", "https://kubernetes.default.svc.cluster.local"]
}
```

### SPIFFE/SPIRE

SPIFFE (Secure Production Identity Framework for Everyone) provides a universal identity framework.

```
SPIFFE ID format:
  spiffe://trust-domain/path

Examples:
  spiffe://acme.com/production/payment-service
  spiffe://acme.com/staging/user-service
  spiffe://acme.com/production/database-proxy
```

SPIRE (SPIFFE Runtime Environment) is the reference implementation:

```yaml
# SPIRE server configuration
server {
  trust_domain = "acme.com"
  bind_address = "0.0.0.0"
  bind_port = 8081
  data_dir = "/opt/spire/data"

  ca_ttl = "72h"
  default_svid_ttl = "1h"
}

plugins {
  NodeAttestor "k8s_psat" {
    plugin_data {
      clusters = {
        "production" = {
          service_account_allow_list = ["spire:spire-agent"]
        }
      }
    }
  }
}
```

### Cloud IAM Roles

| Cloud | Service Identity | How It Works |
|-------|-----------------|-------------|
| AWS | IAM Roles for Service Accounts (IRSA) | Pod assumes IAM role via OIDC federation |
| AWS | ECS Task Roles | Task automatically gets temporary AWS credentials |
| GCP | Workload Identity | Pod maps to GCP service account |
| Azure | Workload Identity | Pod uses federated credential to access Azure resources |

**AWS IRSA Example:**
```bash
# 1. Create IAM role with trust policy
aws iam create-role --role-name payment-service \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Federated": "arn:aws:iam::123456:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/ABCDEF"},
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/ABCDEF:sub": "system:serviceaccount:production:payment-service"
        }
      }
    }]
  }'

# 2. Attach permission policy
aws iam attach-role-policy --role-name payment-service \
  --policy-arn arn:aws:iam::123456:policy/payment-service-policy

# 3. The pod now automatically receives temporary AWS credentials
# No static access keys needed
```

## Mutual TLS (mTLS)

Service-to-service authentication using certificates instead of shared secrets.

```
┌─────────────┐         mTLS          ┌─────────────┐
│ Service A   │◄──────────────────────▶│ Service B   │
│ (client cert)│   Both verify each   │(server cert) │
└─────────────┘   other's identity     └─────────────┘
```

### Vault PKI for mTLS

```bash
# Issue client certificate
vault write pki_int/issue/service-a-role \
  common_name="service-a.production.svc.cluster.local" \
  ttl=24h

# Issue server certificate
vault write pki_int/issue/service-b-role \
  common_name="service-b.production.svc.cluster.local" \
  ttl=24h
```

### Service Mesh (Istio/Linkerd)

Service meshes automate mTLS between all services:

```yaml
# Istio PeerAuthentication — require mTLS
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT  # All traffic must be mTLS
```

## Token Exchange Patterns

### OAuth2 Token Exchange (RFC 8693)

Service A exchanges its identity token for a token that grants access to Service B:

```
Service A → Authorization Server: "Here's my identity token, I need access to Service B"
Authorization Server → Service A: "Here's a scoped token for Service B (valid 5 minutes)"
Service A → Service B: "Here's my scoped token"
Service B → Authorization Server: "Is this token valid?"
Authorization Server → Service B: "Yes, Service A is authorized for read access"
```

### Vault Token Exchange

```bash
# Service authenticates with Kubernetes identity
vault write auth/kubernetes/login \
  role=payment-service \
  jwt=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
# Returns: Vault token with payment-service policy

# Use Vault token to get database credentials
vault read database/creds/payment-db
# Returns: short-lived database credentials
```

## Migration Path

### From Static Secrets to Zero-Trust

| Phase | Action | Effort |
|-------|--------|--------|
| 1 | Inventory all static secrets | Low |
| 2 | Deploy vault or managed secret service | Medium |
| 3 | Enable Kubernetes auth / cloud IAM | Medium |
| 4 | Migrate database credentials to dynamic secrets | Medium |
| 5 | Replace API keys with IAM roles where possible | High |
| 6 | Implement mTLS for service-to-service | High |
| 7 | Remove all static shared secrets | Medium |

### Quick Wins

1. **AWS services:** Replace access keys with IAM roles (ECS task roles, Lambda execution roles, IRSA)
2. **Database:** Use Vault dynamic secrets or RDS IAM authentication
3. **Internal APIs:** Replace static API keys with JWT-based service auth
4. **External APIs:** Move static keys to vault with rotation automation

## Monitoring Zero-Trust Systems

| Signal | Monitor | Alert |
|--------|---------|-------|
| Identity token issuance | SPIRE/Vault audit logs | Unexpected service identity requests |
| Credential refresh failures | Application health checks | Any service failing to obtain credentials |
| Certificate expiry | Certificate monitoring | Certificates approaching expiry without renewal |
| Unauthorized access attempts | Service mesh telemetry | 403 responses between services |
| Token lifetime anomalies | Vault lease tracking | Tokens living beyond expected TTL |
