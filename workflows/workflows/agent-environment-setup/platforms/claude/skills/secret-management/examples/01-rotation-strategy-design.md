# Example 1: Secret Rotation Strategy for a SaaS Platform

## User Prompt

> Design a secret rotation strategy for our SaaS platform. We have:
> - 8 Node.js microservices in AWS ECS
> - PostgreSQL RDS (single instance, credentials shared by 5 services)
> - Redis ElastiCache (AUTH password shared by all services)
> - Stripe, Twilio, and AWS SES API keys
> - JWT signing key (RS256) used by auth service and verified by 4 other services
> - SSL certificates from Let's Encrypt
> - All secrets currently in AWS Systems Manager Parameter Store (SecureString)
> - No rotation automation exists

## Expected Response

### Secret Rotation Strategy — SaaS Platform

#### Current State Assessment

| Secret | Type | Current Storage | Shared By | Rotation | Risk |
|--------|------|----------------|-----------|----------|------|
| PostgreSQL credentials | Database | SSM Parameter Store | 5 services | Manual/never | Critical |
| Redis AUTH password | Database | SSM Parameter Store | 8 services | Manual/never | High |
| Stripe API key | Third-party | SSM Parameter Store | 2 services | Manual/never | High |
| Twilio API key | Third-party | SSM Parameter Store | 1 service | Manual/never | Medium |
| AWS SES credentials | Cloud IAM | SSM Parameter Store | 1 service | Manual/never | Medium |
| JWT signing key (RS256) | Crypto key | SSM Parameter Store | 5 services | Manual/never | Critical |
| TLS certificates | Certificate | Let's Encrypt | ALB | Auto-renew | Low |

#### Phase 1: Migrate to AWS Secrets Manager (Week 1-2)

Move from SSM Parameter Store to Secrets Manager because Secrets Manager supports native rotation with Lambda functions.

```bash
# Migration for each secret
aws secretsmanager create-secret \
  --name /production/database/postgres \
  --secret-string '{"username":"app","password":"current_password","host":"...","port":5432}'
```

Update all ECS task definitions to reference Secrets Manager ARNs instead of SSM parameters.

#### Phase 2: Database Credential Rotation (Week 2-3)

**Strategy:** Dual-credential rotation with zero downtime.

**How it works:**
1. Secrets Manager creates a new password for the database user
2. The database is updated with the new password
3. Services pick up the new credential on next secret fetch
4. The old password remains valid during a grace period
5. After all services have rotated, the old password is retired

**Rotation schedule:** Every 30 days

**Implementation:**
- Use the AWS-provided `SecretsManagerRDSPostgreSQLRotationSingleUser` Lambda
- Configure each of the 5 services to refresh credentials every 5 minutes from Secrets Manager (cached, not on every request)
- Use connection pool refresh on credential change:

```javascript
// Credential refresh pattern for Node.js
const refreshCredentials = async () => {
  const secret = await secretsManager.getSecretValue({
    SecretId: '/production/database/postgres'
  }).promise();
  const creds = JSON.parse(secret.SecretString);
  pool.options.password = creds.password;
};
setInterval(refreshCredentials, 5 * 60 * 1000);
```

**Per-service credentials (recommended long-term):**
Create individual database users for each service with minimum required permissions. This eliminates shared credentials and enables independent rotation.

#### Phase 3: Redis Password Rotation (Week 3)

**Challenge:** ElastiCache does not support Secrets Manager native rotation.

**Strategy:**
1. Create a custom rotation Lambda
2. Lambda generates new password, updates ElastiCache AUTH, updates Secrets Manager
3. Use a dual-password window (Redis 6+ supports multiple AUTH passwords during transition)

**Rotation schedule:** Every 60 days

#### Phase 4: Third-Party API Key Rotation (Week 4)

| Service | Rotation Method | Schedule |
|---------|----------------|----------|
| Stripe | Generate new restricted key in Stripe dashboard API, update Secrets Manager, revoke old key | 90 days |
| Twilio | Generate new API key via Twilio API, update Secrets Manager, revoke old key | 90 days |
| AWS SES | Replace with IAM role-based access (no static keys) | One-time migration |

**AWS SES migration to IAM roles:** Assign an ECS task role with SES permissions. Delete static SES credentials entirely. IAM roles use temporary credentials that rotate automatically.

#### Phase 5: JWT Signing Key Rotation (Week 5)

**Strategy:** JWKS (JSON Web Key Set) endpoint with key ID (`kid`) support.

1. Auth service maintains two active signing keys (current + previous)
2. New tokens are signed with the current key
3. Verifying services fetch the JWKS endpoint and accept tokens from either key
4. After token max lifetime (e.g., 24 hours), retire the previous key
5. Rotate every 90 days

```json
// JWKS endpoint response
{
  "keys": [
    { "kid": "key-2025-03", "kty": "RSA", "use": "sig", ... },
    { "kid": "key-2025-01", "kty": "RSA", "use": "sig", ... }
  ]
}
```

#### Rotation Schedule Summary

| Secret Type | Rotation Period | Method | Downtime Risk |
|-------------|----------------|--------|---------------|
| PostgreSQL credentials | 30 days | Secrets Manager Lambda | Zero (dual-credential) |
| Redis AUTH | 60 days | Custom Lambda | Zero (dual-password) |
| Stripe/Twilio keys | 90 days | Custom Lambda + API | Zero (generate-then-revoke) |
| AWS SES | N/A | Migrate to IAM roles | Zero |
| JWT signing key | 90 days | JWKS rotation | Zero (dual-key window) |
| TLS certificates | Auto | Let's Encrypt + cert-manager | Zero |

#### Monitoring and Alerting

- Alert if any secret has not been rotated within 1.5x its schedule
- Alert on rotation Lambda failures
- Dashboard showing last rotation date for each secret
- Audit log all Secrets Manager access via CloudTrail
