# SEO Implementation

## Metadata API

### Static Metadata

```tsx
// app/layout.tsx or app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "My App",
    template: "%s | My App", // Child pages: "About | My App"
  },
  description: "A description of my app",
  metadataBase: new URL("https://myapp.com"),
  openGraph: {
    title: "My App",
    description: "A description of my app",
    url: "https://myapp.com",
    siteName: "My App",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "My App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My App",
    description: "A description of my app",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}
```

## Sitemap

### Static Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://myapp.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://myapp.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://myapp.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
```

### Dynamic Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({
    select: { slug: true, updatedAt: true },
  });

  const postUrls = posts.map((post) => ({
    url: `https://myapp.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: "https://myapp.com", lastModified: new Date(), priority: 1 },
    ...postUrls,
  ];
}
```

## Robots.txt

```tsx
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/private/"],
      },
    ],
    sitemap: "https://myapp.com/sitemap.xml",
  };
}
```

## Structured Data (JSON-LD)

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

## Dynamic OG Images

```tsx
// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "My App";

  return new ImageResponse(
    <div
      style={{
        fontSize: 60,
        background: "linear-gradient(to bottom, #1a1a2e, #16213e)",
        color: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      {title}
    </div>,
    { width: 1200, height: 630 },
  );
}

// Reference in metadata
export const metadata: Metadata = {
  openGraph: {
    images: ["/api/og?title=My+Page"],
  },
};
```

## Canonical URLs

```tsx
export const metadata: Metadata = {
  alternates: {
    canonical: "https://myapp.com/blog/my-post",
    languages: {
      "en-US": "https://myapp.com/en/blog/my-post",
      "es-ES": "https://myapp.com/es/blog/my-post",
    },
  },
};
```

## International SEO

```tsx
// app/[lang]/layout.tsx
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }, { lang: "fr" }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}) {
  return {
    alternates: {
      canonical: `https://myapp.com/${params.lang}`,
      languages: {
        en: "https://myapp.com/en",
        es: "https://myapp.com/es",
        fr: "https://myapp.com/fr",
      },
    },
  };
}
```

## SEO Checklist

- [ ] Title and description on every page
- [ ] Open Graph tags for social sharing
- [ ] Twitter card meta tags
- [ ] Sitemap generated and submitted
- [ ] robots.txt configured
- [ ] Structured data (JSON-LD) for content pages
- [ ] Canonical URLs set
- [ ] Dynamic OG images for key pages
- [ ] Alt text on all images
- [ ] Semantic HTML (h1-h6, article, nav, main)
- [ ] Mobile-friendly (responsive)
- [ ] Fast loading (Core Web Vitals passing)
