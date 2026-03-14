# Pinia State Management Reference

## Overview

Pinia is the official state management library for Vue 3. It provides a simple, type-safe API with Vue DevTools integration, SSR support, and hot module replacement. Pinia replaces Vuex and eliminates the concept of mutations -- state changes are made directly or through actions.

## Defining Stores

### Setup Syntax (Recommended)

The setup syntax uses the Composition API inside `defineStore`. Refs become state, computed become getters, and functions become actions.

```typescript
// stores/counter.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0);
  const history = ref<number[]>([]);

  // Getters
  const doubleCount = computed(() => count.value * 2);
  const lastThree = computed(() => history.value.slice(-3));

  // Actions
  function increment() {
    count.value++;
    history.value.push(count.value);
  }

  function reset() {
    count.value = 0;
    history.value = [];
  }

  async function incrementAsync() {
    await new Promise(resolve => setTimeout(resolve, 100));
    increment();
  }

  return { count, history, doubleCount, lastThree, increment, reset, incrementAsync };
});
```

### Options Syntax

```typescript
// stores/counter.ts
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    history: [] as number[],
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    lastThree: (state) => state.history.slice(-3),
  },
  actions: {
    increment() {
      this.count++;
      this.history.push(this.count);
    },
    reset() {
      this.count = 0;
      this.history = [];
    },
  },
});
```

### Which Syntax to Use

- **Setup syntax**: More flexible, works naturally with composables, better TypeScript inference
- **Options syntax**: Familiar to Vuex users, simpler for small stores

## Using Stores in Components

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter';
import { storeToRefs } from 'pinia';

const counterStore = useCounterStore();

// Destructure reactive state with storeToRefs (preserves reactivity)
const { count, doubleCount } = storeToRefs(counterStore);

// Actions can be destructured directly (they don't need reactivity)
const { increment, reset } = counterStore;
</script>

<template>
  <p>Count: {{ count }} (Double: {{ doubleCount }})</p>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

**Important**: Use `storeToRefs()` to destructure state and getters. Direct destructuring (`const { count } = store`) loses reactivity.

## Store Composition

Stores can use other stores:

```typescript
// stores/cart.ts
import { defineStore } from 'pinia';
import { useProductStore } from './product';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const items = ref<{ productId: string; quantity: number }[]>([]);
  const productStore = useProductStore();

  const total = computed(() => {
    return items.value.reduce((sum, item) => {
      const product = productStore.getById(item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
  });

  function addItem(productId: string) {
    const existing = items.value.find(i => i.productId === productId);
    if (existing) {
      existing.quantity++;
    } else {
      items.value.push({ productId, quantity: 1 });
    }
  }

  return { items, total, addItem };
});
```

## Persisting State

Use the `pinia-plugin-persistedstate` plugin:

```typescript
// main.ts
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
```

```typescript
// stores/settings.ts
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light');
  const locale = ref('en');

  return { theme, locale };
}, {
  persist: true, // Stores in localStorage under key 'settings'
});
```

## $patch for Batch Updates

```typescript
const store = useCounterStore();

// Partial patch
store.$patch({ count: 10 });

// Function patch (for arrays and complex updates)
store.$patch((state) => {
  state.count = 10;
  state.history.push(10);
});
```

## $subscribe for Watching Changes

```typescript
const store = useCounterStore();

store.$subscribe((mutation, state) => {
  console.log('Store changed:', mutation.type, mutation.storeId);
  localStorage.setItem('counter', JSON.stringify(state));
});
```

## $reset for Resetting State

```typescript
// Only works with Options syntax stores
const store = useCounterStore();
store.$reset(); // Resets to initial state
```

For Setup syntax stores, implement a manual `reset()` action.

## SSR Considerations

### Nuxt Integration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
});
```

Pinia is automatically available in Nuxt components -- no need to call `createPinia()`.

### Hydration

Pinia handles SSR hydration automatically. State set on the server during SSR is serialized and hydrated on the client without duplicate API calls.

```typescript
// In a Nuxt page or component
const store = useProductStore();

// This runs on the server during SSR
// The state is serialized to HTML and hydrated on the client
const { data } = await useFetch('/api/products');
store.setProducts(data.value);
```

## Testing Stores

```typescript
// stores/__tests__/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCounterStore } from '../counter';

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with count 0', () => {
    const store = useCounterStore();
    expect(store.count).toBe(0);
  });

  it('increments count', () => {
    const store = useCounterStore();
    store.increment();
    expect(store.count).toBe(1);
    expect(store.history).toEqual([1]);
  });

  it('computes doubleCount', () => {
    const store = useCounterStore();
    store.increment();
    store.increment();
    expect(store.doubleCount).toBe(4);
  });
});
```

## Common Pitfalls

1. **Destructuring state without `storeToRefs()`** -- Loses reactivity; the value becomes a plain snapshot
2. **Circular store dependencies** -- Store A using Store B which uses Store A. Restructure to avoid cycles.
3. **Calling `$reset()` on setup stores** -- Only works with options syntax. For setup stores, create a manual `reset()` action.
4. **Large monolithic stores** -- Split stores by domain (auth, cart, products) for better maintainability and code splitting
5. **Mutating state outside of actions** -- While technically possible, it makes debugging harder. Prefer actions for traceability in DevTools.
