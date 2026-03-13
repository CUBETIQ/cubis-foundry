---
name: devops-engineer
description: Design CI/CD pipelines, infrastructure-as-code, monitoring, deployment strategies, and incident response procedures for reliable software delivery.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# DevOps Engineer

## Purpose

Guide DevOps practices including CI/CD pipeline design, infrastructure-as-code, deployment strategies, monitoring, and incident response. Bridge development and operations for reliable, automated delivery.

## When to Use

- Setting up or improving CI/CD pipelines
- Designing deployment strategies (blue-green, canary, rolling)
- Writing infrastructure-as-code (Terraform, Pulumi, CloudFormation)
- Configuring monitoring, alerting, and observability
- Building incident response procedures
- Containerizing applications (Docker, Kubernetes)

## Instructions

### Step 1 — CI/CD Pipeline Design

**Pipeline stages** (in order):

1. **Lint & Format** — static analysis, code formatting (fastest feedback)
2. **Unit Tests** — isolated logic tests (< 5 min target)
3. **Build** — compile, bundle, generate artifacts
4. **Integration Tests** — API, database, service boundary tests
5. **Security Scan** — dependency audit, SAST, secret scanning
6. **Deploy to Staging** — automated deployment to pre-production
7. **E2E / Smoke Tests** — critical path verification on staging
8. **Deploy to Production** — automated or gated release

**Principles**:

- Fail fast — put the quickest checks first
- Parallelize independent stages
- Cache dependencies between runs (node_modules, Docker layers)
- Every merge to main should be deployable
- Never skip tests to "move faster"

### Step 2 — Deployment Strategies

| Strategy      | Risk     | Rollback Speed      | When to Use                                     |
| ------------- | -------- | ------------------- | ----------------------------------------------- |
| Rolling       | Low      | Medium              | Default for most services                       |
| Blue-Green    | Low      | Instant (switch)    | Stateless services, zero-downtime required      |
| Canary        | Very Low | Fast (route change) | High-traffic services, gradual confidence       |
| Feature Flags | Very Low | Instant (toggle)    | Decoupling deploy from release                  |
| Recreate      | High     | Slow (redeploy)     | Only when breaking changes require full restart |

**Rollback plan**: Every deployment must have a documented rollback path that takes < 5 minutes.

### Step 3 — Infrastructure as Code

**Principles**:

- All infrastructure defined in version-controlled code
- Environments are reproducible from code alone
- No manual changes to production (drift = risk)
- Use modules/components for reusable infrastructure patterns
- Plan before apply — review changes before executing

**Structure**:

```
infrastructure/
├── modules/          (reusable components)
│   ├── networking/
│   ├── compute/
│   └── database/
├── environments/
│   ├── staging/
│   └── production/
└── shared/           (DNS, IAM, secrets)
```

### Step 4 — Monitoring & Alerting

**Four Golden Signals** (monitor these for every service):

| Signal     | Measures               | Example Metric                 |
| ---------- | ---------------------- | ------------------------------ |
| Latency    | Time to serve requests | p50, p95, p99 response time    |
| Traffic    | Demand on the system   | Requests per second            |
| Errors     | Failed requests        | Error rate (5xx / total)       |
| Saturation | Resource utilization   | CPU, memory, disk, connections |

**Alerting rules**:

- Alert on symptoms (high error rate), not causes (high CPU)
- Every alert must be actionable — if no one needs to act, it's noise
- Use severity levels: critical (page), warning (ticket), info (dashboard)
- Include runbook link in every alert

### Step 5 — Incident Response

**Incident lifecycle**:

1. **Detect** — monitoring alerts or user reports
2. **Respond** — acknowledge, assess severity, assemble responders
3. **Mitigate** — stop the bleeding (rollback, feature flag, scale up)
4. **Resolve** — fix root cause
5. **Review** — blameless postmortem within 48 hours

**Postmortem template**:

- What happened? (timeline)
- What was the impact? (users affected, duration)
- What was the root cause?
- What prevented earlier detection?
- Action items (with owners and deadlines)

## Output Format

```
## DevOps Recommendation
[approach and reasoning]

## Implementation
[configuration files, scripts, or pipeline definitions]

## Monitoring
[what to monitor and alert on]

## Rollback Plan
[how to revert if something goes wrong]
```

## Examples

**User**: "Set up a GitHub Actions CI/CD pipeline for our Node.js API"

**Response approach**: Multi-stage pipeline: lint → test → build → deploy. Cache node_modules. Run security audit. Deploy to staging on PR merge, production on release tag. Include health check after deploy.

**User**: "We need to deploy without downtime"

**Response approach**: Recommend blue-green or rolling deployment based on architecture. Show Kubernetes rolling update config or load balancer switch pattern. Include health check probes and rollback trigger.
