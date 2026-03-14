# Vue Router & Nuxt 3 Reference

## Overview

Vue Router 4 provides client-side routing for Vue 3 applications. Nuxt 3 builds on Vue Router with file-based routing, auto-imports, server-side rendering, and per-route rendering strategies. This reference covers both standalone Vue Router and Nuxt 3 routing.

## Vue Router Setup

### Basic Configuration

```typescript
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/Home.vue') },
  { path: '/about', component: () => import('@/pages/About.vue') },
  {
    path: '/products/:id',
    component: () => import('@/pages/ProductDetail.vue'),
    props: true, // Pass params as props
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/Dashboard.vue') },
      { path: 'settings', component: () => import('@/pages/Settings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFound.vue') },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});
```

## Navigation Guards

### Global Guard

```typescript
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return '/dashboard';
  }
});
```

### Composition API Guards

```vue
<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

const hasUnsavedChanges = ref(false);

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Leave anyway?');
    if (!answer) return false;
  }
});

onBeforeRouteUpdate(async (to, from) => {
  // Route params changed (e.g., /products/1 -> /products/2)
  if (to.params.id !== from.params.id) {
    await fetchProduct(to.params.id as string);
  }
});
</script>
```

### Per-Route Guard

```typescript
{
  path: '/admin',
  component: AdminLayout,
  beforeEnter: (to, from) => {
    const auth = useAuthStore();
    if (auth.user?.role !== 'admin') {
      return { path: '/forbidden' };
    }
  },
}
```

## Dynamic Route Matching

```typescript
// Required param
{ path: '/users/:id' }          // /users/123

// Optional param
{ path: '/users/:id?' }         // /users or /users/123

// Regex constraint
{ path: '/posts/:id(\\d+)' }    // /posts/123 (numbers only)

// Repeatable params
{ path: '/docs/:chapters+' }    // /docs/a/b/c

// Optional repeatable
{ path: '/docs/:chapters*' }    // /docs or /docs/a/b

// Catch-all
{ path: '/:pathMatch(.*)*' }    // Everything
```

## Lazy Loading Routes

```typescript
// Each route is a separate chunk
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/pages/Dashboard.vue'),
  },
  {
    path: '/reports',
    // Named chunk for debugging
    component: () => import(/* webpackChunkName: "reports" */ '@/pages/Reports.vue'),
  },
];
```

---

## Nuxt 3 File-Based Routing

### Route Conventions

```
pages/
  index.vue               ->  /
  about.vue               ->  /about
  products/
    index.vue             ->  /products
    [id].vue              ->  /products/123
  blog/
    [...slug].vue         ->  /blog/any/path/here
  [[optional]]/
    index.vue             ->  / or /optional
```

### Dynamic Parameters

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const id = computed(() => route.params.id as string);

// Or use typed route params
const { data } = await useFetch(`/api/products/${id.value}`);
</script>
```

## definePageMeta

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  title: 'Admin Dashboard',
  validate: async (route) => {
    return /^\d+$/.test(route.params.id as string);
  },
  keepalive: true,
});
</script>
```

## Nuxt Middleware

### Route Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});
```

### Global Middleware

```typescript
// middleware/analytics.global.ts (note: .global suffix)
export default defineNuxtRouteMiddleware((to, from) => {
  trackPageView(to.fullPath);
});
```

### Inline Middleware

```vue
<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      const auth = useAuth();
      if (!auth.isAdmin.value) {
        return navigateTo('/');
      }
    },
  ],
});
</script>
```

## Nuxt Data Fetching

### useFetch

```vue
<script setup lang="ts">
const { data, status, error, refresh } = await useFetch('/api/products', {
  key: 'products',
  query: { page: 1 },
  watch: [page],      // Re-fetch when page changes
  default: () => [],  // Default value during loading
  transform: (data) => data.map(normalize), // Transform response
});
</script>
```

### useAsyncData

```vue
<script setup lang="ts">
const { data: user } = await useAsyncData('user', () => {
  return $fetch('/api/user/me');
});
```

### useLazyFetch

```vue
<script setup lang="ts">
// Does not block navigation -- component renders immediately with null data
const { data, status } = useLazyFetch('/api/slow-endpoint');
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else>{{ data }}</div>
</template>
```

## Nuxt Route Rules

Configure per-route rendering strategies in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },                    // SSG at build time
    '/api/**': { cors: true },                   // CORS headers
    '/blog/**': { swr: 3600 },                   // Stale-while-revalidate (1 hour)
    '/admin/**': { ssr: false },                 // Client-only (SPA)
    '/dashboard/**': { isr: 600 },               // ISR (10 minutes)
    '/old-page': { redirect: '/new-page' },      // Redirect
  },
});
```

### Rendering Strategies

| Strategy | Config | When to Use |
|----------|--------|------------|
| SSR | `{ ssr: true }` (default) | Dynamic, personalized pages |
| SSG | `{ prerender: true }` | Static pages (about, pricing) |
| SPA | `{ ssr: false }` | Admin dashboards, no SEO needed |
| SWR | `{ swr: seconds }` | Blog posts, product listings |
| ISR | `{ isr: seconds }` | Frequently updated content |

## Nuxt Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <main>
      <slot /> <!-- Page content renders here -->
    </main>
    <AppFooter />
  </div>
</template>
```

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="flex">
    <AdminSidebar />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
```

## Common Pitfalls

1. **Not using lazy loading** -- Loading all routes eagerly inflates the initial bundle
2. **Missing catch-all route** -- Users hitting unknown paths get a blank page instead of a 404
3. **Mutating `route.params` directly** -- Route params are read-only; use `router.push()` for navigation
4. **Forgetting `await` on `useFetch`** -- Without `await`, the page renders before data is available during SSR
5. **Route rules conflicts** -- More specific rules should come after general ones; Nuxt processes them in order
