# Example 01: Expo Router Navigation with Deep Linking

## Scenario

Build a React Native app with tab, stack, and drawer navigation using Expo Router. Configure deep linking so that external URLs route to the correct screen, including cold-start scenarios.

## Prompt

> Set up an Expo Router app with Home (tabs: Feed and Search), Product Detail (stack, dynamic [id] param), and a Settings drawer. Configure deep linking with the scheme `shopapp://` so that `shopapp://product/42` opens the product screen. Handle deep links on cold start.

## Expected Output

### `app.json` (partial)

```json
{
  "expo": {
    "scheme": "shopapp",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### `app/_layout.tsx`

```tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  useEffect(() => {
    // Handle deep link that launched the app from killed state
    async function handleInitialURL() {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('Cold-start deep link:', url);
        // Expo Router handles navigation automatically from the URL
      }
    }
    handleInitialURL();

    // Handle deep links while app is foregrounded
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Foreground deep link:', url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="product/[id]"
        options={{ headerShown: true, title: 'Product' }}
      />
      <Stack.Screen
        name="(settings)"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
```

### `app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0a7ea4' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### `app/(tabs)/index.tsx`

```tsx
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const PRODUCTS = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
}));

export default function FeedScreen() {
  return (
    <FlatList
      data={PRODUCTS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Link href={`/product/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardText}>{item.name}</Text>
          </Pressable>
        </Link>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  cardText: { fontSize: 16 },
});
```

### `app/product/[id].tsx`

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

type ProductParams = {
  id: string;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<ProductParams>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product #{id}</Text>
      <Text style={styles.body}>
        This screen is reachable via tab navigation or the deep link:
        shopapp://product/{id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  body: { fontSize: 16, color: '#666' },
});
```

## Key Patterns Demonstrated

1. **File-based routing** -- Expo Router derives the navigation tree from the `app/` directory structure. No manual `createStackNavigator` or `createBottomTabNavigator` calls needed.

2. **Typed route params** -- `useLocalSearchParams<ProductParams>()` provides compile-time type safety for dynamic segments. The `typedRoutes` experiment enables this globally.

3. **Deep link scheme** -- Setting `"scheme": "shopapp"` in `app.json` registers the URL protocol with both iOS and Android. Expo Router automatically maps `shopapp://product/42` to `app/product/[id].tsx`.

4. **Cold-start handling** -- `Linking.getInitialURL()` retrieves the URL that launched the app from a killed state. Expo Router processes this automatically, but the explicit check allows logging and analytics.

5. **Layout nesting** -- The `(tabs)` group layout wraps tab screens without adding a URL segment. The root stack can push `product/[id]` on top of the tabs.
