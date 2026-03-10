# GitHub Actions Patterns

## Reusable workflow pattern

```yaml
# .github/workflows/ci-shared.yml
name: Shared CI
on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: "20"
      working-directory:
        required: false
        type: string
        default: "."
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: "npm"
          cache-dependency-path: "${{ inputs.working-directory }}/package-lock.json"
      - run: npm ci
      - run: npm test
```

## Composite action pattern

```yaml
# .github/actions/setup-project/action.yml
name: Setup Project
description: Install dependencies and restore caches
inputs:
  node-version:
    required: false
    default: "20"
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: "npm"
    - run: npm ci
      shell: bash
```

## Matrix strategy

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [18, 20, 22]
        exclude:
          - os: windows-latest
            node: 18
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

## Environment protection

```yaml
jobs:
  deploy-staging:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to staging"

  deploy-production:
    needs: deploy-staging
    environment:
      name: production
      url: https://example.com
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production"
```

Settings for the `production` environment:

- Required reviewers: 1+
- Wait timer: 5 minutes (optional)
- Deployment branches: `main` only
- Prevent self-review: enabled

## Concurrency control

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false # false for deploy, true for CI
```

- Use `cancel-in-progress: true` for CI checks — no reason to test outdated code.
- Use `cancel-in-progress: false` for deployments — cancelling mid-deploy is dangerous.

## Monorepo path filtering

```yaml
on:
  push:
    paths:
      - "packages/api/**"
      - "shared/**"
      - "package-lock.json"
```

- Filter on paths to skip unnecessary CI for unrelated changes.
- Always include shared code and lockfile paths.

## Artifact passing between jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "Deploy dist/"
```
