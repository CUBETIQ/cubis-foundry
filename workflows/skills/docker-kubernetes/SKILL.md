---
name: "docker-kubernetes"
description: "Use for containerization strategy, Dockerfile optimization, Kubernetes deployment patterns, Helm charts, and container orchestration decisions."
license: MIT
metadata:
  version: "1.0.0"
  domain: "infrastructure"
  role: "specialist"
  stack: "docker-kubernetes"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Docker 27 + Kubernetes 1.31"
  tags:
    [
      "docker",
      "kubernetes",
      "containers",
      "k8s",
      "helm",
      "devops",
      "orchestration",
      "deployment",
    ]
  provenance:
    source: "cubis-foundry canonical"
    snapshot: "2026-03-09 initial from research on platform-sre-kubernetes and devops agent patterns"
---

# Docker & Kubernetes

## When to use

- Writing or optimizing Dockerfiles for production builds.
- Designing Kubernetes deployment, service, and ingress manifests.
- Choosing between deployment strategies (rolling, blue-green, canary).
- Setting up health checks, resource limits, and autoscaling.
- Writing Helm charts or Kustomize overlays.
- Debugging container startup failures, crashloops, or networking issues.

## When not to use

- Pure application code with no container or deployment concern.
- Cloud provider-specific IaC (use terraform/cloud-specific skills instead).
- CI/CD pipeline design with no container build step.

## Core workflow

1. Define the build target: minimal base image, multi-stage build, layer caching.
2. Set resource requests and limits based on measured usage, not guesses.
3. Configure health checks (liveness, readiness, startup probes) appropriate to the service.
4. Design the deployment strategy matching the service's availability requirements.
5. Verify the container runs as non-root, has no secrets baked in, and scans clean.

## Dockerfile standards

- Use multi-stage builds to separate build dependencies from runtime.
- Pin base image versions to digest or specific tag — never use `latest` in production.
- Order layers from least-changing to most-changing for optimal cache utilization.
- Copy dependency manifests and install before copying application code.
- Run as non-root user: `USER nonroot` or numeric UID.
- Use `.dockerignore` to exclude `.git`, `node_modules`, test fixtures, and local configs.
- Keep final image minimal: `distroless`, `alpine`, or `slim` variants.

## Kubernetes standards

- Always set resource requests AND limits for CPU and memory.
- Define liveness probes (restart on deadlock), readiness probes (remove from service on overload), and startup probes (slow initialization).
- Use `PodDisruptionBudget` for services that need availability guarantees during node maintenance.
- Set `securityContext`: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, drop all capabilities.
- Use `ConfigMap` for non-sensitive config, `Secret` (or external secrets operator) for credentials.
- Label everything: `app`, `version`, `component`, `part-of`, `managed-by`.
- Use `topologySpreadConstraints` or pod anti-affinity for high-availability across zones.

## Debugging patterns

- CrashLoopBackOff: check `kubectl logs --previous`, verify probes aren't too aggressive.
- ImagePullBackOff: verify image name, tag, registry auth, and network access.
- Pending pods: check events for resource pressure, node affinity mismatches, or PVC issues.
- OOMKilled: increase memory limits or fix the memory leak — never just raise limits blindly.
- Network issues: verify service selectors match pod labels, check NetworkPolicy rules.

## Avoid

- Storing secrets in Dockerfiles, environment variables baked at build time, or ConfigMaps.
- Running as root in production containers.
- Using `latest` tag for base images or application images.
- Setting CPU limits without measuring — over-limiting causes throttling.
- Single-replica deployments for stateless services that need availability.
- Skipping health probes — Kubernetes cannot manage what it cannot observe.

## References

Load on demand. Do not preload all reference files.

| File                                              | Load when                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `references/dockerfile-optimization-checklist.md` | The task focuses on Dockerfile writing, multi-stage builds, layer caching, or image size reduction.       |
| `references/kubernetes-deployment-patterns.md`    | The task involves deployment strategies, autoscaling, Helm charts, or production Kubernetes architecture. |
