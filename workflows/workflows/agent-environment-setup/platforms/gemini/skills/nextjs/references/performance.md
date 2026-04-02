# Next.js 15 Performance Reference

## Overview

Next.js 15 provides built-in tools for optimizing Core Web Vitals: image optimization, font loading, metadata management, streaming, and Partial Prerendering. This reference covers each mechanism and when to apply it.

## Image Optimization

### next/image Component

```tsx
import Image from 'next/image';

// Static import (automatically sized at build time)
import heroImage from '@/public/hero.jpg';

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Product showcase"
      priority // Load eagerly for LCP images
      placeholder="blur" // Show blurred placeholder during load
    />
  );
}

// Remote image (explicit dimensions required)
export function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name}'s avatar`}
      width={64}
      height={64}
      className="rounded-full"
    />
  );
}

// Fill mode (for responsive containers)
export function Banner({ src }: { src: string }) {
  return (
    <div className="relative w-full h-64">
      <Image
        src={src}
        alt="Banner"
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover"
      />
    </div>
  );
}
```

### Image Configuration

```typescript
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.example.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

### Key Rules

- Always set `priority` on the Largest Contentful Paint (LCP) image
- Always provide `sizes` with `fill` to prevent unnecessary large images
- Use `placeholder="blur"` for static imports to prevent CLS
- Configure `remotePatterns` instead of `domains` (more secure)

## Font Optimization

### next/font/google

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### next/font/local

```tsx
import localFont from 'next/font/local';

const brandFont = localFont({
  src: [
    { path: '../fonts/Brand-Regular.woff2', weight: '400' },
    { path: '../fonts/Brand-Bold.woff2', weight: '700' },
  ],
  variable: '--font-brand',
  display: 'swap',
});
```

### Key Rules

- Always use `display: 'swap'` to prevent FOIT (Flash of Invisible Text)
- Use CSS variables (`variable` option) for Tailwind integration
- Fonts are self-hosted and loaded at build time -- no Google Fonts requests at runtime

## Metadata

### Static Metadata

```tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our company and mission',
  openGraph: {
    title: 'About Us',
    description: 'Learn about our company',
    images: ['/og/about.png'],
  },
};
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}
```

### Metadata Merging

Metadata merges from root layout downward. Child segments override parent values for the same fields.

## Streaming and Suspense

### How Streaming Works

1. Server renders the shell (layout, navigation, non-async content) immediately
2. Sends HTML to the browser progressively
3. Async components stream in as their data resolves
4. Browser hydrates each chunk independently

### loading.tsx

```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}
```

### Fine-Grained Suspense

```tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast data -- renders quickly */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />
      </Suspense>

      {/* Slow data -- streams in later without blocking the page */}
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </Suspense>

      {/* Even slower -- independent stream */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}
```

## Partial Prerendering (PPR)

PPR combines static and dynamic content in a single route. The static shell is served from the CDN edge, and dynamic holes are streamed in.

### Enabling PPR

```typescript
// next.config.ts
const config = {
  experimental: {
    ppr: 'incremental',
  },
};
```

```typescript
// app/dashboard/page.tsx
export const experimental_ppr = true;

export default function DashboardPage() {
  return (
    <div>
      <StaticHeader /> {/* Prerendered at build time */}
      <Suspense fallback={<CartSkeleton />}>
        <DynamicCart /> {/* Streamed at request time */}
      </Suspense>
    </div>
  );
}
```

## Bundle Analysis

```bash
# Analyze bundle composition
ANALYZE=true next build

# Or use the built-in bundle analyzer
npm install @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(config);
```

## Performance Checklist

1. Mark the LCP image with `priority` on `next/image`
2. Use `next/font` with `display: 'swap'` for all fonts
3. Add `generateMetadata` to every page for SEO
4. Wrap slow async components in `<Suspense>` boundaries
5. Set appropriate `revalidate` intervals for cached data
6. Use `React.lazy` or dynamic `import()` for heavy client components
7. Analyze the bundle after significant dependency changes
8. Test Core Web Vitals with Lighthouse and the Next.js Speed Insights

## Common Pitfalls

1. **Missing `sizes` on fill images** -- Causes the browser to download unnecessarily large images
2. **Not setting `priority` on LCP images** -- The image lazy-loads by default, delaying LCP
3. **Blocking the entire page on slow data** -- Use Suspense boundaries to stream independent sections
4. **Large client bundles from `'use client'` at the top of the tree** -- Push the client boundary down to the smallest interactive component
