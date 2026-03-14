# EAS Build Configuration

Load this when configuring EAS Build profiles, signing credentials, environment variables, or build resource allocation.

## Build Profiles

### eas.json Structure

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": { },
    "preview": { },
    "production": { }
  },
  "submit": { }
}
```

### Development Profile

Use for local development with expo-dev-client. Produces a debug build with developer tools.

```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "ios": {
      "simulator": true
    },
    "env": {
      "API_URL": "http://localhost:3000"
    }
  }
}
```

- `developmentClient: true` includes expo-dev-client for fast refresh with custom native code.
- `simulator: true` builds for iOS Simulator only (faster, no signing required).
- Set `simulator: false` to build for physical devices (requires Apple Developer account).

### Preview Profile

Use for internal QA distribution. Produces a release build distributed via ad hoc or internal.

```json
{
  "preview": {
    "distribution": "internal",
    "channel": "staging",
    "env": {
      "API_URL": "https://staging-api.example.com"
    },
    "ios": {
      "resourceClass": "m-medium"
    },
    "android": {
      "buildType": "apk"
    }
  }
}
```

- `distribution: "internal"` uses ad hoc provisioning on iOS and produces an installable APK or AAB on Android.
- `buildType: "apk"` produces an APK for direct installation. Use `"app-bundle"` for Play Store submission.

### Production Profile

```json
{
  "production": {
    "autoIncrement": true,
    "channel": "production",
    "env": {
      "API_URL": "https://api.example.com"
    }
  }
}
```

- `autoIncrement: true` increments the build number on each build. Works with `appVersionSource: "remote"`.

## Signing Credentials

### iOS Signing

EAS manages iOS credentials automatically by default.

```bash
# Let EAS manage credentials (recommended)
eas build --platform ios

# Use local credentials
eas credentials --platform ios
```

- EAS creates and manages provisioning profiles and distribution certificates.
- For enterprise distribution, configure the Apple Developer Enterprise Program team ID.
- Ad hoc builds register device UDIDs automatically when testers install via the EAS build page.

### Android Signing

```bash
# Generate a new keystore (first build)
eas build --platform android
# EAS will prompt to generate a keystore if none exists

# Use an existing keystore
eas credentials --platform android
```

- EAS stores the keystore securely. Download a backup with `eas credentials`.
- Never lose the production keystore. Android requires the same keystore for all updates to a published app.

## Environment Variables

### Build-Time Variables

Variables defined in `eas.json` `env` are available during the build process and in `app.config.ts`.

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.example.com",
        "SENTRY_DSN": "https://xxxx@sentry.io/123"
      }
    }
  }
}
```

### EAS Secrets

For sensitive values that should not be in source control.

```bash
# Set a secret
eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value pk_live_xxx

# List secrets
eas secret:list

# Delete a secret
eas secret:delete --name STRIPE_PUBLISHABLE_KEY
```

- Secrets are available as environment variables during EAS Build.
- Secrets override `env` values in `eas.json` if both exist with the same name.
- Use `--scope account` for secrets shared across all projects in your EAS account.

## Build Resource Classes

Control build machine performance for faster builds.

| Class | CPU | RAM | Use Case |
|-------|-----|-----|----------|
| `default` | 2 vCPU | 8 GB | Standard builds |
| `m-medium` | 4 vCPU | 16 GB | Large apps, heavy native deps |
| `m-large` | 8 vCPU | 32 GB | Monorepos, very large native builds |

```json
{
  "production": {
    "ios": { "resourceClass": "m-medium" },
    "android": { "resourceClass": "m-medium" }
  }
}
```

## Custom Build Steps

### Pre-install and Post-install Hooks

```json
{
  "production": {
    "ios": {
      "image": "macos-ventura-14.2-xcode-15.1",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Monorepo Configuration

```json
{
  "build": {
    "production": {
      "node": "20.11.0",
      "pnpm": "8.15.0"
    }
  }
}
```

- Set explicit Node.js and package manager versions for reproducible builds.
- For monorepos, ensure the EAS Build can resolve workspace dependencies from the project root.

## Version Management

```bash
# Use remote version source (EAS manages version numbers)
# In eas.json: "appVersionSource": "remote"

# Set the version manually
eas build:version:set --platform ios --build-number 42
eas build:version:set --platform android --version-code 42

# Get current version
eas build:version:get --platform ios
```

- `appVersionSource: "remote"` stores version numbers on EAS servers. `autoIncrement: true` bumps them each build.
- The `version` field in `app.config.ts` is the user-facing version (1.2.0). The build number is the internal number incremented per build.
