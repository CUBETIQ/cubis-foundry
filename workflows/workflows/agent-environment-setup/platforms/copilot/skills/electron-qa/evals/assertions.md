# Electron QA Eval Assertions

## Eval 1: IPC Contract Testing with Preload Validation

This eval tests the ability to write typed IPC channel tests, preload script validation, and main process handler tests for an Electron file manager application with proper security boundary enforcement.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `ipcMain` — Main process handler testing | Testing ipcMain.handle registrations verifies that IPC handlers correctly process messages, validate arguments, and return expected responses. Without isolated handler tests, IPC bugs are only discovered through slow E2E tests or user reports. |
| 2 | contains | `contextBridge` — Preload API surface validation | contextBridge.exposeInMainWorld defines the renderer's API surface. Testing that only intended functions are exposed prevents accidental Node.js API leaks that would allow renderer-side code to access the file system or execute arbitrary commands. |
| 3 | contains | `contextIsolation` — Security boundary assertion | contextIsolation: true prevents renderer scripts from accessing the preload script's scope. A missing or false contextIsolation setting is the most common Electron security vulnerability, allowing XSS to escalate to full system access. |
| 4 | contains | `invoke` — IPC contract verification | ipcRenderer.invoke calls must match ipcMain.handle registrations. Testing both sides against a shared channel contract catches channel name mismatches, argument type drift, and missing handlers at compile time rather than at runtime. |
| 5 | contains | `mock` — File system isolation | Mocking file system operations in IPC handler tests isolates handler logic from the actual file system. Without mocks, tests are slow, non-deterministic, and may modify or delete real files on the test machine. |

### What a passing response looks like

- Typed IPC channel map: `interface IpcChannels { 'fs:readDirectory': { args: [string]; return: FileEntry[] }; ... }`.
- Main process handler tests using Vitest with mocked `fs` module, testing success paths, error paths (permission denied, not found), and argument validation.
- Preload script test that verifies `contextBridge.exposeInMainWorld` is called with exactly the intended API methods and no additional properties.
- BrowserWindow configuration test asserting `webPreferences.contextIsolation === true`, `webPreferences.sandbox === true`, and `webPreferences.nodeIntegration === false`.
- Contract test that verifies every channel in the typed map has a corresponding ipcMain.handle registration and a preload-exposed invoke wrapper.
- Tests organized by process boundary: `tests/main/`, `tests/preload/`, `tests/renderer/`.

---

## Eval 2: E2E Packaging and Native Module Validation

This eval tests the ability to write Playwright-based E2E tests, packaging verification scripts, and auto-update lifecycle tests for an Electron application with native dependencies across all three major platforms.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `_electron` — Playwright Electron integration | Playwright's `_electron.launch()` starts the actual Electron application with its full process architecture. Without it, tests run against a browser that lacks the main process, IPC, and native module capabilities of the real application. |
| 2 | contains | `electron-builder` — Packaging output verification | electron-builder can silently exclude files, bundle wrong native module ABIs, or produce broken code signatures. Verifying the build output catches distribution-breaking issues before they reach users. |
| 3 | contains | `better-sqlite3` — Native module ABI validation | better-sqlite3 requires platform-specific compiled binaries that must match Electron's Node.js ABI version. ABI mismatches are the single most common cause of "works in dev, crashes in production" Electron bugs. |
| 4 | contains | `autoUpdater` — Update lifecycle testing | Mocking electron-updater's autoUpdater verifies the check-download-verify-install lifecycle without a real update server. Untested auto-update code risks failed updates that leave users on broken versions with no recovery path. |
| 5 | contains | `platform` — Cross-platform coverage | macOS (DMG), Windows (NSIS), and Linux (AppImage) have different packaging formats, code signing requirements, and system integration behaviors. Platform-specific tests catch issues that single-platform development misses. |

### What a passing response looks like

- E2E test launches the app with `const electronApp = await _electron.launch({ args: ['./dist/main.js'] })`.
- Creates a note through the UI, quits the app, relaunches, and verifies the note persists (testing both UI and SQLite persistence).
- Startup time measured with `performance.now()` delta between launch and first meaningful paint, asserted below a threshold.
- Packaging test builds with `electron-builder --publish never`, then verifies: ASAR contains app files, native `.node` binaries exist for target platform, `package.json` is present.
- Platform-conditional tests: `codesign --verify` on macOS, Authenticode check on Windows, executable permission on Linux.
- Auto-update test mocks `autoUpdater.checkForUpdates()`, provides a fake update manifest, verifies download progress events, and asserts `quitAndInstall()` is callable.
- CI matrix runs on `macos-latest`, `windows-latest`, and `ubuntu-latest`.
