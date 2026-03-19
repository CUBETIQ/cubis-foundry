---
name: deploy
description: "CI/CD and deployment setup: configure pipelines, Docker, infrastructure, test the pipeline, and review the configuration."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "deploy"
  platform: "Claude Code"
  command: "/deploy"
compatibility: Claude Code
---
# Deploy Workflow
## When to use

Use for CI/CD pipeline setup, Docker configuration, Kubernetes manifests, deployment automation, or infrastructure changes.

## Agent Chain

`devops` → `tester` → `reviewer`

## Routing

1. **Build**: `@devops` creates or modifies pipeline configs, Dockerfiles, or infrastructure definitions.
2. **Test**: `@tester` validates the pipeline (dry runs, container builds, integration checks).
3. **Review**: `@reviewer` reviews the configuration for correctness and security.

## Skill Routing

- Primary skills: `ci-cd-pipeline`, `docker-compose-dev`
- Supporting skills (optional): `kubernetes-deploy`, `integration-testing`, `code-review`, `owasp-security-review`

## Context notes

- Provide the deployment target, requirements, and any infrastructure constraints.
- DevOps follows the project's existing infrastructure patterns.

## Workflow steps

1. DevOps analyzes the current deployment setup and requirements.
2. DevOps implements the pipeline/infrastructure changes.
3. Tester runs pipeline checks, container builds, or dry-run deployments.
4. Reviewer validates security (no hardcoded secrets, least-privilege, image scanning).
5. If issues are found, devops iterates on the configuration.

## Verification

- Pipeline runs successfully (build, test, deploy stages pass).
- No hardcoded secrets in configuration files.
- Rollback procedure documented and tested.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: devops
  supporting_agents: [tester, reviewer]
  pipeline_status: <pass|fail>
  changed_artifacts: [<path>]
  secrets_hardcoded: <number>
  rollback_documented: <boolean>
  follow_up_items: [<string>] | []
```