# Over-the-Air Updates

Load this when setting up expo-updates channels, configuring runtime versioning, or managing update rollouts and rollbacks.

## How OTA Updates Work

OTA updates deliver JavaScript bundle and asset changes to users without requiring a new app store submission. The `expo-updates` library checks for updates at launch, downloads new bundles in the background, and applies them on the next app restart.

Key constraint: OTA updates can only change JavaScript and assets. Changes to native code (new native modules, permission changes, SDK upgrades) require a new binary build through EAS Build.

## Configuration

### app.config.ts Setup

```typescript
export default {
  updates: {
    url: 'https://u.expo.dev/your-project-id',
    fallbackToCacheTimeout: 5000,     // ms to wait for update before using cache
    checkAutomatically: 'ON_LOAD',    // or 'ON_ERROR_RECOVERY', 'WIFI_ONLY'
    enabled: true,
  },
  runtimeVersion: {
    policy: 'fingerprint',  // or 'appVersion', 'nativeVersion', or a fixed string
  },
};
```

### Runtime Version Policies

| Policy | Behavior | Use When |
|--------|----------|----------|
| `fingerprint` | Hash of native project files. Changes when native code changes. | Recommended for most apps. Automatically detects native changes. |
| `appVersion` | Uses the `version` field from app config. | Simple apps where version bumps always coincide with native changes. |
| `nativeVersion` | Uses `ios.buildNumber` / `android.versionCode`. | When you manually track native compatibility. |
| Fixed string | e.g., `"1.0.0"`. Manual control. | When you want explicit control over compatibility windows. |

- `fingerprint` is the safest default. It prevents OTA updates from targeting binaries with incompatible native code.
- If you use a fixed string, you must update it manually whenever native code changes, or users will crash on launch.

## Channels and Branching

Channels map EAS Build profiles to update streams. A build on the `production` channel only receives updates published to `production`.

```bash
# Publish to staging channel
eas update --channel staging --message "Fix login timeout"

# Publish to production channel
eas update --channel production --message "v2.1.1 hotfix"

# Publish from a specific branch
eas update --branch staging --message "Feature flag for new checkout"
```

### Channel vs Branch

- **Channel**: assigned to a build profile in `eas.json`. Determines which updates a binary can receive.
- **Branch**: a named stream of updates. Channels point to branches. By default, a channel points to a branch with the same name.

```bash
# Point the production channel to a specific branch
eas channel:edit production --branch release-2.1

# Roll back by pointing to the previous branch
eas channel:edit production --branch release-2.0
```

This enables instant rollback without publishing a new update.

## Update Lifecycle in Code

### Checking for Updates

```typescript
import * as Updates from 'expo-updates';

async function checkAndApply() {
  if (__DEV__) return;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    const fetch = await Updates.fetchUpdateAsync();
    if (fetch.isNew) {
      // Option 1: Apply immediately
      await Updates.reloadAsync();

      // Option 2: Apply on next cold start (default behavior)
      // Do nothing -- the update is cached and will load next time.
    }
  } catch (error) {
    console.warn('Update check failed:', error);
  }
}
```

### Listening to Update Events

```typescript
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    const subscription = Updates.addListener((event) => {
      switch (event.type) {
        case Updates.UpdateEventType.UPDATE_AVAILABLE:
          // New update downloaded and ready
          break;
        case Updates.UpdateEventType.NO_UPDATE_AVAILABLE:
          // Already on latest
          break;
        case Updates.UpdateEventType.ERROR:
          // Update check or download failed
          console.warn('Update error:', event.message);
          break;
      }
    });

    return () => subscription.remove();
  }, []);
}
```

### Querying Current Update Info

```typescript
const info = {
  updateId: Updates.updateId,        // ID of the running update
  channel: Updates.channel,          // Channel this build is on
  createdAt: Updates.createdAt,      // When the update was published
  isEmbeddedLaunch: Updates.isEmbeddedLaunch, // true if using built-in bundle
  runtimeVersion: Updates.runtimeVersion,
};
```

## Rollback Strategies

### Republish a Previous Update

```bash
# List recent updates
eas update:list --channel production --limit 10

# Republish a known-good update group
eas update:republish --group <update-group-id> --channel production
```

### Channel Switching

```bash
# Point production channel to a previous release branch
eas channel:edit production --branch release-2.0

# After fix, point back to the current branch
eas channel:edit production --branch release-2.1
```

### Emergency: Force New Binary

If an OTA update causes a native crash or update loop:

1. Publish a fix via `eas update` (if JS-only fix is possible).
2. If the app cannot load updates, build and submit a new binary with `eas build`.
3. Use `fallbackToCacheTimeout: 0` in the new binary to skip network checks on launch.

## Monitoring Update Adoption

```bash
# View update details and download counts
eas update:view <update-group-id>

# List all updates for a channel
eas update:list --channel production
```

In code, report the running update ID to your analytics or error tracking service:

```typescript
import * as Updates from 'expo-updates';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: '...',
  release: Updates.updateId ?? 'embedded',
});
```

- Track the percentage of users on each update to determine when it is safe to stop supporting older versions.
- Monitor crash rates by update ID to detect regressions introduced by specific OTA updates.

## Best Practices

- Always test OTA updates on the `staging` channel before promoting to `production`.
- Use `fingerprint` runtime version to prevent JS/native mismatches automatically.
- Set `fallbackToCacheTimeout` to 3000-5000ms so the app loads quickly even if the update server is slow.
- Never ship OTA updates that depend on native changes. The update will crash on binaries without those changes.
- Include the update ID in error reports so you can correlate crashes with specific updates.
