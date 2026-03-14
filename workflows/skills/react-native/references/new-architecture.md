# React Native New Architecture Reference

## Key Components

- **Fabric** -- New renderer with C++ core, synchronous layout, concurrent rendering support
- **TurboModules** -- Lazy-loaded, type-safe native modules with synchronous call support
- **Codegen** -- Generates type-safe native interfaces from TypeScript/Flow specs

## Enabling (Expo)

```json
{
  "expo": {
    "newArchEnabled": true,
    "plugins": [["expo-build-properties", {
      "ios": { "newArchEnabled": true },
      "android": { "newArchEnabled": true }
    }]]
  }
}
```

Bare RN: set `RCT_NEW_ARCH_ENABLED=1` in Podfile, `newArchEnabled=true` in gradle.properties.

## TurboModule Spec

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  add(a: number, b: number): number;
  fetchData(url: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCalculator');
```

### Supported Types

| TypeScript | iOS (ObjC++) | Android (Java) |
|-----------|-------------|----------------|
| `number` | `double` | `double` |
| `string` | `NSString *` | `String` |
| `boolean` | `BOOL` | `boolean` |
| `Object` | `NSDictionary *` | `ReadableMap` |
| `Array` | `NSArray *` | `ReadableArray` |
| `Promise<T>` | Callback-based | `Promise` |

## Fabric Component Spec

```typescript
import type { ViewProps } from 'react-native';
import type { Float, DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

interface NativeProps extends ViewProps {
  title: string;
  opacity?: Float;
  onChange?: DirectEventHandler<Readonly<{ value: string }>>;
}

export default codegenNativeComponent<NativeProps>('CustomView');
```

## Running Codegen

```bash
npx react-native codegen    # bare RN
npx expo prebuild --clean    # Expo
```

## Performance Comparison

| Metric | Legacy Bridge | New Architecture |
|--------|--------------|-----------------|
| Startup (50 modules) | ~800ms | ~200ms (lazy) |
| JS-Native call | ~5ms (async) | ~0.1ms (sync) |
| Layout measurement | Async round-trip | Synchronous |
| Concurrent rendering | Not supported | Supported |

## Interop Layer

RN 0.76+ includes a compatibility shim that wraps legacy modules/views as TurboModules/Fabric components automatically. This is a migration aid, not a long-term solution.

## Migration Steps

1. Enable New Architecture in config
2. Migrate Native Modules to TurboModule specs with codegen
3. Migrate Native Views to Fabric component specs
4. Test thoroughly -- run `adb logcat | grep "Bridge"` to verify no bridge usage

## Common Pitfalls

1. **Library compatibility** -- check reactnative.directory for New Architecture support tags
2. **Codegen cache** -- run `npx expo prebuild --clean` when specs change
3. **Synchronous limits** -- only use sync TurboModule methods for fast computations
4. **iOS minimum** -- Fabric requires iOS 13.4+
