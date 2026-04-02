# SvelteKit Deployment Reference

## Adapters

| Adapter | Target | SSR | Edge |
|---------|--------|-----|------|
| `adapter-node` | Node.js server | Yes | No |
| `adapter-vercel` | Vercel | Yes | Yes |
| `adapter-cloudflare` | Cloudflare Pages | Yes | Yes |
| `adapter-static` | Static hosting | No (SSG) | No |
| `adapter-auto` | Auto-detect platform | Yes | Depends |

## Configuration

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
export default {
  kit: {
    adapter: adapter({ out: 'build', precompress: true, envPrefix: 'APP_' })
  }
};
```

**Vercel:** `adapter-vercel({ runtime: 'nodejs20.x', regions: ['iad1'], split: true })`
**Cloudflare:** `adapter-cloudflare({ routes: { include: ['/*'], exclude: ['<all>'] } })`
**Static:** `adapter-static({ fallback: '404.html', precompress: true })`

## Environment Variables

```typescript
import { DATABASE_URL } from '$env/static/private';   // server-only, build-time
import { PUBLIC_API_URL } from '$env/static/public';   // everywhere, build-time
import { env } from '$env/dynamic/private';             // server-only, runtime
```

Prefix public vars with `PUBLIC_` in `.env`. SvelteKit loads `.env`, `.env.local`, `.env.[mode]`.

## Prerendering (SSG)

```typescript
// Per-route
export const prerender = true;

// Dynamic entries
export const entries: EntryGenerator = async () => {
  const posts = await fetchAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
};
```

Configure crawling in `svelte.config.js`: `kit.prerender.entries`, `crawl: true`.

## Production Optimization

**Compression:** `adapter({ precompress: true })` generates gzip + brotli files.

**Cache headers** in `hooks.server.ts`:

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  if (event.url.pathname.startsWith('/_app/'))
    response.headers.set('cache-control', 'public, max-age=31536000, immutable');
  return response;
};
```

## Node.js Deployment

```bash
npm run build && node build/index.js
```

Environment: `HOST=0.0.0.0`, `PORT=3000`, `ORIGIN=https://example.com` (required for CSRF).

### Docker

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY package.json .
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "build/index.js"]
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 403 on form submit | Set `ORIGIN` env var to match domain |
| Missing env vars at runtime | Use `$env/dynamic` or rebuild |
| 404 on refresh (static) | Set `fallback` in adapter-static |
| Slow cold start (Vercel) | Use `split: true` for per-route functions |
