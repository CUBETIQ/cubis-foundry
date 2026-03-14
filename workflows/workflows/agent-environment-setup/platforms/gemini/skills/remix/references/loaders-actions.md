# Loaders and Actions

Load this when implementing data fetching, form mutations, server-side validation, revalidation control, or session-based data access.

## Loaders

Loaders run on the server for every GET request to a route. They receive the request and route params and return data for the component.

### Basic Loader Pattern

```tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const post = await getPost(params.slug!);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ post });
}

export default function PostPage() {
  const { post } = useLoaderData<typeof loader>();
  return <h1>{post.title}</h1>;
}
```

- Loaders run in parallel for nested routes. A parent loader and child loader execute simultaneously, not sequentially.
- `typeof loader` provides type inference. Never manually type `useLoaderData`.
- Throw a `Response` to trigger the nearest `ErrorBoundary` with a status code.
- Return `json()` for serialized data. The response is always serialized over the network.

### Loader Headers and Caching

```tsx
export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control") ?? "private, max-age=60",
  };
}

export async function loader() {
  const data = await getCachedData();
  return json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
```

## Actions

Actions run on the server for non-GET requests (POST, PUT, PATCH, DELETE). They handle form mutations and return data or redirects.

### Basic Action Pattern

```tsx
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Body is required"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = CreatePostSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors, values: Object.fromEntries(formData) },
      { status: 400 }
    );
  }

  const post = await createPost(result.data);
  return redirect(`/blog/${post.slug}`);
}

export default function NewPost() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <input name="title" defaultValue={actionData?.values?.title} />
      {actionData?.errors?.title && <p>{actionData.errors.title[0]}</p>}

      <textarea name="body" defaultValue={actionData?.values?.body} />
      {actionData?.errors?.body && <p>{actionData.errors.body[0]}</p>}

      <button type="submit">Create Post</button>
    </Form>
  );
}
```

### Action Conventions

- Return `redirect()` on successful mutations to follow POST/Redirect/GET.
- Return `json({ errors })` with status 400 on validation failure.
- Preserve submitted values in the response so the form repopulates on error.
- Always validate on the server. Client-side validation is optional and bypassable.
- Use `formData.get("_action")` to distinguish between multiple actions in one form.

## Revalidation

After any action completes, Remix revalidates all active loaders by default.

### Controlling Revalidation

```tsx
import type { ShouldRevalidateFunctionArgs } from "@remix-run/react";

export function shouldRevalidate({
  actionResult,
  currentUrl,
  nextUrl,
  formAction,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Skip revalidation for this loader after actions on unrelated routes
  if (formAction && !formAction.startsWith("/blog")) {
    return false;
  }

  // Skip revalidation for GET navigations within the same parent
  if (formMethod === "GET" && currentUrl.pathname === nextUrl.pathname) {
    return false;
  }

  return defaultShouldRevalidate;
}
```

- `shouldRevalidate` runs on the client after navigations and action completions.
- Return `false` to prevent the loader from re-running.
- Use this to avoid re-fetching expensive data (analytics, external APIs) after unrelated mutations.

## Session Access in Loaders and Actions

```tsx
import { createCookieSessionStorage, redirect } from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET!],
      secure: process.env.NODE_ENV === "production",
    },
  });

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/login");
  }

  return json({ userId });
}
```
