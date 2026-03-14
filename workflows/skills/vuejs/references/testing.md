# Vue 3.5 Testing Reference

## Overview

Testing Vue 3.5 applications requires Vitest for the test runner, `@vue/test-utils` for component mounting, and optionally Playwright for E2E tests. This reference covers setup, component testing patterns, Pinia store testing, and composable testing.

## Setup

### Install Dependencies

```bash
npm install -D vitest @vue/test-utils @testing-library/vue @testing-library/jest-dom jsdom
npm install -D @playwright/test  # For E2E tests
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
```

## Component Testing with @vue/test-utils

### Basic Component Test

```typescript
// components/__tests__/Counter.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Counter from '../Counter.vue';

describe('Counter', () => {
  it('renders initial count', () => {
    const wrapper = mount(Counter, {
      props: { initial: 5 },
    });
    expect(wrapper.text()).toContain('Count: 5');
  });

  it('increments on button click', async () => {
    const wrapper = mount(Counter, {
      props: { initial: 0 },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.text()).toContain('Count: 1');
  });
});
```

### Testing Props

```typescript
it('displays the title prop', () => {
  const wrapper = mount(PageHeader, {
    props: {
      title: 'Dashboard',
      subtitle: 'Welcome back',
    },
  });

  expect(wrapper.find('h1').text()).toBe('Dashboard');
  expect(wrapper.find('p').text()).toBe('Welcome back');
});
```

### Testing Emits

```typescript
it('emits search event with query', async () => {
  const wrapper = mount(SearchBar);

  const input = wrapper.find('input');
  await input.setValue('vue testing');
  await wrapper.find('form').trigger('submit');

  expect(wrapper.emitted('search')).toBeTruthy();
  expect(wrapper.emitted('search')![0]).toEqual(['vue testing']);
});
```

### Testing v-model

```typescript
it('supports v-model', async () => {
  const wrapper = mount(TextInput, {
    props: {
      modelValue: 'initial',
      'onUpdate:modelValue': (value: string) => {
        wrapper.setProps({ modelValue: value });
      },
    },
  });

  const input = wrapper.find('input');
  expect(input.element.value).toBe('initial');

  await input.setValue('updated');
  expect(wrapper.emitted('update:modelValue')![0]).toEqual(['updated']);
});
```

### Testing Slots

```typescript
it('renders default slot content', () => {
  const wrapper = mount(Card, {
    slots: {
      default: '<p>Card content</p>',
      header: '<h2>Card Title</h2>',
      footer: '<button>Action</button>',
    },
  });

  expect(wrapper.find('h2').text()).toBe('Card Title');
  expect(wrapper.find('p').text()).toBe('Card content');
  expect(wrapper.find('button').text()).toBe('Action');
});
```

### Testing Async Components

```typescript
import { flushPromises } from '@vue/test-utils';

it('loads and displays data', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ name: 'Alice' }))
  );

  const wrapper = mount(UserProfile, {
    props: { userId: '123' },
  });

  // Wait for async operations to complete
  await flushPromises();

  expect(wrapper.text()).toContain('Alice');
});
```

## Testing with @testing-library/vue

For tests that follow user-centric patterns (query by role, label, text):

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

it('submits the form with user input', async () => {
  render(ContactForm);
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Name'), 'Alice');
  await user.type(screen.getByLabelText('Email'), 'alice@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText('Message sent')).toBeVisible();
});
```

## Testing Pinia Stores

### Unit Testing Stores

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCartStore } from '@/stores/cart';

describe('Cart Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds item to cart', () => {
    const cart = useCartStore();
    cart.addItem({ id: '1', name: 'Widget', price: 999 });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Widget');
  });

  it('computes total correctly', () => {
    const cart = useCartStore();
    cart.addItem({ id: '1', name: 'A', price: 1000 });
    cart.addItem({ id: '2', name: 'B', price: 2000 });

    expect(cart.total).toBe(3000);
  });

  it('removes item from cart', () => {
    const cart = useCartStore();
    cart.addItem({ id: '1', name: 'Widget', price: 999 });
    cart.removeItem('1');

    expect(cart.items).toHaveLength(0);
  });
});
```

### Testing Components with Stores

```typescript
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CartSummary from '../CartSummary.vue';

it('displays cart items from store', () => {
  const wrapper = mount(CartSummary, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            cart: {
              items: [
                { id: '1', name: 'Widget', price: 999, quantity: 2 },
              ],
            },
          },
        }),
      ],
    },
  });

  expect(wrapper.text()).toContain('Widget');
  expect(wrapper.text()).toContain('2');
});
```

## Testing Composables

```typescript
// composables/__tests__/use-counter.test.ts
import { describe, it, expect } from 'vitest';
import { useCounter } from '../use-counter';

describe('useCounter', () => {
  it('starts at initial value', () => {
    const { count } = useCounter(10);
    expect(count.value).toBe(10);
  });

  it('increments and decrements', () => {
    const { count, increment, decrement } = useCounter(0);

    increment();
    expect(count.value).toBe(1);

    decrement();
    expect(count.value).toBe(0);
  });
});
```

For composables that need a component context (lifecycle hooks, provide/inject):

```typescript
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

function withSetup<T>(composable: () => T): { result: T; wrapper: any } {
  let result!: T;

  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return {};
    },
    template: '<div />',
  });

  const wrapper = mount(TestComponent);
  return { result, wrapper };
}

it('uses lifecycle hooks correctly', () => {
  const { result } = withSetup(() => useMyComposable());
  expect(result.data.value).toBeDefined();
});
```

## Testing Vue Router

```typescript
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '../App.vue';

it('navigates to about page', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/about', component: { template: '<div>About</div>' } },
    ],
  });

  router.push('/');
  await router.isReady();

  const wrapper = mount(App, {
    global: { plugins: [router] },
  });

  await router.push('/about');
  await wrapper.vm.$nextTick();

  expect(wrapper.text()).toContain('About');
});
```

## Common Pitfalls

1. **Forgetting `await` after trigger/setValue** -- Vue updates the DOM asynchronously; without `await`, assertions run before the DOM updates
2. **Not using `flushPromises`** -- Async operations in `onMounted` or watchers need `flushPromises()` before assertions
3. **Testing implementation details** -- Avoid testing internal state; test what the user sees and does
4. **Missing Pinia setup in tests** -- Call `setActivePinia(createPinia())` in `beforeEach` or use `createTestingPinia`
5. **Not cleaning up mocks** -- Use `vi.restoreAllMocks()` in `afterEach` to prevent test pollution
