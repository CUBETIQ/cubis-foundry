# Kubernetes Deploy Eval Assertions

## Eval 1: Rolling Deployment with Health Checks

This eval tests the core Kubernetes deployment skill: configuring a Deployment with rolling updates, probes, resource management, security hardening, and disruption protection.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `startupProbe:` — Startup probe configuration   | Startup probes handle slow container initialization (database migrations, cache warming) without the liveness probe killing the pod prematurely during first boot. |
| 2 | contains | `readinessProbe:` — Readiness probe configuration| Readiness probes tell Kubernetes when a pod can accept traffic. During rolling updates, unready pods are excluded from Service endpoints, preventing requests to pods still initializing. |
| 3 | contains | `maxSurge:` — Rolling update surge control       | `maxSurge: 1` with `maxUnavailable: 0` ensures zero-downtime deploys by requiring a new pod to be ready before terminating an old one. Uncontrolled surge can exhaust node resources. |
| 4 | contains | `runAsNonRoot:` — Non-root security context      | Running as non-root prevents privilege escalation attacks. A compromised process running as root inside a container can escape to the host via kernel vulnerabilities. |
| 5 | contains | `PodDisruptionBudget` — Disruption protection    | PDBs prevent node drains and cluster upgrades from evicting all replicas simultaneously. Without a PDB, a node maintenance event can take down the entire service. |

### What a passing response looks like

- A Deployment in the `commerce` namespace with `metadata.name: order-api` and `spec.replicas: 3`.
- Rolling update strategy: `maxSurge: 1`, `maxUnavailable: 0`.
- All three probes configured: `startupProbe` (with `failureThreshold: 30`), `readinessProbe`, and `livenessProbe` hitting `/healthz`.
- Resource requests: `memory: 256Mi`, `cpu: 250m`. Limits: `memory: 512Mi`, `cpu: 500m`.
- Pod anti-affinity using `requiredDuringSchedulingIgnoredDuringExecution` or `preferredDuringSchedulingIgnoredDuringExecution` with `topologyKey: kubernetes.io/hostname`.
- Security context: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, with an `emptyDir` volume for `/tmp` if needed.
- A separate PodDisruptionBudget resource with `maxUnavailable: 1` selecting pods via matching labels.

---

## Eval 2: Helm Chart Design

This eval tests the Helm chart authoring skill: creating parameterized templates with environment-specific value overrides, autoscaling, and production configuration.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `{{ .Values.` — Helm value templating           | All configurable fields (replicas, image tag, resources, domain) must be parameterized via `.Values` references so that a single chart serves all environments without template edits. |
| 2 | contains | `HorizontalPodAutoscaler` — HPA resource        | An HPA with CPU-based autoscaling ensures the service scales elastically under load, preventing both under-provisioning (dropped requests) and over-provisioning (wasted cost). |
| 3 | contains | `values-production` — Production values override | A dedicated production values file separates environment-specific configuration from defaults, making the differences between environments explicit and auditable. |
| 4 | contains | `tls:` — TLS configuration in Ingress           | Production Ingress must terminate TLS. Serving traffic over plain HTTP exposes user data to interception and violates compliance requirements for most applications. |
| 5 | contains | `ConfigMap` — Externalized configuration         | Application settings in a ConfigMap can be updated independently of the Deployment image, enabling configuration changes without a full redeployment cycle. |

### What a passing response looks like

- A chart directory with `Chart.yaml`, `values.yaml`, `values-production.yaml`, and `templates/` containing `deployment.yaml`, `service.yaml`, `ingress.yaml`, `configmap.yaml`, and `hpa.yaml`.
- Templates using `{{ .Values.image.repository }}:{{ .Values.image.tag }}`, `{{ .Values.replicaCount }}`, `{{ .Values.resources }}`.
- Default `values.yaml` with `replicaCount: 2`, reasonable dev resource limits, and a placeholder domain.
- `values-production.yaml` overriding with `replicaCount: 4`, higher resource limits, production domain, and TLS secret name.
- HPA targeting the Deployment with `minReplicas: 2`, `maxReplicas: 10`, CPU target 70%.
- Ingress with `tls:` section referencing a TLS secret and `hosts:` from values.
- ConfigMap with application settings mounted as a volume or injected as environment variables.
