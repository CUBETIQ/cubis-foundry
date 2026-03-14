# React Native Performance Reference

## Hermes Engine

Enabled by default in Expo SDK 52+. Provides bytecode precompilation (30-50% faster cold start), optimized GC, and smaller memory footprint.

```json
{ "expo": { "jsEngine": "hermes" } }
```

Verify: `const isHermes = () => !!global.HermesInternal;`

## List Performance

### FlashList (Recommended)

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>
```

| Feature | FlatList | FlashList |
|---------|----------|-----------|
| Cell recycling | No | Yes |
| Blank areas on fast scroll | Common | Rare |
| Memory usage | Higher | Lower |

### FlatList Optimization

```tsx
<FlatList
  data={items} renderItem={renderItem} keyExtractor={item => item.id}
  getItemLayout={(_, i) => ({ length: 80, offset: 80 * i, index: i })}
  maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews
/>
```

## Rendering Optimization

**React.memo:** Prevent re-renders for pure components.

```tsx
const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  return <View><Text>{product.name}</Text></View>;
});
```

**useMemo / useCallback:** Stabilize references passed as props.

```tsx
const filtered = useMemo(() => items.filter(i => i.name.includes(query)), [items, query]);
const onSelect = useCallback((id: string) => router.push(`/product/${id}`), []);
```

**Avoid inline objects/functions in render:**

```tsx
// BAD: <View style={{ flex: 1 }}>   GOOD: <View style={styles.container}>
// BAD: onPress={() => fn(id)}        GOOD: onPress={memoizedCallback}
```

## Image Optimization

```tsx
import { Image } from 'expo-image';
<Image source={{ uri: url }} style={{ width: 200, height: 200 }}
  contentFit="cover" placeholder={{ blurhash: 'L6PZfS...' }}
  transition={200} cachePolicy="memory-disk" />
```

Use WebP format (25-34% smaller). Serve at correct resolution via `PixelRatio.get()`.

## Bundle Size

```bash
npx react-native-bundle-visualizer          # analyze
npx expo export --dump-sourcemap             # Expo
```

Reduce: enable Hermes, lazy-load screens (Expo Router does this by default), tree-shake imports (`import debounce from 'lodash/debounce'` not `import _ from 'lodash'`).

## Animation Performance

```tsx
// Native driver (transform + opacity only)
Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
```

Use Reanimated for gesture-driven animations (runs on UI thread). Never animate `width`/`height`/`margin` -- use `transform: [{ translateX }]` instead.

## Profiling Tools

- **React DevTools Profiler:** identify components rendering >16ms
- **Flipper:** network, DB inspection, component profiling
- **Hermes profiler:** `npx react-native profile-hermes`, view in `chrome://tracing`
- **Fabric overlay:** built-in FPS monitor in dev builds

## Startup Optimization

| Technique | Impact | Effort |
|-----------|--------|--------|
| Enable Hermes | 30-50% faster cold start | Low |
| Lazy-load screens | 10-30% faster TTI | Low |
| Reduce `initialNumToRender` | Faster first frame | Low |
| Native splash screen | Hides init lag | Low |
| Preload critical data | Perceived speed | Medium |

## Common Pitfalls

1. **Anonymous functions in render** -- use `useCallback` for memoized children
2. **Inline styles** -- use `StyleSheet.create` for stable references
3. **Unoptimized images** -- serve at device resolution, use caching, prefer WebP
4. **Missing list optimization** -- always provide `keyExtractor`; use FlashList for 50+ items
