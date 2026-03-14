# Hybrid Search

## Overview

Hybrid search combines dense vector search (semantic similarity) with sparse keyword search (lexical matching) to capture both conceptual relevance and exact term matches. This reference covers architecture, fusion algorithms, sparse representations, and tuning strategies.

## Why Hybrid Search

Dense embeddings encode semantic meaning but lose lexical precision. Sparse search preserves exact terms but misses semantic similarity. Hybrid search gets the best of both.

| Query type | Dense search | Sparse search | Hybrid search |
|-----------|-------------|---------------|---------------|
| "how to authenticate" | Strong (semantic) | Moderate | Strong |
| "ERR-4502 payment failed" | Weak (identifier) | Strong (exact match) | Strong |
| "configure max_retries" | Moderate | Strong (exact term) | Strong |
| "best practices for security" | Strong (semantic) | Weak (too generic) | Strong |

## Architecture Patterns

### Pattern 1: Parallel Retrieval + Fusion

Run dense and sparse searches independently, then merge results.

```
Query --> [Dense Retriever] --> top-K dense results --|
   |                                                   |--> [Fusion] --> [Re-ranker] --> top-N
   +--> [Sparse Retriever] --> top-K sparse results --|
```

**Pros:** Each retriever is independent and can be optimized separately.
**Cons:** Two index lookups per query. Higher latency.

### Pattern 2: Native Hybrid (Vector Store Built-in)

Some vector stores support both dense and sparse vectors natively.

```
Query --> [Vector Store with native hybrid] --> fused results --> [Re-ranker] --> top-N
```

**Supported stores:** Qdrant (named vectors), Weaviate (BM25 + vector), Pinecone (sparse-dense), Milvus (sparse vectors).

**Pros:** Single query, lower latency, fusion happens inside the store.
**Cons:** Tied to the store's fusion algorithm and configuration.

### Pattern 3: Late Interaction

Models like ColBERT produce token-level embeddings for both query and document. Similarity is computed by matching individual token embeddings.

```
Query tokens --> [ColBERT encoder] --> per-token embeddings --|
                                                               |--> [MaxSim] --> relevance score
Document tokens --> [ColBERT encoder] --> per-token embeddings --|
```

**Pros:** Captures both semantic and lexical matching at the token level.
**Cons:** Higher storage (one vector per token) and more complex infrastructure.

## Sparse Representations

### BM25

The classic term-frequency inverse-document-frequency scoring function. No neural network involved.

```python
from rank_bm25 import BM25Okapi

class BM25Index:
    def __init__(self, documents: list[str]):
        tokenized = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized)
        self.documents = documents

    def search(self, query: str, top_k: int = 50) -> list[dict]:
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)
        top_indices = scores.argsort()[-top_k:][::-1]

        return [
            {"index": int(i), "text": self.documents[i], "score": float(scores[i])}
            for i in top_indices
            if scores[i] > 0
        ]
```

**When to use:** Default choice for the sparse component. Simple, effective, no GPU needed.

### SPLADE (Sparse Lexical and Expansion)

A learned sparse representation that expands terms using a neural network. Bridges the gap between BM25 and dense embeddings.

```python
from fastembed import SparseTextEmbedding

sparse_model = SparseTextEmbedding("Qdrant/bm25")  # or "prithivida/SPLADE_PP_en_v1"

def get_sparse_embedding(text: str):
    result = list(sparse_model.embed([text]))[0]
    return {
        "indices": result.indices.tolist(),
        "values": result.values.tolist()
    }
```

**When to use:** When BM25 is insufficient because queries use different terminology than documents (term mismatch problem). SPLADE's learned expansion adds related terms.

### Comparison

| Method | Term expansion | GPU required | Quality | Latency |
|--------|---------------|-------------|---------|---------|
| BM25 | No | No | Good for exact match | < 10ms |
| SPLADE | Yes (learned) | Yes (inference) | Better for paraphrases | 20-50ms |
| TF-IDF | No | No | Baseline | < 10ms |

## Fusion Algorithms

### Reciprocal Rank Fusion (RRF)

RRF combines ranked lists by scoring each document based on its rank position.

```python
def reciprocal_rank_fusion(
    ranked_lists: list[list[dict]],
    weights: list[float] = None,
    k: int = 60
) -> list[dict]:
    """
    RRF formula: score(d) = sum(weight_i / (k + rank_i(d))) for each list i.

    k=60 is the standard constant from the original RRF paper (Cormack et al., 2009).
    It dampens the advantage of high-ranked documents, making fusion more robust.
    """
    if weights is None:
        weights = [1.0] * len(ranked_lists)

    scores = {}
    payloads = {}

    for list_idx, ranked_list in enumerate(ranked_lists):
        for rank, doc in enumerate(ranked_list):
            doc_id = doc["id"]
            rrf_score = weights[list_idx] / (k + rank + 1)
            scores[doc_id] = scores.get(doc_id, 0) + rrf_score
            payloads[doc_id] = doc

    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [
        {**payloads[doc_id], "fusion_score": scores[doc_id]}
        for doc_id in sorted_ids
    ]
```

**Advantages:** Robust to score scale differences between retrievers. No normalization needed.
**Disadvantages:** Ignores the actual scores, only uses rank positions. A document with a very high sparse score gets the same RRF contribution as one barely making the list.

### Convex Combination (Weighted Sum)

Directly combine normalized scores from each retriever.

```python
def weighted_fusion(
    dense_results: list[dict],
    sparse_results: list[dict],
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4
) -> list[dict]:
    """Combine normalized scores with configurable weights."""
    # Normalize scores to [0, 1]
    dense_max = max(r["score"] for r in dense_results) if dense_results else 1
    sparse_max = max(r["score"] for r in sparse_results) if sparse_results else 1

    scores = {}
    payloads = {}

    for r in dense_results:
        doc_id = r["id"]
        scores[doc_id] = dense_weight * (r["score"] / dense_max)
        payloads[doc_id] = r

    for r in sparse_results:
        doc_id = r["id"]
        sparse_norm = sparse_weight * (r["score"] / sparse_max)
        scores[doc_id] = scores.get(doc_id, 0) + sparse_norm
        if doc_id not in payloads:
            payloads[doc_id] = r

    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [
        {**payloads[doc_id], "fusion_score": scores[doc_id]}
        for doc_id in sorted_ids
    ]
```

**Advantages:** Preserves score magnitude. A very high-confidence dense match can outweigh many marginal sparse matches.
**Disadvantages:** Sensitive to score normalization. Different retrievers produce scores on different scales.

### Which Fusion to Use

| Scenario | Recommended fusion | Rationale |
|----------|-------------------|-----------|
| General-purpose hybrid search | RRF | Robust to scale differences, good default. |
| Tuned production system | Weighted sum | More control when you have eval data to tune weights. |
| More than 2 retrievers | RRF | Scales naturally to N lists without N-way normalization. |
| One retriever dominates | Weighted sum | Can give 0.8/0.2 weight to favor the stronger retriever. |

## Weight Tuning

### Grid Search

```python
def tune_hybrid_weights(eval_set: list[dict], weight_grid: list[float]) -> dict:
    best_config = {"dense_weight": 0.5, "mrr": 0.0}

    for dw in weight_grid:
        sw = 1.0 - dw
        mrr_scores = []

        for item in eval_set:
            results = hybrid_search(
                item["query"],
                dense_weight=dw,
                sparse_weight=sw
            )
            mrr = compute_mrr(results, item["relevant_ids"])
            mrr_scores.append(mrr)

        mean_mrr = statistics.mean(mrr_scores)
        if mean_mrr > best_config["mrr"]:
            best_config = {"dense_weight": dw, "sparse_weight": sw, "mrr": mean_mrr}

    return best_config
```

### Adaptive Weights by Query Type

Different query types benefit from different weight balances:

```python
def adaptive_weights(query: str) -> tuple[float, float]:
    """Heuristic: if query contains identifiers, boost sparse weight."""
    identifier_patterns = [
        r'[A-Z]{2,}-\d+',        # Error codes: ERR-4502
        r'[A-Z]+-[A-Z]+-\d+',    # SKUs: PRO-TEAM-50
        r'[a-z_]+\.[a-z_]+',     # Config: ssl.verify_mode
        r'v\d+\.\d+',            # Versions: v2.1
    ]

    has_identifier = any(re.search(p, query) for p in identifier_patterns)

    if has_identifier:
        return (0.3, 0.7)  # Favor sparse for identifier queries
    else:
        return (0.7, 0.3)  # Favor dense for conceptual queries
```

## Production Considerations

### Latency Budget

| Component | Typical latency | Notes |
|-----------|----------------|-------|
| Dense embedding | 20-50ms | API call to embedding service |
| Dense search | 10-30ms | Vector store query |
| Sparse search | 5-15ms | BM25 or sparse vector query |
| Fusion | < 1ms | In-memory merge |
| Re-ranking | 100-300ms | Cross-encoder on top-20 |
| **Total** | **150-400ms** | Before LLM generation |

### Monitoring

Track these metrics in production:

1. **Retrieval latency p95** -- catch degradation from index growth.
2. **Zero-result rate** -- queries that return no results indicate coverage gaps.
3. **Dense-only vs. hybrid overlap** -- if 95% of results are identical, sparse search is not contributing.
4. **Re-ranker inversion rate** -- how often the re-ranker changes the top-1 result. Low inversion means the initial retrieval is already good.

### Fallback Strategy

If one retriever fails (API timeout, index corruption), the system should degrade to the other rather than returning no results.

```python
async def resilient_hybrid_search(query: str) -> list[dict]:
    try:
        dense_results = await dense_search(query)
    except Exception:
        dense_results = []
        logger.warning("Dense search failed, falling back to sparse-only")

    try:
        sparse_results = await sparse_search(query)
    except Exception:
        sparse_results = []
        logger.warning("Sparse search failed, falling back to dense-only")

    if not dense_results and not sparse_results:
        raise RetrievalError("Both retrievers failed")

    return fuse(dense_results, sparse_results)
```
