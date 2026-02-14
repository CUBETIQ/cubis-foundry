# Deployment Strategies

## Vercel Deployment

### Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (auto-detects Next.js)
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

```bash
# Add via CLI
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

# Or via dashboard: Settings → Environment Variables
```

### vercel.json Configuration

```json
{
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

### Preview Deployments

- Every PR gets a unique preview URL automatically
- Preview deployments use `preview` environment variables
- Comment on PR with deployment URL

## Docker Deployment

### Dockerfile (multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### next.config.js for Docker

```js
module.exports = {
  output: "standalone", // Required for Docker
};
```

### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Self-Hosting (Node.js)

```bash
# Build
npm run build

# Start production server
npm start
# or
node .next/standalone/server.js
```

### PM2 Process Manager

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "node_modules/.bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

## Monitoring

### Error Tracking (Sentry)

```bash
npx @sentry/wizard@latest -i nextjs
```

```tsx
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Analytics

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Health Check Endpoint

```tsx
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 },
    );
  }
}
```

## Deployment Checklist

- [ ] Environment variables set for production
- [ ] `output: 'standalone'` if using Docker
- [ ] Error tracking configured (Sentry or similar)
- [ ] Analytics enabled
- [ ] Health check endpoint available
- [ ] HTTPS configured
- [ ] Security headers set (CSP, HSTS, etc.)
- [ ] Caching strategy verified
- [ ] Preview deployments working for PRs
- [ ] Rollback plan documented
