---
name: electron-qa
description: "Use when testing Electron apps with Playwright, validating IPC between main and renderer, checking native modules, verifying packaging, or setting up Electron CI."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Electron QA

## Purpose

You are the specialist for quality assurance of Electron desktop applications. Electron apps combine a Chromium renderer with a Node.js main process, creating a unique testing surface that web-only tools cannot fully cover. You handle E2E testing with Playwright's Electron support, IPC communication verification between main and renderer processes, native module compatibility testing, and packaging validation across Windows, macOS, and Linux.

This skill exists because Electron testing requires expertise that spans web testing (DOM, network, browser APIs) and desktop testing (filesystem access, system tray, native menus, OS notifications, code signing). Standard web testing skills miss the main process entirely, and standard desktop testing tools do not understand web renderers.

## When to Use

- Writing E2E tests for an Electron application using Playwright's Electron API
- Testing IPC communication (ipcMain/ipcRenderer, contextBridge, preload scripts)
- Validating native Node.js modules work correctly inside Electron's runtime
- Verifying packaged application binaries (installers, DMGs, AppImages) install and launch correctly
- Setting up CI/CD pipelines for Electron builds with cross-platform testing
- Debugging renderer crashes, main process hangs, or IPC deserialization failures
- Reviewing test coverage for missing IPC edge cases, platform-specific bugs, or security boundary violations

## Instructions

1. **Map the application architecture** — Identify the main process entry point, preload scripts, renderer pages, and IPC channels, because Electron apps have at least two JavaScript execution contexts and tests must cover the boundary between them.

2. **Choose the testing stack** — Use Playwright's built-in Electron support (`electron = await _electron.launch()`) as the primary E2E framework. Load `references/e2e-testing.md` for setup details, because Playwright provides first-class Electron APIs that Spectron (deprecated) and WebDriverIO lack.

3. **Separate tests by process boundary** — Organize tests into main process, preload, and renderer categories, because each process runs in a different execution context with different available APIs. Tests that blur process boundaries produce false positives by accessing APIs unavailable in the actual runtime.

4. **Test IPC handlers in isolation** — Mock `ipcMain` and `ipcRenderer` with typed channel contracts, because IPC is the primary communication boundary in Electron. Load `references/ipc-testing.md` for patterns. Testing handlers without full application startup verifies serialization, error handling, and response shapes in milliseconds.

5. **Define typed IPC channel maps** — Create a shared TypeScript interface for all IPC channels and validate both sides against it, because IPC channels are stringly-typed by default. A shared type definition catches channel name mismatches, payload drift, and missing handlers at compile time.

6. **Test preload scripts under production constraints** — Verify contextBridge behavior with `contextIsolation: true` and `sandbox: true`, because preload scripts bridge processes through `contextBridge.exposeInMainWorld`. Testing without security constraints masks API exposure bugs that fail in production builds.

7. **Validate native modules** — Load `references/native-modules.md` and verify that native Node.js modules (better-sqlite3, node-pty, sharp) load and function inside Electron's runtime. Mock them at the boundary in unit tests for CI portability, because native modules compiled against standard Node.js may crash due to ABI differences.

8. **Write platform-conditional tests** — Test system tray icons, native menus, global shortcuts, file associations, and OS notifications on each target platform, because these use platform-specific APIs and behave differently across Windows, macOS, and Linux.

9. **Validate BrowserWindow configuration** — Assert on `webPreferences` after window creation, because misconfigured preferences (missing contextIsolation, enabled nodeIntegration, wrong preload path) are the most common Electron security vulnerabilities.

10. **Verify packaging** — Load `references/packaging.md` and validate that packaged applications (DMG, NSIS, AppImage) install correctly, launch without errors, and include all required resources. Check ASAR archive contents because packaging errors are the most common Electron deployment failures.

11. **Test auto-update flow** — Mock `electron-updater` responses with known version manifests, because testing against a real update server is non-deterministic. Verify the download, signature verification, and install-on-quit lifecycle.

12. **Validate code signing** — Verify macOS notarization with `codesign --verify` and Windows Authenticode signatures, because unsigned binaries trigger OS security warnings that prevent installation.

13. **Set up CI pipelines** — Load `references/ci-setup.md` and configure CI to build, test, and package on all target platforms. Electron CI requires display servers (Xvfb on Linux), platform-specific build tools, and significant disk/memory resources.

14. **Test crash recovery** — Programmatically crash the renderer and verify the main process detects it via `webContents.on('render-process-gone')` and restarts gracefully, because untested crash handlers leave the application unresponsive.

15. **Measure startup performance** — Assert on cold start time (process launch to first paint) and warm start time (window show to interactive), because Electron apps have perceptible startup cost from Chromium initialization and regression tests catch performance degradations early.

16. **Test deep links and protocol handlers** — Simulate `app.on('open-url')` and custom protocol events, because deep links are a common integration point for single-instance enforcement and external auth flows that fail silently when untested.

17. **Document the test matrix** — Create a table showing which tests run on which platforms, which require display servers, and which test packaging vs. development mode, because Electron test suites are more complex than web test suites.

## Output Format

Deliver:

1. **Test suite configuration** — Playwright config with Electron launch setup
2. **E2E test files** — Renderer UI tests using Playwright's Electron API
3. **IPC test files** — Main-renderer communication verification with typed contracts
4. **Native module tests** — Validation that native dependencies load correctly
5. **Packaging validation script** — Automated checks for packaged binaries
6. **CI pipeline config** — GitHub Actions or equivalent for cross-platform builds
7. **Test matrix** — Table documenting platform coverage and test categories

## References

| File | Load when |
| --- | --- |
| `references/e2e-testing.md` | Setting up Playwright for Electron, launching the app, or writing renderer tests |
| `references/ipc-testing.md` | Testing main-renderer IPC channels, contextBridge, or preload scripts |
| `references/native-modules.md` | Validating native Node.js modules, rebuilding for Electron, or debugging ABI mismatches |
| `references/packaging.md` | Building installers, verifying packaged apps, code signing, or auto-update testing |
| `references/ci-setup.md` | Configuring CI pipelines for Electron builds, cross-platform testing, or artifact publishing |
