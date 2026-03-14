# CI Setup

Load this reference when configuring CI pipelines for Electron builds, cross-platform testing, or artifact publishing.

## CI Requirements for Electron

Electron CI pipelines are more demanding than typical web app pipelines:

| Requirement | Why | Impact |
| --- | --- | --- |
| Display server (Linux) | Chromium needs a display to render | Xvfb or virtual framebuffer |
| Large disk space | Electron + Chromium binary is 150-200 MB | 2-4 GB free disk minimum |
| Sufficient RAM | Chromium renderer + Node.js main process | 4 GB minimum, 8 GB recommended |
| Native build tools | Native modules need compilation | Xcode, Visual Studio Build Tools, build-essential |
| Code signing certs | macOS notarization, Windows Authenticode | Stored as CI secrets |
| Platform runners | Must build on target OS | macOS, Windows, Linux runners |

## GitHub Actions — Complete Pipeline

```yaml
name: Electron CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  # Job 1: Lint and unit tests (fast, no Electron)
  lint-and-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit

  # Job 2: E2E tests on each platform
  e2e-tests:
    needs: lint-and-unit
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Rebuild native modules
        run: npx electron-rebuild

      - name: Run E2E tests (Linux)
        if: runner.os == 'Linux'
        run: xvfb-run --auto-servernum npx playwright test
        env:
          DISPLAY: ':99'

      - name: Run E2E tests (macOS/Windows)
        if: runner.os != 'Linux'
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.os }}
          path: |
            playwright-report/
            test-results/

  # Job 3: Build and package
  package:
    needs: e2e-tests
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: macos-latest
            build-args: --mac
            artifact-name: macos-build
            artifact-path: dist/*.dmg
          - os: windows-latest
            build-args: --win
            artifact-name: windows-build
            artifact-path: dist/*.exe
          - os: ubuntu-latest
            build-args: --linux
            artifact-name: linux-build
            artifact-path: dist/*.AppImage
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Package application
        run: npx electron-builder ${{ matrix.build-args }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}

      - name: Validate package
        run: npx ts-node scripts/validate-package.ts

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact-name }}
          path: ${{ matrix.artifact-path }}
          retention-days: 30
```

## Linux Display Server (Xvfb)

Chromium requires a display server to render. On headless Linux CI, use Xvfb:

```bash
# Install
sudo apt-get install -y xvfb

# Run tests with Xvfb
xvfb-run --auto-servernum --server-args="-screen 0 1280x720x24" npx playwright test
```

### Alternative: Use a Docker image with Xvfb

```dockerfile
FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
  xvfb \
  libgtk-3-0 \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libasound2 \
  libxtst6 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgbm1

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["xvfb-run", "--auto-servernum", "npm", "test"]
```

## Native Module Compilation in CI

### macOS

macOS runners include Xcode by default. No additional setup needed.

### Windows

Windows runners need Visual Studio Build Tools:

```yaml
- name: Install Windows Build Tools
  if: runner.os == 'Windows'
  run: npm install -g windows-build-tools
```

Or use the pre-installed tools on GitHub Actions `windows-latest` runners.

### Linux

```yaml
- name: Install Linux build dependencies
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y \
      build-essential \
      libx11-dev \
      libxkbfile-dev \
      libsecret-1-dev \
      python3
```

## Code Signing in CI

### macOS signing secrets

Store these as GitHub Actions secrets:

| Secret | Contents |
| --- | --- |
| `MAC_CERTIFICATE` | Base64-encoded .p12 certificate file |
| `MAC_CERTIFICATE_PASSWORD` | Password for the .p12 file |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | Apple Developer team ID |

#### Encoding the certificate

```bash
base64 -i Certificates.p12 | pbcopy
# Paste into GitHub secret MAC_CERTIFICATE
```

### Windows signing secrets

| Secret | Contents |
| --- | --- |
| `WIN_CERTIFICATE` | Base64-encoded .pfx certificate |
| `WIN_CERTIFICATE_PASSWORD` | Password for the .pfx file |

## Caching Strategies

### npm cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```

### Electron binary cache

Electron downloads a large binary on first install. Cache it:

```yaml
- name: Cache Electron
  uses: actions/cache@v4
  with:
    path: ~/.cache/electron
    key: electron-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

### electron-builder cache

```yaml
- name: Cache electron-builder
  uses: actions/cache@v4
  with:
    path: ~/.cache/electron-builder
    key: electron-builder-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

## Release Pipeline

Publish builds when a git tag is pushed:

```yaml
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build

      - name: Publish
        run: npx electron-builder --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
```

This creates a GitHub Release with the packaged artifacts attached.

## Troubleshooting CI

| Issue | Platform | Fix |
| --- | --- | --- |
| `cannot open display` | Linux | Add `xvfb-run` wrapper |
| `Error: ENOMEM` | All | Increase runner memory or reduce workers |
| `Timeout waiting for Electron` | All | Increase `timeout` in playwright.config.ts |
| Native module build fails | Windows | Install windows-build-tools |
| Code signing fails | macOS | Verify certificate is not expired, check team ID |
| AppImage not executable | Linux | Add `chmod +x` step after build |
| ASAR missing files | All | Check `files` glob in electron-builder config |
| Disk space exhausted | All | Clean caches before build, use larger runner |

## Pipeline Duration Targets

| Stage | Target | Notes |
| --- | --- | --- |
| Install + rebuild | < 3 min | With caching |
| Unit tests | < 2 min | No Electron needed |
| E2E tests | < 5 min | Per platform |
| Package build | < 5 min | Per platform |
| Code signing + notarization | < 5 min | macOS is slowest |
| Total pipeline | < 20 min | All platforms parallel |

If total pipeline exceeds 20 minutes, investigate caching, test parallelism, and build optimization.
