# Example 01: Search Filter with defineModel and Pinia Store

## Scenario

Build a Vue 3.5 search filter component using `<script setup>`, `defineModel()` for two-way binding, Pinia for shared filter state, and computed properties for derived values.

## Prompt

> Create a Vue 3.5 SearchFilter component using script setup with defineModel for the search text, defineProps for categories, a Pinia store for filter state, and computed properties for the filtered result count. Emit a search event when submitted.

## Expected Output

### `stores/filter.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface FilterItem {
  id: string;
  name: string;
  category: string;
}

export const useFilterStore = defineStore('filter', () => {
  const items = ref<FilterItem[]>([]);
  const searchQuery = ref('');
  const selectedCategory = ref('all');

  const filteredItems = computed(() => {
    let result = items.value;

    if (selectedCategory.value !== 'all') {
      result = result.filter((item) => item.category === selectedCategory.value);
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    return result;
  });

  const filteredCount = computed(() => filteredItems.value.length);
  const totalCount = computed(() => items.value.length);

  function setItems(newItems: FilterItem[]) {
    items.value = newItems;
  }

  function reset() {
    searchQuery.value = '';
    selectedCategory.value = 'all';
  }

  return {
    items,
    searchQuery,
    selectedCategory,
    filteredItems,
    filteredCount,
    totalCount,
    setItems,
    reset,
  };
});
```

### `components/SearchFilter.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useFilterStore } from '@/stores/filter';

interface Props {
  categories: string[];
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
});

const emit = defineEmits<{
  search: [query: string];
}>();

const searchText = defineModel<string>('searchText', { default: '' });
const store = useFilterStore();

const resultSummary = computed(() => {
  return `${store.filteredCount} of ${store.totalCount} results`;
});

function handleSubmit() {
  store.searchQuery = searchText.value;
  emit('search', searchText.value);
}

function handleCategoryChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  store.selectedCategory = target.value;
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-3">
    <div class="flex gap-2">
      <input
        v-model="searchText"
        type="search"
        :placeholder="props.placeholder"
        aria-label="Search"
        class="flex-1 border rounded px-3 py-2"
      />
      <select
        :value="store.selectedCategory"
        @change="handleCategoryChange"
        aria-label="Category filter"
        class="border rounded px-3 py-2"
      >
        <option value="all">All Categories</option>
        <option
          v-for="category in categories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
      </select>
      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Search
      </button>
    </div>

    <p class="text-sm text-gray-500" aria-live="polite">
      {{ resultSummary }}
    </p>
  </form>
</template>

<style scoped>
input:focus,
select:focus {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}
</style>
```

## Key Patterns Demonstrated

1. **`defineModel()` for two-way binding** -- `defineModel<string>('searchText')` generates the prop and `update:searchText` emit automatically. The parent can use `v-model:searchText="value"` without boilerplate.

2. **`defineProps` with TypeScript generics** -- `defineProps<Props>()` provides full type inference in the template. `withDefaults()` adds default values while preserving types.

3. **Pinia setup store** -- `defineStore('filter', () => { ... })` uses the Composition API syntax. Refs become state, computed become getters, and plain functions become actions.

4. **`computed()` for derived values** -- `filteredCount`, `totalCount`, and `resultSummary` recompute only when their dependencies change, avoiding unnecessary recalculations.

5. **Typed emits** -- `defineEmits<{ search: [query: string] }>()` provides compile-time type checking for event payloads, catching errors when the parent binds the wrong handler signature.

6. **Scoped styles** -- `<style scoped>` ensures CSS rules apply only to this component, preventing style leaks across the application.
