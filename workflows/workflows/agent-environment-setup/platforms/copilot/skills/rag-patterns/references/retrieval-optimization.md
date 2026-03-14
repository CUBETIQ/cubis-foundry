# Retrieval Optimization

## Overview

Retrieval optimization improves the relevance of documents returned by the vector store before they reach the LLM. This reference covers re-ranking, query expansion, metadata filtering, contextual compression, and evaluation metrics that measure retrieval quality.

## Re-Ranking

### Why Re-Rank?

Vector similarity search optimizes for recall (find all potentially relevant documents) using bi-encoder embeddings that independently encode the query and document. A cross-encoder re-ranker jointly encodes the query AND document together, producing a much more accurate relevance score at the cost of higher latency.

**The retrieval funnel:**
1. Vector search returns top-50 (high recall, moderate precision).
2. Re-ranker reorders to top-5 (high precision).
3. LLM receives only the top-5 most relevant chunks.

### Cross-Encoder Re-Ranking

```python
import cohere

co = cohere.Client(os.environ["COHERE_API_KEY"])

def rerank(query: str, documents: list[dict], top_n: int = 5) -> list[dict]:
    """Re-rank using Cohere's cross-encoder model."""
    doc_texts = [d["text"] for d in documents]

    results = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=doc_texts,
        top_n=top_n,
        return_documents=True
    )

    reranked = []
    for r in results.results:
        original = documents[r.index]
        reranked.append({
            **original,
            "rerank_score": r.relevance_score
        })

    return reranked
```

### Re-Ranker Options

| Model | Provider | Latency (20 docs) | Quality | Cost |
|-------|----------|-------------------|---------|------|
| rerank-english-v3.0 | Cohere | ~200ms | High | $1/1K queries |
| rerank-multilingual-v3.0 | Cohere | ~250ms | High (multilingual) | $1/1K queries |
| bge-reranker-v2-m3 | BAAI | ~150ms (GPU) | High | Self-hosted |
| jina-reranker-v2 | Jina AI | ~180ms | High | $0.50/1K queries |
| flashrank | Open-source | ~50ms (CPU) | Medium | Free |

### When Re-Ranking Helps Most

- Queries where the top-1 result from vector search is wrong but the correct result is in the top-20.
- Queries with ambiguous terms where the embedding conflates multiple meanings.
- Long queries where the embedding averages over too much content.

### When Re-Ranking Does Not Help

- The correct document is not in the initial retrieval set at all (recall problem, not precision).
- The corpus is small enough that brute-force search returns near-perfect results.
- Latency budget is too tight for the additional cross-encoder pass.

## Query Expansion

Query expansion reformulates the user's query to improve recall.

### HyDE (Hypothetical Document Embeddings)

Generate a hypothetical answer to the query, embed the hypothetical answer, and use that embedding for retrieval. The hypothesis contains domain vocabulary that improves embedding alignment with relevant documents.

```python
async def hyde_retrieve(query: str, top_k: int = 50) -> list[dict]:
    """Use a hypothetical answer to improve retrieval."""
    hypothesis_prompt = f"""Answer this question in 2-3 sentences as if you were
a technical documentation page. Include specific technical terms.

Question: {query}"""

    hypothesis = await llm.generate(hypothesis_prompt)
    hypothesis_embedding = embed(hypothesis)

    return vector_store.query(
        vector=hypothesis_embedding,
        top_k=top_k
    )
```

**Trade-off:** HyDE adds one LLM call (~500ms) to the retrieval path. Use it for complex queries where direct embedding fails, not for every query.

### Multi-Query Retrieval

Generate multiple reformulations of the query, retrieve with each, and merge results.

```python
async def multi_query_retrieve(query: str, top_k: int = 50) -> list[dict]:
    reformulations = await generate_reformulations(query, n=3)

    all_results = {}
    for reformulation in [query] + reformulations:
        embedding = embed(reformulation)
        results = vector_store.query(vector=embedding, top_k=top_k)
        for r in results:
            if r["id"] not in all_results or r["score"] > all_results[r["id"]]["score"]:
                all_results[r["id"]] = r

    # Sort by best score across all queries
    merged = sorted(all_results.values(), key=lambda x: x["score"], reverse=True)
    return merged[:top_k]
```

### Query Decomposition

For complex queries, decompose into sub-queries and retrieve for each.

```python
async def decompose_and_retrieve(query: str) -> list[dict]:
    decomposition_prompt = f"""Break this question into 2-3 independent sub-questions
that together would fully answer the original question.

Question: {query}

Return one sub-question per line."""

    sub_queries = (await llm.generate(decomposition_prompt)).strip().split("\n")

    all_results = []
    for sub_query in sub_queries:
        results = await retrieve(sub_query, top_k=20)
        all_results.extend(results)

    # Deduplicate and re-rank
    unique_results = deduplicate_by_id(all_results)
    return rerank(query, unique_results, top_n=5)
```

## Metadata Filtering

Pre-filtering narrows the search space before vector similarity, improving both relevance and latency.

### Filter Before Search vs. Search Then Filter

| Approach | How it works | Pros | Cons |
|----------|-------------|------|------|
| Pre-filter | Apply metadata filter, then vector search within filtered set | Faster, more relevant | May miss relevant docs with unexpected metadata |
| Post-filter | Vector search first, then filter results | Broader recall | Wastes computation on filtered-out results |

**Recommendation:** Pre-filter when the metadata constraint is certain (e.g., user-selected product category). Post-filter when the metadata constraint is uncertain (e.g., auto-detected intent).

### Routing by Query Intent

```python
async def route_query(query: str) -> dict:
    """Classify query intent to select metadata filters."""
    routing_prompt = f"""Classify this query into one of these categories:
- api_reference: asking about specific API endpoints, parameters, or responses
- tutorial: asking how to accomplish a task step by step
- troubleshooting: reporting an error or problem
- conceptual: asking about architecture, design, or theory

Query: {query}
Category:"""

    category = (await llm.generate(routing_prompt)).strip().lower()

    filter_map = {
        "api_reference": {"doc_type": "api_reference"},
        "tutorial": {"doc_type": "tutorial"},
        "troubleshooting": {"doc_type": {"$in": ["troubleshooting", "faq"]}},
        "conceptual": {"doc_type": "conceptual"}
    }

    return filter_map.get(category, {})
```

## Contextual Compression

After retrieval, compress chunks to extract only the relevant portions.

```python
async def compress_context(query: str, chunks: list[dict]) -> list[dict]:
    """Extract only the relevant parts of each chunk."""
    compressed = []
    for chunk in chunks:
        prompt = f"""Extract ONLY the sentences from this passage that are relevant
to answering the question. If nothing is relevant, respond with "NOT_RELEVANT".

Question: {query}

Passage: {chunk['text']}

Relevant sentences:"""

        extracted = await llm.generate(prompt)
        if extracted.strip() != "NOT_RELEVANT":
            compressed.append({**chunk, "text": extracted.strip()})

    return compressed
```

**Trade-off:** Contextual compression adds one LLM call per chunk. Use it when the context window is tight and chunks contain a mix of relevant and irrelevant content.

## Evaluation Metrics

### Recall@K

What fraction of relevant documents appear in the top-K results?

```python
def recall_at_k(retrieved_ids: list[str], relevant_ids: set[str], k: int) -> float:
    top_k = set(retrieved_ids[:k])
    return len(top_k & relevant_ids) / len(relevant_ids) if relevant_ids else 0.0
```

### MRR@K (Mean Reciprocal Rank)

How high is the first relevant document in the ranked list?

```python
def mrr_at_k(retrieved_ids: list[str], relevant_ids: set[str], k: int) -> float:
    for i, doc_id in enumerate(retrieved_ids[:k]):
        if doc_id in relevant_ids:
            return 1.0 / (i + 1)
    return 0.0
```

### NDCG@K (Normalized Discounted Cumulative Gain)

How well does the ranking match the ideal ordering? Accounts for graded relevance.

```python
import math

def ndcg_at_k(retrieved_ids: list[str], relevance_scores: dict[str, float], k: int) -> float:
    dcg = sum(
        relevance_scores.get(doc_id, 0) / math.log2(i + 2)
        for i, doc_id in enumerate(retrieved_ids[:k])
    )
    ideal = sorted(relevance_scores.values(), reverse=True)[:k]
    idcg = sum(score / math.log2(i + 2) for i, score in enumerate(ideal))
    return dcg / idcg if idcg > 0 else 0.0
```

### Building an Eval Set

Minimum viable retrieval eval: 50-100 queries with labeled relevant documents.

| Eval set size | Confidence | Time to build | Use case |
|---------------|-----------|---------------|----------|
| 50 queries | Directional | 2-4 hours | Initial development |
| 200 queries | Confident | 1-2 days | Pre-launch validation |
| 500+ queries | High confidence | 3-5 days | Production monitoring |
