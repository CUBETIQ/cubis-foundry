# Kubernetes Resource Management Reference

## Resource Requests and Limits

### Concepts

| Field | Purpose | Scheduler Impact |
|-------|---------|-----------------|
| `requests.cpu` | Guaranteed CPU allocation | Used for pod scheduling decisions |
| `requests.memory` | Guaranteed memory allocation | Used for pod scheduling decisions |
| `limits.cpu` | Maximum CPU allowed | Throttled when exceeded |
| `limits.memory` | Maximum memory allowed | OOM-killed when exceeded |

### Configuration

```yaml
containers:
  - name: app
    resources:
      requests:
        cpu: 250m        # 0.25 CPU cores guaranteed
        memory: 256Mi    # 256 MiB guaranteed
      limits:
        cpu: 500m        # Throttled above 0.5 cores
        memory: 512Mi    # OOM-killed above 512 MiB
```

### Sizing Guidelines

| Service Type | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|-------------|-----------|----------------|-------------|
| API server | 100-500m | 500m-1 | 128-512Mi | 512Mi-1Gi |
| Worker/queue consumer | 250m-1 | 1-2 | 256Mi-1Gi | 1-2Gi |
| Database (managed) | N/A | N/A | N/A | N/A |
| Cache (Redis) | 100-250m | 500m | 128-512Mi | 512Mi-1Gi |
| Frontend (Nginx) | 50-100m | 200m | 64-128Mi | 256Mi |

### QoS Classes

Kubernetes assigns Quality of Service classes based on resource configuration:

| QoS Class | Condition | Eviction Priority |
|-----------|-----------|-------------------|
| Guaranteed | requests == limits for all containers | Last to be evicted |
| Burstable | At least one request or limit set | Middle priority |
| BestEffort | No requests or limits set | First to be evicted |

```yaml
# Guaranteed QoS (recommended for critical services)
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 500m        # Same as request
    memory: 512Mi    # Same as request
```

## Horizontal Pod Autoscaler (HPA)

### CPU-Based Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300    # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60              # Scale down max 10% per minute
    scaleUp:
      stabilizationWindowSeconds: 0      # Scale up immediately
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15              # Double pods every 15s if needed
```

### Custom Metrics Autoscaling

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: 1000           # Scale when RPS > 1000 per pod
  - type: External
    external:
      metric:
        name: queue_messages_ready
        selector:
          matchLabels:
            queue: orders
      target:
        type: Value
        value: 100                   # Scale when queue depth > 100
```

## PodDisruptionBudget (PDB)

PDBs protect availability during voluntary disruptions (node drain, cluster upgrade).

### Configuration

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp
spec:
  # Option 1: Maximum unavailable pods
  maxUnavailable: 1

  # Option 2: Minimum available pods
  # minAvailable: 2

  # Option 3: Percentage
  # maxUnavailable: "25%"

  selector:
    matchLabels:
      app: myapp
```

### PDB Guidelines

| Replicas | Recommended PDB | Rationale |
|----------|----------------|-----------|
| 1 | `maxUnavailable: 0` | Single pod; any disruption is an outage |
| 2 | `minAvailable: 1` | Always keep at least 1 pod running |
| 3-5 | `maxUnavailable: 1` | Allow 1 pod drain at a time |
| 6+ | `maxUnavailable: 25%` | Percentage-based for larger deployments |

## Vertical Pod Autoscaler (VPA)

VPA recommends or automatically adjusts resource requests based on observed usage.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Off"          # "Off" = recommendations only
    # "Auto" = automatically adjusts requests (restarts pods)
  resourcePolicy:
    containerPolicies:
      - containerName: app
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 2
          memory: 4Gi
```

### VPA + HPA Coexistence

VPA and HPA should not both scale on CPU. Recommended combination:

- HPA scales on custom metrics (RPS, queue depth)
- VPA right-sizes CPU and memory requests

## Pod Topology and Affinity

### Pod Anti-Affinity (Spread Across Nodes)

```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: myapp
            topologyKey: kubernetes.io/hostname
```

### Topology Spread Constraints

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule    # or ScheduleAnyway
      labelSelector:
        matchLabels:
          app: myapp
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app: myapp
```

## Troubleshooting Resource Issues

### Pod Stuck in Pending

```bash
kubectl describe pod <pod-name> -n <namespace>
# Look for: "Insufficient cpu", "Insufficient memory", "0/5 nodes are available"

# Check node resource usage
kubectl top nodes
kubectl describe node <node-name> | grep -A 10 "Allocated resources"
```

### OOM Killed

```bash
# Check if pod was OOM-killed
kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'

# Check container exit code (137 = OOM)
kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'

# Fix: increase memory limits
kubectl patch deployment myapp -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

### CPU Throttling

```bash
# Check throttling metrics (if metrics-server installed)
kubectl top pod <pod> -n <namespace>

# Signs of throttling: high latency with low CPU usage in metrics
# The pod is limited to its CPU limit even if the node has spare capacity
```

## Resource Quota

Enforce resource limits at the namespace level:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    services: "10"
    persistentvolumeclaims: "20"
```

## LimitRange

Set default resource values for pods that do not specify them:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-a
spec:
  limits:
    - default:           # Default limits
        cpu: 500m
        memory: 512Mi
      defaultRequest:    # Default requests
        cpu: 100m
        memory: 128Mi
      type: Container
```
