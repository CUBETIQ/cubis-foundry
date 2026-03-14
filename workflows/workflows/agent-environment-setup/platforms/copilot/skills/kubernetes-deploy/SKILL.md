---
name: kubernetes-deploy
description: "Use when designing or managing Kubernetes deployments: Deployment and StatefulSet configurations, Service and Ingress routing, Helm chart authoring, resource requests and limits, health checks, rolling updates, and production hardening."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Kubernetes Deployment Patterns

## Purpose

Guide the design and implementation of production-grade Kubernetes deployments that are resilient, observable, and operationally manageable. Every instruction prioritizes zero-downtime deployments, resource efficiency, security posture, and day-two operational readiness including scaling, debugging, and disaster recovery.

## When to Use

- Designing Deployment, StatefulSet, or DaemonSet manifests for a new service.
- Configuring Services, Ingress resources, or Gateway API routing rules.
- Authoring or maintaining Helm charts with parameterized values and templates.
- Setting resource requests, limits, HPA rules, or PodDisruptionBudgets.
- Implementing health checks (liveness, readiness, startup probes) for containerized services.
- Troubleshooting pod scheduling failures, CrashLoopBackOff, or networking issues.

## Instructions

1. **Define resource requests and limits for every container in every pod spec** because the Kubernetes scheduler uses requests to place pods on nodes, and without limits a single misbehaving pod can starve co-located workloads of CPU and memory, causing cascading failures.
2. **Implement all three probe types (startup, readiness, liveness) with appropriate thresholds** because startup probes prevent premature liveness kills during slow initialization, readiness probes remove unhealthy pods from service endpoints, and liveness probes restart stuck containers -- each serves a distinct failure mode.
3. **Configure rolling update strategy with `maxSurge` and `maxUnavailable` tuned to the service's capacity** so that deployments proceed without dropping traffic, and the rollout rate matches the service's ability to absorb new pod registration and old pod draining.
4. **Use `PodDisruptionBudget` to protect availability during voluntary disruptions** because node drains (maintenance, scaling, upgrades) evict pods simultaneously, and without a PDB the entire replica set can be drained at once, causing a full outage.
5. **Author Helm charts with a clear separation between templates and values** so that environment-specific configuration (replica count, resource limits, feature flags) lives in `values.yaml` overrides rather than in template logic, making charts portable across dev, staging, and production.
6. **Use Kubernetes namespaces with RBAC policies to enforce service isolation** because a flat cluster with default namespace usage allows any pod to discover and communicate with any other service, violating the principle of least privilege.
7. **Configure `NetworkPolicy` resources to restrict pod-to-pod communication** so that only explicitly allowed traffic flows between services, limiting the blast radius of a compromised pod and satisfying zero-trust networking requirements.
8. **Externalize configuration with ConfigMaps and secrets with volume mounts (not environment variables for large configs)** because environment variables are visible in pod specs and have size limits, while mounted volumes support dynamic reload and keep sensitive data separate from the pod definition.
9. **Implement Horizontal Pod Autoscaler with custom metrics where CPU alone is insufficient** because CPU-based autoscaling does not capture queue depth, request latency, or connection count, which are often better indicators of when a service needs more replicas.
10. **Set pod anti-affinity rules to spread replicas across failure domains** because co-locating all replicas on the same node or availability zone creates a single point of failure, and anti-affinity ensures that a node or zone failure leaves surviving replicas to serve traffic.
11. **Use init containers for pre-flight checks and database migration** so that the main application container only starts after prerequisites are satisfied (schema migrated, config files generated, dependency services reachable), preventing startup crashes.
12. **Configure graceful shutdown with `preStop` hooks and `terminationGracePeriodSeconds`** because Kubernetes sends SIGTERM and then hard-kills the container after the grace period, and without a preStop hook the pod may be removed from endpoints while still processing in-flight requests.
13. **Implement GitOps with a declarative deployment repository and reconciliation controller** because imperative `kubectl apply` from CI pipelines creates drift between desired and actual state, while a GitOps controller (Argo CD, Flux) continuously reconciles and provides an audit trail.
14. **Run containers as non-root with a read-only root filesystem** because a container running as root with a writable filesystem is a privilege escalation vector, and security contexts that enforce non-root and read-only are baseline hardening requirements for production clusters.
15. **Use pod topology spread constraints for even distribution across zones and nodes** because the default scheduler may pack pods onto a small number of nodes for bin-packing efficiency, which concentrates risk and creates uneven load distribution across the cluster.
16. **Version Helm chart releases and maintain a changelog per chart** so that rollbacks target a specific known-good version, upgrade diffs are reviewable, and the operations team can correlate application behavior changes with specific chart version bumps.
17. **Configure service mesh or Ingress TLS termination with certificate auto-rotation** because manual certificate management leads to expiration outages, and automated solutions (cert-manager, mesh-managed mTLS) eliminate this operational risk entirely.
18. **Test manifests with dry-run validation and policy engines before applying** because invalid manifests, missing required labels, or policy violations caught after deployment require rollback and re-deployment, while pre-apply validation catches these in CI.

## Output Format

Provide complete Kubernetes manifests in YAML with inline comments explaining non-obvious decisions. Include the `apiVersion`, `kind`, and full metadata for every resource. When showing Helm charts, provide both the template file and the corresponding `values.yaml` defaults. For multi-resource configurations, separate resources with `---` and include them in deployment order.

## References

| File                                      | Load when                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `references/deployment-strategies.md`     | Configuring rolling updates, canary deployments, blue-green strategies, or rollback procedures.        |
| `references/helm-charts.md`               | Authoring Helm charts, managing values files, or designing chart dependency trees.                      |
| `references/resource-management.md`       | Setting requests/limits, configuring HPA, PDB, or diagnosing scheduling and resource pressure issues.  |
| `references/networking.md`                | Configuring Services, Ingress, Gateway API, NetworkPolicy, or debugging DNS and connectivity.           |
| `references/monitoring.md`                | Integrating Prometheus metrics, setting up alerts, or configuring liveness/readiness/startup probes.    |
