# Native Modules

Load this reference when validating native Node.js modules, rebuilding for Electron's Node.js ABI, or debugging native module crashes.

## The ABI Problem

Native Node.js modules (`.node` files) are compiled C/C++ addons linked against a specific Node.js ABI version. Electron bundles its own version of Node.js, which may have a different ABI than the system Node.js. If the ABIs do not match, the module crashes on load with an error like:

```
Error: The module 'better-sqlite3.node' was compiled against a different Node.js version
using NODE_MODULE_VERSION 108. This version of Node.js requires NODE_MODULE_VERSION 116.
```

## Rebuilding Native Modules

### Using electron-rebuild (recommended)

```bash
# Install
npm install -D @electron/rebuild

# Rebuild all native modules for the current Electron version
npx electron-rebuild

# Rebuild a specific module
npx electron-rebuild -m node_modules/better-sqlite3

# Specify Electron version explicitly
npx electron-rebuild -v 28.1.0
```

### Using node-gyp manually

```bash
# Set the target to Electron's Node.js version
export npm_config_target=28.1.0
export npm_config_arch=x64
export npm_config_disturl=https://electronjs.org/headers
export npm_config_runtime=electron
export npm_config_build_from_source=true

npm install better-sqlite3
```

### In package.json scripts

```json
{
  "scripts": {
    "postinstall": "electron-rebuild",
    "rebuild": "electron-rebuild -f"
  }
}
```

## Common Native Modules in Electron

| Module | Purpose | Special handling |
| --- | --- | --- |
| `better-sqlite3` | SQLite database | Must unpack from ASAR |
| `node-pty` | Terminal emulation | Platform-specific build |
| `sharp` | Image processing | Large binary, consider prebuilt |
| `keytar` | OS keychain access | Requires system keychain headers |
| `node-hid` | USB HID devices | Requires libusb on Linux |
| `serialport` | Serial port access | Platform-specific drivers |
| `fsevents` | macOS file watching | macOS only, skip on other platforms |

## ASAR Unpacking

Native modules contain platform-specific binary files that cannot be loaded from inside an ASAR archive. They must be unpacked.

### electron-builder configuration

```json
{
  "asarUnpack": [
    "node_modules/better-sqlite3/**/*",
    "node_modules/node-pty/**/*",
    "node_modules/sharp/**/*"
  ]
}
```

### electron-forge configuration

```javascript
// forge.config.js
module.exports = {
  packagerConfig: {
    asar: {
      unpack: '{node_modules/better-sqlite3/**/*,node_modules/sharp/**/*}',
    },
  },
};
```

### Verifying unpacked modules

```typescript
import * as fs from 'fs';
import * as path from 'path';

function verifyUnpacked(appDir: string, moduleName: string): boolean {
  const unpackedPath = path.join(appDir, 'resources', 'app.asar.unpacked', 'node_modules', moduleName);
  return fs.existsSync(unpackedPath);
}
```

## Testing Native Modules

### Unit tests with mocking

For CI environments without native build tools, mock native modules:

```typescript
// tests/unit/database.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation((dbPath: string) => ({
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockReturnValue([{ id: 1, title: 'Test' }]),
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn().mockReturnValue({ id: 1, title: 'Test' }),
      }),
      exec: vi.fn(),
      close: vi.fn(),
      pragma: vi.fn(),
    })),
  };
});

import { DatabaseService } from '../../main/database';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService(':memory:');
  });

  it('queries notes', () => {
    const notes = db.getAllNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('Test');
  });
});
```

### Integration tests with real native modules

For environments with native build tools, test the actual module:

```typescript
// tests/integration/native-sqlite.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('better-sqlite3 native module', () => {
  const dbPath = path.join(os.tmpdir(), 'test-native.db');
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(dbPath);
  });

  afterAll(() => {
    db.close();
    fs.unlinkSync(dbPath);
  });

  it('loads without ABI error', () => {
    expect(db).toBeDefined();
  });

  it('creates tables and inserts data', () => {
    db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)');
    const insert = db.prepare('INSERT INTO test (value) VALUES (?)');
    const result = insert.run('hello');
    expect(result.changes).toBe(1);
  });

  it('queries data correctly', () => {
    const row = db.prepare('SELECT value FROM test WHERE id = 1').get() as any;
    expect(row.value).toBe('hello');
  });

  it('handles concurrent access', () => {
    db.pragma('journal_mode = WAL');
    const insert = db.prepare('INSERT INTO test (value) VALUES (?)');
    const transaction = db.transaction((values: string[]) => {
      for (const v of values) insert.run(v);
    });
    transaction(['a', 'b', 'c']);
    const count = (db.prepare('SELECT COUNT(*) as n FROM test').get() as any).n;
    expect(count).toBe(4); // 1 from earlier + 3 from transaction
  });
});
```

### E2E native module verification

In the packaged app, verify the native module loads correctly:

```typescript
// tests/e2e/native-module.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';
import * as path from 'path';

test('better-sqlite3 loads in packaged app', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../main/index.js')],
  });

  // Verify from the main process
  const canLoadSqlite = await app.evaluate(() => {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(':memory:');
      db.exec('SELECT 1');
      db.close();
      return true;
    } catch (e) {
      return false;
    }
  });

  expect(canLoadSqlite).toBe(true);
  await app.close();
});
```

## Cross-Platform Compilation

### Platform-specific builds in CI

```yaml
# .github/workflows/native-modules.yml
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
        arch: [x64, arm64]
        exclude:
          - os: windows-latest
            arch: arm64
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx electron-rebuild
      - run: npm test
```

### Prebuild binaries

Use `prebuild` or `prebuild-install` to distribute precompiled binaries:

```json
{
  "scripts": {
    "install": "prebuild-install -r electron || node-gyp rebuild"
  }
}
```

This downloads prebuilt binaries when available and falls back to compilation when they are not.

## Debugging Native Module Failures

| Error | Cause | Fix |
| --- | --- | --- |
| `NODE_MODULE_VERSION mismatch` | Compiled for wrong Node ABI | Run `electron-rebuild` |
| `Cannot find module *.node` | Module inside ASAR archive | Add to `asarUnpack` |
| `GLIBC not found` | Linux binary built on newer glibc | Build on older distro (Ubuntu 20.04) |
| `dyld: Library not loaded` | Missing macOS framework dependency | Install Xcode Command Line Tools |
| `The specified module could not be found` | Missing Windows DLL dependency | Install Visual C++ Redistributable |
| `Error: dlopen failed` | Architecture mismatch (x64 vs arm64) | Rebuild for correct architecture |

## Version Compatibility Matrix

Keep these versions synchronized:

```
Electron version ─── determines ──→ Chromium version
       │                                     │
       └── determines ──→ Node.js ABI  ──→ Native module binary
```

Check your Electron's Node version:

```bash
npx electron -e "console.log(process.versions)"
```

Check the ABI version:

```bash
npx electron -e "console.log(process.versions.modules)"
```

Rebuild native modules every time you upgrade Electron.
