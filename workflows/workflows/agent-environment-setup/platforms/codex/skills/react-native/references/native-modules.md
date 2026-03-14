# React Native Native Modules Reference (Expo Modules API)

## Project Structure

```
modules/my-module/
  index.ts                    # Public TypeScript API
  expo-module.config.json     # Registration
  src/MyModule.ts             # requireNativeModule bridge
  ios/MyModule.swift          # iOS implementation
  android/.../MyModule.kt     # Android implementation
```

## iOS Module (Swift)

```swift
import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyModule")

    Constants(["platform": "ios"])

    Function("add") { (a: Double, b: Double) -> Double in a + b }

    AsyncFunction("fetchUser") { (userId: String) -> [String: Any] in
      let user = try await UserService.fetch(userId)
      return ["id": user.id, "name": user.name]
    }

    Events("onProgress")
  }
}
```

## Android Module (Kotlin)

```kotlin
package expo.modules.mymodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")

    Constants("platform" to "android")

    Function("add") { a: Double, b: Double -> a + b }

    AsyncFunction("fetchUser") { userId: String ->
      val user = UserService.fetch(userId)
      mapOf("id" to user.id, "name" to user.name)
    }

    Events("onProgress")
  }
}
```

## Registration

```json
{
  "platforms": ["ios", "android"],
  "ios": { "modules": ["MyModule"] },
  "android": { "modules": ["expo.modules.mymodule.MyModule"] }
}
```

## TypeScript Bridge

```typescript
import { requireNativeModule } from 'expo-modules-core';
type MyModuleType = { add(a: number, b: number): number; fetchUser(id: string): Promise<{ id: string; name: string }> };
export default requireNativeModule<MyModuleType>('MyModule');
```

## Function Types

- **`Function`** -- synchronous, runs on JS thread; use only for fast computations
- **`AsyncFunction`** -- runs on background thread, returns Promise in JS
- **Throwing** -- errors propagate as rejected promises or thrown exceptions

## Events

```swift
// Send from native
self.sendEvent("onProgress", ["percent": 50])
```

```typescript
// Listen in JS
import { EventEmitter } from 'expo-modules-core';
const emitter = new EventEmitter(MyModule);
const sub = emitter.addListener('onProgress', (e) => console.log(e.percent));
sub.remove(); // cleanup
```

## Native Views

Define with `View(MyNativeView.self) { Prop("title") { ... } }` in the module definition. Views extend `ExpoView` (iOS) or `ExpoView` (Android). Consume via `requireNativeViewManager`.

## Type Mappings

| TypeScript | Swift | Kotlin |
|-----------|-------|--------|
| `number` | `Double` | `Double` |
| `string` | `String` | `String` |
| `boolean` | `Bool` | `Boolean` |
| `Record<string, any>` | `[String: Any]` | `Map<String, Any>` |
| `Uint8Array` | `Data` | `ByteArray` |

## Development

```bash
npx create-expo-module my-module    # scaffold
npx expo prebuild --clean           # rebuild after native changes
npx expo run:ios / run:android      # test
```

## Common Pitfalls

1. **Name mismatch** -- `Name()` must exactly match `requireNativeModule()` string
2. **Missing prebuild** -- native changes need `npx expo prebuild --clean`
3. **Thread safety** -- sync functions block JS thread; keep them fast
4. **Type strictness** -- codegen validates types at build time; mismatches fail the build
