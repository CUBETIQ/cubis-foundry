# Example: Hybrid Search for Customer Support Knowledge Base

## Context

A SaaS company's support team uses an internal knowledge base with 8,000 articles. The current dense-only search fails on queries containing:
- Error codes: "ERR-4502", "TIMEOUT-3001"
- Product SKUs: "PRO-TEAM-50", "ENT-UNLIMITED"
- Configuration keys: "max_retry_count", "ssl_verify_mode"

These exact strings have no semantic meaning -- they are identifiers that must be matched lexically. The goal is to implement hybrid search that combines semantic understanding with exact keyword matching.

## Problem Analysis

Dense embeddings map text to a continuous vector space based on semantic meaning. The string "ERR-4502" has no inherent semantic content -- it is an arbitrary identifier. When a user searches for "ERR-4502 payment failed," the dense embedding captures "payment failed" but the error code gets mapped to a generic region of the embedding space, losing its specificity.

**Evidence from retrieval eval:**

| Query type | Dense Recall@5 | Dense MRR@5 |
|------------|---------------|-------------|
| Conceptual ("how to set up SSO") | 0.85 | 0.72 |
| Error code ("ERR-4502 payment") | 0.31 | 0.18 |
| SKU-specific ("PRO-TEAM-50 limits") | 0.28 | 0.15 |
| Config key ("max_retry_count") | 0.22 | 0.12 |

Dense search performs well on conceptual queries but fails dramatically on identifier-heavy queries.

## Hybrid Search Architecture

```
User Query: "ERR-4502 payment failed"
    |
    +---> [Dense Path]
    |       Embed query --> Qdrant dense search --> top-50
    |
    +---> [Sparse Path]
    |       BM25 tokenize --> Qdrant sparse search --> top-50
    |
    v
[Reciprocal Rank Fusion] --> merge top-50 + top-50 --> ranked list
    |
    v
[Cross-Encoder Re-ranker] --> top-5
    |
    v
[LLM Generation with context]
```

## Qdrant Configuration

Qdrant supports named vectors, allowing both dense and sparse vectors on the same point.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

# Create collection with both dense and sparse vectors
client.create_collection(
    collection_name="support_kb",
    vectors_config={
        "dense": models.VectorParams(
            size=1536,
            distance=models.Distance.COSINE
        )
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF  # TF-IDF weighting
        )
    }
)

# Create payload index for metadata filtering
client.create_payload_index(
    collection_name="support_kb",
    field_name="doc_type",
    field_schema=models.PayloadSchemaType.KEYWORD
)
client.create_payload_index(
    collection_name="support_kb",
    field_name="product",
    field_schema=models.PayloadSchemaType.KEYWORD
)
```

## Indexing Pipeline

```python
from fastembed import SparseTextEmbedding, TextEmbedding

dense_model = TextEmbedding("BAAI/bge-small-en-v1.5")
sparse_model = SparseTextEmbedding("Qdrant/bm25")

def index_document(doc: dict) -> None:
    chunks = chunk_document(doc)

    for chunk in chunks:
        # Generate dense embedding
        dense_vector = list(dense_model.embed([chunk["text"]]))[0].tolist()

        # Generate sparse embedding (BM25)
        sparse_result = list(sparse_model.embed([chunk["text"]]))[0]
        sparse_vector = models.SparseVector(
            indices=sparse_result.indices.tolist(),
            values=sparse_result.values.tolist()
        )

        # Upsert with both vector types
        client.upsert(
            collection_name="support_kb",
            points=[
                models.PointStruct(
                    id=chunk["id"],
                    vector={
                        "dense": dense_vector,
                        "sparse": sparse_vector
                    },
                    payload={
                        "text": chunk["text"],
                        "doc_type": chunk["metadata"]["doc_type"],
                        "product": chunk["metadata"]["product"],
                        "title": chunk["metadata"]["title"],
                        "url": chunk["metadata"]["url"]
                    }
                )
            ]
        )
```

## Query Pipeline

```python
def hybrid_search(
    query: str,
    top_k: int = 50,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
    rerank_top_n: int = 5
) -> list[dict]:
    # Dense retrieval
    dense_vector = list(dense_model.embed([query]))[0].tolist()
    dense_results = client.query_points(
        collection_name="support_kb",
        query=dense_vector,
        using="dense",
        limit=top_k,
        with_payload=True
    )

    # Sparse retrieval
    sparse_result = list(sparse_model.embed([query]))[0]
    sparse_vector = models.SparseVector(
        indices=sparse_result.indices.tolist(),
        values=sparse_result.values.tolist()
    )
    sparse_results = client.query_points(
        collection_name="support_kb",
        query=sparse_vector,
        using="sparse",
        limit=top_k,
        with_payload=True
    )

    # Reciprocal Rank Fusion
    fused = reciprocal_rank_fusion(
        dense_results=dense_results.points,
        sparse_results=sparse_results.points,
        dense_weight=dense_weight,
        sparse_weight=sparse_weight
    )

    # Cross-encoder re-ranking
    reranked = rerank_with_cross_encoder(query, fused[:20], top_n=rerank_top_n)

    return reranked
```

## Reciprocal Rank Fusion (RRF)

RRF merges two ranked lists by assigning each result a score based on its rank position, then summing scores across lists.

```python
def reciprocal_rank_fusion(
    dense_results: list,
    sparse_results: list,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
    k: int = 60
) -> list[dict]:
    """
    RRF score = sum(weight / (k + rank)) for each list the document appears in.
    k=60 is the standard constant that prevents high-ranked documents from dominating.
    """
    scores = {}

    for rank, result in enumerate(dense_results):
        doc_id = result.id
        rrf_score = dense_weight / (k + rank + 1)
        scores[doc_id] = scores.get(doc_id, {"score": 0, "payload": result.payload})
        scores[doc_id]["score"] += rrf_score

    for rank, result in enumerate(sparse_results):
        doc_id = result.id
        rrf_score = sparse_weight / (k + rank + 1)
        scores[doc_id] = scores.get(doc_id, {"score": 0, "payload": result.payload})
        scores[doc_id]["score"] += rrf_score

    # Sort by fused score descending
    fused = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)
    return [{"id": doc_id, **data} for doc_id, data in fused]
```

## Weight Tuning

The dense/sparse weight balance depends on query distribution. Use a retrieval eval set to find the optimal weights.

```python
def tune_weights(
    eval_queries: list[dict],
    weight_range: list[float] = [0.3, 0.4, 0.5, 0.6, 0.7]
) -> dict:
    """Grid search over dense weights. Sparse weight = 1 - dense weight."""
    best_mrr = 0
    best_dense_weight = 0.5

    for dw in weight_range:
        sw = 1.0 - dw
        mrr_scores = []

        for q in eval_queries:
            results = hybrid_search(q["query"], dense_weight=dw, sparse_weight=sw)
            mrr = compute_mrr(results, q["relevant_doc_ids"])
            mrr_scores.append(mrr)

        mean_mrr = statistics.mean(mrr_scores)
        if mean_mrr > best_mrr:
            best_mrr = mean_mrr
            best_dense_weight = dw

    return {
        "best_dense_weight": best_dense_weight,
        "best_sparse_weight": 1.0 - best_dense_weight,
        "best_mrr": best_mrr
    }
```

## Results After Hybrid Search

| Query type | Dense Recall@5 | Hybrid Recall@5 | Improvement |
|------------|---------------|-----------------|-------------|
| Conceptual | 0.85 | 0.87 | +2% |
| Error code | 0.31 | 0.82 | +51% |
| SKU-specific | 0.28 | 0.79 | +51% |
| Config key | 0.22 | 0.76 | +54% |
| **Overall** | **0.52** | **0.82** | **+30%** |

The dramatic improvement on identifier queries comes from BM25 matching exact strings. The slight improvement on conceptual queries comes from BM25 catching important keywords that dense search sometimes misses (e.g., specific product names).

## Key Takeaways

1. **Dense search is not enough.** Any corpus with identifiers, codes, or proper nouns needs a keyword matching component.
2. **RRF is robust.** Reciprocal Rank Fusion with k=60 works well out of the box and is less sensitive to weight tuning than linear combination.
3. **Weight tuning matters for edge cases.** The default 0.6/0.4 split was optimal overall, but error-code-heavy query distributions benefited from 0.4/0.6 (more sparse weight).
4. **Re-ranking is the precision layer.** Hybrid search improved recall dramatically. The cross-encoder re-ranker then improved MRR by reordering the top results for precision.
