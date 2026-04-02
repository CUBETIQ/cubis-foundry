# Example: EAS Build with Custom Native Config and OTA Updates

## Scenario

A team is building a health tracking app with Expo SDK 52 that requires a custom native module for Bluetooth Low Energy (BLE) communication with fitness devices. The app needs a config plugin to modify native project settings, development builds with custom native code, OTA updates with channel-based targeting, and push notifications for workout reminders. The team wants to avoid ejecting from the managed workflow.

## Prompt

"Configure our Expo health tracking app with: (1) a config plugin for BLE permissions and background modes, (2) EAS Build with custom native module support, (3) OTA updates with separate channels for staging and production with rollback capability, (4) push notifications with token registration and background handling."

## Expected Output

### Config Plugin for BLE Permissions

```typescript
// plugins/withBlePermissions.ts
import { ConfigPlugin, withInfoPlist, withAndroidManifest } from 'expo/config-plugins';

const withBlePermissions: ConfigPlugin = (config) => {
  // iOS: Add Bluetooth usage descriptions and background modes
  config = withInfoPlist(config, (config) => {
    config.modResults.NSBluetoothAlwaysUsageDescription =
      'This app uses Bluetooth to connect to your fitness tracker.';
    config.modResults.NSBluetoothPeripheralUsageDescription =
      'This app uses Bluetooth to communicate with fitness devices.';

    // Enable background BLE
    const backgroundModes = config.modResults.UIBackgroundModes ?? [];
    if (!backgroundModes.includes('bluetooth-central')) {
      backgroundModes.push('bluetooth-central');
    }
    config.modResults.UIBackgroundModes = backgroundModes;

    return config;
  });

  // Android: Add BLE permissions
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest;
    const permissions = mainApplication['uses-permission'] ?? [];

    const blePermissions = [
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_FINE_LOCATION',
    ];

    for (const perm of blePermissions) {
      if (!permissions.some((p) => p.$?.['android:name'] === perm)) {
        permissions.push({ $: { 'android:name': perm } });
      }
    }

    mainApplication['uses-permission'] = permissions;
    return config;
  });

  return config;
};

export default withBlePermissions;
```

### App Config with Plugins and OTA

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HealthTrack',
  slug: 'healthtrack',
  version: '1.2.0',
  runtimeVersion: {
    policy: 'fingerprint',
  },
  updates: {
    url: 'https://u.expo.dev/your-project-id',
    fallbackToCacheTimeout: 5000,
    checkAutomatically: 'ON_LOAD',
  },
  ios: {
    bundleIdentifier: 'com.example.healthtrack',
    infoPlist: {
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
  },
  android: {
    package: 'com.example.healthtrack',
    permissions: ['RECEIVE_BOOT_COMPLETED'],
  },
  plugins: [
    './plugins/withBlePermissions',
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: { deploymentTarget: '15.0' },
        android: { minSdkVersion: 26, compileSdkVersion: 34 },
      },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL,
    eas: { projectId: 'your-project-id' },
  },
});
```

### EAS Build with Native Module Support

```json
// eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "env": { "API_URL": "http://localhost:3000" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "staging",
      "env": { "API_URL": "https://staging-api.example.com" },
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": { "API_URL": "https://api.example.com" },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

### OTA Update Manager

```typescript
// lib/update-manager.ts
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

export async function checkForUpdates(): Promise<void> {
  if (__DEV__) return; // Skip in development

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        Alert.alert(
          'Update Available',
          'A new version has been downloaded. Restart to apply?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart',
              onPress: () => Updates.reloadAsync(),
            },
          ]
        );
      }
    }
  } catch (error) {
    // Log but do not crash -- OTA failures should be silent
    console.warn('OTA update check failed:', error);
  }
}

export function useUpdateMonitor() {
  Updates.useUpdateEvents((event) => {
    if (event.type === Updates.UpdateEventType.ERROR) {
      console.warn('OTA update error:', event.message);
    }
    if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      console.log('App is up to date');
    }
    if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      console.log('New update available, downloading...');
    }
  });
}

export async function getCurrentUpdateInfo() {
  return {
    updateId: Updates.updateId,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    createdAt: Updates.createdAt,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
```

### Push Notification Service

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('health-alerts', {
      name: 'Health Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alert.wav',
    });
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  // Register token with backend
  await apiFetch('/api/push-tokens', {
    method: 'POST',
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName,
    }),
  });

  return token;
}
```

### Background Notification Handler

```typescript
// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '@/lib/notifications';
import { checkForUpdates, useUpdateMonitor } from '@/lib/update-manager';

export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useUpdateMonitor();

  useEffect(() => {
    registerForPushNotifications();
    checkForUpdates();

    // Handle notifications received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification.request.content);
      });

    // Handle notification taps (deep linking)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'workout') {
          router.push(`/workout/${data.workoutId}`);
        } else if (data?.screen === 'health-alert') {
          router.push('/health/alerts');
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
      <Stack.Screen name="health/alerts" options={{ title: 'Health Alerts' }} />
    </Stack>
  );
}
```

### OTA Deployment Commands

```bash
# Publish OTA update to staging channel
eas update --channel staging --message "Fix BLE connection timeout"

# Publish OTA update to production channel
eas update --channel production --message "v1.2.1 hotfix: heart rate sync"

# Check update status and adoption
eas update:list --channel production --limit 5

# Roll back by republishing a previous update
eas update:republish --group <previous-update-group-id> --channel production

# Build new native binary when fingerprint changes
eas build --profile production --platform all
```

## Key Decisions

- **Config plugin over bare ejection** -- the BLE permissions plugin modifies native projects at build time, keeping the project in managed workflow and preserving SDK upgrade compatibility.
- **`fingerprint` runtime version policy** -- automatically detects when native code changes require a new binary build vs when an OTA update is safe, preventing crashes from native/JS mismatches.
- **Channel-based OTA deployment** -- staging and production channels allow testing OTA updates on preview builds before promoting to production, with rollback via `update:republish`.
- **expo-notifications with platform-specific channels** -- Android notification channels allow users to customize alert behavior per category, and the setup runs once at registration time.
- **Background notification deep linking** -- notification tap responses route to specific screens using expo-router, providing seamless navigation from notification to content.
