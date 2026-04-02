# Kubernetes Monitoring Reference

## Prometheus Metrics Integration

### Exposing Application Metrics

Applications expose metrics on a `/metrics` endpoint that Prometheus scrapes.

```yaml
# Pod annotations for Prometheus auto-discovery
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
```

### ServiceMonitor (Prometheus Operator)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp
  labels:
    release: prometheus    # Must match Prometheus label selector
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
      scrapeTimeout: 10s
  namespaceSelector:
    matchNames:
      - production
```

### PodMonitor (for Pods Without Services)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: batch-jobs
spec:
  selector:
    matchLabels:
      type: batch-worker
  podMetricsEndpoints:
    - port: metrics
      interval: 30s
```

## Health Probes

### Startup Probe

Disables liveness and readiness checks during initialization. Use for applications with slow startup (database migrations, cache warming).

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 30     # 30 * 10s = 5 minutes max startup time
  timeoutSeconds: 3
```

### Readiness Probe

Determines if the pod should receive traffic. Failed readiness removes the pod from Service endpoints.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
  successThreshold: 1
  timeoutSeconds: 3
```

### Liveness Probe

Determines if the pod is stuck and needs a restart. Be conservative to avoid restart loops.

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 15
  failureThreshold: 5       # 5 failures = 75 seconds before restart
  timeoutSeconds: 3
```

### Probe Types

| Type | Use Case | Example |
|------|----------|---------|
| `httpGet` | Web services | `path: /healthz, port: 8080` |
| `tcpSocket` | Non-HTTP services | `port: 5432` (database) |
| `exec` | Custom logic | `command: ["pg_isready", "-U", "postgres"]` |
| `grpc` | gRPC services | `port: 50051` (K8s 1.24+) |

### Health Endpoint Design

```python
# Good: /healthz checks only the process itself
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Good: /ready checks dependencies
@app.get("/ready")
def ready():
    checks = {
        "database": check_database(),
        "cache": check_redis(),
    }
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    return JSONResponse(checks, status_code=status_code)
```

**Important:** Never make the liveness probe depend on external services. If the database is down, the liveness probe will restart the pod, which makes the problem worse. Use the readiness probe to stop traffic and the liveness probe only for detecting stuck processes.

### Probe Tuning Guidelines

| Probe | periodSeconds | failureThreshold | timeoutSeconds | Rationale |
|-------|--------------|-------------------|----------------|-----------|
| Startup | 10 | 30 | 3 | Allow up to 5 min for initialization |
| Readiness | 10 | 3 | 3 | Remove from endpoints within 30s |
| Liveness | 15 | 5 | 3 | Restart only after 75s of failure |

## Alerting with PrometheusRule

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: myapp-alerts
  labels:
    release: prometheus
spec:
  groups:
    - name: myapp.rules
      rules:
        # Pod restart alert
        - alert: PodRestartingFrequently
          expr: |
            increase(kube_pod_container_status_restarts_total{namespace="production"}[1h]) > 3
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} restarting frequently"
            runbook: "https://runbooks.example.com/pod-restarts"

        # High error rate
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{status=~"5..", namespace="production"}[5m]))
            / sum(rate(http_requests_total{namespace="production"}[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Error rate above 5% in production"

        # Pod memory approaching limit
        - alert: PodMemoryNearLimit
          expr: |
            container_memory_working_set_bytes{namespace="production"}
            / container_spec_memory_limit_bytes{namespace="production"} > 0.9
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} using >90% of memory limit"
```

## Grafana Dashboards

### Standard Dashboard Panels

| Panel | Query | Purpose |
|-------|-------|---------|
| Request Rate | `sum(rate(http_requests_total[5m])) by (service)` | Traffic volume |
| Error Rate | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | Reliability |
| Latency p99 | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | Performance |
| Pod Restarts | `increase(kube_pod_container_status_restarts_total[1h])` | Stability |
| Memory Usage | `container_memory_working_set_bytes / container_spec_memory_limit_bytes` | Capacity |
| CPU Throttle | `rate(container_cpu_cfs_throttled_seconds_total[5m])` | Resource pressure |

### Dashboard Layout (Top to Bottom)

1. **SLO Status**: Current SLO burn rate and error budget remaining.
2. **Golden Signals**: Request rate, error rate, latency (p50, p95, p99), saturation.
3. **Deployment Events**: Vertical annotations for recent deployments.
4. **Pod Health**: Replica count, restarts, readiness status.
5. **Resource Usage**: CPU, memory, network I/O per pod.
6. **Dependencies**: Database connection pool, Redis hit rate, external API latency.

## Kubernetes Metrics Server

The metrics server provides `kubectl top` and HPA CPU/memory metrics.

```bash
# Node resource usage
kubectl top nodes

# Pod resource usage (sorted by CPU)
kubectl top pods -n production --sort-by=cpu

# Container-level metrics
kubectl top pods -n production --containers
```

## Logging Integration

### Structured Logging with Kubernetes Metadata

Applications should output structured JSON to stdout. The log aggregator (Fluentd, Fluent Bit, Vector) enriches logs with Kubernetes metadata.

```yaml
# Fluent Bit DaemonSet config
filters:
  - name: kubernetes
    match: '*'
    merge_log: On
    keep_log: Off
    annotations: On
    labels: On
```

### Log-Based Alerts

```yaml
# PrometheusRule using log-derived metrics
- alert: AuthenticationFailureSpike
  expr: |
    sum(rate(log_messages_total{level="error", message=~".*authentication failed.*"}[5m])) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Authentication failures exceeding 10/s"
```

## Observability Stack Deployment

### kube-prometheus-stack (Helm)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f monitoring-values.yaml
```

```yaml
# monitoring-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi

grafana:
  adminPassword: changeme
  persistence:
    enabled: true
    size: 10Gi

alertmanager:
  config:
    route:
      receiver: slack
      routes:
        - matchers: ["severity=critical"]
          receiver: pagerduty
    receivers:
      - name: slack
        slack_configs:
          - channel: "#alerts"
            api_url: https://hooks.slack.com/...
      - name: pagerduty
        pagerduty_configs:
          - routing_key: <key>
```
