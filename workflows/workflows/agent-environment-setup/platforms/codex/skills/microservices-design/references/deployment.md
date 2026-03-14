# Deployment Strategies

## Deployment Patterns

### Rolling Deployment

```
Time 0:  [v1] [v1] [v1] [v1]    ← All instances on v1
Time 1:  [v2] [v1] [v1] [v1]    ← First instance updated
Time 2:  [v2] [v2] [v1] [v1]    ← Second instance updated
Time 3:  [v2] [v2] [v2] [v1]    ← Third instance updated
Time 4:  [v2] [v2] [v2] [v2]    ← All instances on v2
```

| Pro | Con |
|-----|-----|
| Zero downtime | Both versions run simultaneously during rollout |
| Simple to implement | Slow rollback (must roll forward or re-deploy v1) |
| Resource efficient (no extra instances) | Database schema must be compatible with both versions |

Configuration:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%         # Allow 25% extra instances during update
    maxUnavailable: 25%   # Allow 25% instances to be down during update
```

### Blue-Green Deployment

```
Blue (v1):  [v1] [v1] [v1] [v1]  ← Currently serving traffic
Green (v2): [v2] [v2] [v2] [v2]  ← Deployed, tested, not serving

Switch: Load balancer routes traffic from Blue to Green
Rollback: Load balancer routes traffic back to Blue
```

| Pro | Con |
|-----|-----|
| Instant rollback (switch LB back) | Requires 2x infrastructure |
| Full testing of v2 before exposure | Database migrations must be backward compatible |
| No mixed-version traffic | Expensive for large deployments |

### Canary Deployment

```
Time 0: 100% → [v1] [v1] [v1] [v1]

Time 1:   5% → [v2]
          95% → [v1] [v1] [v1]

Time 2:  25% → [v2] [v2]
          75% → [v1] [v1] [v1]

Time 3:  50% → [v2] [v2] [v2]
          50% → [v1] [v1]

Time 4: 100% → [v2] [v2] [v2] [v2]
```

| Pro | Con |
|-----|-----|
| Limited blast radius | More complex routing configuration |
| Real production traffic testing | Metrics must be split by version |
| Automated promotion/rollback based on metrics | Both versions must coexist |

### Canary Configuration

```yaml
analysis:
  metrics:
    - name: error-rate
      threshold: 1%        # Rollback if error rate > 1%
      interval: 60s
    - name: p99-latency
      threshold: 500ms     # Rollback if p99 > 500ms
      interval: 60s
  steps:
    - setWeight: 5
      pause: { duration: 5m }
    - setWeight: 25
      pause: { duration: 10m }
    - setWeight: 50
      pause: { duration: 15m }
    - setWeight: 100
```

## CI/CD Pipeline

### Pipeline Stages

```
┌────────┐   ┌──────┐   ┌──────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐
│ Build  │──►│ Test │──►│ Security │──►│ Package │──►│ Deploy │──►│ Verify  │
│        │   │      │   │  Scan    │   │         │   │        │   │         │
└────────┘   └──────┘   └──────────┘   └─────────┘   └────────┘   └──────────┘
```

| Stage | Actions | Gate |
|-------|---------|------|
| Build | Compile, resolve dependencies | Compilation succeeds |
| Test | Unit tests, integration tests, contract tests | All tests pass, coverage > threshold |
| Security | SAST, dependency vulnerability scan, secret detection | No critical/high vulnerabilities |
| Package | Build container image, push to registry | Image builds and passes health check |
| Deploy | Deploy to staging, then production (canary) | Staging smoke tests pass |
| Verify | Post-deployment smoke tests, metric validation | Error rate and latency within SLO |

### Independent Deployability

Each microservice must have its own CI/CD pipeline:

```
Repo: order-service/
  .github/workflows/deploy.yml    ← Triggered on push to main
  Dockerfile
  src/
  tests/

Repo: payment-service/
  .github/workflows/deploy.yml    ← Independent pipeline
  Dockerfile
  src/
  tests/
```

Rule: A change to order-service must NEVER require deploying payment-service. If it does, the service boundary is wrong.

### Contract Testing in CI

```
┌─────────────────┐     contract      ┌──────────────────┐
│ Order Service   │ ←────────────────► │ Payment Service  │
│ (consumer)      │                    │ (provider)       │
│                 │     Pact broker    │                  │
│ Generates pact  │ ──────────────► ──►│ Verifies pact   │
│ in CI           │                    │ in CI            │
└─────────────────┘                    └──────────────────┘
```

1. Consumer (Order) generates a contract (Pact file) during its CI.
2. Contract is published to a Pact broker.
3. Provider (Payment) CI fetches the contract and runs verification.
4. If verification fails, Payment CI fails. The provider team must not break the consumer's expectations.

## Database Migration Strategy

### Expand-Contract Pattern

When a schema change breaks backward compatibility:

```
Phase 1: Expand (v1 and v2 compatible)
  - Add new column (nullable or with default)
  - Both v1 and v2 code work with the schema
  - Deploy v2 code

Phase 2: Migrate
  - Backfill new column with data from old column
  - Verify data integrity

Phase 3: Contract (v2 only)
  - Remove old column
  - This is safe because v1 code is no longer deployed
```

### Migration Rules

1. **Never rename a column** in a single step. Add new, migrate data, remove old.
2. **Never drop a column** until all services using it are updated.
3. **Always add columns as nullable** or with a default value.
4. **Run migrations before deploying** the code that uses them.
5. **Test rollback** — every migration must have a reverse migration.
6. **Separate deployment from migration** — schema changes in one PR, code changes in the next.

## API Versioning During Deployment

When deploying a breaking API change:

```
Phase 1: Deploy v2 endpoint alongside v1
  GET /v1/orders → existing behavior
  GET /v2/orders → new behavior

Phase 2: Migrate consumers to v2
  - Update each consumer to use /v2/orders
  - Monitor v1 traffic dropping to zero

Phase 3: Deprecate v1
  - Return Sunset header: Sunset: Sat, 01 Jun 2025 00:00:00 GMT
  - Return Deprecation header: Deprecation: true
  - Log v1 usage for tracking

Phase 4: Remove v1
  - After sunset date, return 410 Gone
  - Eventually remove v1 code
```

## Rollback Procedures

### Automated Rollback Triggers

| Trigger | Action | Threshold |
|---------|--------|-----------|
| Error rate spike | Rollback canary, route all traffic to previous version | > 1% error rate for 2 minutes |
| Latency increase | Rollback canary | p99 > 2x baseline for 5 minutes |
| Health check failure | Kill unhealthy pod, stop rollout | 3 consecutive failures |
| Crash loop | Stop rollout, alert on-call | > 3 restarts in 5 minutes |

### Manual Rollback

```bash
# Kubernetes: rollback to previous revision
kubectl rollout undo deployment/order-service

# Verify rollback
kubectl rollout status deployment/order-service

# Check pods are healthy
kubectl get pods -l app=order-service
```

### Rollback Checklist

1. Verify the previous version is still available in the container registry.
2. Confirm the database schema is backward compatible (expand-contract).
3. Check that no new message formats were introduced that old consumers cannot parse.
4. Verify feature flags can disable new functionality without rollback.
5. After rollback, investigate root cause before re-deploying.

## Feature Flags

Use feature flags to decouple deployment from release:

```
Deploy v2 code with flag: ORDER_NEW_CHECKOUT_FLOW=false
  → v2 code is in production but new behavior is disabled
  → Gradually enable for 1%, 5%, 25%, 50%, 100% of users
  → If issues arise, disable flag (instant rollback, no deployment)
```

| Flag type | Lifetime | Example |
|-----------|----------|---------|
| Release flag | Days to weeks | New checkout flow |
| Experiment flag | Weeks to months | A/B test pricing page |
| Ops flag | Permanent | Disable search during maintenance |
| Permission flag | Permanent | Beta features for premium users |

Clean up release flags after rollout is complete. Stale flags are tech debt.
