# Example 02: Nuxt 3 Product Page with SSR and Auth Middleware

## Scenario

Build a Nuxt 3 product detail page with SSR data fetching using `useFetch`, route middleware for authentication, `definePageMeta` for route configuration, and typed route parameters.

## Prompt

> Implement a Nuxt 3 product detail page at pages/products/[id].vue with useFetch for SSR, an auth middleware that redirects unauthenticated users, definePageMeta for configuration, and typed route params. Handle loading and error states.

## Expected Output

### `middleware/auth.ts`

```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    return navigateTo('/login', {
      redirectCode: 302,
      external: false,
    });
  }
});
```

### `composables/useUserSession.ts`

```typescript
interface UserSession {
  loggedIn: Ref<boolean>;
  user: Ref<{ id: string; name: string; email: string } | null>;
}

export function useUserSession(): UserSession {
  const user = useState<{ id: string; name: string; email: string } | null>(
    'user',
    () => null
  );

  const loggedIn = computed(() => user.value !== null);

  return { loggedIn, user };
}
```

### `pages/products/[id].vue`

```vue
<script setup lang="ts">
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
}

definePageMeta({
  middleware: 'auth',
  validate: async (route) => {
    return /^\d+$/.test(route.params.id as string);
  },
});

const route = useRoute();
const productId = computed(() => route.params.id as string);

const {
  data: product,
  status,
  error,
  refresh,
} = await useFetch<Product>(`/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
  watch: [productId],
});

useHead({
  title: () => product.value?.name ?? 'Product',
  meta: [
    {
      name: 'description',
      content: () => product.value?.description ?? '',
    },
  ],
});
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <div v-if="status === 'pending'" class="animate-pulse">
      <div class="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div class="flex gap-8">
        <div class="w-96 h-96 bg-gray-200 rounded" />
        <div class="flex-1 space-y-3">
          <div class="h-6 bg-gray-200 rounded w-1/3" />
          <div class="h-4 bg-gray-200 rounded" />
          <div class="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    </div>

    <NuxtErrorBoundary v-else-if="error">
      <template #error="{ error: err }">
        <div class="text-center py-12">
          <h2 class="text-2xl font-bold text-red-600">
            Failed to load product
          </h2>
          <p class="text-gray-500 mt-2">{{ err.message }}</p>
          <button
            @click="refresh()"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </template>
    </NuxtErrorBoundary>

    <template v-else-if="product">
      <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <NuxtLink to="/products" class="hover:underline">Products</NuxtLink>
        <span class="mx-2">/</span>
        <span>{{ product.name }}</span>
      </nav>

      <div class="flex flex-col md:flex-row gap-8">
        <img
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full md:w-96 h-96 object-cover rounded-lg"
        />

        <div class="flex-1">
          <h1 class="text-3xl font-bold">{{ product.name }}</h1>
          <p class="text-gray-500 mt-1">{{ product.category }}</p>

          <p class="text-2xl font-semibold mt-4">
            {{ formatPrice(product.price) }}
          </p>

          <p class="mt-4 text-gray-700 leading-relaxed">
            {{ product.description }}
          </p>

          <div class="mt-6">
            <span
              v-if="product.inStock"
              class="text-green-600 font-medium"
            >
              In Stock
            </span>
            <span v-else class="text-red-600 font-medium">
              Out of Stock
            </span>
          </div>

          <button
            :disabled="!product.inStock"
            class="mt-6 w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
</script>
```

### `server/api/products/[id].get.ts`

```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  // Replace with your database query
  const product = await $fetch(`https://api.example.com/products/${id}`);

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found',
    });
  }

  return product;
});
```

## Key Patterns Demonstrated

1. **`useFetch` with SSR** -- `await useFetch()` in `<script setup>` runs on the server during SSR and deduplicates on the client. The `key` option ensures proper caching and the `watch` option re-fetches when params change.

2. **`definePageMeta` with middleware** -- The `middleware: 'auth'` assignment runs the auth check before the page loads. The `validate` function rejects non-numeric IDs at the routing level, returning a 404 before any data fetching.

3. **`defineNuxtRouteMiddleware`** -- The auth middleware checks session state and calls `navigateTo('/login')` for unauthenticated users. It runs on both server and client navigation.

4. **Typed route params** -- `useRoute()` provides access to `params.id`. The `computed(() => route.params.id)` ensures reactivity when navigating between product pages.

5. **`NuxtErrorBoundary`** -- Wraps the error state to display a retry button. The scoped slot receives the error object for displaying specific messages.

6. **Server API route** -- `server/api/products/[id].get.ts` handles the API endpoint with Nitro, providing `createError` for proper HTTP error responses.
