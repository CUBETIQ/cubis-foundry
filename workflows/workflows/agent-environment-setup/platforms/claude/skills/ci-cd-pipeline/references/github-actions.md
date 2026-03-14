# GitHub Actions Reference

## Workflow Structure

GitHub Actions workflows are YAML files in `.github/workflows/`. Each workflow contains jobs, each job contains steps, and steps run either shell commands or reusable actions.

### Trigger Events

```yaml
on:
  push:
    branches: [main, release/*]
    paths:
      - 'src/**'
      - 'package.json'
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  workflow_dispatch:       # Manual trigger
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [staging, production]
  schedule:
    - cron: '0 2 * * 1'   # Weekly Monday 2am UTC
```

### Job Dependencies and Parallelism

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps: [...]

  lint:
    needs: install          # Runs after install completes
    runs-on: ubuntu-latest

  typecheck:
    needs: install          # Runs in parallel with lint
    runs-on: ubuntu-latest

  test:
    needs: [lint, typecheck]  # Runs after both complete
    runs-on: ubuntu-latest

  build:
    needs: test
    if: github.ref == 'refs/heads/main'  # Only on main
```

### Matrix Strategy

```yaml
jobs:
  test:
    strategy:
      fail-fast: false      # Don't cancel other matrix jobs on failure
      matrix:
        os: [ubuntu-latest, macos-latest]
        node-version: [18, 20, 22]
        exclude:
          - os: macos-latest
            node-version: 18
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

## Reusable Workflows

### Defining a Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yml
name: Deploy
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image-tag:
        required: true
        type: string
    secrets:
      DEPLOY_TOKEN:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - run: deploy --env ${{ inputs.environment }} --tag ${{ inputs.image-tag }}
        env:
          TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### Calling a Reusable Workflow

```yaml
jobs:
  deploy-staging:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image-tag: ${{ needs.build.outputs.image-tag }}
    secrets:
      DEPLOY_TOKEN: ${{ secrets.STAGING_DEPLOY_TOKEN }}
```

## Composite Actions

Composite actions bundle multiple steps into a single reusable action.

```yaml
# .github/actions/setup-project/action.yml
name: Setup Project
description: Install Node.js, pnpm, and project dependencies
inputs:
  node-version:
    description: Node.js version
    default: '20'
runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v4
      with:
        version: 9
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: pnpm
    - run: pnpm install --frozen-lockfile
      shell: bash
```

## Concurrency Controls

```yaml
# Cancel in-progress runs for the same branch
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# For deployments: queue instead of cancel
concurrency:
  group: deploy-${{ inputs.environment }}
  cancel-in-progress: false
```

## Environments and Protection Rules

GitHub environments provide deployment tracking, required reviewers, and secret scoping.

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://myapp.com
    # Environment protection rules are configured in repo settings:
    # - Required reviewers (1-6 people or teams)
    # - Wait timer (0-43200 minutes)
    # - Deployment branches (specific branches or patterns)
```

## Artifacts

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
    retention-days: 7
    if-no-files-found: error

- uses: actions/download-artifact@v4
  with:
    name: build-output
    path: dist/
```

## Security Best Practices

| Practice | Implementation |
|----------|---------------|
| Pin actions to SHA | `uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11` |
| Minimal permissions | `permissions: { contents: read, pull-requests: write }` |
| OIDC for cloud auth | `id-token: write` permission + provider-specific action |
| Secret scanning | Never echo secrets; use `add-mask` for dynamic values |
| Dependency review | `actions/dependency-review-action` on PRs |
