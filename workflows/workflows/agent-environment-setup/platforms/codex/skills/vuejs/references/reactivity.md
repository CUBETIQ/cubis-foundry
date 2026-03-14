# Vue 3.5 Reactivity Reference

## Overview

Vue 3.5's reactivity system is built on `ref()`, `reactive()`, `computed()`, `watch()`, and `watchEffect()`. Vue 3.5 introduces `defineModel()` for two-way binding and `useTemplateRef()` for explicit template refs.

## ref()

Creates a reactive wrapper around a value. Access the value via `.value` in JavaScript; in templates, Vue unwraps it automatically.

```vue
<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
const name = ref('');

function increment() {
  count.value++;
}
</script>

<template>
  <p>{{ count }}</p> <!-- No .value in template -->
  <button @click="increment">+1</button>
</template>
```

### Typing Refs

```typescript
import { ref, type Ref } from 'vue';

// Inferred as Ref<number>
const count = ref(0);

// Explicit generic
const user = ref<User | null>(null);

// Complex types
const items = ref<Map<string, Item>>(new Map());
```

## reactive()

Creates a deeply reactive object. Unlike `ref()`, no `.value` wrapper -- access properties directly.

```vue
<script setup lang="ts">
import { reactive } from 'vue';

interface FormState {
  name: string;
  email: string;
  errors: Record<string, string>;
}

const form = reactive<FormState>({
  name: '',
  email: '',
  errors: {},
});

function validate() {
  form.errors = {};
  if (!form.name) form.errors.name = 'Name is required';
  if (!form.email) form.errors.email = 'Email is required';
}
</script>
```

### ref vs. reactive

| `ref()` | `reactive()` |
|---------|-------------|
| Works with any value type | Only works with objects (not primitives) |
| Access via `.value` in JS | Direct property access |
| Can be reassigned (`count.value = 5`) | Cannot be reassigned (`form = newObj` breaks reactivity) |
| Unwrapped in templates | No unwrapping needed |
| Can be passed to functions without losing reactivity | Loses reactivity if destructured |

**General rule**: Use `ref()` for primitives and simple values. Use `reactive()` for complex form state or objects you never reassign.

## computed()

Creates a cached, read-only derived value that recomputes only when dependencies change.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const items = ref([1, 2, 3, 4, 5]);
const filter = ref<'all' | 'even' | 'odd'>('all');

const filteredItems = computed(() => {
  switch (filter.value) {
    case 'even': return items.value.filter(n => n % 2 === 0);
    case 'odd': return items.value.filter(n => n % 2 !== 0);
    default: return items.value;
  }
});

const count = computed(() => filteredItems.value.length);
```

### Writable Computed

```typescript
const firstName = ref('John');
const lastName = ref('Doe');

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newValue: string) => {
    const [first, ...rest] = newValue.split(' ');
    firstName.value = first;
    lastName.value = rest.join(' ');
  },
});
```

## watch()

Watches specific reactive sources and runs a callback when they change.

```typescript
import { ref, watch } from 'vue';

const query = ref('');

// Watch a single ref
watch(query, (newValue, oldValue) => {
  console.log(`Query changed from "${oldValue}" to "${newValue}"`);
});

// Watch multiple sources
const page = ref(1);
watch([query, page], ([newQuery, newPage], [oldQuery, oldPage]) => {
  fetchResults(newQuery, newPage);
});

// Watch with options
watch(query, (newValue) => {
  fetchResults(newValue, page.value);
}, {
  immediate: true,  // Run immediately with current value
  deep: true,        // Deep watch objects/arrays
  once: true,        // Run only once then stop
  flush: 'post',     // Run after DOM updates
});
```

### Watching Reactive Object Properties

```typescript
const state = reactive({ count: 0, nested: { value: 'hello' } });

// Must use a getter for specific properties
watch(
  () => state.count,
  (newCount) => { console.log('count:', newCount); }
);

// Deep watch an entire reactive object
watch(state, (newState) => {
  // Fires on any nested change
});
```

## watchEffect()

Automatically tracks all reactive dependencies accessed during execution.

```typescript
import { ref, watchEffect } from 'vue';

const query = ref('');
const page = ref(1);
const results = ref([]);

// Automatically tracks query and page
watchEffect(async () => {
  const response = await fetch(`/api/search?q=${query.value}&page=${page.value}`);
  results.value = await response.json();
});
```

### watchEffect vs. watch

| `watchEffect` | `watch` |
|--------------|---------|
| Runs immediately | Lazy by default (`immediate: false`) |
| Auto-tracks all dependencies | Explicitly specifies sources |
| No access to previous values | Receives both old and new values |
| Best for side effects with many dependencies | Best for responding to specific changes |

### Cleanup

```typescript
watchEffect((onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/data?q=${query.value}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => { results.value = data; });

  onCleanup(() => controller.abort()); // Abort on re-run or unmount
});
```

## defineModel() (Vue 3.4+/3.5)

Simplifies two-way binding (`v-model`) on custom components.

```vue
<!-- TextInput.vue -->
<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' });
</script>

<template>
  <input v-model="modelValue" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue';
const name = ref('');
</script>

<template>
  <TextInput v-model="name" />
</template>
```

### Named Models

```vue
<!-- DateRange.vue -->
<script setup lang="ts">
const start = defineModel<string>('start', { required: true });
const end = defineModel<string>('end', { required: true });
</script>

<template>
  <input type="date" v-model="start" />
  <input type="date" v-model="end" />
</template>
```

```vue
<!-- Parent -->
<DateRange v-model:start="startDate" v-model:end="endDate" />
```

## useTemplateRef() (Vue 3.5)

Explicitly accesses template refs with type safety.

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue';

const inputRef = useTemplateRef<HTMLInputElement>('search-input');

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input ref="search-input" type="text" />
</template>
```

## Common Pitfalls

1. **Destructuring reactive objects** -- `const { name } = reactive({ name: 'Vue' })` loses reactivity. Use `toRefs()` or keep the object intact.
2. **Reassigning reactive** -- `form = { name: '' }` breaks reactivity. Mutate properties instead: `form.name = ''`.
3. **Using `ref()` and forgetting `.value`** -- In JavaScript/TypeScript, always use `.value`. Templates unwrap automatically.
4. **Deep watching large objects** -- `deep: true` on large reactive trees is expensive. Watch specific properties instead.
5. **Side effects in computed** -- `computed()` must be pure. Use `watchEffect()` for side effects.
