# Performance Optimization

Load this when profiling render performance, optimizing lists, reducing bridge overhead, or diagnosing frame drops.

## Profiling Tools

### React DevTools Profiler

Measures component render times and identifies unnecessary re-renders.

```bash
# Start the profiler
npx react-devtools
```

- Record a session, then inspect the flamegraph for components that render frequently.
- Look for components that re-render without prop changes (missing memoization).
- Gray bars indicate components that did not render during a commit.

### Flipper Performance Plugin

Measures JS and UI thread frame rates.

- JS thread FPS < 60 indicates expensive JavaScript execution.
- UI thread FPS < 60 indicates heavy native rendering or layout.
- Bridge traffic tab shows message volume between threads.

### Systrace (Android)

```bash
# Capture a systrace while reproducing the issue
npx react-native profile-hermes

# Or use Android systrace directly
python systrace.py --time=10 -o trace.html sched gfx view
```

### Xcode Instruments (iOS)

Use the Time Profiler instrument to identify CPU hotspots and the Core Animation instrument for rendering performance.

## Eliminating Unnecessary Re-renders

### React.memo

```typescript
const ExpensiveRow = React.memo(function ExpensiveRow({ item }: { item: Item }) {
  return (
    <View>
      <Text>{item.title}</Text>
      <ComplexChart data={item.chartData} />
    </View>
  );
});
```

- Wrap components that receive the same props frequently but do not need to re-render.
- Provide a custom comparison function for complex props: `React.memo(Component, areEqual)`.

### useMemo and useCallback

```typescript
function Dashboard({ transactions }: Props) {
  // Memoize expensive computation
  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, t) => ({
        total: acc.total + t.amount,
        count: acc.count + 1,
      }),
      { total: 0, count: 0 }
    );
  }, [transactions]);

  // Stable callback reference for child components
  const onRefresh = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return <TransactionList data={transactions} summary={summary} onRefresh={onRefresh} />;
}
```

- `useMemo` prevents recalculating derived data on every render.
- `useCallback` prevents child components wrapped in `React.memo` from re-rendering due to new function references.

## List Optimization

### FlashList over FlatList

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ItemRow item={item} />}
  estimatedItemSize={80}   // Required: approximate row height in pixels
  keyExtractor={(item) => item.id}
/>
```

- FlashList recycles native views instead of creating new ones, reducing memory allocation.
- `estimatedItemSize` is required and should be close to the average item height for accurate scroll position calculation.
- Up to 5x performance improvement on lists with 1000+ items compared to FlatList.

### FlatList Tuning

If you must use FlatList:

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  removeClippedSubviews={true}      // Detach off-screen views
  maxToRenderPerBatch={10}           // Render 10 items per batch
  windowSize={5}                     // Keep 5 viewports worth of items
  initialNumToRender={10}            // Render 10 items initially
  getItemLayout={(data, index) => ({ // Skip measurement if items are fixed height
    length: 80,
    offset: 80 * index,
    index,
  })}
/>
```

## Image Optimization

```typescript
import { Image } from 'expo-image'; // or FastImage

<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  cachePolicy="memory-disk"
  placeholder={{ blurhash: item.blurhash }}
  transition={200}
  recyclingKey={item.id}
/>
```

- Use `expo-image` or `react-native-fast-image` instead of the built-in `Image` component.
- Serve images at the display size. Loading a 4000x3000 image for a 100x100 thumbnail wastes memory and CPU.
- Use WebP format for 25-35% smaller file sizes compared to JPEG at equivalent quality.

## JavaScript Thread Optimization

### Moving Work Off the JS Thread

```typescript
import { InteractionManager } from 'react-native';

function onNavigationComplete() {
  // Defer expensive work until after the transition animation completes
  InteractionManager.runAfterInteractions(() => {
    loadHeavyData();
    initializeAnalytics();
  });
}
```

### Hermes Engine

Hermes provides faster startup through bytecode precompilation and lower memory usage.

```json
// android/app/build.gradle
project.ext.react = [
    enableHermes: true
]
```

- Hermes is the default engine in React Native 0.70+.
- Hermes reduces startup time by 50-80% on Android through bytecode precompilation.
- Use `hermes-profile-transformer` to convert Hermes sampling profiles into Chrome DevTools format.

## Animation Performance

### Use Reanimated for JS-driven animations

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => { scale.value = withSpring(0.95); };
  const onPressOut = () => { scale.value = withSpring(1); };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>Card</Text>
      </Pressable>
    </Animated.View>
  );
}
```

- Reanimated runs animations on the UI thread via worklets, avoiding JS thread blocking.
- Use `useAnimatedStyle` instead of inline styles for animated values.
- Prefer `withSpring` and `withTiming` over manual `Animated.Value` manipulation.

## Memory Leak Detection

Common React Native memory leaks:

1. **Event listeners not removed** -- always return cleanup functions from `useEffect`.
2. **Timers not cleared** -- clear `setTimeout` and `setInterval` on unmount.
3. **Subscriptions not unsubscribed** -- navigation listeners, keyboard events, network state.
4. **Large closures in callbacks** -- avoid capturing entire screens or large data in callbacks passed to native modules.

```typescript
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  const timer = setInterval(pollData, 5000);

  return () => {
    subscription.remove();
    clearInterval(timer);
  };
}, []);
```

Use Xcode's Memory Graph Debugger (iOS) or Android Studio's Memory Profiler to identify retained objects.
