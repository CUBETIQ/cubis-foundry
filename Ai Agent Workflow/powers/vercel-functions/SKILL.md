---
name: vercel-functions
description: "Vercel Serverless and Edge Functions: core patterns, Node.js and Python runtimes, edge runtime, Fluid Compute for long-running tasks, and function configuration."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, serverless, functions, edge function, nodejs runtime, python runtime, fluid compute, function config, api route, edge runtime
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nodejs-best-practices, fastapi-expert, vercel-routing, vercel-caching
  consolidates: vercel-functions-core, vercel-functions-edge-runtime, vercel-functions-nodejs, vercel-functions-python, vercel-function-config, vercel-fluid-compute
---

# Vercel Functions

## Purpose

Design and implement Vercel Serverless and Edge Functions with the correct runtime selection, configuration, and compute strategy for each use case.

## When To Use

- Writing Vercel API routes or serverless function handlers.
- Choosing between Edge Runtime and Node.js runtime.
- Configuring Python serverless functions on Vercel.
- Implementing long-running tasks or streaming with Fluid Compute.
- Tuning function memory, regions, timeout, and concurrency config.

## Domain Areas

### Core Patterns

- Request/response handler structure for Vercel functions.
- Environment-aware error handling and status codes.
- Cold start mitigation strategies.

### Node.js Runtime

- Use `@vercel/node` and standard Node.js APIs.
- Streaming responses with `Response` and `ReadableStream`.

### Python Runtime

- Configure `requirements.txt` and handler conventions.
- Use WSGI/ASGI adapters where needed.

### Edge Runtime

- Use Web Standard APIs only (no Node.js built-ins).
- Optimize for global low-latency execution at the edge.
- Middleware-friendly patterns.

### Fluid Compute

- Enable for long-running tasks exceeding standard limits.
- Stream output progressively for large responses.
- Configure max duration and concurrency appropriately.

### Function Config (`vercel.json`)

- Set `runtime`, `regions`, `maxDuration`, `memory` per function.
- Use `rewrites` to map routes to specific functions.

## Operating Checklist

1. Choose runtime (Edge vs Node.js vs Python) based on latency, API, and duration needs.
2. Set explicit `maxDuration` and `memory` for non-default requirements.
3. Implement structured error responses with proper HTTP status codes.
4. Test cold-start behavior and streaming in staging environment.
5. Validate regional deployment targets match latency requirements.
6. Run regression checks before promoting to production.

## Output Contract

- Runtime selection rationale and tradeoffs
- Handler implementation with error handling and streaming
- `vercel.json` function config section
- Performance validation (cold start, p99 latency targets)
- Residual risks and follow-up actions
