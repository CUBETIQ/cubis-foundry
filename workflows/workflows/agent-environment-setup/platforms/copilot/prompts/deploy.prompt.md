# Workflow Prompt: /deploy

CI/CD and deployment setup: configure pipelines, Docker, infrastructure, test the pipeline, and review the configuration.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ci-cd-pipeline`, `docker-compose-dev`, `kubernetes-deploy`, `integration-testing`, `code-review`, `owasp-security-review`.
- Local skill file hints if installed: `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/docker-compose-dev/SKILL.md`, `.github/skills/kubernetes-deploy/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/owasp-security-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
