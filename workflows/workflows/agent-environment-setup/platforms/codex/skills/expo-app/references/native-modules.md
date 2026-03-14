# Native Modules

Load this when adding config plugins, using the Expo Modules API, or integrating third-party native code.

## Config Plugins

Config plugins modify native iOS and Android project files at build time without ejecting from the managed workflow.

### Writing a Config Plugin

```typescript
// plugins/withCustomScheme.ts
import { ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

const withCustomScheme: ConfigPlugin<{ scheme: string }> = (config, { scheme }) => {
  return withInfoPlist(config, (config) => {
    const schemes = config.modResults.CFBundleURLTypes ?? [];
    schemes.push({
      CFBundleURLSchemes: [scheme],
    });
    config.modResults.CFBundleURLTypes = schemes;
    return config;
  });
};

export default withCustomScheme;
```

Register in `app.config.ts`:

```typescript
plugins: [
  ['./plugins/withCustomScheme', { scheme: 'myapp' }],
],
```

### Available Mod Functions

| Function | Platform | Modifies |
|----------|----------|----------|
| `withInfoPlist` | iOS | Info.plist values |
| `withEntitlementsPlist` | iOS | Entitlements (capabilities) |
| `withXcodeProject` | iOS | Xcode project configuration |
| `withPodfileProperties` | iOS | CocoaPods settings |
| `withAndroidManifest` | Android | AndroidManifest.xml |
| `withMainActivity` | Android | MainActivity code |
| `withMainApplication` | Android | MainApplication code |
| `withAppBuildGradle` | Android | app/build.gradle |
| `withProjectBuildGradle` | Android | project build.gradle |
| `withStringsXml` | Android | strings.xml resources |

### iOS Entitlements Example

```typescript
import { ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

const withApplePay: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.in-app-payments'] = ['merchant.com.example'];
    return config;
  });
};
```

### Android Manifest Example

```typescript
import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

const withForegroundService: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApp = config.modResults.manifest.application?.[0];
    if (mainApp) {
      mainApp.service = mainApp.service ?? [];
      mainApp.service.push({
        $: {
          'android:name': '.LocationService',
          'android:foregroundServiceType': 'location',
        },
      });
    }
    return config;
  });
};
```

## Expo Modules API

The Expo Modules API provides a unified Swift/Kotlin API for writing custom native modules with automatic TypeScript type generation.

### Module Definition (TypeScript Interface)

```typescript
// modules/health-sensor/src/HealthSensorModule.ts
import { requireNativeModule } from 'expo-modules-core';

export type SensorReading = {
  heartRate: number;
  timestamp: number;
  confidence: number;
};

type HealthSensorModuleType = {
  startMonitoring(): Promise<void>;
  stopMonitoring(): void;
  getLatestReading(): Promise<SensorReading>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
};

export default requireNativeModule<HealthSensorModuleType>('HealthSensor');
```

### Swift Implementation (iOS)

```swift
// modules/health-sensor/ios/HealthSensorModule.swift
import ExpoModulesCore
import HealthKit

public class HealthSensorModule: Module {
  private let healthStore = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("HealthSensor")

    Events("onReading")

    AsyncFunction("startMonitoring") {
      // Request HealthKit authorization and start queries
      let types: Set<HKSampleType> = [
        HKQuantityType(.heartRate),
      ]
      try await healthStore.requestAuthorization(
        toShare: [], read: types
      )
    }

    Function("stopMonitoring") {
      // Stop active queries
    }

    AsyncFunction("getLatestReading") { () -> [String: Any] in
      // Query latest heart rate sample
      return [
        "heartRate": 72,
        "timestamp": Date().timeIntervalSince1970,
        "confidence": 0.95,
      ]
    }
  }
}
```

### Kotlin Implementation (Android)

```kotlin
// modules/health-sensor/android/src/main/java/expo/modules/healthsensor/HealthSensorModule.kt
package expo.modules.healthsensor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HealthSensorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HealthSensor")

    Events("onReading")

    AsyncFunction("startMonitoring") {
      // Initialize sensor listener
    }

    Function("stopMonitoring") {
      // Remove sensor listener
    }

    AsyncFunction("getLatestReading") {
      mapOf(
        "heartRate" to 72,
        "timestamp" to System.currentTimeMillis() / 1000.0,
        "confidence" to 0.95
      )
    }
  }
}
```

### Module Configuration

```json
// modules/health-sensor/expo-module.config.json
{
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["HealthSensorModule"]
  },
  "android": {
    "modules": ["expo.modules.healthsensor.HealthSensorModule"]
  }
}
```

## Third-Party Native Libraries

### Using Libraries with Config Plugins

Many popular libraries ship their own config plugins:

```typescript
// app.config.ts
plugins: [
  'expo-camera',
  'expo-location',
  ['expo-media-library', { photosPermission: 'Allow access to save photos.' }],
  ['react-native-ble-plx', { isBackgroundEnabled: true }],
],
```

### Libraries Without Config Plugins

For libraries that modify native projects but lack a config plugin, write a custom plugin:

```typescript
// plugins/withCustomNativeLib.ts
import { ConfigPlugin, withAppBuildGradle } from 'expo/config-plugins';

const withCustomNativeLib: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('customNativeLib')) {
      config.modResults.contents = config.modResults.contents.replace(
        'dependencies {',
        `dependencies {\n    implementation 'com.example:custom-native-lib:1.0.0'`
      );
    }
    return config;
  });
};
```

## When to Eject

Config plugins and Expo Modules API cover the majority of native integration needs. Consider bare workflow (CNG with prebuild) only when:

- You need to modify native code that no config plugin API can reach.
- A native SDK requires manual Xcode or Gradle project changes that cannot be automated.
- You are integrating a large brownfield native codebase.

Even then, prefer `npx expo prebuild --clean` (Continuous Native Generation) over a permanent eject, so you retain the ability to regenerate native projects on SDK upgrades.
