# React Native Callstack Eval Assertions

## Eval 1: Native Module Bridge (Turbo Module)

This eval tests Turbo Module development: TypeScript codegen spec, platform-specific native implementations, JSI integration, and proper error handling.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `TurboModule` — New architecture module type     | Turbo Modules use JSI for synchronous, zero-copy JS-to-native communication, replacing the slow JSON-serialized Bridge of the old architecture. |
| 2 | contains | `codegenNativeComponent` — Codegen integration   | The codegen generates type-safe C++, Objective-C++, and Java/Kotlin bindings from the TypeScript spec, preventing type mismatches between JS and native. |
| 3 | contains | `getEnforcing` — Module registry lookup          | `TurboModuleRegistry.getEnforcing` retrieves the module and throws immediately if not registered, catching configuration errors at call site instead of producing undefined. |
| 4 | contains | `Promise` — Async native operations              | Biometric operations require OS-level UI (fingerprint/face prompt) and must return Promises. Synchronous calls would block the JS thread and freeze the UI. |
| 5 | contains | `ReactContextBaseJavaModule` — Android base class | The Android implementation must extend the correct base class for React Native lifecycle integration, native method exposure, and bridge event emission. |

### What a passing response looks like

- TypeScript spec file (`NativeBiometricAuth.ts`) defining the module interface with typed method signatures.
- iOS implementation in Swift or Objective-C++ using the generated C++ spec for type conformance.
- Android implementation in Kotlin extending `ReactContextBaseJavaModule` with `@ReactMethod` annotations.
- Promise-based async methods for `authenticate()` and `getAvailableBiometrics()`.
- Typed error codes (e.g., `BIOMETRIC_NOT_AVAILABLE`, `AUTHENTICATION_FAILED`) in rejection callbacks.

---

## Eval 2: Performance Optimization

This eval tests React Native performance optimization: profiling methodology, list optimization with FlashList, re-render prevention, and measurable targets.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `FlashList` — High-performance list component    | FlashList's cell recycling reduces memory allocation during scroll by reusing native views, achieving up to 5x better performance than FlatList on large datasets. |
| 2 | contains | `React.memo` — Re-render prevention              | List items wrapped in React.memo skip re-rendering when props are unchanged, which is critical when the parent list re-renders due to filter changes or new data. |
| 3 | contains | `useCallback` — Callback stabilization           | Unstable callback references (created on every render) break React.memo's shallow comparison, causing every item to re-render even when data is unchanged. |
| 4 | contains | `getItemType` — FlashList recycling configuration | FlashList needs getItemType for heterogeneous lists to recycle cells correctly. Without it, recycled cells may have mismatched layouts causing visual glitches. |
| 5 | contains | `Hermes` — JavaScript engine recommendation      | Hermes provides bytecode precompilation for faster startup and improved GC behavior during scroll, directly addressing the 3-second initial render and scroll jank. |

### What a passing response looks like

- Profiling steps using Flipper Performance plugin, React DevTools Profiler, and systrace to identify bottlenecks.
- Migration from FlatList to FlashList with `estimatedItemSize` and `getItemType` configuration.
- Item component wrapped in `React.memo` with extracted `useCallback` handlers.
- Image optimization using `expo-image` or `FastImage` with proper caching and placeholder support.
- Hermes verification and configuration, with before/after metrics targeting 60 FPS and under 500ms render.
