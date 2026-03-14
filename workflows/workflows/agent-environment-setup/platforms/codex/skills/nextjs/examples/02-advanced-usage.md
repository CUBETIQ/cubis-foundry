# Example 02: Server Action Form with Optimistic UI and Revalidation

## Scenario

Build a Next.js 15 todo application with a Server Action for creating todos, Zod validation, useActionState for form state, useOptimistic for instant feedback, and cache revalidation.

## Prompt

> Implement a Next.js 15 todo list with a Server Action in a separate actions.ts file. Validate the input with Zod. Use useActionState in a Client Component form with useOptimistic to show the new todo immediately. After success, revalidate the /todos path. Handle and display validation errors.

## Expected Output

### `app/todos/actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const todoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
});

export type ActionState = {
  errors?: { title?: string[] };
  message?: string;
  todo?: { id: string; title: string; completed: boolean };
};

export async function createTodo(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = todoSchema.safeParse({
    title: formData.get('title'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    const todo = await saveTodo(result.data.title);
    revalidatePath('/todos');
    return { message: 'Todo created', todo };
  } catch {
    return { message: 'Failed to create todo. Please try again.' };
  }
}

async function saveTodo(title: string) {
  // Replace with your database call
  return { id: crypto.randomUUID(), title, completed: false };
}
```

### `app/todos/todo-form.tsx`

```tsx
'use client';

import { useActionState, useOptimistic, useRef } from 'react';
import { createTodo, type ActionState } from './actions';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export function TodoForm({ todos }: { todos: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (current: Todo[], newTitle: string) => [
      ...current,
      { id: `temp-${Date.now()}`, title: newTitle, completed: false },
    ]
  );

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const title = formData.get('title') as string;
      addOptimistic(title);
      formRef.current?.reset();
      return createTodo(prevState, formData);
    },
    {}
  );

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex gap-2">
        <input
          name="title"
          type="text"
          placeholder="What needs to be done?"
          aria-label="Todo title"
          aria-invalid={state.errors?.title ? 'true' : undefined}
          aria-describedby={state.errors?.title ? 'title-error' : undefined}
          className="flex-1 border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
      </form>

      {state.errors?.title && (
        <p id="title-error" className="text-red-500 text-sm mt-1" role="alert">
          {state.errors.title[0]}
        </p>
      )}

      <ul className="mt-6 space-y-2">
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-2 p-2 rounded ${
              todo.id.startsWith('temp-') ? 'opacity-50' : ''
            }`}
          >
            <input type="checkbox" checked={todo.completed} readOnly />
            <span>{todo.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### `app/todos/page.tsx`

```tsx
import { TodoForm } from './todo-form';

export const metadata = {
  title: 'Todos',
  description: 'Manage your todo list',
};

export default async function TodosPage() {
  const todos = await getTodos();
  return (
    <main className="max-w-xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Todos</h1>
      <TodoForm todos={todos} />
    </main>
  );
}

async function getTodos() {
  // Replace with your database call
  return [
    { id: '1', title: 'Learn Server Actions', completed: true },
    { id: '2', title: 'Build todo app', completed: false },
  ];
}
```

## Key Patterns Demonstrated

1. **Separated Server Action** -- The action lives in `actions.ts` with `'use server'` at the file level, keeping mutation logic isolated and testable independently from the UI.

2. **Zod validation + structured errors** -- `safeParse` returns field-level errors that the form renders per-input. The action never throws; it always returns a typed `ActionState`.

3. **`useActionState` for form lifecycle** -- The hook manages pending state, previous result, and the action binding in one call. `isPending` drives the button's disabled and loading states.

4. **`useOptimistic` for instant feedback** -- The new todo appears in the list immediately with `opacity-50` styling. If the server action fails, React automatically reverts to the real list.

5. **`revalidatePath` after mutation** -- After successfully saving, the `/todos` path is revalidated so subsequent navigations see fresh data from the server.

6. **Progressive enhancement** -- The `<form action={formAction}>` works as a native POST without JavaScript. `useActionState` adds the enhanced UX on top.
