# Svelte 5 Runes Reference

## $state -- Mutable Reactive State

```svelte
<script lang="ts">
  let count = $state(0);                          // primitive
  let user = $state({ name: 'Alice', age: 30 });  // deeply reactive object
  let items = $state<string[]>([]);                // array (push/splice tracked)
</script>
```

Use `$state.raw` for values that should only trigger on reassignment (not deep mutation).

```svelte
<script lang="ts">
  let data = $state.raw<ApiResponse | null>(null);
  async function refresh() { data = await fetchData(); }
</script>
```

## $derived -- Computed Values

```svelte
<script lang="ts">
  let items = $state([1, 2, 3, 4, 5]);
  let count = $derived(items.length);
  let evens = $derived(items.filter(n => n % 2 === 0));
  let summary = $derived(`${evens.length} of ${count} items`);
</script>
```

Use `$derived.by` when you need a function body with statements:

```svelte
<script lang="ts">
  let totals = $derived.by(() => {
    let subtotal = 0;
    for (const item of cart) subtotal += item.price * item.quantity;
    const tax = subtotal * 0.08;
    return { subtotal, tax, total: subtotal + tax };
  });
</script>
```

## $effect -- Side Effects

Runs after DOM updates when tracked dependencies change. Return a cleanup function for resources.

```svelte
<script lang="ts">
  let query = $state('');

  $effect(() => {
    if (query.length < 3) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(r => r.json()).then(data => { results = data; });
    return () => controller.abort();
  });
</script>
```

**Rules:** Effects run after DOM updates (not synchronously). They auto-track reactive dependencies. They do not run during SSR. Avoid setting `$state` inside `$effect` when `$derived` suffices.

Use `$effect.pre` to run before DOM updates (useful for reading scroll positions).

## $props -- Component Props

```svelte
<script lang="ts">
  type Props = { title: string; count?: number; onUpdate?: (v: number) => void };
  let { title, count = 0, onUpdate }: Props = $props();
</script>
```

## $bindable -- Two-Way Binding Props

```svelte
<!-- TextInput.svelte -->
<script lang="ts">
  let { value = $bindable('') }: { value: string } = $props();
</script>
<input bind:value />

<!-- Parent.svelte -->
<script lang="ts">
  let name = $state('');
</script>
<TextInput bind:value={name} />
```

## Migration from Svelte 4

| Svelte 4 | Svelte 5 |
|-----------|----------|
| `let x = 0` (reactive in component) | `let x = $state(0)` |
| `$: doubled = x * 2` | `let doubled = $derived(x * 2)` |
| `$: { console.log(x) }` | `$effect(() => { console.log(x) })` |
| `export let title` | `let { title } = $props()` |
| `createEventDispatcher()` | Callback props: `let { onClick } = $props()` |

## Common Pitfalls

1. **Do not use `$:` with runes** -- mixing Svelte 4 syntax with runes causes unpredictable behavior
2. **Do not set $state in $derived** -- derived values must be pure computations
3. **Avoid unnecessary $effect** -- if you can express it as $derived, do so
4. **SSR awareness** -- $effect does not run on the server; guard browser APIs
