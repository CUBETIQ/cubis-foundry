# Example: GitHub Actions CI for a Node.js Monorepo

## Prompt

> Design a GitHub Actions CI workflow for a TypeScript monorepo using pnpm workspaces. The repo has three packages: `@acme/api` (Express backend), `@acme/web` (Next.js frontend), and `@acme/shared` (shared types and utilities). Run lint and typecheck in parallel, then unit tests, then build. Cache pnpm dependencies. Test on Node 18 and 20. Only trigger on pull requests and pushes to main.

## Response

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Cancel in-progress runs for the same branch to save resources
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  install:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad1dd2 # v4.0.0
        with:
          version: 9
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      # Upload node_modules so downstream jobs skip install
      - uses: actions/cache/save@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9 # v4.0.2
        with:
          path: |
            node_modules
            packages/*/node_modules
          key: modules-${{ matrix.node-version }}-${{ hashFiles('pnpm-lock.yaml') }}

  lint:
    needs: install
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad1dd2
        with:
          version: 9
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - uses: actions/cache/restore@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9
        with:
          path: |
            node_modules
            packages/*/node_modules
          key: modules-${{ matrix.node-version }}-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm lint

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad1dd2
        with:
          version: 9
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - uses: actions/cache/restore@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9
        with:
          path: |
            node_modules
            packages/*/node_modules
          key: modules-${{ matrix.node-version }}-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm typecheck

  test:
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad1dd2
        with:
          version: 9
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - uses: actions/cache/restore@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9
        with:
          path: |
            node_modules
            packages/*/node_modules
          key: modules-${{ matrix.node-version }}-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm test -- --coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad1dd2
        with:
          version: 9
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - uses: actions/cache/restore@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9
        with:
          path: |
            node_modules
            packages/*/node_modules
          key: modules-${{ matrix.node-version }}-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm build
      - uses: actions/upload-artifact@5d5d22a31266ced268874388b861e4b58bb5c2f3 # v4.3.1
        if: matrix.node-version == 20
        with:
          name: build-output
          path: |
            packages/api/dist
            packages/web/.next
          retention-days: 7
```

### Key decisions

1. **Concurrency control** cancels in-progress runs on the same branch, saving runner minutes when a developer pushes multiple times rapidly.
2. **Cache save/restore split** ensures the install job writes the cache and downstream jobs read it, preventing cache race conditions.
3. **Matrix strategy** validates compatibility on both Node 18 (LTS maintenance) and Node 20 (LTS active).
4. **Artifacts uploaded only for Node 20** because the build output is deterministic; storing both would double storage cost with no diagnostic value.
5. **All actions pinned to SHA digests** for supply chain security per the skill's instruction 5.
