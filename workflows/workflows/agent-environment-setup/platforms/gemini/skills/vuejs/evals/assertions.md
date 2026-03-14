# Vue 3.5+ Composition API -- Eval Assertions

## Eval 01: Composition API component with defineModel and Pinia

This eval validates correct usage of Vue 3.5 `<script setup>`, `defineModel()`, TypeScript generic props, and Pinia store integration.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `defineModel` | Verifies the skill uses `defineModel()` for two-way binding. Introduced in Vue 3.4 and stable in 3.5, `defineModel()` replaces the verbose `modelValue` + `update:modelValue` pattern with a single macro call. |
| 2 | contains | `defineProps` | Verifies the skill uses `defineProps` with TypeScript generics for type-safe props. Generic props provide full template inference and compile-time error checking without `PropType`. |
| 3 | contains | `defineStore` | Verifies the skill uses Pinia's `defineStore` for shared state. Pinia is the official Vue state management library with devtools integration, SSR support, and TypeScript inference. |
| 4 | contains | `computed(` | Verifies the skill uses `computed()` for derived values. Computed properties cache their results and only recompute when dependencies change, unlike methods which run on every render. |
| 5 | contains | `<script setup` | Verifies the skill uses `<script setup>` syntax. This is the recommended and most performant way to write Composition API components in Vue 3.5+. |

### What a passing response looks like

A passing response creates:
- A `SearchFilter.vue` SFC with `<script setup lang="ts">`
- `defineModel<string>()` for the search text input two-way binding
- `defineProps<{ categories: string[]; selectedCategory: string }>()` with TypeScript generics
- A Pinia store using `defineStore('filter', () => { ... })` setup syntax with reactive state and actions
- `computed()` for the filtered result count derived from store state
- `defineEmits<{ search: [query: string] }>()` for the typed search event

---

## Eval 02: Vue Router with Nuxt SSR and route middleware

This eval validates correct implementation of a Nuxt 3 page with SSR data fetching, route middleware, and typed parameters.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `useFetch` | Verifies the skill uses Nuxt's `useFetch` for SSR-compatible data fetching. `useFetch` deduplicates requests between server and client and provides automatic payload serialization. |
| 2 | contains | `definePageMeta` | Verifies the skill uses `definePageMeta` for route configuration. This Nuxt macro sets middleware, layout, and validation at the page level with compile-time extraction. |
| 3 | pattern | `defineNuxtRouteMiddleware\|navigateTo\|middleware` | Verifies the skill implements route middleware for authentication. Middleware runs before navigation and provides a centralized auth enforcement point. |
| 4 | pattern | `useRoute\|params\.id\|params\[` | Verifies the skill accesses typed route parameters. The product ID from the `[id]` dynamic segment must be read from route params for data fetching. |
| 5 | contains | `<script setup` | Verifies the skill uses `<script setup>` consistent with Nuxt 3 conventions. All Nuxt 3 pages should use this syntax for optimal compilation and auto-imports. |

### What a passing response looks like

A passing response provides:
- A `pages/products/[id].vue` page using `<script setup lang="ts">`
- `useFetch('/api/products/' + id)` or equivalent for SSR data fetching
- `definePageMeta({ middleware: 'auth' })` to assign the auth middleware
- A `middleware/auth.ts` file using `defineNuxtRouteMiddleware` that checks authentication and calls `navigateTo('/login')` for unauthenticated users
- `useRoute()` to access `params.id` with proper typing
- Error handling with `<NuxtErrorBoundary>` or conditional rendering based on fetch error state
