# Example: Basic Expo Managed App with EAS Build

## Scenario

A team is starting a new mobile app for a restaurant ordering platform using Expo SDK 52. They need a managed workflow project with file-based routing via expo-router, EAS Build profiles for development and production, and environment variable configuration for API endpoints. The app should work on both iOS and Android from a single codebase.

## Prompt

"Set up a new Expo SDK 52 project with expo-router for navigation, three EAS Build profiles (development, preview, production), and environment variables for different API endpoints per environment."

## Expected Output

### Project Initialization

```bash
# Create new Expo project with the latest SDK template
npx create-expo-app@latest restaurant-app --template tabs

cd restaurant-app

# Install core dependencies
npx expo install expo-router expo-dev-client expo-constants
npx expo install expo-image expo-secure-store
```

### App Configuration

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Restaurant App',
  slug: 'restaurant-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'restaurant-app',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.restaurantapp',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.example.restaurantapp',
  },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3000',
    eas: {
      projectId: 'your-project-id',
    },
  },
});
```

### EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "API_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "API_URL": "https://staging-api.example.com"
      },
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "API_URL": "https://api.example.com"
      },
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### File-Based Routing with expo-router

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/[id]" options={{ title: 'Restaurant' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal', title: 'Cart' }} />
      </Stack>
    </>
  );
}
```

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#e65100' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

```typescript
// app/(tabs)/index.tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function HomeScreen() {
  const { data: restaurants, isLoading } = useRestaurants();

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={restaurants}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Link href={`/restaurant/${item.id}`} asChild>
          <Pressable style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              placeholder={{ blurhash: item.blurhash }}
              transition={200}
            />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#666' }}>{item.cuisine} - {item.deliveryTime} min</Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}
```

### Environment-Aware API Client

```typescript
// lib/api.ts
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

### Build Commands

```bash
# Create a development build for iOS simulator
eas build --profile development --platform ios

# Create a preview build for internal testing
eas build --profile preview --platform all

# Create a production build and submit to stores
eas build --profile production --platform all
eas submit --profile production --platform all
```

## Key Decisions

- **Managed workflow with expo-dev-client** -- provides Expo Go-like fast refresh while supporting custom native code through config plugins when needed.
- **File-based routing with expo-router** -- maps file paths to routes automatically, provides type-safe navigation, and handles deep linking with minimal configuration.
- **Environment variables in eas.json** -- each build profile injects the correct API URL at build time, keeping secrets out of source control.
- **expo-image over React Native Image** -- provides blur hash placeholders, efficient caching, AVIF/WebP support, and smooth transitions out of the box.
- **Three build profiles** -- development (local testing with simulator), preview (internal distribution for QA), and production (store submission) cover the full release pipeline.
