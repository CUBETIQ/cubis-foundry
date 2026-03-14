# Example: Blog with Nested Routes, Loaders, and Progressive Forms

## Scenario

A team is building a content blog with Remix v2. The blog has a layout with a sidebar listing categories, a post list page, individual post pages loaded from a database, and an edit page for authors. The edit form must work without JavaScript for accessibility and resilience. Route-level error boundaries should handle missing posts gracefully.

## Prompt

"Create a Remix v2 blog with nested routes. The /blog layout shows a category sidebar. /blog lists recent posts. /blog/$slug shows a post loaded from the database. /blog/$slug/edit has a form for updating the post title and body with server-side Zod validation. The edit form must work without JavaScript. Add ErrorBoundary for missing posts."

## Expected Output

### Route Files (Flat File Convention)

```
app/routes/
  blog.tsx           # Layout: sidebar + Outlet
  blog._index.tsx    # Post list
  blog.$slug.tsx     # Post detail
  blog.$slug.edit.tsx # Edit form
```

### Layout Route

```tsx
// app/routes/blog.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, NavLink } from "@remix-run/react";
import { getCategories } from "~/models/category.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const categories = await getCategories();
  return json({ categories });
}

export default function BlogLayout() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div className="blog-layout">
      <aside className="sidebar">
        <h2>Categories</h2>
        <nav>
          {categories.map((cat) => (
            <NavLink key={cat.slug} to={`/blog?category=${cat.slug}`}>
              {cat.name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Post Detail with ErrorBoundary

```tsx
// app/routes/blog.$slug.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, isRouteErrorResponse, Outlet } from "@remix-run/react";
import { getPostBySlug } from "~/models/post.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPostBySlug(params.slug!);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  return json({ post });
}

export default function PostDetail() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <time dateTime={post.publishedAt}>{post.publishedAt}</time>
      <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
      <Outlet />
    </article>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="error-container">
        <h1>Post Not Found</h1>
        <p>The post you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="error-container">
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred while loading this post.</p>
    </div>
  );
}
```

### Edit Form with Progressive Enhancement

```tsx
// app/routes/blog.$slug.edit.tsx
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { getPostBySlug, updatePost } from "~/models/post.server";
import { requireAuthor } from "~/utils/auth.server";

const UpdatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Body is required"),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
  await requireAuthor(request);
  const post = await getPostBySlug(params.slug!);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  return json({ post });
}

export async function action({ params, request }: ActionFunctionArgs) {
  await requireAuthor(request);
  const formData = await request.formData();
  const result = UpdatePostSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await updatePost(params.slug!, result.data);
  return redirect(`/blog/${params.slug}`);
}

export default function EditPost() {
  const { post } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <fieldset disabled={isSubmitting}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={post.title}
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-describedby="title-error"
          />
          {actionData?.errors?.title && (
            <p id="title-error" className="error">{actionData.errors.title[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="body">Body</label>
          <textarea
            id="body"
            name="body"
            rows={20}
            defaultValue={post.body}
            aria-invalid={actionData?.errors?.body ? true : undefined}
            aria-describedby="body-error"
          />
          {actionData?.errors?.body && (
            <p id="body-error" className="error">{actionData.errors.body[0]}</p>
          )}
        </div>

        <button type="submit">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </fieldset>
    </Form>
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Could not load the edit form. You may not have permission to edit this post.</p>
    </div>
  );
}
```

## Key Decisions

- **Flat file routing** -- `blog.$slug.edit.tsx` uses dot-delimited nesting, the Remix v2 default. This keeps all route files in a single directory for easier navigation.
- **`<Form method="post">`** -- works as a standard HTML form without JavaScript. When JS is available, Remix intercepts the submission for a client-side navigation with instant feedback.
- **Server-side Zod validation** -- the action validates on the server because client-side validation is bypassable. Validation errors are returned as JSON and displayed next to the fields.
- **`redirect()` on success** -- follows POST/Redirect/GET to prevent duplicate submissions on browser refresh.
- **`throw new Response("...", { status: 404 })`** -- Remix catches thrown responses and renders the nearest ErrorBoundary with the status code, keeping the rest of the layout intact.
