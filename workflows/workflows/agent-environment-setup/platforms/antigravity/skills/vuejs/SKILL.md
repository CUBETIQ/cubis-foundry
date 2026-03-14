---
name: vuejs
description: "Use when building web applications with Vue 3.5+. Invoke for Composition API, script setup, Pinia state management, TypeScript integration, Vue Router, SSR with Nuxt, and reactivity patterns."
---
# Vue 3.5+ Composition API

Senior frontend engineer specializing in Vue 3.5+ Composition API patterns, Pinia state management, TypeScript integration, Vue Router, and SSR/SSG with Nuxt for scalable, type-safe web applications.

## Purpose

Provide authoritative guidance on building production Vue 3.5+ applications using the Composition API with `<script setup>`. This skill covers reactive state with `ref`/`reactive`/`computed`/`watch`, Pinia stores for shared state, full TypeScript integration, Vue Router with typed routes, SSR and SSG with Nuxt 3, and testing strategies with Vitest and Vue Test Utils.

## When to Use

- Creating Vue 3 components using `<script setup>` and Composition API
- Managing application state with Pinia stores
- Implementing type-safe props, emits, and slots with TypeScript
- Building single-page or multi-page apps with Vue Router
- Configuring SSR, SSG, or hybrid rendering with Nuxt 3
- Migrating from Options API or Vue 2 to Composition API
- Writing unit and integration tests for Vue components
- Optimizing Vue apps for performance and bundle size

## Instructions

1. **Verify the Vue version and build toolchain** before writing any code, because Vue 3.5 introduced `defineModel`, `useTemplateRef`, and improved `reactive` destructuring that do not exist in earlier versions, and Vite-based setups differ from webpack.

2. **Use `<script setup lang="ts">` for all Single File Components**, because `<script setup>` provides the most concise syntax, enables compile-time macro support (`defineProps`, `defineEmits`, `defineModel`), and produces the most efficient compiled output.

3. **Declare props with `defineProps<T>()`** using a TypeScript generic interface instead of the runtime declaration, because generic props provide full type inference in the template, catch type errors at compile time, and eliminate the need for `PropType` casts.

4. **Use `ref()` for primitives and `reactive()` for objects** as the default reactive state strategy, because `ref()` wraps values in a `.value` container that maintains reactivity through reassignment while `reactive()` provides direct property access for complex objects without `.value`.

5. **Derive computed values with `computed()`** instead of methods or watchers, because `computed()` caches its result and only recomputes when dependencies change, preventing unnecessary recalculations on every re-render.

6. **Use `watch` and `watchEffect` intentionally**: prefer `watchEffect` for side effects that should track all reactive dependencies automatically, and `watch` with explicit sources when you need the previous value, lazy execution, or fine-grained control over which dependencies trigger the callback.

7. **Manage shared state with Pinia stores** using the Composition API syntax (`defineStore` with a setup function), because Pinia provides devtools integration, SSR support, TypeScript inference, and hot module replacement without the boilerplate of Vuex mutations.

8. **Define two-way bound props with `defineModel()`** instead of the manual `modelValue` + `update:modelValue` pattern, because `defineModel()` generates the prop and emit pair automatically with full TypeScript support and reduces component API surface.

9. **Access template refs with `useTemplateRef()`** instead of declaring a `ref` with a matching template `ref` attribute name, because `useTemplateRef()` provides explicit intent, supports generic typing, and avoids naming collisions between refs and reactive variables.

10. **Structure routes with Vue Router using typed route definitions** and `definePageMeta` in Nuxt, because typed routes catch broken links and missing params at compile time rather than at runtime in production.

11. **Implement route guards in composition functions** (`onBeforeRouteLeave`, `onBeforeRouteUpdate`) or in `router.beforeEach` for global auth checks, because guards run before navigation commits and provide a centralized authorization enforcement point.

12. **Use `<Suspense>` with async setup for data-dependent components**, because `<Suspense>` displays a fallback while the component's async `setup()` resolves and prevents the component from rendering in an incomplete state.

13. **Provide and inject dependencies with `provide`/`inject`** typed with `InjectionKey<T>`, because typed injection keys ensure consumers receive the correct type and `provide`/`inject` avoids prop drilling through intermediate components.

14. **Write component tests with Vitest and `@vue/test-utils`** mounting components with `mount()` or `shallowMount()` and asserting on rendered output and emitted events, because isolated component tests verify behavior without browser dependencies and run in milliseconds.

15. **Lazy-load route components with `defineAsyncComponent` or dynamic `import()` in router config**, because code-splitting per route reduces initial bundle size and improves Time to Interactive for applications with many pages.

16. **Configure SSR with Nuxt 3 for SEO-critical pages** and use `routeRules` for per-route rendering strategies (SSR, SSG, SWR, ISR), because different pages have different latency and freshness requirements that a single rendering mode cannot satisfy.

## Output Format

When delivering Vue 3.5+ code:

1. **Component files** -- `.vue` SFCs with `<script setup lang="ts">`, `<template>`, and `<style scoped>` blocks
2. **Store files** -- Pinia stores in `stores/` directory using setup function syntax
3. **Composable files** -- Reusable composition functions in `composables/use-*.ts`
4. **Router config** -- `router/index.ts` with typed route definitions
5. **Test files** -- `.test.ts` files co-located with components or in `__tests__/`
6. **Brief rationale** -- One-sentence explanation for each architectural decision

## References

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Reactivity | `references/reactivity.md` | ref, reactive, computed, watch, watchEffect, defineModel |
| Pinia | `references/pinia.md` | Store setup, actions, getters, SSR hydration, testing stores |
| TypeScript | `references/typescript.md` | Generic props, typed emits, slots, provide/inject, augmentation |
| Router & Nuxt | `references/router-nuxt.md` | Vue Router guards, Nuxt 3 pages, route rules, middleware |
| Testing | `references/testing.md` | Vitest, Vue Test Utils, component testing, Pinia mocking |

## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
