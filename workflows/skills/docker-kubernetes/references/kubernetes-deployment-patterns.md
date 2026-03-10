# Kubernetes Deployment Patterns

## Deployment strategies

- **Rolling update** (default): gradually replaces pods. Set `maxUnavailable` and `maxSurge` based on replica count and availability requirement.
- **Blue-green**: deploy new version alongside old, switch service selector after verification. Requires 2x resources temporarily.
- **Canary**: route a percentage of traffic to new version. Use Istio, Linkerd, or Argo Rollouts for traffic splitting.
- **Recreate**: kill all old pods before starting new. Only for services that cannot run two versions simultaneously.

## Autoscaling

- **HPA** (Horizontal Pod Autoscaler): scale on CPU, memory, or custom metrics. Set `minReplicas` ≥ 2 for availability.
- **VPA** (Vertical Pod Autoscaler): auto-adjust resource requests. Use in recommendation mode first, not auto mode.
- **KEDA**: scale on event-driven metrics (queue depth, HTTP rate). Good for batch and event-driven workloads.
- Always set resource requests accurately — HPA decisions depend on them.

## Helm chart structure

```
chart-name/
├── Chart.yaml
├── values.yaml
├── values-staging.yaml
├── values-production.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    ├── pdb.yaml
    ├── configmap.yaml
    ├── serviceaccount.yaml
    └── _helpers.tpl
```

- Keep `values.yaml` as the single source of configurable parameters.
- Use `_helpers.tpl` for label generation and name templating.
- Pin chart dependencies to exact versions.
- Test with `helm template` and `helm lint` before deploy.

## Networking

- Use `ClusterIP` services for internal communication, `LoadBalancer` or `Ingress` for external.
- Use `NetworkPolicy` to restrict pod-to-pod communication (default-deny, allow-list).
- Prefer `Ingress` with TLS termination over exposing services directly.

## Observability

- Export `/healthz` and `/readyz` endpoints from every service.
- Use structured JSON logging to stdout/stderr — never write logs to files inside containers.
- Expose Prometheus metrics on a `/metrics` endpoint.
- Set meaningful pod labels for filtering in dashboards and alerting.

## Stateful workloads

- Use `StatefulSet` only when stable network identity or stable storage is required.
- Prefer managed databases over running databases in Kubernetes.
- Use `PersistentVolumeClaim` with appropriate storage class and reclaim policy.
- Back up PVCs independently — Kubernetes does not manage backup.
