# Performance Optimization

## Core Web Vitals Targets

| Metric  | Target  | What It Measures        |
| ------- | ------- | ----------------------- |
| TTFB    | < 200ms | Server response time    |
| FCP     | < 1s    | First content painted   |
| LCP     | < 2.5s  | Largest content painted |
| CLS     | < 0.1   | Layout shift score      |
| FID/INP | < 100ms | Input responsiveness    |

## Image Optimization

### next/image

```tsx
import Image from "next/image";

// Local image — auto-sized, optimized at build
import heroImage from "@/public/hero.jpg";

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Hero banner"
      placeholder="blur" // Blur placeholder while loading
      priority // Preload (use for above-the-fold images)
      sizes="100vw"
    />
  );
}

// Remote image — must specify sizes
export function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name}'s avatar`}
      width={48}
      height={48}
      className="rounded-full"
    />
  );
}
```

### Image Best Practices

- Use `priority` for LCP images (hero, above-the-fold)
- Always provide `sizes` for responsive images
- Use `placeholder="blur"` for better perceived performance
- Configure `remotePatterns` in `next.config.js` for external images
- Use WebP/AVIF formats (automatic with next/image)

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.example.com" }],
    formats: ["image/avif", "image/webp"],
  },
};
```

## Font Optimization

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent FOIT
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Local Fonts

```tsx
import localFont from "next/font/local";

const myFont = localFont({
  src: "./fonts/MyFont.woff2",
  display: "swap",
  variable: "--font-my-font",
});
```

## Script Loading

```tsx
import Script from 'next/script';

// After page is interactive (default)
<Script src="https://analytics.example.com/script.js" />

// Before page hydration (blocking — use sparingly)
<Script src="/critical.js" strategy="beforeInteractive" />

// After hydration, when browser is idle
<Script src="/non-critical.js" strategy="lazyOnload" />

// Inline script with worker strategy (off main thread)
<Script strategy="worker">
  {`console.log('Runs in web worker')`}
</Script>
```

## Link Prefetching

```tsx
import Link from 'next/link';

// Prefetched automatically when visible in viewport
<Link href="/dashboard">Dashboard</Link>

// Disable prefetch for rarely visited pages
<Link href="/admin/settings" prefetch={false}>Settings</Link>
```

## Bundle Analysis

```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({ /* config */ });

# Run analysis
ANALYZE=true npm run build
```

## Code Splitting

### Dynamic Imports

```tsx
import dynamic from "next/dynamic";

// Lazy load heavy components
const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Skip SSR for client-only components
});

// Lazy load below-the-fold content
const Comments = dynamic(() => import("@/components/Comments"));
```

### Route-Based Splitting

Next.js automatically code-splits by route. Each `page.tsx` is its own chunk.

## Caching Strategy

| Layer               | What                               | How                         |
| ------------------- | ---------------------------------- | --------------------------- |
| Request memoization | Duplicate fetches in single render | Automatic for `fetch()`     |
| Data cache          | API responses across requests      | `fetch()` with `revalidate` |
| Full route cache    | Static HTML + RSC payload          | Automatic for static routes |
| Router cache        | Client-side route cache            | Automatic, 30s for dynamic  |

### Opting Out of Caching

```tsx
// Per-fetch
fetch(url, { cache: "no-store" });

// Per-route segment
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Per-route via headers/cookies usage
import { cookies, headers } from "next/headers";
// Using these automatically makes the route dynamic
```

## React Compiler (experimental)

```js
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true, // Auto-memoizes components and hooks
  },
};
```

When enabled, the compiler automatically handles `useMemo`, `useCallback`, and `React.memo` — you don't need to add them manually.

## Performance Checklist

- [ ] LCP image has `priority` prop
- [ ] Fonts use `next/font` with `display: 'swap'`
- [ ] Heavy components use `dynamic()` import
- [ ] Third-party scripts use appropriate `strategy`
- [ ] Images use `next/image` with proper `sizes`
- [ ] No layout shift from dynamic content (set explicit dimensions)
- [ ] Server Components used where possible (smaller client bundle)
- [ ] Suspense boundaries for streaming
- [ ] Bundle analyzed for unexpected large dependencies
