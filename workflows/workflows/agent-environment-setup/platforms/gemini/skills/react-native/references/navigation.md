# React Native Navigation Reference (Expo Router)

## File-Based Routing

```
app/
  _layout.tsx          # Root navigator
  index.tsx            # / (home)
  (tabs)/_layout.tsx   # Tab navigator
  (tabs)/index.tsx     # Tab: Home
  (tabs)/search.tsx    # Tab: Search
  product/[id].tsx     # /product/:id (dynamic)
  (auth)/login.tsx     # /login (grouped layout)
  settings/[...rest].tsx  # /settings/* (catch-all)
  +not-found.tsx       # 404 handler
```

## Layout Navigators

**Stack:**
```tsx
import { Stack } from 'expo-router';
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

**Tabs:**
```tsx
import { Tabs } from 'expo-router';
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0a7ea4' }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
    </Tabs>
  );
}
```

## Dynamic Parameters

```tsx
import { useLocalSearchParams } from 'expo-router';
type Params = { id: string };
const { id } = useLocalSearchParams<Params>();
```

All params are `string | string[]` -- parse numbers explicitly.

## Navigation API

```tsx
import { router, Link } from 'expo-router';
router.push('/product/42');
router.replace('/login');
router.back();
router.navigate('/home');     // resets stack if needed
router.dismiss();             // dismiss modal
```

```tsx
<Link href={`/product/${id}`} asChild>
  <Pressable><Text>View</Text></Pressable>
</Link>
```

## Deep Linking

```json
{ "expo": { "scheme": "myapp" } }
```

```tsx
import * as Linking from 'expo-linking';

useEffect(() => {
  Linking.getInitialURL().then(url => { /* cold start */ });
  const sub = Linking.addEventListener('url', ({ url }) => { /* foreground */ });
  return () => sub.remove();
}, []);
```

Test: `npx uri-scheme open "myapp://product/42" --ios`

For universal links, configure `associatedDomains` (iOS) and `intentFilters` (Android) in `app.json`.

## Auth Guards

```tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Tabs />;
}
```

## Common Pitfalls

1. **Missing `_layout.tsx`** -- every route group needs a layout file
2. **Circular redirects** -- auth guards redirecting within the same group loop infinitely
3. **Universal link verification** -- AASA (iOS) and asset links (Android) must be served from the domain
4. **Param types** -- all search params are strings; parse numbers explicitly
