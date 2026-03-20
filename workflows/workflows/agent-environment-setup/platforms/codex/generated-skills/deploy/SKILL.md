---
name: deploy
description: "CI/CD and deployment setup: configure pipelines, Docker, infrastructure, test the pipeline, and review the configuration."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "deploy"
  platform: "Codex"
  command: "/deploy"
compatibility: Codex
---
# Deploy Workflow
## When to use

Use for CI/CD pipeline setup, Docker configuration, Kubernetes manifests, deployment automation, or infrastructure changes.

## Agent Chain

`planner` -> `implementer` -> `tester` -> `reviewer`

## Routing

1. **Plan**: `@planner` defines the deployment path, risks, rollback points, and validation gates.
2. **Build**: `@implementer` creates or modifies pipeline configs, Dockerfiles, or infrastructure definitions.
3. **Test**: `@tester` validates the pipeline (dry runs, container builds, integration checks).
4. **Review**: `@reviewer` reviews the configuration for correctness and security.

## Skill Routing

- Primary skills: `ci-cd-pipeline`, `docker-compose-dev`
- Supporting skills (optional): `kubernetes-deploy`, `integration-testing`, `code-review`, `owasp-security-review`

## Context notes

- Provide the deployment target, requirements, and any infrastructure constraints.
- Implementer follows the project's existing infrastructure patterns.

## Workflow steps

1. Planner analyzes the current deployment setup and requirements.
2. Implementer implements the pipeline or infrastructure changes.
3. Tester runs pipeline checks, container builds, or dry-run deployments.
4. Reviewer validates security (no hardcoded secrets, least-privilege, image scanning).
5. If issues are found, implementer iterates on the configuration.

## Verification

- Pipeline runs successfully (build, test, deploy stages pass).
- No hardcoded secrets in configuration files.
- Rollback procedure documented and tested.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [planner, tester, reviewer]
  pipeline_status: <pass|fail>
  changed_artifacts: [<path>]
  secrets_hardcoded: <number>
  rollback_documented: <boolean>
  follow_up_items: [<string>] | []
```