# Example 01: Blog Post Page with Server Component Data Fetching

## Scenario

Build a Next.js 15 blog post page using async Server Components for data fetching, streaming with loading.tsx, and dynamic SEO metadata.

## Prompt

> Create a Next.js 15 App Router blog post page that fetches post data from an API endpoint, displays the title, author, date, and content, uses time-based revalidation of 60 seconds, streams the page with a loading skeleton, and generates dynamic metadata for SEO.

## Expected Output

### `app/blog/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Post = {
  slug: string;
  title: string;
  author: string;
  date: string;
  content: string;
  excerpt: string;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-prose mx-auto py-12">
      <header>
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="text-gray-500 mt-2">
          By {post.author} on {new Date(post.date).toLocaleDateString()}
        </p>
      </header>
      <div
        className="prose mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 60, tags: [`post-${slug}`] },
  });

  if (!res.ok) return null;
  return res.json();
}
```

### `app/blog/[slug]/loading.tsx`

```tsx
export default function BlogPostLoading() {
  return (
    <div className="max-w-prose mx-auto py-12 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}
```

### `app/blog/[slug]/error.tsx`

```tsx
'use client';

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-prose mx-auto py-12 text-center">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-gray-500 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

## Key Patterns Demonstrated

1. **Async Server Component** -- The page function is `async` and fetches data directly. No `useEffect`, no `useState`, no `'use client'`. The data is available before the component renders.

2. **Segment-level revalidation** -- `export const revalidate = 60` sets time-based ISR for the entire route segment. The fetch call also uses `next.revalidate` for fine-grained control per request.

3. **Tag-based cache keys** -- `next: { tags: ['post-${slug}'] }` enables surgical cache invalidation via `revalidateTag('post-slug')` in Server Actions.

4. **Dynamic metadata** -- `generateMetadata` is an async function that reads the same data the page needs. Next.js deduplicates the fetch call so it only runs once.

5. **Streaming** -- `loading.tsx` automatically wraps the page in a `<Suspense>` boundary. The skeleton renders immediately while the async page streams in.

6. **Params as Promise** -- Next.js 15 passes `params` as a `Promise` that must be awaited, enabling streaming before params are resolved.
