# Next.js 15 Server Actions Reference

## Overview

Server Actions are async functions that run on the server, callable from both Server and Client Components. They provide a type-safe RPC mechanism for mutations, form handling, and data revalidation with built-in progressive enhancement.

## Defining Server Actions

### Inline in Server Components

```tsx
// app/posts/page.tsx (Server Component)
export default function PostsPage() {
  async function createPost(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    await db.posts.create({ title });
    revalidatePath('/posts');
  }

  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### In Separate Files

```typescript
// app/posts/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
});

export async function createPost(prevState: any, formData: FormData) {
  const result = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.posts.create(result.data);
  revalidatePath('/posts');
  return { success: true };
}
```

## Using Server Actions in Client Components

### With useActionState

```tsx
'use client';

import { useActionState } from 'react';
import { createPost } from './actions';

export function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {});

  return (
    <form action={formAction}>
      <input
        name="title"
        aria-invalid={state.errors?.title ? 'true' : undefined}
      />
      {state.errors?.title && (
        <p className="text-red-500">{state.errors.title[0]}</p>
      )}

      <textarea name="content" />
      {state.errors?.content && (
        <p className="text-red-500">{state.errors.content[0]}</p>
      )}

      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

### Direct Invocation (Non-Form)

```tsx
'use client';

import { useTransition } from 'react';
import { deletePost } from './actions';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deletePost(postId);
        });
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

## Validation Patterns

### Zod with Structured Errors

```typescript
'use server';

import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactState = {
  errors?: z.inferFlattenedErrors<typeof contactSchema>['fieldErrors'];
  message?: string;
};

export async function submitContact(
  prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const result = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await sendEmail(result.data);
    return { message: 'Message sent successfully' };
  } catch {
    return { message: 'Failed to send message. Please try again.' };
  }
}
```

## Revalidation

### Path-Based

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  await db.users.update({ name: formData.get('name') as string });

  revalidatePath('/profile');       // Revalidate a specific path
  revalidatePath('/profile', 'layout'); // Revalidate path and all child segments
  revalidatePath('/', 'layout');    // Revalidate everything
}
```

### Tag-Based

```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function publishPost(postId: string) {
  await db.posts.publish(postId);

  revalidateTag('posts');              // Revalidate all data tagged 'posts'
  revalidateTag(`post-${postId}`);     // Revalidate specific post data
}
```

Tags are set during data fetching:

```typescript
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});
```

## Optimistic Updates

```tsx
'use client';

import { useOptimistic } from 'react';
import { toggleTodo } from './actions';

export function TodoItem({ todo }: { todo: Todo }) {
  const [optimisticTodo, setOptimistic] = useOptimistic(
    todo,
    (current, newCompleted: boolean) => ({
      ...current,
      completed: newCompleted,
    })
  );

  return (
    <form
      action={async () => {
        setOptimistic(!optimisticTodo.completed);
        await toggleTodo(todo.id);
      }}
    >
      <button>
        {optimisticTodo.completed ? 'Undo' : 'Complete'}
      </button>
    </form>
  );
}
```

## Redirects After Actions

```typescript
'use server';

import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const post = await db.posts.create({ title: formData.get('title') as string });

  redirect(`/posts/${post.slug}`); // Must be called outside try/catch
}
```

**Important**: `redirect()` throws internally, so it must not be inside a `try/catch` block.

## Security Considerations

1. **Always validate inputs** -- Server Actions are public HTTP endpoints; never trust client data
2. **Check authentication and authorization** in every action, not just in middleware
3. **Use CSRF protection** -- Next.js automatically includes CSRF tokens for Server Actions
4. **Rate limit sensitive actions** -- Login, registration, and payment actions should be rate-limited
5. **Never return sensitive data** -- Action return values are serialized to the client

## Common Pitfalls

1. **Forgetting `'use server'`** -- The function runs on the client without the directive, exposing server logic
2. **Wrapping `redirect()` in try/catch** -- `redirect()` throws a special error that must propagate
3. **Not revalidating after mutation** -- Users see stale cached data until the next full page load
4. **Returning full database objects** -- Action return values go to the client; strip sensitive fields
