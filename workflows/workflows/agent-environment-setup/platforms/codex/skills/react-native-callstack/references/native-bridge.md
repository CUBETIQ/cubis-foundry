# Native Bridge

Load this when building Turbo Modules, Fabric components, or migrating from the old architecture to the new architecture.

## Architecture Overview

### Old Architecture (Bridge)

```
JavaScript -> JSON serialize -> Bridge (async queue) -> Native
```

- All communication is asynchronous and serialized as JSON.
- Batched messages introduce latency.
- No synchronous access to native state.

### New Architecture (JSI + Turbo Modules + Fabric)

```
JavaScript -> JSI (C++ shared memory) -> Native (sync or async)
```

- JSI provides direct, synchronous access to native objects.
- No JSON serialization overhead.
- Turbo Modules replace Native Modules. Fabric replaces Paper renderer.

## Turbo Module Development

### Codegen Spec

The codegen spec is the source of truth for the module interface. React Native generates C++, Objective-C++, and Java bindings from it.

```typescript
// specs/NativeMyModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous (JSI direct call, no async overhead)
  getValue(): string;
  multiply(a: number, b: number): number;

  // Asynchronous (returns a Promise)
  fetchData(url: string): Promise<string>;

  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyModule');
```

### Supported Types in Codegen

| TypeScript | iOS (Obj-C++) | Android (Java/Kotlin) |
|-----------|---------------|----------------------|
| `number` | `double` | `double` |
| `string` | `NSString *` | `String` |
| `boolean` | `BOOL` / `NSNumber *` | `boolean` |
| `Array<T>` | `NSArray *` | `ReadableArray` |
| `Object` | `NSDictionary *` | `ReadableMap` |
| `Promise<T>` | resolve/reject blocks | `Promise` |
| `null \| T` | nullable type | `@Nullable` |

### iOS Implementation Pattern

```objc
// ios/MyModule.mm
#import "MyModule.h"

@implementation MyModule

RCT_EXPORT_MODULE(MyModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeMyModuleSpecJSI>(params);
}

- (NSString *)getValue {
  return @"native_value";
}

- (NSNumber *)multiply:(double)a b:(double)b {
  return @(a * b);
}

- (void)fetchData:(NSString *)url
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  // Perform async work, then call resolve or reject
  resolve(@"response_data");
}

@end
```

### Android Implementation Pattern

```kotlin
// android/src/main/java/com/mymodule/MyModule.kt
class MyModule(reactContext: ReactApplicationContext) :
    NativeMyModuleSpec(reactContext) {

    override fun getName() = "MyModule"

    override fun getValue(): String = "native_value"

    override fun multiply(a: Double, b: Double): Double = a * b

    override fun fetchData(url: String, promise: Promise) {
        // Perform async work
        promise.resolve("response_data")
    }

    override fun addListener(eventName: String?) {}
    override fun removeListeners(count: Double) {}
}
```

## Fabric Components

Fabric is the new rendering system that replaces Paper. Fabric components render through C++ and the platform's native rendering pipeline.

### Component Spec

```typescript
// specs/MyNativeViewNativeComponent.ts
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { Float, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

interface NativeProps extends ViewProps {
  borderRadius?: Float;
  maxItems?: Int32;
  label: string;
  onItemSelected?: (event: { nativeEvent: { index: Int32 } }) => void;
}

export default codegenNativeComponent<NativeProps>('MyNativeView');
```

### Native View Manager (iOS)

```objc
// ios/MyNativeViewManager.mm
#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>

@interface MyNativeViewManager : RCTViewManager
@end

@implementation MyNativeViewManager

RCT_EXPORT_MODULE(MyNativeView)

- (UIView *)view {
  return [[MyNativeView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(label, NSString)
RCT_EXPORT_VIEW_PROPERTY(borderRadius, float)
RCT_EXPORT_VIEW_PROPERTY(maxItems, int)
RCT_EXPORT_VIEW_PROPERTY(onItemSelected, RCTDirectEventBlock)

@end
```

## Migration from Bridge to New Architecture

### Step 1: Enable New Architecture

```ruby
# ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

```groovy
// android/gradle.properties
newArchEnabled=true
```

### Step 2: Create Codegen Specs

Write TypeScript specs for all existing native modules. The codegen generates the glue code.

### Step 3: Update Native Implementations

- iOS: Implement the generated `Spec` protocol instead of `RCTBridgeModule`.
- Android: Extend the generated `NativeXxxSpec` class instead of `ReactContextBaseJavaModule`.

### Step 4: Interop Mode

React Native provides an interop layer that runs old-architecture modules on the new architecture. Use it during migration to avoid a big-bang rewrite.

```json
// react-native.config.js
module.exports = {
  project: {
    ios: { unstable_reactLegacyComponentNames: ['OldNativeView'] },
    android: { unstable_reactLegacyComponentNames: ['OldNativeView'] },
  },
};
```

## Event Emission

### From Turbo Module

```objc
// iOS
[self sendEventWithName:@"onStatusChange" body:@{@"status": @"connected"}];
```

```kotlin
// Android
reactApplicationContext
  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  .emit("onStatusChange", Arguments.createMap().apply {
    putString("status", "connected")
  })
```

### Listening in JavaScript

```typescript
import { NativeEventEmitter } from 'react-native';
import MyModule from './specs/NativeMyModule';

const emitter = new NativeEventEmitter(MyModule);
const subscription = emitter.addListener('onStatusChange', (event) => {
  console.log('Status:', event.status);
});

// Clean up
subscription.remove();
```

## Thread Safety

- Turbo Module synchronous functions run on the JS thread. Keep them fast (< 1ms).
- Async functions can dispatch to background threads, but must call resolve/reject on the JS thread.
- Native module state accessed from multiple threads must be synchronized with locks or serial queues.
- On iOS, use `dispatch_queue_create` for a serial queue. On Android, use `@Synchronized` or `ReentrantLock`.
