# Audit Trail Design Reference

## Overview

Audit trails record who accessed, modified, or deleted PII, when, why, and from where. They are required by GDPR (Article 5, accountability principle), HIPAA, PCI DSS, and SOC 2. Beyond compliance, audit trails enable breach impact assessment, insider threat detection, and data governance.

## What to Audit

### PII Access Events

| Event Type | What to Log | Example |
|-----------|------------|---------|
| Read | Who accessed which PII fields | "user:admin_42 read customer:1234 fields:[email, phone]" |
| Write | Who modified which PII fields, old/new values (hashed) | "user:api_service wrote customer:1234 field:email" |
| Delete | Who deleted which PII records | "user:admin_42 deleted customer:1234 (erasure request)" |
| Export | Who exported PII data and in what format | "user:admin_42 exported customers CSV, 5000 records" |
| Search | Who searched for PII values | "user:support_01 searched email=*@example.com" |
| Bulk access | Who accessed PII at scale | "user:analytics_service read 10000 customer records" |
| Failed access | Who attempted unauthorized PII access | "user:intern_01 denied access to customer:1234 salary" |
| Consent change | When consent was granted/withdrawn | "customer:1234 withdrew marketing consent" |

### System Events

| Event | Purpose |
|-------|---------|
| Masking pipeline execution | Track when non-production data was refreshed |
| Retention policy execution | Track automated deletions |
| Backup creation/restoration | Track when PII was copied |
| Access policy changes | Track permission modifications |
| Encryption key rotation | Track key management activities |

## Audit Log Schema

### Structured Audit Event

```json
{
  "event_id": "evt_a7b3c9d1e5f2g8h4",
  "timestamp": "2025-03-14T10:23:45.123Z",
  "event_type": "pii_access",
  "action": "read",
  "actor": {
    "type": "user",
    "id": "user_42",
    "role": "support_agent",
    "ip_address": "10.0.1.50",
    "user_agent": "Chrome/120.0",
    "session_id": "sess_xyz789"
  },
  "resource": {
    "type": "customer",
    "id": "cust_1234",
    "fields_accessed": ["email", "phone", "address"]
  },
  "context": {
    "purpose": "support_ticket_resolution",
    "ticket_id": "TICKET-5678",
    "legal_basis": "legitimate_interest",
    "application": "support-portal",
    "environment": "production"
  },
  "result": "success",
  "data_classification": "pii_standard"
}
```

### Database Schema

```sql
CREATE TABLE pii_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,

  -- Actor
  actor_type VARCHAR(20) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(50),
  actor_ip INET,
  session_id VARCHAR(100),

  -- Resource
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  fields_accessed TEXT[],

  -- Context
  purpose VARCHAR(100),
  legal_basis VARCHAR(50),
  application VARCHAR(100),
  environment VARCHAR(20),

  -- Result
  result VARCHAR(20) NOT NULL,
  error_message TEXT,
  data_classification VARCHAR(50),

  -- Metadata
  metadata JSONB
);

-- Indexes for common queries
CREATE INDEX idx_audit_timestamp ON pii_audit_log (timestamp);
CREATE INDEX idx_audit_actor ON pii_audit_log (actor_id, timestamp);
CREATE INDEX idx_audit_resource ON pii_audit_log (resource_type, resource_id, timestamp);
CREATE INDEX idx_audit_event_type ON pii_audit_log (event_type, timestamp);

-- Partitioning by month for performance
CREATE TABLE pii_audit_log_2025_03 PARTITION OF pii_audit_log
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
```

## Implementation Patterns

### Middleware-Based Audit Logging

```javascript
// Express.js middleware for automatic PII access logging
function piiAuditMiddleware(piiFields) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Detect which PII fields are in the response
      const accessedFields = detectPIIFields(body, piiFields);

      if (accessedFields.length > 0) {
        auditLogger.log({
          event_type: 'pii_access',
          action: req.method === 'GET' ? 'read' : 'write',
          actor: {
            id: req.user?.id,
            role: req.user?.role,
            ip: req.ip,
            session_id: req.session?.id,
          },
          resource: {
            type: extractResourceType(req.path),
            id: req.params.id,
            fields_accessed: accessedFields,
          },
          context: {
            purpose: req.headers['x-processing-purpose'],
            application: 'api-server',
          },
          result: 'success',
        });
      }

      return originalJson(body);
    };

    next();
  };
}

// Apply to routes that serve PII
app.use('/api/customers', piiAuditMiddleware([
  'email', 'phone', 'address', 'date_of_birth', 'ssn'
]));
```

### Database-Level Audit Triggers

```sql
-- PostgreSQL trigger for PII table changes
CREATE OR REPLACE FUNCTION audit_pii_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pii_audit_log (
    event_id, event_type, action,
    actor_type, actor_id,
    resource_type, resource_id,
    fields_accessed, result, metadata
  ) VALUES (
    'evt_' || gen_random_uuid(),
    'pii_modification',
    TG_OP,
    'database_user',
    current_user,
    TG_TABLE_NAME,
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    ARRAY(SELECT column_name FROM information_schema.columns
          WHERE table_name = TG_TABLE_NAME
          AND column_name IN ('email', 'phone', 'ssn', 'address', 'name')),
    'success',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'application_name', current_setting('application_name')
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_customers_pii
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_pii_changes();
```

## Audit Log Protection

### Immutability

| Approach | Implementation | Cost |
|----------|---------------|------|
| Append-only table | Revoke DELETE/UPDATE on audit table | Low |
| Write-once storage | S3 with Object Lock, WORM storage | Medium |
| Blockchain/hash chain | Each entry hashes the previous | High |
| Separate audit database | Different credentials, network isolation | Medium |

### Append-Only Implementation

```sql
-- Revoke modification permissions on audit table
REVOKE UPDATE, DELETE ON pii_audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON pii_audit_log FROM app_user;

-- Only the audit_writer role can insert
GRANT INSERT ON pii_audit_log TO audit_writer;

-- Create hash chain for tamper detection
ALTER TABLE pii_audit_log ADD COLUMN previous_hash VARCHAR(64);
ALTER TABLE pii_audit_log ADD COLUMN entry_hash VARCHAR(64);

CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.previous_hash := (
    SELECT entry_hash FROM pii_audit_log
    ORDER BY id DESC LIMIT 1
  );
  NEW.entry_hash := encode(
    sha256(
      (NEW.event_id || NEW.timestamp || NEW.actor_id || NEW.resource_id
       || COALESCE(NEW.previous_hash, 'genesis'))::bytea
    ), 'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Retention and Archival

| Regulation | Minimum Retention | Maximum Retention |
|-----------|-------------------|-------------------|
| GDPR | Duration of processing + dispute period | Purpose-dependent (minimize) |
| HIPAA | 6 years | No maximum specified |
| PCI DSS | 1 year (immediately available) + archive | No maximum specified |
| SOC 2 | Per control objectives | Per control objectives |

### Archival Strategy

```
Active (0-90 days): Hot storage, indexed, queryable
Warm (90-365 days): Compressed, queryable with delay
Cold (1-7 years): Archived to S3/Glacier, restore on request
Deletion (>7 years): Automated purge per retention policy
```

## Monitoring and Alerting

### Anomaly Detection Rules

| Signal | Threshold | Alert |
|--------|-----------|-------|
| Bulk PII read | > 1000 records in 1 hour by single actor | Immediate |
| Off-hours PII access | Any PII access outside business hours | Review next day |
| Failed PII access attempts | > 5 failures in 10 minutes | Immediate |
| PII export | Any export of > 100 records | Immediate |
| New actor accessing PII | First-time PII access by a user | Informational |
| Unusual fields accessed | Actor reads fields they have never read before | Review |
| Cross-tenant access | Actor accesses PII from multiple tenants | Immediate |

### Dashboard Metrics

- Total PII access events per day/week/month
- PII access by actor (top N actors)
- PII access by resource type
- Failed access attempts trend
- Erasure request completion rate
- Average DSAR response time
- Audit log integrity check status

## Compliance Reporting

### DSAR Response Evidence

When responding to a data subject access request, the audit trail provides:
- Complete list of who has accessed the subject's data
- When each access occurred
- What fields were accessed
- The stated purpose of each access

### Breach Impact Assessment

When a breach occurs, the audit trail enables:
- Determine exactly which records were accessed
- Identify the breach window (first unauthorized access to detection)
- Identify all affected data subjects
- Determine what data was exposed
- Generate the required notification content
