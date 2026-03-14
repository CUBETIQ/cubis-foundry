# GDPR/CCPA Compliance Reference

## Overview

This reference covers the key privacy regulations affecting PII handling: the European Union's General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA). It maps regulatory requirements to technical implementation.

## GDPR Core Principles (Article 5)

| Principle | Requirement | Technical Implementation |
|-----------|------------|------------------------|
| Lawfulness | Valid legal basis for processing | Consent management system, purpose tracking |
| Purpose limitation | Data used only for stated purposes | Access controls per purpose, audit logging |
| Data minimization | Collect only what is necessary | Schema review, field-level access control |
| Accuracy | Data must be kept accurate | Update mechanisms, data quality checks |
| Storage limitation | Delete when no longer needed | Retention policies, automated deletion |
| Integrity & confidentiality | Protect against unauthorized access | Encryption, access controls, security measures |
| Accountability | Demonstrate compliance | Audit trails, DPIAs, documentation |

## GDPR Data Subject Rights

### Right to Access (Article 15)

The data subject can request all personal data held about them.

```python
class DSARHandler:
    def handle_access_request(self, data_subject_id):
        """Export all PII for a data subject across all systems."""
        report = {
            'data_subject_id': data_subject_id,
            'generated_at': datetime.utcnow().isoformat(),
            'data_sources': []
        }

        # Collect from all data stores
        for source in self.registered_data_sources:
            records = source.find_by_subject(data_subject_id)
            report['data_sources'].append({
                'source': source.name,
                'purpose': source.processing_purpose,
                'legal_basis': source.legal_basis,
                'retention_period': source.retention_period,
                'records': records,
            })

        return report  # Must be delivered within 30 days
```

**Implementation requirements:**
- Respond within 30 days (extendable to 90 for complex requests)
- Provide data in a commonly used, machine-readable format
- Include processing purposes, categories, recipients, retention periods
- Free of charge (unless manifestly excessive)

### Right to Erasure (Article 17)

The data subject can request deletion of all personal data.

```python
class ErasureHandler:
    def handle_erasure_request(self, data_subject_id):
        """Delete or anonymize all PII for a data subject."""
        results = []

        for source in self.registered_data_sources:
            # Check if legal obligation requires retention
            if source.has_legal_retention_requirement(data_subject_id):
                results.append({
                    'source': source.name,
                    'action': 'retained',
                    'reason': 'Legal obligation (e.g., tax records)',
                })
                continue

            # Delete or anonymize
            deleted = source.delete_subject_data(data_subject_id)
            results.append({
                'source': source.name,
                'action': 'deleted',
                'records_affected': deleted,
            })

        # Also notify third parties who received the data
        for processor in self.data_processors:
            processor.request_erasure(data_subject_id)

        return results
```

**Erasure must cover:**
- Primary database records
- Backups (within reasonable timeframe)
- Caches and CDN
- Analytics and data warehouses
- Third-party processors
- Search engine indexes (request de-indexing)

### Right to Portability (Article 20)

```json
// Export format example (JSON, CSV, or XML)
{
  "data_subject": {
    "email": "sarah@example.com",
    "name": "Sarah Jones",
    "account_created": "2023-01-15"
  },
  "orders": [
    {"id": "ORD-001", "date": "2023-02-20", "total": 49.99}
  ],
  "preferences": {
    "newsletter": true,
    "language": "en"
  }
}
```

## CCPA/CPRA Requirements

### Key Rights (Comparison with GDPR)

| Right | CCPA | GDPR Equivalent |
|-------|------|-----------------|
| Right to know | Categories + specific pieces of data | Right to access (Art. 15) |
| Right to delete | Delete personal information | Right to erasure (Art. 17) |
| Right to opt out | Opt out of sale/sharing | No direct equivalent (consent-based) |
| Right to correct | Correct inaccurate data | Right to rectification (Art. 16) |
| Right to limit use | Limit use of sensitive PI | Purpose limitation (Art. 5) |
| Non-discrimination | No retaliation for exercising rights | Similar protection (Art. 21) |

### CCPA Technical Requirements

```python
# "Do Not Sell My Personal Information" implementation
class CCPAOptOutHandler:
    def process_opt_out(self, consumer_id):
        """Stop selling/sharing consumer's personal information."""

        # 1. Set opt-out flag
        self.set_consumer_flag(consumer_id, 'do_not_sell', True)

        # 2. Notify all data sharing partners
        for partner in self.data_sharing_partners:
            partner.cease_data_sharing(consumer_id)

        # 3. Update advertising/analytics integrations
        self.analytics.exclude_consumer(consumer_id)

        # 4. Must process within 15 business days
        # 5. Must not ask consumer to opt in again for 12 months
```

## Consent Management

### Consent Tracking Schema

```sql
CREATE TABLE consent_records (
  id SERIAL PRIMARY KEY,
  data_subject_id VARCHAR(255) NOT NULL,
  purpose VARCHAR(100) NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,  -- consent, legitimate_interest, contract, legal_obligation
  granted_at TIMESTAMP NOT NULL,
  withdrawn_at TIMESTAMP,
  consent_version VARCHAR(20),
  consent_text_hash VARCHAR(64),  -- Hash of the exact consent text shown
  collection_method VARCHAR(50),  -- web_form, mobile_app, api
  ip_address VARCHAR(45),  -- IP at time of consent (for evidence)
  is_active BOOLEAN DEFAULT TRUE,

  INDEX idx_subject_purpose (data_subject_id, purpose)
);
```

### Consent Validation

```python
def is_processing_allowed(data_subject_id, purpose):
    """Check if processing is allowed for this purpose."""
    consent = db.query("""
        SELECT * FROM consent_records
        WHERE data_subject_id = %s
        AND purpose = %s
        AND is_active = TRUE
        AND withdrawn_at IS NULL
        ORDER BY granted_at DESC
        LIMIT 1
    """, [data_subject_id, purpose])

    if not consent:
        return False

    # Consent must be for the specific purpose
    # Consent must not be withdrawn
    # Legal basis must be valid for the processing type
    return True
```

## Data Retention

### Retention Schedule

| Data Category | Retention Period | Legal Basis | Auto-Delete |
|--------------|-----------------|-------------|-------------|
| Account data | Until account deletion + 30 days | Contract | Yes |
| Transaction records | 7 years | Legal obligation (tax) | Yes |
| Marketing consent | Until withdrawal | Consent | On withdrawal |
| Log data | 90 days | Legitimate interest | Yes |
| Support tickets | 2 years after resolution | Legitimate interest | Yes |
| Analytics (anonymized) | Indefinite | N/A (not personal data) | No |

### Automated Retention Enforcement

```python
class RetentionEnforcer:
    RETENTION_RULES = {
        'logs': timedelta(days=90),
        'session_data': timedelta(days=30),
        'deleted_accounts': timedelta(days=30),
        'support_tickets': timedelta(days=730),
    }

    def enforce(self):
        """Run daily to delete data past retention period."""
        for data_type, retention_period in self.RETENTION_RULES.items():
            cutoff = datetime.utcnow() - retention_period
            deleted = self.data_stores[data_type].delete_before(cutoff)
            self.audit_log.record(
                action='retention_deletion',
                data_type=data_type,
                records_deleted=deleted,
                cutoff_date=cutoff.isoformat()
            )
```

## Data Protection Impact Assessment (DPIA)

Required under GDPR Article 35 for high-risk processing.

### When Required

- Systematic evaluation of personal aspects (profiling)
- Processing special category data at scale
- Systematic monitoring of public areas
- New technologies processing personal data
- Cross-referencing or combining datasets

### DPIA Template Sections

1. **Processing description** — What data, what purpose, what systems
2. **Necessity assessment** — Is this processing necessary and proportionate?
3. **Risk assessment** — What could go wrong? (data breach, unauthorized access, discrimination)
4. **Risk mitigation** — Technical and organizational measures in place
5. **Residual risk** — Risk remaining after mitigation
6. **DPO consultation** — Data Protection Officer review and sign-off

## Breach Notification

### GDPR (Article 33-34)

| Action | Timeline | Recipient |
|--------|----------|-----------|
| Internal assessment | Immediately on discovery | Incident response team |
| Supervisory authority notification | Within 72 hours | Data protection authority |
| Data subject notification | Without undue delay | Affected individuals (if high risk) |

### Notification Content

```markdown
## Breach Notification

- Nature of the breach
- Categories and approximate number of data subjects affected
- Categories and approximate number of records affected
- Name and contact details of DPO
- Likely consequences of the breach
- Measures taken or proposed to address the breach
- Measures to mitigate adverse effects
```

## Compliance Checklist

- [ ] Legal basis documented for each processing activity
- [ ] Privacy policy published and current
- [ ] Consent mechanism with granular purpose selection
- [ ] Data subject request handling (access, erasure, portability)
- [ ] Data retention schedule defined and automated
- [ ] DPIAs completed for high-risk processing
- [ ] Data processing agreements with all third-party processors
- [ ] Breach notification procedure documented and tested
- [ ] PII encrypted at rest and in transit
- [ ] Audit trails for all PII access
- [ ] Staff trained on data protection responsibilities
- [ ] DPO appointed (if required)
