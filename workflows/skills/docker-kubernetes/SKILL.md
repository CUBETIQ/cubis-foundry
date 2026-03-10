---
name: docker-kubernetes
description: "Use for containerization strategy, Dockerfile optimization, Kubernetes deployment patterns, Helm charts, and container orchestration decisions."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Docker & Kubernetes

## Purpose

Use for containerization strategy, Dockerfile optimization, Kubernetes deployment patterns, Helm charts, and container orchestration decisions.

## When to Use

- Writing or optimizing Dockerfiles for production builds.
- Designing Kubernetes deployment, service, and ingress manifests.
- Choosing between deployment strategies (rolling, blue-green, canary).
- Setting up health checks, resource limits, and autoscaling.
- Writing Helm charts or Kustomize overlays.
- Debugging container startup failures, crashloops, or networking issues.

## Instructions

1. Define the build target: minimal base image, multi-stage build, layer caching.
2. Set resource requests and limits based on measured usage, not guesses.
3. Configure health checks (liveness, readiness, startup probes) appropriate to the service.
4. Design the deployment strategy matching the service's availability requirements.
5. Verify the container runs as non-root, has no secrets baked in, and scans clean.

### Dockerfile standards

- Use multi-stage builds to separate build dependencies from runtime.
- Pin base image versions to digest or specific tag — never use `latest` in production.
- Order layers from least-changing to most-changing for optimal cache utilization.
- Copy dependency manifests and install before copying application code.
- Run as non-root user: `USER nonroot` or numeric UID.
- Use `.dockerignore` to exclude `.git`, `node_modules`, test fixtures, and local configs.
- Keep final image minimal: `distroless`, `alpine`, or `slim` variants.

### Kubernetes standards

- Always set resource requests AND limits for CPU and memory.
- Define liveness probes (restart on deadlock), readiness probes (remove from service on overload), and startup probes (slow initialization).
- Use `PodDisruptionBudget` for services that need availability guarantees during node maintenance.
- Set `securityContext`: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, drop all capabilities.
- Use `ConfigMap` for non-sensitive config, `Secret` (or external secrets operator) for credentials.
- Label everything: `app`, `version`, `component`, `part-of`, `managed-by`.
- Use `topologySpreadConstraints` or pod anti-affinity for high-availability across zones.

### Debugging patterns

- CrashLoopBackOff: check `kubectl logs --previous`, verify probes aren't too aggressive.
- ImagePullBackOff: verify image name, tag, registry auth, and network access.
- Pending pods: check events for resource pressure, node affinity mismatches, or PVC issues.
- OOMKilled: increase memory limits or fix the memory leak — never just raise limits blindly.
- Network issues: verify service selectors match pod labels, check NetworkPolicy rules.

### Constraints

- Avoid storing secrets in Dockerfiles, environment variables baked at build time, or ConfigMaps.
- Avoid running as root in production containers.
- Avoid using `latest` tag for base images or application images.
- Avoid setting CPU limits without measuring — over-limiting causes throttling.
- Avoid single-replica deployments for stateless services that need availability.
- Avoid skipping health probes — Kubernetes cannot manage what it cannot observe.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File                                              | Load when                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `references/dockerfile-optimization-checklist.md` | The task focuses on Dockerfile writing, multi-stage builds, layer caching, or image size reduction.       |
| `references/kubernetes-deployment-patterns.md`    | The task involves deployment strategies, autoscaling, Helm charts, or production Kubernetes architecture. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with docker kubernetes best practices in this project"
- "Review my docker kubernetes implementation for issues"
