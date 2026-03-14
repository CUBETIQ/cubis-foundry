# Example 02: Todo Form with useActionState and useOptimistic

## Scenario

Build a React 19 todo list form using `useActionState` for form state management, `useOptimistic` for instant feedback, and `useFormStatus` for pending state on the submit button.

## Prompt

> Build a React 19 todo list with an add-todo form. Use useActionState to handle a server action, useOptimistic to show the new todo instantly, and useFormStatus for the submit button pending state. Handle errors by reverting optimistic updates.

## Expected Output

### `actions.ts`

```typescript
'use server';

import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
});

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type TodoActionState = {
  todos: Todo[];
  error?: string;
};

export async function addTodo(
  prevState: TodoActionState,
  formData: FormData
): Promise<TodoActionState> {
  const result = todoSchema.safeParse({ title: formData.get('title') });

  if (!result.success) {
    return {
      ...prevState,
      error: result.error.flatten().fieldErrors.title?.[0] ?? 'Invalid input',
    };
  }

  // Simulate server delay and persistence
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title: result.data.title,
    completed: false,
  };

  return {
    todos: [...prevState.todos, newTodo],
    error: undefined,
  };
}
```

### `submit-button.tsx`

```tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      {pending ? 'Adding...' : 'Add Todo'}
    </button>
  );
}
```

### `todo-list.tsx`

```tsx
'use client';

import { useActionState, useOptimistic, useRef } from 'react';
import { addTodo, type Todo, type TodoActionState } from './actions';
import { SubmitButton } from './submit-button';

interface TodoListProps {
  initialTodos: Todo[];
}

export function TodoList({ initialTodos }: TodoListProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState<TodoActionState, FormData>(
    async (prevState, formData) => {
      const title = formData.get('title') as string;
      if (title.trim()) {
        addOptimistic({ id: `temp-${Date.now()}`, title, completed: false });
        formRef.current?.reset();
      }
      return addTodo(prevState, formData);
    },
    { todos: initialTodos }
  );

  const [optimisticTodos, addOptimistic] = useOptimistic(
    state.todos,
    (currentTodos: Todo[], newTodo: Todo) => [...currentTodos, newTodo]
  );

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex gap-2 mb-6">
        <input
          name="title"
          type="text"
          placeholder="What needs to be done?"
          aria-label="Todo title"
          className="flex-1 border rounded px-3 py-2"
          required
        />
        <SubmitButton />
      </form>

      {state.error && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {state.error}
        </p>
      )}

      <ul className="space-y-2">
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-3 p-3 border rounded ${
              todo.id.startsWith('temp-') ? 'opacity-50 italic' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              aria-label={`Mark "${todo.title}" as complete`}
            />
            <span>{todo.title}</span>
          </li>
        ))}
      </ul>

      {optimisticTodos.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          No todos yet. Add one above.
        </p>
      )}
    </div>
  );
}
```

## Key Patterns Demonstrated

1. **`useActionState` for form lifecycle** -- The hook binds the server action, manages the accumulated state (todo list + errors), and provides the `formAction` function to pass to the form's `action` prop.

2. **`useOptimistic` for instant UI** -- When the form submits, the new todo appears immediately in the list with reduced opacity. If the server action fails, React reverts `optimisticTodos` to the real `state.todos`.

3. **`useFormStatus` in a child component** -- `SubmitButton` uses `useFormStatus` to read the pending state from the nearest parent `<form>`. This hook must be called in a component that is a child of the form, not the form component itself.

4. **Server action with Zod validation** -- The `addTodo` action validates input on the server, returns structured errors on failure, and appends the new todo on success. It never throws.

5. **Form reset on submit** -- `formRef.current?.reset()` clears the input immediately after submission starts, while the optimistic todo shows in the list. This provides responsive feedback without waiting for the server.

6. **Progressive enhancement** -- The form uses the `action` prop (not `onSubmit`), so it works as a standard POST without JavaScript. React 19 enhances it with pending states and optimistic UI when JS is available.
