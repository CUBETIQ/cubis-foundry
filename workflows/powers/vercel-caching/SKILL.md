---
name: vercel-caching
description: "Vercel caching strategies: CDN cache, cache-control headers, runtime cache, ISR, Next.js Data Cache, request collapsing, remote caching (Turborepo), and CDN purging."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, cdn cache, caching, isr, incremental static regeneration, data cache, request collapsing, remote caching, turborepo cache, cache purge, stale-while-revalidate, cache-control
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, vercel-functions, vercel-routing, web-perf
  consolidates: vercel-cdn-cache, vercel-cdn-purging, vercel-cache-control-headers, vercel-runtime-cache, vercel-isr, vercel-data-cache-nextjs, vercel-request-collapsing, vercel-remote-caching
---

# Vercel Caching

## Purpose

Implement and tune Vercel's full caching stack to maximize performance and reduce origin load, including CDN edge caching, ISR, Next.js Data Cache, request collapsing, and Turborepo remote caching.

## When To Use

- Setting cache-control headers and CDN TTL for static/dynamic assets.
- Configuring ISR revalidation periods and on-demand revalidation.
- Using Next.js Data Cache (`fetch` caching, `unstable_cache`).
- Purging CDN cache after deploys or content updates.
- Enabling request collapsing to prevent cache stampedes.
- Setting up Turborepo remote caching for faster CI.

## Domain Areas

### CDN Cache & Cache-Control

- Set `Cache-Control: s-maxage`, `stale-while-revalidate` headers.
- Configure edge cache TTL per route in `vercel.json`.
- Understand Vercel's cache key construction.

### CDN Purging

- On-demand cache invalidation via Vercel dashboard or REST API.
- Tag-based purge strategies for content updates.

### ISR (Incremental Static Regeneration)

- Configure `revalidate` in Next.js page/route handlers.
- On-demand revalidation with `revalidatePath` / `revalidateTag`.
- ISR fallback behavior and error handling.

### Next.js Data Cache

- `fetch` cache with `cache`, `next.revalidate`, `next.tags` options.
- `unstable_cache` for non-fetch data sources.
- Cache invalidation with `revalidateTag`.

### Request Collapsing

- Enable to coalesce concurrent cache-miss requests.
- Validate behavior under load with simulated stampedes.

### Remote Caching (Turborepo)

- Configure Vercel Remote Cache for Turborepo.
- Authenticate with `TURBO_TOKEN` and `TURBO_TEAM`.
- Monitor cache hit rates and artifact sizes.

## Operating Checklist

1. Audit current cache-control headers and TTL values.
2. Define caching strategy per route type (static, dynamic, API).
3. Implement ISR or Data Cache with explicit revalidation tags.
4. Set up cache purge automation for content updates.
5. Enable and validate request collapsing in staging under load.
6. Configure Turborepo remote caching and verify hit rates in CI.

## Output Contract

- Cache-control header strategy per route type
- ISR/Data Cache configuration with revalidation tags
- CDN purge automation plan and trigger events
- Turborepo remote cache setup instructions
- Performance validation (cache hit ratios, TTFB targets)
