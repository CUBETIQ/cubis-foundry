# Deployment Strategies Reference

## Strategy Comparison

| Strategy | Downtime | Rollback Speed | Resource Overhead | Complexity |
|----------|----------|----------------|-------------------|------------|
| Recreate | Yes | Slow (redeploy) | None | Low |
| Rolling update | No | Medium (rollback) | +1 instance | Low |
| Blue-green | No | Instant (switch) | 2x instances | Medium |
| Canary | No | Fast (route shift) | +10-20% instances | High |
| Shadow/dark | No | N/A (no user impact) | 2x compute | High |

## Rolling Update

The default Kubernetes strategy. Gradually replaces old pods with new ones.

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%        # How many extra pods during update
    maxUnavailable: 25%  # How many pods can be down during update
```

### Zero-Downtime Rolling Update

For services that cannot tolerate any dropped requests:

```yaml
rollingUpdate:
  maxSurge: 1
  maxUnavailable: 0    # Never remove a pod until the new one is ready
```

**Requirements for zero-downtime:**
1. Readiness probe correctly reports when the pod can accept traffic.
2. `terminationGracePeriodSeconds` is long enough to drain in-flight requests.
3. `preStop` hook adds a small sleep to allow endpoint propagation.

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 5"]  # Allow endpoint removal to propagate
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/myapp

# Rollback to previous version
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=3

# Check rollout status
kubectl rollout status deployment/myapp --timeout=5m
```

## Blue-Green Deployment

Two identical environments (blue and green). Traffic switches from one to the other via load balancer or service selector.

### Implementation with Kubernetes Services

```yaml
# Blue deployment (currently live)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  labels:
    app: myapp
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
---
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
  labels:
    app: myapp
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
---
# Service selector points to active color
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue    # Switch to 'green' to promote
```

### Cutover Process

1. Deploy new version to inactive color (green).
2. Run smoke tests against green directly (via port-forward or internal endpoint).
3. Switch Service selector from `blue` to `green`.
4. Monitor health for 10-15 minutes.
5. If healthy, scale down blue. If unhealthy, switch back to blue.

### Advantages and Disadvantages

| Advantage | Disadvantage |
|-----------|-------------|
| Instant rollback (selector switch) | 2x resource cost during transition |
| Full environment testing before cutover | Database migrations must be backward-compatible |
| No mixed-version traffic | More complex orchestration |

## Canary Deployment

Route a small percentage of traffic to the new version. Gradually increase if healthy.

### Implementation with Ingress (NGINX)

```yaml
# Canary ingress annotation
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% to canary
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-canary
                port:
                  number: 80
```

### Progressive Canary with Flagger

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5           # Max failed checks before rollback
    maxWeight: 50          # Max canary traffic percentage
    stepWeight: 10         # Increment per interval
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99           # Rollback if success rate drops below 99%
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500          # Rollback if p99 latency exceeds 500ms
        interval: 1m
```

### Canary Rollout Timeline

```
T+0m   Deploy canary, route 10% traffic
T+5m   Health check pass → increase to 20%
T+10m  Health check pass → increase to 30%
T+15m  Health check pass → increase to 50%
T+20m  Health check pass → promote to 100%
       (or at any step: health check fail → rollback to 0%)
```

## Database Migration Strategies

Deployments that include database schema changes require special handling because the old and new application versions coexist during rollout.

### Expand-Contract Pattern

1. **Expand**: Add new column/table without removing old ones. Deploy the new app version that writes to both old and new columns.
2. **Migrate**: Backfill data from old column to new column.
3. **Contract**: Remove old column after all application versions use the new one.

### Migration Safety Rules

| Rule | Rationale |
|------|-----------|
| Never drop a column in the same release that stops using it | Old pods still running during rollout will crash |
| Always add columns as nullable or with defaults | Old pods do not know about the new column |
| Never rename columns | Both old and new code must work simultaneously |
| Run migrations as a separate step before deployment | Migration failures should not affect running pods |

## Health Check Integration

Every deployment strategy depends on accurate health checks.

```yaml
# Startup: Am I initialized? (generous timeout)
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 10

# Readiness: Can I accept traffic? (moderate)
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3

# Liveness: Am I stuck? (conservative)
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
  failureThreshold: 5
```
