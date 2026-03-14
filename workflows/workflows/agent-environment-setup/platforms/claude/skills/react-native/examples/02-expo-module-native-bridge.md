# Example 02: Custom Expo Module -- Native Haptics Bridge

## Scenario

Create a custom Expo Module that exposes native haptic feedback functionality to React Native, with platform-specific Swift and Kotlin implementations and a type-safe TypeScript API.

## Prompt

> Build an Expo Module called ExpoHaptics that provides a `triggerImpact(style)` function accepting 'light', 'medium', or 'heavy'. Implement the Swift code for iOS using UIImpactFeedbackGenerator and the Kotlin code for Android using VibrationEffect. Provide TypeScript bindings and show usage in a component.

## Expected Output

### Module Definition: `modules/expo-haptics/index.ts`

```typescript
import ExpoHapticsModule from './src/ExpoHapticsModule';

export type ImpactStyle = 'light' | 'medium' | 'heavy';

export function triggerImpact(style: ImpactStyle): void {
  return ExpoHapticsModule.triggerImpact(style);
}
```

### Module Registration: `modules/expo-haptics/src/ExpoHapticsModule.ts`

```typescript
import { requireNativeModule } from 'expo-modules-core';

type ExpoHapticsModuleType = {
  triggerImpact(style: string): void;
};

export default requireNativeModule<ExpoHapticsModuleType>('ExpoHaptics');
```

### Expo Module Definition: `modules/expo-haptics/src/ExpoHapticsModule.swift`

```swift
import ExpoModulesCore
import UIKit

public class ExpoHapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHaptics")

    Function("triggerImpact") { (style: String) in
      let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle

      switch style {
      case "light":
        feedbackStyle = .light
      case "medium":
        feedbackStyle = .medium
      case "heavy":
        feedbackStyle = .heavy
      default:
        feedbackStyle = .medium
      }

      let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
      generator.prepare()
      generator.impactOccurred()
    }
  }
}
```

### Expo Module Definition: `modules/expo-haptics/src/ExpoHapticsModule.kt`

```kotlin
package expo.modules.haptics

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoHapticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoHaptics")

    Function("triggerImpact") { style: String ->
      val context = appContext.reactContext ?: return@Function
      val vibrator = getVibrator(context)

      val (duration, amplitude) = when (style) {
        "light" -> 20L to 40
        "medium" -> 40L to 120
        "heavy" -> 60L to 255
        else -> 40L to 120
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(
          VibrationEffect.createOneShot(duration, amplitude)
        )
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(duration)
      }
    }
  }

  private fun getVibrator(context: Context): Vibrator {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      manager.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }
}
```

### `expo-module.config.json`

```json
{
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["ExpoHapticsModule"]
  },
  "android": {
    "modules": ["expo.modules.haptics.ExpoHapticsModule"]
  }
}
```

### Usage in a Component: `app/haptics-demo.tsx`

```tsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { triggerImpact, type ImpactStyle } from '../../modules/expo-haptics';

const STYLES: ImpactStyle[] = ['light', 'medium', 'heavy'];

export default function HapticsDemoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Haptic Feedback Demo</Text>
      {STYLES.map((style) => (
        <Pressable
          key={style}
          style={styles.button}
          onPress={() => triggerImpact(style)}
        >
          <Text style={styles.buttonText}>
            {style.charAt(0).toUpperCase() + style.slice(1)} Impact
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

## Key Patterns Demonstrated

1. **Expo Modules API** -- The `Module` base class and `ModuleDefinition` DSL provide a unified way to define native functions that work with TurboModules on both platforms.

2. **`Function` registration** -- Each function is registered by name and receives typed parameters. Expo handles the JS-to-native marshalling via codegen.

3. **iOS `UIImpactFeedbackGenerator`** -- The generator must be `prepare()`d before `impactOccurred()` to minimize latency. The feedback style maps to physical actuator intensity.

4. **Android API-level guards** -- `VibrationEffect` requires API 26+. The `VibratorManager` service requires API 31+. Both fallback paths are handled to support older devices.

5. **TypeScript facade** -- The `index.ts` re-exports a typed function, hiding the `requireNativeModule` plumbing from consumers. The union type `ImpactStyle` provides autocomplete and compile-time safety.

6. **`expo-module.config.json`** -- This file tells Expo's autolinking which native classes to register on each platform, eliminating manual `MainApplication.java` or `AppDelegate.swift` edits.
