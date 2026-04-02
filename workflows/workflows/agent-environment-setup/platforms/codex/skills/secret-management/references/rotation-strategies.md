# Secret Rotation Strategies Reference

## Overview

Secret rotation limits the window of exposure when credentials are compromised. This reference covers rotation patterns, scheduling, zero-downtime strategies, and automation approaches for different secret types.

## Rotation Schedule Guidelines

| Secret Type | Rotation Period | Justification |
|-------------|----------------|---------------|
| Database passwords | 30 days | High-value target, credential reuse risk |
| API keys (internal) | 90 days | Moderate exposure risk |
| API keys (third-party) | 90-180 days | Vendor-dependent rotation capability |
| TLS certificates | Auto-renew at 66% lifetime | Prevent expiry outages |
| JWT signing keys | 90 days | Limit token forgery window |
| SSH keys | 180 days | Moderate exposure risk |
| Encryption keys | Annual | Key rotation with re-encryption |
| Service account tokens | 24 hours (dynamic) | Short-lived is best |

## Zero-Downtime Rotation Patterns

### Dual-Credential Pattern

The most common pattern for database and API key rotation.

```
Timeline:
  T0: [OLD active] ────────────────────────
  T1: [OLD active] [NEW created] ──────────
  T2: [OLD active] [NEW deployed to services]
  T3: [OLD grace]  [NEW active] ───────────
  T4: [OLD revoked] [NEW active] ──────────
```

**Steps:**
1. Generate new credential
2. Configure the target system to accept both old and new
3. Deploy new credential to all consuming services
4. Verify all services are using the new credential
5. Revoke the old credential

**Implementation for PostgreSQL:**
```sql
-- Step 1: Create new password
ALTER USER app_user WITH PASSWORD 'new_password';

-- PostgreSQL accepts the new password immediately
-- Old sessions remain valid until they reconnect
-- New connections can use either password during migration

-- Step 5: After all services migrated
-- (old password is naturally superseded)
```

### Blue-Green Credential Pattern

For systems that support multiple named credentials simultaneously.

```
T0: [User-A active, User-B inactive]
T1: [User-A active, User-B updated with new password]
T2: [Services switch to User-B]
T3: [User-A inactive, User-B active]
T4: [User-A updated with new password for next rotation]
```

**Implementation:**
```bash
# Two database users, alternating active/inactive
# Rotation simply switches which user services connect with
vault write database/config/mydb \
  allowed_roles="blue-role,green-role"

# Blue role (currently active)
vault write database/roles/blue-role \
  db_name=mydb \
  creation_statements="..." \
  default_ttl=768h  # 32 days

# On rotation: switch services to green role
# On next rotation: switch back to blue role
```

### Dynamic Credential Pattern

Eliminates rotation entirely by generating short-lived credentials on demand.

```bash
# Vault database dynamic secrets
vault read database/creds/web-app
# Returns: username=v-web-abc, password=random, ttl=1h

# Credentials are automatically revoked after TTL
# No rotation needed — each request gets fresh credentials
```

**Advantages:**
- No shared credentials between services
- Compromise is limited to TTL duration
- Automatic cleanup of unused credentials
- Audit trail per-credential per-service

## Rotation Automation

### AWS Secrets Manager Rotation

```python
# Lambda rotation function structure
def lambda_handler(event, context):
    secret_id = event['SecretId']
    step = event['Step']

    if step == 'createSecret':
        # Generate new secret value
        new_password = generate_password()
        secrets_client.put_secret_value(
            SecretId=secret_id,
            ClientRequestToken=event['ClientRequestToken'],
            SecretString=json.dumps({'password': new_password}),
            VersionStages=['AWSPENDING']
        )

    elif step == 'setSecret':
        # Apply new password to the target system
        pending = get_secret_version(secret_id, 'AWSPENDING')
        set_database_password(pending['password'])

    elif step == 'testSecret':
        # Verify new credentials work
        pending = get_secret_version(secret_id, 'AWSPENDING')
        test_connection(pending['password'])

    elif step == 'finishSecret':
        # Promote AWSPENDING to AWSCURRENT
        secrets_client.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage='AWSCURRENT',
            MoveToVersionId=event['ClientRequestToken'],
            RemoveFromVersionId=current_version_id
        )
```

### HashiCorp Vault Automatic Rotation

Vault handles rotation automatically for database dynamic secrets:

```bash
# Configure with rotation schedule
vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@db:5432/mydb" \
  username="vault_admin" \
  password="initial_password" \
  password_policy="strong-password"

# Vault rotates root credentials immediately
vault write -force database/rotate-root/mydb
```

### Custom Rotation Script Pattern

For services without native vault rotation support:

```bash
#!/bin/bash
# rotate-api-key.sh

VAULT_PATH="kv/data/production/service/api-key"

# 1. Generate new key via service API
NEW_KEY=$(curl -s -X POST https://api.service.com/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.key')

# 2. Store new key in vault
vault kv put "$VAULT_PATH" \
  api_key="$NEW_KEY" \
  rotated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  previous_key="$(vault kv get -field=api_key $VAULT_PATH)"

# 3. Wait for services to pick up new key
sleep 300  # 5 minutes

# 4. Revoke old key
OLD_KEY=$(vault kv get -field=previous_key "$VAULT_PATH")
curl -s -X DELETE "https://api.service.com/keys/$OLD_KEY" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Clean up previous_key field
vault kv patch "$VAULT_PATH" previous_key=""
```

## Application-Side Credential Refresh

### Connection Pool Refresh Pattern

```javascript
// Node.js — graceful credential refresh
class SecretAwarePool {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
    this.pool = null;
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    await this.refreshCredentials();
    setInterval(() => this.refreshCredentials(), this.refreshInterval);
  }

  async refreshCredentials() {
    const secret = await vault.read(this.vaultPath);
    const { username, password } = secret.data;

    if (this.pool) {
      // Drain old connections gracefully
      const oldPool = this.pool;
      this.pool = new Pool({ user: username, password, /* ... */ });
      await oldPool.end();
    } else {
      this.pool = new Pool({ user: username, password, /* ... */ });
    }
  }

  async query(sql, params) {
    return this.pool.query(sql, params);
  }
}
```

## Monitoring Rotation Health

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Time since last rotation | > 1.5x scheduled period | Investigate rotation failure |
| Rotation Lambda errors | Any error | Check logs, fix, re-run |
| Credential age | > max TTL | Emergency rotation |
| Services using old credential | > 0 after grace period | Force service restart |
| Vault lease expiry failures | Any failure | Check vault health |

## Emergency Rotation Procedure

When a credential is compromised:

1. **Immediately** generate new credential
2. **Immediately** deploy to all consuming services
3. **Immediately** revoke compromised credential
4. **Within 1 hour** audit access logs for unauthorized use
5. **Within 24 hours** conduct incident review
6. **Document** timeline, impact, and prevention measures
