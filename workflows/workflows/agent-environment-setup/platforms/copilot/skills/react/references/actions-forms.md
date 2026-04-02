# React 19 Actions & Forms Reference

## Overview

React 19 introduces Actions as a first-class way to handle form submissions and data mutations. Actions work with the `<form>` element's `action` prop, `useActionState` for state management, `useOptimistic` for instant feedback, and `useFormStatus` for pending indicators.

## Form Actions

### Basic Form Action

```tsx
// Server Action
'use server';

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string;
  await db.items.create({ name });
}
```

```tsx
// Client Component
import { createItem } from './actions';

export function ItemForm() {
  return (
    <form action={createItem}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

The `action` prop accepts an async function that receives `FormData`. React handles serialization, pending states, and progressive enhancement.

### Client-Side Actions

Actions do not require a server. You can use client-side async functions:

```tsx
'use client';

export function SearchForm() {
  async function handleSearch(formData: FormData) {
    const query = formData.get('q') as string;
    const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
    // Update state with results
  }

  return (
    <form action={handleSearch}>
      <input name="q" placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  );
}
```

## useActionState

Manages form action state: the action function, pending state, and accumulated result.

```tsx
'use client';

import { useActionState } from 'react';
import { createItem, type ActionState } from './actions';

export function ItemForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createItem,
    { errors: undefined, message: undefined }
  );

  return (
    <form action={formAction}>
      <input
        name="name"
        aria-invalid={state.errors?.name ? 'true' : undefined}
      />
      {state.errors?.name && (
        <p className="text-red-500">{state.errors.name[0]}</p>
      )}

      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Signature

```typescript
const [state, formAction, isPending] = useActionState(
  action: (prevState: State, formData: FormData) => Promise<State>,
  initialState: State,
  permalink?: string
);
```

- `state` -- Current state (initially `initialState`, then the last action return value)
- `formAction` -- The wrapped action to pass to `<form action>`
- `isPending` -- Whether the action is currently executing

### Server Action Shape

```typescript
'use server';

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function createItem(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Validate, persist, return new state
}
```

## useOptimistic

Provides instant UI feedback while an async action processes.

```tsx
'use client';

import { useOptimistic } from 'react';

type Message = { id: string; text: string; sending?: boolean };

export function Chat({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (current: Message[], newMessage: Message) => [...current, newMessage]
  );

  async function sendMessage(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimistic({ id: `temp-${Date.now()}`, text, sending: true });
    await submitMessage(text); // Server action
  }

  return (
    <div>
      <ul>
        {optimisticMessages.map(msg => (
          <li key={msg.id} className={msg.sending ? 'opacity-50' : ''}>
            {msg.text}
          </li>
        ))}
      </ul>
      <form action={sendMessage}>
        <input name="text" required />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Signature

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  state: T,
  updateFn: (currentState: T, optimisticValue: V) => T
);
```

- `state` -- The source of truth (usually from the server)
- `updateFn` -- Pure function that produces the optimistic state
- `optimisticState` -- The optimistic value during pending, or `state` when settled
- `addOptimistic` -- Call to trigger the optimistic update

### Automatic Revert

When the source `state` updates (action completes), `optimisticState` syncs to the real state. If the action fails and `state` does not change, the optimistic value is automatically reverted.

## useFormStatus

Reads the pending status of the nearest parent `<form>`. Must be called in a component that is a child of the form.

```tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : children}
    </button>
  );
}
```

**Important**: `useFormStatus` reads from the parent `<form>` -- it does NOT work if called in the same component that renders the `<form>`. Extract the button into a child component.

## Progressive Enhancement

Forms with the `action` prop work without JavaScript as standard HTTP form submissions. When JavaScript is available, React intercepts the submission and handles it with the action function.

```tsx
export function ContactForm() {
  return (
    <form action={submitContact}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <SubmitButton>Send Message</SubmitButton>
    </form>
  );
}
```

- **Without JS**: Browser submits the form as a POST request
- **With JS**: React calls `submitContact` with FormData, manages pending state

## Common Pitfalls

1. **Using `onSubmit` instead of `action`** -- `onSubmit` does not integrate with `useActionState` or progressive enhancement
2. **Calling `useFormStatus` in the form component** -- It must be in a child component of `<form>`
3. **Forgetting `isPending` check** -- Without disabling the button, users can double-submit
4. **Creating the optimistic updater inline** -- The update function should be stable; define it outside the render or use `useCallback`
5. **Not returning from the action** -- `useActionState` reads the return value; forgetting to return state causes `undefined` in `state`
