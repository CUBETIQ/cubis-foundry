# Vue 3.5 TypeScript Integration Reference

## Overview

Vue 3.5 provides first-class TypeScript support with `<script setup lang="ts">`, generic components, typed props via `defineProps<T>()`, typed emits, typed slots, and typed `provide`/`inject`. This reference covers TypeScript patterns specific to Vue.

## Typed Props with defineProps

### Generic Props (Recommended)

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  items: string[];
  status: 'active' | 'inactive' | 'pending';
}

const props = defineProps<Props>();
```

### With Defaults

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  variant?: 'primary' | 'secondary';
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: 'primary',
});
```

### Complex Default Values

```vue
<script setup lang="ts">
interface Props {
  config?: { theme: string; locale: string };
  items?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ theme: 'light', locale: 'en' }),
  items: () => [],
});
```

## Typed Emits

### Tuple Syntax

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string];
  submit: [data: FormData, isValid: boolean];
  close: [];
}>();

// Usage
emit('change', 'new value');
emit('submit', formData, true);
emit('close');
```

### Function Syntax (For Validation)

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'change', value: string): void;
  (e: 'submit', data: FormData): void;
}>();
```

## Typed Slots

```vue
<script setup lang="ts">
defineSlots<{
  default(props: { item: Product; index: number }): any;
  header(props: { title: string }): any;
  footer(): any;
}>();
</script>

<template>
  <div>
    <header>
      <slot name="header" :title="title" />
    </header>
    <ul>
      <li v-for="(item, index) in items" :key="item.id">
        <slot :item="item" :index="index" />
      </li>
    </ul>
    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>
```

## Generic Components

Vue 3.5 supports generic components for type-safe reusable patterns.

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T extends { id: string }">
defineProps<{
  items: T[];
  selected?: T;
}>();

defineEmits<{
  select: [item: T];
}>();

defineSlots<{
  default(props: { item: T; index: number }): any;
  empty(): any;
}>();
</script>

<template>
  <ul v-if="items.length">
    <li
      v-for="(item, index) in items"
      :key="item.id"
      :class="{ selected: selected?.id === item.id }"
      @click="$emit('select', item)"
    >
      <slot :item="item" :index="index" />
    </li>
  </ul>
  <div v-else>
    <slot name="empty">
      <p>No items</p>
    </slot>
  </div>
</template>
```

Usage:

```vue
<GenericList
  :items="users"
  :selected="currentUser"
  @select="selectUser"
>
  <template #default="{ item }">
    <!-- item is typed as User -->
    <span>{{ item.name }}</span>
  </template>
</GenericList>
```

## Typed provide/inject

### With InjectionKey

```typescript
// types/injection-keys.ts
import type { InjectionKey, Ref } from 'vue';

export interface AuthContext {
  user: Ref<User | null>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthKey: InjectionKey<AuthContext> = Symbol('auth');
```

### Provider

```vue
<script setup lang="ts">
import { provide, ref } from 'vue';
import { AuthKey, type AuthContext } from '@/types/injection-keys';

const user = ref<User | null>(null);

async function login(email: string, password: string) {
  user.value = await authService.login(email, password);
}

async function logout() {
  await authService.logout();
  user.value = null;
}

provide(AuthKey, { user, login, logout });
</script>
```

### Consumer

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { AuthKey } from '@/types/injection-keys';

const auth = inject(AuthKey);
if (!auth) throw new Error('AuthKey not provided');

// auth is typed as AuthContext
</script>
```

### Safe Injection Helper

```typescript
// composables/use-safe-inject.ts
import { inject, type InjectionKey } from 'vue';

export function useSafeInject<T>(key: InjectionKey<T>, errorMessage?: string): T {
  const value = inject(key);
  if (value === undefined) {
    throw new Error(errorMessage ?? `Injection key "${String(key)}" not provided`);
  }
  return value;
}
```

## Typing Composables

```typescript
// composables/use-async-data.ts
import { ref, type Ref } from 'vue';

interface UseAsyncDataReturn<T> {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  isLoading: Ref<boolean>;
  refresh: () => Promise<void>;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>
): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  async function refresh() {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await fetcher();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      isLoading.value = false;
    }
  }

  refresh(); // Initial fetch

  return { data, error, isLoading, refresh };
}
```

## Type Augmentation

### Global Component Types

```typescript
// types/global-components.d.ts
import type { GlobalComponents } from 'vue';

declare module 'vue' {
  interface GlobalComponents {
    RouterLink: typeof import('vue-router')['RouterLink'];
    RouterView: typeof import('vue-router')['RouterView'];
  }
}
```

### Custom Properties on ComponentInstance

```typescript
// types/vue-shims.d.ts
declare module 'vue' {
  interface ComponentCustomProperties {
    $filters: {
      currency: (value: number) => string;
      date: (value: string) => string;
    };
  }
}
```

## Common Pitfalls

1. **Using runtime prop declarations with TypeScript** -- Use `defineProps<T>()` generic instead of `defineProps({ name: String })` for full type inference
2. **Forgetting `withDefaults`** -- Optional props without defaults are `T | undefined`. Use `withDefaults` when you need a guaranteed value
3. **Untyped `inject`** -- Always use `InjectionKey<T>` for type safety. Plain string keys lose type information
4. **Generic component constraints** -- The `generic` attribute must be on the same `<script setup>` tag as `lang="ts"`
5. **Ref unwrapping in templates** -- Template types automatically unwrap refs, but TypeScript may show `.value` types in IDE tooltips inside `<script>`
