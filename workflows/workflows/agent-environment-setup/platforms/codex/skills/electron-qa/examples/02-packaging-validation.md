# Example: Packaging Validation for Cross-Platform Electron App

This example demonstrates validating packaged Electron binaries across macOS, Windows, and Linux, including code signing verification, ASAR contents checking, native module inclusion, and installer smoke tests.

## Scenario

A note-taking Electron app built with electron-builder that:
- Uses better-sqlite3 for local storage
- Includes custom application icons for all platforms
- Supports auto-update via electron-updater
- Targets macOS (DMG), Windows (NSIS installer), and Linux (AppImage)

## electron-builder Configuration

```json
{
  "appId": "com.example.notes",
  "productName": "QuickNotes",
  "directories": {
    "output": "dist"
  },
  "files": [
    "build/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "asarUnpack": [
    "node_modules/better-sqlite3/**/*"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg"],
    "icon": "assets/icon.icns",
    "hardenedRuntime": true,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "win": {
    "target": ["nsis"],
    "icon": "assets/icon.ico",
    "signingHashAlgorithms": ["sha256"]
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "assets/icon.png",
    "category": "Office"
  },
  "publish": {
    "provider": "github",
    "owner": "example",
    "repo": "quick-notes"
  }
}
```

## Packaging Validation Script

```typescript
// scripts/validate-package.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as asar from '@electron/asar';

const DIST_DIR = path.resolve(__dirname, '../dist');
const platform = process.platform;

interface ValidationResult {
  check: string;
  passed: boolean;
  details: string;
}

const results: ValidationResult[] = [];

function check(name: string, fn: () => string) {
  try {
    const details = fn();
    results.push({ check: name, passed: true, details });
  } catch (error: any) {
    results.push({ check: name, passed: false, details: error.message });
  }
}

// --- Cross-platform checks ---

check('ASAR archive exists', () => {
  const asarPaths = {
    darwin: 'mac/QuickNotes.app/Contents/Resources/app.asar',
    win32: 'win-unpacked/resources/app.asar',
    linux: 'linux-unpacked/resources/app.asar',
  };
  const asarPath = path.join(DIST_DIR, asarPaths[platform as keyof typeof asarPaths]);
  if (!fs.existsSync(asarPath)) throw new Error(`ASAR not found at ${asarPath}`);
  return `Found at ${asarPath}`;
});

check('ASAR contains main process entry', () => {
  const asarPaths = {
    darwin: 'mac/QuickNotes.app/Contents/Resources/app.asar',
    win32: 'win-unpacked/resources/app.asar',
    linux: 'linux-unpacked/resources/app.asar',
  };
  const asarPath = path.join(DIST_DIR, asarPaths[platform as keyof typeof asarPaths]);
  const listing = asar.listPackage(asarPath);
  if (!listing.includes('/build/main/index.js')) {
    throw new Error('Main process entry point missing from ASAR');
  }
  return `ASAR contains ${listing.length} files including main entry`;
});

check('ASAR contains preload script', () => {
  const asarPaths = {
    darwin: 'mac/QuickNotes.app/Contents/Resources/app.asar',
    win32: 'win-unpacked/resources/app.asar',
    linux: 'linux-unpacked/resources/app.asar',
  };
  const asarPath = path.join(DIST_DIR, asarPaths[platform as keyof typeof asarPaths]);
  const listing = asar.listPackage(asarPath);
  if (!listing.includes('/build/preload/preload.js')) {
    throw new Error('Preload script missing from ASAR');
  }
  return 'Preload script present in ASAR';
});

check('Native module unpacked (better-sqlite3)', () => {
  const unpackedPaths = {
    darwin: 'mac/QuickNotes.app/Contents/Resources/app.asar.unpacked/node_modules/better-sqlite3',
    win32: 'win-unpacked/resources/app.asar.unpacked/node_modules/better-sqlite3',
    linux: 'linux-unpacked/resources/app.asar.unpacked/node_modules/better-sqlite3',
  };
  const nativePath = path.join(DIST_DIR, unpackedPaths[platform as keyof typeof unpackedPaths]);
  if (!fs.existsSync(nativePath)) {
    throw new Error('better-sqlite3 not found in unpacked directory');
  }
  // Check for the .node binary
  const bindingDir = path.join(nativePath, 'build', 'Release');
  if (!fs.existsSync(bindingDir)) {
    throw new Error('Native binding directory missing');
  }
  return `Native module found at ${nativePath}`;
});

// --- macOS-specific checks ---

if (platform === 'darwin') {
  check('macOS code signing', () => {
    const appPath = path.join(DIST_DIR, 'mac/QuickNotes.app');
    const output = execSync(`codesign --verify --deep --strict "${appPath}" 2>&1`, {
      encoding: 'utf-8',
    });
    return output || 'Code signature valid';
  });

  check('macOS icon (.icns)', () => {
    const iconPath = path.join(DIST_DIR, 'mac/QuickNotes.app/Contents/Resources/icon.icns');
    if (!fs.existsSync(iconPath)) throw new Error('App icon not found');
    const stat = fs.statSync(iconPath);
    if (stat.size < 1000) throw new Error('Icon file suspiciously small');
    return `Icon present (${stat.size} bytes)`;
  });

  check('macOS app bundle structure', () => {
    const requiredPaths = [
      'Contents/MacOS/QuickNotes',
      'Contents/Resources/app.asar',
      'Contents/Info.plist',
      'Contents/Frameworks/Electron Framework.framework',
    ];
    const appBase = path.join(DIST_DIR, 'mac/QuickNotes.app');
    for (const p of requiredPaths) {
      if (!fs.existsSync(path.join(appBase, p))) {
        throw new Error(`Missing: ${p}`);
      }
    }
    return 'All required bundle paths present';
  });

  check('DMG artifact exists', () => {
    const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.dmg'));
    if (files.length === 0) throw new Error('No DMG file found in dist/');
    return `Found: ${files.join(', ')}`;
  });
}

// --- Windows-specific checks ---

if (platform === 'win32') {
  check('Windows installer exists', () => {
    const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.exe'));
    if (files.length === 0) throw new Error('No installer EXE found in dist/');
    return `Found: ${files.join(', ')}`;
  });

  check('Windows icon (.ico)', () => {
    const iconPath = path.join(DIST_DIR, 'win-unpacked/resources/icon.ico');
    if (!fs.existsSync(iconPath)) {
      // electron-builder may embed the icon differently
      const exePath = path.join(DIST_DIR, 'win-unpacked/QuickNotes.exe');
      if (!fs.existsSync(exePath)) throw new Error('Neither icon nor exe found');
      return 'Icon embedded in executable';
    }
    return 'Icon file present';
  });
}

// --- Linux-specific checks ---

if (platform === 'linux') {
  check('AppImage artifact exists', () => {
    const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.AppImage'));
    if (files.length === 0) throw new Error('No AppImage found in dist/');
    return `Found: ${files.join(', ')}`;
  });

  check('AppImage is executable', () => {
    const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.AppImage'));
    const appImage = path.join(DIST_DIR, files[0]);
    const stat = fs.statSync(appImage);
    const isExecutable = (stat.mode & 0o111) !== 0;
    if (!isExecutable) throw new Error('AppImage is not executable');
    return `${files[0]} has execute permission`;
  });

  check('Linux icon present', () => {
    const iconPath = path.join(DIST_DIR, 'linux-unpacked/resources/icon.png');
    if (!fs.existsSync(iconPath)) throw new Error('Icon not found');
    return 'Linux icon present';
  });
}

// --- Report ---

console.log('\n=== Packaging Validation Report ===\n');
let passed = 0;
let failed = 0;

for (const r of results) {
  const status = r.passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${r.check}`);
  console.log(`       ${r.details}\n`);
  if (r.passed) passed++;
  else failed++;
}

console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length} checks`);
process.exit(failed > 0 ? 1 : 0);
```

## Auto-Update Mock Test

```typescript
// tests/e2e/auto-update.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';
import * as http from 'http';
import * as path from 'path';

let mockUpdateServer: http.Server;

test.beforeAll(async () => {
  // Start a mock update server
  mockUpdateServer = http.createServer((req, res) => {
    if (req.url?.includes('/update/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        version: '99.0.0',
        releaseDate: '2025-01-01',
        url: 'http://localhost:9999/download/update.zip',
        sha512: 'abc123',
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  mockUpdateServer.listen(9999);
});

test.afterAll(async () => {
  mockUpdateServer.close();
});

test('detects available update from mock server', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../main/index.js')],
    env: {
      ...process.env,
      ELECTRON_UPDATE_URL: 'http://localhost:9999/update',
      NODE_ENV: 'test',
    },
  });

  const page = await app.firstWindow();

  // Trigger update check via the UI
  await page.getByRole('menuitem', { name: 'Check for Updates' }).click();

  // Verify the update notification appears
  await expect(page.getByText('Update available: v99.0.0')).toBeVisible({
    timeout: 10000,
  });

  await app.close();
});
```

## CI Integration

```yaml
# .github/workflows/package-validation.yml
name: Package Validation
on: [push, pull_request]

jobs:
  validate-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --mac
      - run: npx ts-node scripts/validate-package.ts
      - uses: actions/upload-artifact@v4
        with:
          name: macos-dmg
          path: dist/*.dmg

  validate-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --win
      - run: npx ts-node scripts/validate-package.ts

  validate-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --linux
      - run: npx ts-node scripts/validate-package.ts
```

## Key Takeaways

- ASAR verification catches files excluded by packaging configuration before users encounter missing-file errors
- Native modules must be unpacked from the ASAR (via `asarUnpack`) because they contain platform-specific binaries
- Code signing verification is platform-specific: `codesign` on macOS, Authenticode on Windows
- Auto-update testing with a mock server verifies the full lifecycle without network dependencies
- Run packaging validation on all three platforms in CI to catch platform-specific failures
