# Vector Stores

## Overview

The vector store is the persistence and retrieval engine for embeddings. Choosing the right store depends on scale, query patterns, operational model (managed vs. self-hosted), and feature requirements (filtering, multi-tenancy, hybrid search). This reference compares major options and provides configuration guidance.

## Comparison Matrix

| Store | Type | Max vectors | Filtering | Hybrid search | Multi-tenancy | Managed option | Open-source |
|-------|------|-------------|-----------|---------------|---------------|----------------|-------------|
| Pinecone | Managed SaaS | Billions | Metadata filters | Sparse vectors | Namespaces | Yes (only) | No |
| Qdrant | Self-hosted / Cloud | Billions | Payload filters | Named sparse vectors | Collection-level | Qdrant Cloud | Yes |
| Weaviate | Self-hosted / Cloud | Billions | GraphQL filters | BM25 built-in | Class-level | Weaviate Cloud | Yes |
| pgvector | PostgreSQL extension | Millions | SQL WHERE | Full-text search via pg | PostgreSQL schemas | Any PG host | Yes |
| Chroma | Embedded / Client-server | Millions | Metadata filters | No native | Collection-level | No | Yes |
| Milvus | Self-hosted / Cloud | Billions | Expression filters | Sparse vectors | Partition-level | Zilliz Cloud | Yes |

## Selection Guide

### When to Choose Pinecone

- You want zero operational overhead and are willing to pay for managed infrastructure.
- Your query patterns are standard (vector similarity + metadata filtering).
- You need serverless scaling that handles burst traffic automatically.
- You do NOT need self-hosted deployment for data residency.

### When to Choose Qdrant

- You need hybrid search with native sparse vector support.
- You want the flexibility of self-hosted with a cloud option for production.
- You need rich payload filtering with indexed fields.
- You want gRPC for high-throughput batch operations.

### When to Choose pgvector

- Your application already uses PostgreSQL and you want to avoid adding another service.
- Your corpus is under 5 million vectors.
- You need transactional consistency between vector operations and relational data.
- You want to leverage existing PostgreSQL tooling (backups, monitoring, replication).

### When to Choose Weaviate

- You want built-in hybrid search (BM25 + vector) without managing a separate sparse index.
- You use GraphQL heavily and want a native GraphQL query API.
- You need built-in vectorization modules (bring your own model or use integrated ones).

### When to Choose Chroma

- You are prototyping or building a local development environment.
- Your corpus is small (under 1 million vectors).
- You want an embedded store that runs in-process with no external dependencies.

## Pinecone Configuration

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

# Create index
pc.create_index(
    name="knowledge-base",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)

index = pc.Index("knowledge-base")

# Upsert with metadata
index.upsert(
    vectors=[
        {
            "id": "chunk-001",
            "values": embedding_vector,
            "metadata": {
                "doc_type": "api_reference",
                "product": "payments",
                "version": "2.1",
                "text": chunk_text[:40960]  # Pinecone metadata limit
            }
        }
    ],
    namespace="production"
)

# Query with metadata filter
results = index.query(
    vector=query_embedding,
    top_k=50,
    filter={
        "doc_type": {"$eq": "api_reference"},
        "version": {"$gte": "2.0"}
    },
    include_metadata=True,
    namespace="production"
)
```

## pgvector Configuration

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    doc_type TEXT NOT NULL,
    title TEXT,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create IVFFlat index for approximate nearest neighbor search
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- For higher accuracy at the cost of slower index build, use HNSW
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Query with filter
SELECT id, text, doc_type, title,
       1 - (embedding <=> $1::vector) AS similarity
FROM chunks
WHERE doc_type = 'api_reference'
ORDER BY embedding <=> $1::vector
LIMIT 50;
```

### pgvector Performance Tuning

```sql
-- Increase work_mem for vector operations
SET work_mem = '256MB';

-- For IVFFlat: set probes (higher = more accurate, slower)
SET ivfflat.probes = 10;  -- Default 1, recommended 5-20

-- For HNSW: set ef_search (higher = more accurate, slower)
SET hnsw.ef_search = 100;  -- Default 40, recommended 64-200
```

### pgvector Scaling Limits

| Metric | Recommended limit | Beyond this |
|--------|-------------------|-------------|
| Vector count | 5 million | Consider dedicated vector store |
| Dimensions | 2000 | Performance degrades significantly |
| Concurrent queries | 50 | Connection pooling required |
| Index build time | 30 min for 1M vectors | Plan for maintenance windows |

## Qdrant Configuration

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key=os.environ["QDRANT_API_KEY"]
)

# Create collection with HNSW configuration
client.create_collection(
    collection_name="knowledge_base",
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE,
        on_disk=True  # For large collections, store vectors on disk
    ),
    hnsw_config=models.HnswConfigDiff(
        m=16,
        ef_construct=200,
        full_scan_threshold=10000
    ),
    optimizers_config=models.OptimizersConfigDiff(
        indexing_threshold=20000  # Start indexing after 20K points
    )
)

# Create payload indices for fast filtering
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="doc_type",
    field_schema=models.PayloadSchemaType.KEYWORD
)

# Query with payload filter
results = client.query_points(
    collection_name="knowledge_base",
    query=query_embedding,
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="doc_type",
                match=models.MatchValue(value="api_reference")
            )
        ]
    ),
    limit=50,
    with_payload=True
)
```

## Index Types and Trade-offs

| Index type | Build time | Query speed | Memory | Accuracy | Best for |
|-----------|-----------|-------------|--------|----------|----------|
| Flat (brute force) | None | Slow (O(n)) | Low | 100% | < 10K vectors |
| IVFFlat | Medium | Fast | Medium | 95-99% | 10K - 1M vectors |
| HNSW | Slow | Fastest | High | 98-99.5% | > 100K vectors, low latency |
| PQ (Product Quantization) | Slow | Fast | Lowest | 90-95% | > 10M vectors, memory constrained |

## Multi-Tenancy Patterns

### Namespace Isolation (Pinecone)

Each tenant gets a namespace within the same index. Cheap to create, queries are scoped by namespace.

### Collection Per Tenant (Qdrant, Weaviate)

Each tenant gets a separate collection. Strong isolation but higher resource overhead.

### Metadata Filtering (All Stores)

All tenants share an index with a `tenant_id` metadata field. Cheapest but relies on filter performance.

**Recommendation:** Use metadata filtering for < 100 tenants, namespace isolation for 100-10K tenants, and collection-per-tenant for tenants with strict data isolation requirements.

## Backup and Recovery

- **Pinecone:** Managed backups via collections API. Restore creates a new index.
- **Qdrant:** Snapshot API for full collection backup. Restore from snapshot.
- **pgvector:** Standard PostgreSQL backup (pg_dump). Full transactional consistency.
- **Weaviate:** Backup API with S3/GCS targets.

Always test restore procedures before production deployment. A backup you have never restored is not a backup.
