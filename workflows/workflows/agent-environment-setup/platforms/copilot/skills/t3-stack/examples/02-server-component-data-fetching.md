# Example: Server Component Data Fetching with tRPC

## Scenario

A dashboard page needs to display the current user's projects with task counts. The page is a React Server Component that should fetch data on the server without a client-side round-trip. The page also has a client component sidebar that needs to subscribe to real-time updates.

## Prompt

"Show me how to fetch tRPC data in a Next.js App Router server component and hydrate it for a client component that needs the same data."

## Expected Output

### Server-side tRPC Caller Setup

```typescript
// src/trpc/server.ts
import "server-only";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";
import { createCaller, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

const getQueryClient = cache(createQueryClient);

const caller = createCaller(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createTRPCContext({ headers: heads });
});

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
```

### Server Component (Dashboard Page)

```typescript
// src/app/dashboard/page.tsx
import { api, HydrateClient } from "~/trpc/server";
import { ProjectList } from "./_components/project-list";
import { Sidebar } from "./_components/sidebar";

export default async function DashboardPage() {
  // Server-side fetch — no network round-trip
  const projects = await api.project.listMine();

  // Prefetch for client components that need the same data
  void api.project.listMine.prefetch();

  return (
    <HydrateClient>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <h1 className="mb-6 text-2xl font-bold">My Projects</h1>
          <ProjectList initialProjects={projects} />
        </main>
      </div>
    </HydrateClient>
  );
}
```

### Client Component (with React Query)

```typescript
// src/app/dashboard/_components/sidebar.tsx
"use client";

import { api } from "~/trpc/react";

export function Sidebar() {
  // Uses prefetched data from the server — no loading state on first render
  const { data: projects } = api.project.listMine.useQuery(undefined, {
    refetchInterval: 30_000, // Poll for updates every 30s
  });

  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">
        Projects
      </h2>
      <ul className="space-y-2">
        {projects?.map((project) => (
          <li key={project.id} className="rounded-md px-3 py-2 hover:bg-gray-100">
            <span className="text-sm font-medium">{project.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              {project._count.tasks} tasks
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

## Key Decisions

- **`HydrateClient` wrapper** — dehydrates server-fetched data into the HTML so client components can use it without a second fetch.
- **`void api.project.listMine.prefetch()`** — prefetches into the query cache but does not block rendering. The sidebar picks up the cached data.
- **Server component does direct call, client component does `useQuery`** — same data, different access patterns. Server gets it synchronously; client gets cache + refetch.
- **`refetchInterval: 30_000`** — lightweight polling for near-real-time without WebSocket complexity. Suitable for dashboards where 30-second staleness is acceptable.
- **Tailwind utility classes throughout** — consistent with T3 Stack defaults. No CSS modules or styled-components needed.
