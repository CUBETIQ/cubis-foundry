# Caching Strategies Reference

## Why Caching Matters

Dependency installation is typically the single slowest step in CI pipelines. Effective caching can reduce pipeline duration by 30-70% for the install phase and 50-90% for build phases.

## Cache Key Design

Cache keys determine when a cached artifact is valid. The key should change whenever the cached content would change.

### Content-Based Keys (Recommended)

```yaml
# Primary key: exact match on lockfile hash
key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}

# Fallback keys: partial match for faster restore with stale data
restore-keys: |
  ${{ runner.os }}-pnpm-
```

### Key Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `runner.os` | Separate caches per OS | `Linux`, `macOS` |
| `hashFiles(lockfile)` | Invalidate on dependency change | `abc123...` |
| `matrix.node-version` | Separate per runtime version | `18`, `20` |
| `github.ref` | Branch-specific caches | `refs/heads/main` |

### Anti-Pattern: Time-Based Keys

```yaml
# BAD: Cache never matches because timestamp changes every run
key: cache-${{ github.run_id }}

# BAD: Cache grows stale within a week
key: cache-week-${{ steps.date.outputs.week }}
```

## Package Manager Caching

### pnpm

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm    # Built-in pnpm store caching

# Or manual caching for more control:
- uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/pnpm/store/v3
      node_modules
      packages/*/node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

### npm

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### Go Modules

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    restore-keys: |
      ${{ runner.os }}-go-
```

### Python (pip)

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

### Rust (Cargo)

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/bin/
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      ~/.cargo/git/db/
      target/
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

## Docker Layer Caching

### BuildKit Cache Export

```yaml
- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Registry-Based Cache

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=registry,ref=myregistry/myapp:buildcache
    cache-to: type=registry,ref=myregistry/myapp:buildcache,mode=max
```

### Dockerfile Cache Mounts

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Cache mount persists the pnpm store across builds
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
```

## Build Output Caching

### Turborepo Remote Cache

```yaml
- name: Build with remote cache
  run: npx turbo run build --filter='...[origin/main]'
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: my-team
```

### Next.js Build Cache

```yaml
- uses: actions/cache@v4
  with:
    path: ${{ github.workspace }}/.next/cache
    key: nextjs-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      nextjs-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-
      nextjs-${{ runner.os }}-
```

## Cache Management

| Concern | Solution |
|---------|----------|
| Cache size limits | GitHub Actions: 10 GB per repo. Prune old caches via API. |
| Stale cache | Use content-based keys. Old keys are evicted after 7 days. |
| Cross-branch sharing | `restore-keys` fall back to main branch cache on feature branches. |
| Cache poisoning | Never cache untrusted input. Pin action versions. |
| Cache miss debugging | Add `actions/cache` with `save-always: true` for visibility. |

## Cache Hit Rate Monitoring

Track cache effectiveness by logging hit/miss status:

```yaml
- uses: actions/cache@v4
  id: cache
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('pnpm-lock.yaml') }}

- name: Log cache status
  run: |
    if [ "${{ steps.cache.outputs.cache-hit }}" == "true" ]; then
      echo "::notice::Cache HIT - skipping install"
    else
      echo "::notice::Cache MISS - running full install"
      pnpm install --frozen-lockfile
    fi
```
