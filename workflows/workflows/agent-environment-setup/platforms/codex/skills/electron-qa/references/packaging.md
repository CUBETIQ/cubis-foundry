# Packaging

Load this reference when building installers, verifying packaged applications, validating code signing, or testing auto-update flows.

## Packaging Tools

### electron-builder (recommended)

The most widely used Electron packaging tool. Supports all platforms, auto-update, and code signing.

```bash
npm install -D electron-builder
```

### electron-forge

Electron's official tooling. Better integration with Electron's ecosystem but fewer packaging options.

```bash
npm install -D @electron-forge/cli
```

### Comparison

| Feature | electron-builder | electron-forge |
| --- | --- | --- |
| macOS DMG | Yes | Yes |
| macOS PKG | Yes | Yes |
| Windows NSIS | Yes | No (uses Squirrel) |
| Windows MSI | Yes (via WiX) | No |
| Linux AppImage | Yes | No |
| Linux Snap | Yes | Yes |
| Linux deb/rpm | Yes | Yes |
| Auto-update | electron-updater | Built-in |
| Code signing | Built-in | Built-in |
| ASAR packing | Yes | Yes |

## electron-builder Configuration

```json
{
  "build": {
    "appId": "com.example.myapp",
    "productName": "MyApp",
    "directories": {
      "buildResources": "build",
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
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icons",
      "category": "Office"
    },
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "your-app"
    }
  }
}
```

## Building

```bash
# Build for current platform
npx electron-builder

# Build for specific platform
npx electron-builder --mac
npx electron-builder --win
npx electron-builder --linux

# Build all platforms (macOS only — cross-compilation)
npx electron-builder -mwl
```

Cross-compilation:
- macOS can build for macOS, Windows, and Linux
- Windows can build for Windows only
- Linux can build for Linux and Windows (with Wine)

## Code Signing

### macOS

macOS requires code signing and notarization for distribution outside the App Store.

#### Prerequisites
- Apple Developer account ($99/year)
- Developer ID Application certificate
- Developer ID Installer certificate (for PKG)

#### Configuration

```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "afterSign": "scripts/notarize.js"
}
```

#### Entitlements

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

#### Verification

```bash
# Verify code signature
codesign --verify --deep --strict /path/to/MyApp.app

# Check notarization
spctl --assess --verbose /path/to/MyApp.app

# Verify DMG signature
codesign --verify /path/to/MyApp.dmg
```

### Windows

Windows uses Authenticode code signing.

#### Prerequisites
- Code signing certificate (EV or standard)
- SignTool.exe (part of Windows SDK)

#### Configuration (CI environment variables)

```bash
CSC_LINK=path/to/certificate.pfx
CSC_KEY_PASSWORD=certificate-password
```

#### Verification

```powershell
# Verify Authenticode signature
Get-AuthenticodeSignature -FilePath "dist\MyApp Setup.exe"
```

## ASAR Verification

The ASAR archive contains your application source code. Verify its contents after packaging.

```typescript
import * as asar from '@electron/asar';

function verifyAsar(asarPath: string, requiredFiles: string[]): string[] {
  const listing = asar.listPackage(asarPath);
  const missing: string[] = [];

  for (const file of requiredFiles) {
    if (!listing.includes(file)) {
      missing.push(file);
    }
  }

  return missing;
}

// Usage
const missing = verifyAsar('dist/mac/MyApp.app/Contents/Resources/app.asar', [
  '/package.json',
  '/build/main/index.js',
  '/build/preload/preload.js',
  '/build/renderer/index.html',
]);

if (missing.length > 0) {
  console.error('Missing files in ASAR:', missing);
  process.exit(1);
}
```

## Auto-Update

### electron-updater setup

```typescript
// main/updater.ts
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';

export function setupAutoUpdate(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update:ready', info.version);
  });

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('update:error', error.message);
  });

  // Check for updates after app is ready
  autoUpdater.checkForUpdates();
}
```

### Testing auto-update with mock server

```typescript
import * as http from 'http';

function createMockUpdateServer(port: number, updateInfo: any): http.Server {
  return http.createServer((req, res) => {
    if (req.url?.endsWith('/latest.yml') || req.url?.endsWith('/latest-mac.yml')) {
      res.writeHead(200, { 'Content-Type': 'text/yaml' });
      res.end(`
version: ${updateInfo.version}
releaseDate: ${updateInfo.date}
files:
  - url: update-${updateInfo.version}.zip
    sha512: ${updateInfo.sha512}
    size: ${updateInfo.size}
path: update-${updateInfo.version}.zip
      `);
    } else {
      res.writeHead(404);
      res.end();
    }
  }).listen(port);
}
```

## Icon Requirements

| Platform | Format | Sizes | File |
| --- | --- | --- | --- |
| macOS | .icns | 16, 32, 64, 128, 256, 512, 1024 | `build/icon.icns` |
| Windows | .ico | 16, 32, 48, 64, 128, 256 | `build/icon.ico` |
| Linux | .png | 16, 32, 48, 64, 128, 256, 512 | `build/icons/` directory |

Generate all formats from a single 1024x1024 PNG:

```bash
# macOS
iconutil -c icns build/icon.iconset

# Windows (requires imagemagick)
convert icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Linux — place PNGs in build/icons/{size}x{size}/
```

## Packaging Checklist

Before releasing:

- [ ] ASAR contains all required source files
- [ ] Native modules are unpacked and match the Electron ABI
- [ ] Application icons are included for all target platforms
- [ ] Code signing is valid (macOS: codesign + notarization, Windows: Authenticode)
- [ ] Auto-updater points to the correct update server
- [ ] Version number in package.json matches the release tag
- [ ] License file is included in the package
- [ ] No development dependencies are bundled (check package size)
- [ ] The packaged app launches without errors on each platform
- [ ] File associations and protocol handlers are registered correctly
