---
name: vercel-storage
description: "Vercel Storage solutions: Blob for file storage, Marketplace Postgres, Marketplace Redis, and storage migration strategies between providers."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, storage, blob, postgres, redis, kv, storage migration, file upload, vercel blob, vercel postgres, vercel redis
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: database-design, database-optimizer, vercel-functions, vercel-deployments
  consolidates: vercel-blob, vercel-marketplace-storage-postgres, vercel-marketplace-storage-redis, vercel-storage-migrations
---

# Vercel Storage

## Purpose
Implement and manage Vercel Storage solutions including Blob for file/object storage, Marketplace Postgres for relational data, Marketplace Redis for caching/session state, and strategies for migrating between storage providers.

## When To Use
- Storing user-uploaded files, assets, or binary objects with Vercel Blob.
- Provisioning a managed Postgres database via Vercel Marketplace.
- Using managed Redis for session storage, caching, or pub/sub.
- Migrating existing storage workloads onto or off Vercel-managed storage.

## Domain Areas

### Vercel Blob
- Upload, list, and delete blobs with `@vercel/blob` SDK.
- Client-side uploads using multipart upload tokens.
- Set Content-Type, cache-control, and access control.
- Integrate blob URLs with CDN delivery.

### Marketplace Postgres
- Provision and connect via `POSTGRES_URL` environment variable.
- Use with Prisma, Drizzle, or `pg`/`postgres` client.
- Connection pooling with Vercel Postgres connection pool.
- Schema migrations and backup strategy.

### Marketplace Redis
- Connect via `KV_URL` / `REDIS_URL` environment variable.
- Use `@vercel/kv` SDK or `ioredis` for session state, queues, and rate limiting.
- Understand persistence and eviction policy defaults.
- Multi-region replication considerations.

### Storage Migrations
- Audit current storage usage volume and access patterns.
- Plan zero-downtime migration with dual-write phase.
- Validate data integrity post-migration before cutover.

## Operating Checklist
1. Choose storage type based on access pattern (object vs relational vs KV).
2. Inject connection strings via environment variables (never hard-code).
3. Set appropriate TTL/eviction policies for Redis.
4. Validate connection pooling config for Postgres under load.
5. Run migration dry-run and verify checksums before full cutover.
6. Enable auto-backup or export schedule for production data.

## Output Contract
- Storage selection rationale and architecture
- SDK integration code and environment variable setup
- Connection pooling and scaling configuration
- Migration plan with dry-run and rollback steps
- Residual risks and data integrity validation evidence
