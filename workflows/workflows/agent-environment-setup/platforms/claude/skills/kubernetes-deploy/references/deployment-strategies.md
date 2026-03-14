# Kubernetes Deployment Strategies Reference

## Rolling Update

The default Kubernetes deployment strategy. Replaces old pods with new ones incrementally.

### Configuration

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%          # Max pods above desired count during update
      maxUnavailable: 25%    # Max pods below desired count during update
```

### Tuning for Different Requirements

| Requirement | maxSurge | maxUnavailable | Behavior |
|-------------|----------|----------------|----------|
| Zero downtime | 1 | 0 | New pod ready before old removed |
| Fast rollout | 50% | 50% | Aggressive replacement |
| Resource constrained | 0 | 1 | No extra pods; replace one at a time |
| Default | 25% | 25% | Balanced speed and stability |

### Zero-Downtime Checklist

1. **Readiness probe** returns healthy only when the pod can serve traffic.
2. **`maxUnavailable: 0`** ensures old pods are not removed until new pods pass readiness.
3. **`preStop` hook** with sleep prevents traffic being sent to terminating pods.
4. **`terminationGracePeriodSeconds`** is long enough to drain in-flight requests.
5. **PodDisruptionBudget** prevents voluntary evictions from violating availability.

```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                # Sleep allows kube-proxy to update iptables before the pod
                # stops accepting connections. Without this, in-flight requests
                # hit a terminating pod and fail.
                command: ["sh", "-c", "sleep 5"]
```

## Canary Deployments

### Native Kubernetes (Manual Weight)

Run two Deployments with different versions; adjust replica counts to control traffic split.

```yaml
# Stable: 9 replicas = ~90% traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-stable
spec:
  replicas: 9
  template:
    metadata:
      labels:
        app: myapp
        track: stable
    spec:
      containers:
        - image: myapp:1.0.0

---
# Canary: 1 replica = ~10% traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: myapp
        track: canary
    spec:
      containers:
        - image: myapp:1.1.0

---
# Service routes to both via shared label
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp    # Matches both stable and canary pods
```

### Flagger Canary Automation

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
  progressDeadlineSeconds: 600
  service:
    port: 80
    targetPort: 8080
  analysis:
    interval: 1m
    threshold: 5              # Max failed checks before rollback
    maxWeight: 50             # Max traffic to canary
    stepWeight: 10            # Traffic increment per interval
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
      - name: request-duration
        thresholdRange:
          max: 500
    webhooks:
      - name: load-test
        url: http://flagger-loadtester.test/
        metadata:
          cmd: "hey -z 1m -q 10 -c 2 http://myapp-canary.default/"
```

## Blue-Green with Argo Rollouts

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    blueGreen:
      activeService: myapp-active
      previewService: myapp-preview
      autoPromotionEnabled: false       # Require manual promotion
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: myapp-preview
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:1.1.0
```

## Rollback Procedures

### Automatic Rollback

```yaml
spec:
  progressDeadlineSeconds: 600   # Mark deployment as failed after 10 minutes
  # Kubernetes automatically stops the rollout; manual undo required
```

### Manual Rollback Commands

```bash
# View rollout history
kubectl rollout history deployment/myapp -n production

# Rollback to previous version
kubectl rollout undo deployment/myapp -n production

# Rollback to specific revision
kubectl rollout undo deployment/myapp -n production --to-revision=5

# Check rollout status
kubectl rollout status deployment/myapp -n production --timeout=5m

# Pause a problematic rollout
kubectl rollout pause deployment/myapp -n production

# Resume after investigation
kubectl rollout resume deployment/myapp -n production
```

### Revision History

```yaml
spec:
  revisionHistoryLimit: 10    # Keep 10 old ReplicaSets for rollback
```

## StatefulSet Update Strategies

### RollingUpdate (Default)

```yaml
apiVersion: apps/v1
kind: StatefulSet
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1     # K8s 1.24+
      partition: 0           # Update all pods
  # StatefulSets update in reverse ordinal order: pod-N, pod-N-1, ..., pod-0
```

### Partitioned Rollout (Canary for StatefulSets)

```yaml
spec:
  updateStrategy:
    rollingUpdate:
      partition: 2    # Only update pods with ordinal >= 2
  # If replicas=5: pods 2,3,4 get new version; pods 0,1 keep old version
  # Set partition to 0 to complete the rollout
```

## DaemonSet Update Strategies

```yaml
apiVersion: apps/v1
kind: DaemonSet
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1      # Update one node at a time
      maxSurge: 0            # Default; DaemonSet cannot surge (1 per node)
```

## Deployment Patterns Comparison

| Pattern | Use Case | Tooling Required |
|---------|----------|-----------------|
| Rolling update | Standard deployments | Native Kubernetes |
| Blue-green | Instant rollback needed | Argo Rollouts or manual |
| Canary | Gradual validation | Flagger, Argo Rollouts, or Istio |
| A/B testing | Feature-flag-based routing | Service mesh (Istio, Linkerd) |
| Shadow | Test with production traffic | Service mesh with mirroring |
