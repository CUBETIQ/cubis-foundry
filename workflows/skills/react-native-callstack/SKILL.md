---
name: react-native-callstack
description: "Use when building React Native apps with Callstack patterns: performance profiling and optimization, Turbo Module and Fabric native module development, brownfield integration into existing iOS and Android apps, and mobile CI/CD pipelines."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# React Native with Callstack Patterns

## Purpose

Guide the design and implementation of high-performance React Native applications following Callstack engineering patterns, covering render performance profiling and optimization, Turbo Module and Fabric component development, brownfield integration into existing native iOS and Android codebases, and CI/CD pipeline configuration for mobile builds and releases.

## When to Use

- Profiling and optimizing React Native app performance (JS thread, UI thread, bridge overhead).
- Building Turbo Modules or Fabric components for custom native functionality.
- Integrating React Native screens into an existing native iOS or Android application.
- Setting up CI/CD pipelines for mobile builds, code signing, and store distribution.
- Reviewing React Native code for performance regressions, memory leaks, or thread-safety issues.
- Migrating from the old architecture (Bridge) to the new architecture (Fabric + Turbo Modules).

## Instructions

1. **Profile before optimizing by using Flipper, React DevTools, and systrace** because intuition about performance bottlenecks is unreliable. Measure JS frame time, UI thread utilization, and bridge serialization overhead before making changes.

2. **Eliminate unnecessary re-renders with `React.memo`, `useMemo`, and `useCallback`** because React Native's reconciler triggers native view updates on every re-render, and excessive re-renders cause dropped frames that are visible to users.

3. **Use `FlashList` instead of `FlatList` for long scrollable lists** because FlashList recycles native views using cell recycling, reducing memory allocation and improving scroll performance by up to 5x on large datasets.

4. **Move expensive computations off the JS thread with `InteractionManager` or worklets** because the JS thread is single-threaded, and long-running computations block input handling and animations.

5. **Build Turbo Modules instead of legacy Native Modules** because Turbo Modules use JSI for synchronous, zero-copy communication between JavaScript and native code, eliminating the JSON serialization overhead of the old Bridge.

6. **Implement Fabric components for custom native views** because Fabric renders directly through C++ and the platform's rendering pipeline, enabling synchronous layout and reducing the time-to-first-paint compared to the old Paper renderer.

7. **Define native module interfaces with TypeScript codegen specs** because the React Native codegen generates type-safe C++, Objective-C++, and Java/Kotlin bindings from the spec, preventing type mismatches between JS and native code.

8. **Integrate React Native into brownfield apps by embedding `RCTRootView` (iOS) or `ReactActivity` (Android)** because many organizations cannot rewrite entire apps in React Native. Brownfield integration lets teams adopt React Native incrementally, one screen at a time.

9. **Isolate the React Native runtime from the host app's lifecycle** because brownfield integration requires careful management of the bridge/runtime lifecycle to avoid crashes when the host app backgrounds, resumes, or navigates away from React Native screens.

10. **Pre-warm the React Native bundle for brownfield screens** because cold-starting the JavaScript runtime adds 500ms-2s of latency before the screen is interactive. Pre-loading the bundle on app launch or previous screen transition hides this cost.

11. **Configure CI/CD with Fastlane for iOS and Gradle tasks for Android** because mobile builds require code signing, provisioning profiles, keystore management, and store metadata that general-purpose CI tools do not handle natively.

12. **Cache `node_modules`, Gradle dependencies, and CocoaPods in CI** because React Native builds install hundreds of megabytes of dependencies, and caching reduces build times from 20+ minutes to under 5 minutes.

13. **Run Detox or Maestro E2E tests on CI with device farms** because React Native apps have platform-specific behavior that unit tests cannot catch, and E2E tests on real devices or emulators surface rendering and interaction bugs.

14. **Implement code push or OTA updates for JavaScript-only changes** because app store review cycles are 1-7 days, and critical bug fixes in JavaScript logic can be delivered instantly through OTA without binary releases.

15. **Monitor production performance with `react-native-performance` or custom marks** because development profiling does not reflect production behavior on low-end devices, and continuous monitoring catches regressions before user complaints.

16. **Use Hermes as the JavaScript engine for all platforms** because Hermes provides faster startup through bytecode precompilation, lower memory consumption, and better garbage collection behavior compared to JavaScriptCore.

## Output Format

```
## Performance Analysis
[Profiling results, bottleneck identification, optimization plan]

## Native Module Design
[Interface spec, platform implementations, type-safe bindings]

## Integration Architecture
[Brownfield embedding strategy, lifecycle management, pre-warming]

## CI/CD Pipeline
[Build stages, signing, testing, distribution configuration]
```

## References

| File                           | Load when                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `references/performance-optimization.md` | Profiling render performance, optimizing lists, or reducing bridge overhead.        |
| `references/native-bridge.md` | Building Turbo Modules, Fabric components, or wiring native interfaces into JavaScript.      |
| `references/navigation-patterns.md` | Coordinating application flow, integration boundaries, and production delivery patterns. |

## Examples

- "Profile and optimize a React Native list screen that drops frames during fast scroll."
- "Build a Turbo Module for a custom camera feature with TypeScript codegen spec."
- "Embed a React Native checkout flow into an existing native iOS banking app."
