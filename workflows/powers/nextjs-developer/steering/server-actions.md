# Server Actions

## Overview

Server Actions are async functions that run on the server, callable from both Server and Client Components. They replace traditional API routes for mutations.

## Defining Server Actions

### Inline (in Server Components)

```tsx
export default function Page() {
  async function createPost(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    await db.post.create({ data: { title } });
    revalidatePath("/posts");
  }

  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Separate file (shareable across components)

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function createPost(prevState: any, formData: FormData) {
  const validated = CreatePostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await db.post.create({ data: validated.data });
  } catch (e) {
    return { message: "Failed to create post" };
  }

  revalidatePath("/posts");
  redirect("/posts");
}
```

## Form Handling with useActionState

```tsx
"use client";

import { useActionState } from "react";
import { createPost } from "./actions";

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {
    errors: {},
    message: "",
  });

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required />
        {state.errors?.title && (
          <p className="text-red-500">{state.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" required />
        {state.errors?.content && (
          <p className="text-red-500">{state.errors.content}</p>
        )}
      </div>

      {state.message && <p className="text-red-500">{state.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

## Optimistic Updates

```tsx
"use client";

import { useOptimistic } from "react";
import { toggleLike } from "./actions";

export function LikeButton({
  isLiked,
  count,
}: {
  isLiked: boolean;
  count: number;
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    { isLiked, count },
    (state, newIsLiked: boolean) => ({
      isLiked: newIsLiked,
      count: newIsLiked ? state.count + 1 : state.count - 1,
    }),
  );

  return (
    <form
      action={async () => {
        setOptimistic(!optimistic.isLiked);
        await toggleLike();
      }}
    >
      <button type="submit">
        {optimistic.isLiked ? "❤️" : "🤍"} {optimistic.count}
      </button>
    </form>
  );
}
```

## Validation Patterns

### With Zod

```tsx
"use server";

import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function registerUser(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const validated = UserSchema.safeParse(Object.fromEntries(formData));

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await createUser(validated.data);
    return { success: true, message: "Account created" };
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      return { errors: { email: ["Email already exists"] } };
    }
    return { message: "Something went wrong" };
  }
}
```

## Security Best Practices

```tsx
"use server";

import { auth } from "@/lib/auth";

// Always verify authentication
export async function deletePost(postId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Always verify authorization
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== session.user.id) throw new Error("Forbidden");

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/posts");
}

// Never trust client input — always validate
export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Validate and sanitize
  const name = z.string().min(1).max(100).parse(formData.get("name"));

  // Use session.user.id, never a client-provided userId
  await db.user.update({
    where: { id: session.user.id },
    data: { name },
  });
}
```

## Revalidation After Mutations

```tsx
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function createPost(data: PostData) {
  await db.post.create({ data });

  // Revalidate specific path
  revalidatePath("/posts");

  // Revalidate by tag (for fetch-based caching)
  revalidateTag("posts");

  // Redirect after mutation
  redirect("/posts");
}
```

## Non-Form Usage

```tsx
"use client";

import { publishPost } from "./actions";

export function PublishButton({ postId }: { postId: string }) {
  const handlePublish = async () => {
    await publishPost(postId);
  };

  return <button onClick={handlePublish}>Publish</button>;
}
```
