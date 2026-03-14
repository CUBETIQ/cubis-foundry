# Embedding Models

## Overview

The embedding model maps text to dense vectors that capture semantic meaning. Model selection determines retrieval quality, cost, latency, and storage requirements. This reference covers model comparison, selection criteria, fine-tuning, and operational considerations.

## Model Comparison (2025)

| Model | Provider | Dimensions | Max Tokens | MTEB Avg | Cost (per 1M tokens) | Latency (batch) |
|-------|----------|------------|------------|----------|----------------------|-----------------|
| text-embedding-3-large | OpenAI | 3072 (configurable) | 8,191 | 64.6 | $0.13 | ~1.5s/100 items |
| text-embedding-3-small | OpenAI | 1536 | 8,191 | 62.3 | $0.02 | ~0.8s/100 items |
| voyage-3 | Voyage AI | 1024 | 32,000 | 67.1 | $0.06 | ~1.2s/100 items |
| voyage-3-lite | Voyage AI | 512 | 32,000 | 63.2 | $0.02 | ~0.6s/100 items |
| embed-v3.0 | Cohere | 1024 | 512 | 64.5 | $0.10 | ~1.0s/100 items |
| bge-large-en-v1.5 | BAAI | 1024 | 512 | 63.9 | Self-hosted | Depends on GPU |
| jina-embeddings-v3 | Jina AI | 1024 | 8,192 | 65.5 | $0.02 | ~1.0s/100 items |
| nomic-embed-text-v1.5 | Nomic | 768 | 8,192 | 62.8 | Free (open-source) | Self-hosted |

**Note:** MTEB scores are general-purpose benchmarks. Domain-specific performance can differ by 10-20 points. Always benchmark on your own data.

## Selection Criteria

### Quality vs. Cost Trade-off

For most production RAG systems, the embedding model is NOT the bottleneck for answer quality. The gap between the best and worst models on this table is ~5 MTEB points, while chunking strategy and retrieval pipeline design have much larger impact.

**Recommendation:** Start with `text-embedding-3-small` (cheapest, strong quality) and only upgrade if retrieval eval shows the embedding model is the limiting factor.

### Dimension Count and Storage

Higher dimensions capture more semantic nuance but increase storage and query cost:

| Dimensions | Vector size (bytes) | 1M vectors storage | Query latency impact |
|------------|--------------------|--------------------|---------------------|
| 384 | 1,536 | ~1.5 GB | Fastest |
| 768 | 3,072 | ~3.0 GB | Fast |
| 1024 | 4,096 | ~4.0 GB | Moderate |
| 1536 | 6,144 | ~6.0 GB | Moderate |
| 3072 | 12,288 | ~12.0 GB | Slower |

**OpenAI dimension reduction:** `text-embedding-3-large` supports `dimensions` parameter to reduce from 3072 to any lower value. Testing shows 1536 retains 98% of quality at half the storage.

```python
response = client.embeddings.create(
    model="text-embedding-3-large",
    input=["example text"],
    dimensions=1536  # Reduce from 3072
)
```

### Context Window

Models with large context windows (voyage-3 at 32K, jina-v3 at 8K) can embed entire documents or large chunks. However, larger inputs produce embeddings that average over more content, which can dilute topic-specific signal.

**Guideline:** Even with large-context models, keep chunks in the 256-512 token range for optimal retrieval. Use the large context window for late-interaction models or when you need to embed full documents for classification (not retrieval).

## Domain-Specific Benchmarking

### Building a Retrieval Eval Set

```python
def build_eval_set(queries_with_relevance: list[dict]) -> list[dict]:
    """
    Each item: {
        "query": "How do I authenticate?",
        "relevant_chunk_ids": ["chunk-auth-001", "chunk-auth-002"],
        "irrelevant_chunk_ids": ["chunk-billing-001"]  # optional hard negatives
    }
    """
    return queries_with_relevance

def evaluate_model(
    model_fn,
    eval_set: list[dict],
    chunk_embeddings: dict[str, list[float]],
    k: int = 5
) -> dict:
    """Compute Recall@K and MRR@K for a given embedding model."""
    recall_scores = []
    mrr_scores = []

    for item in eval_set:
        query_embedding = model_fn(item["query"])
        ranked = rank_by_similarity(query_embedding, chunk_embeddings, top_k=k)
        ranked_ids = [r["id"] for r in ranked]

        relevant = set(item["relevant_chunk_ids"])
        hits = [1 if rid in relevant else 0 for rid in ranked_ids]

        recall_scores.append(sum(hits) / len(relevant))
        mrr = next((1.0 / (i + 1) for i, h in enumerate(hits) if h), 0.0)
        mrr_scores.append(mrr)

    return {
        "recall_at_k": statistics.mean(recall_scores),
        "mrr_at_k": statistics.mean(mrr_scores)
    }
```

### Interpretation

| Metric | Threshold | Action |
|--------|-----------|--------|
| Recall@5 > 0.85 | Good | Embedding model is sufficient. Focus optimization elsewhere. |
| Recall@5 0.70-0.85 | Acceptable | Try hybrid search or re-ranking before changing the model. |
| Recall@5 < 0.70 | Poor | Consider a larger model, domain fine-tuning, or hybrid search. |

## Fine-Tuning Embeddings

Fine-tuning adapts a pre-trained embedding model to your domain's vocabulary and similarity patterns. It is most valuable when:
- Your domain has specialized terminology (medical, legal, financial).
- General-purpose models confuse domain-specific concepts.
- You have labeled retrieval pairs (query, relevant_document).

### Synthetic Training Data

If you lack labeled pairs, generate them from your corpus:

```python
def generate_training_pairs(chunks: list[dict], llm) -> list[dict]:
    """Generate (question, relevant_chunk) pairs using an LLM."""
    pairs = []
    for chunk in chunks:
        prompt = f"""Given this text passage, generate 3 questions that this passage would answer.
Return only the questions, one per line.

Passage: {chunk['text']}"""
        questions = llm.generate(prompt).strip().split("\n")
        for q in questions:
            pairs.append({
                "query": q.strip(),
                "positive": chunk["text"],
                "negative": random.choice([c["text"] for c in chunks if c["id"] != chunk["id"]])
            })
    return pairs
```

### Fine-Tuning with Sentence Transformers

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

train_examples = [
    InputExample(texts=[pair["query"], pair["positive"], pair["negative"]])
    for pair in training_pairs
]

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
train_loss = losses.TripletLoss(model=model)

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    warmup_steps=100,
    output_path="models/domain-tuned-bge"
)
```

## Operational Considerations

### Embedding Versioning

When you change the embedding model, ALL existing vectors become incompatible. You must re-index the entire corpus.

**Strategy:** Include the model name in the vector store index/collection name:

```
support_kb_bge_small_v1  --> current
support_kb_voyage3_v1    --> migration target
```

Run both indices in parallel during migration, verify retrieval quality on the new index, then switch over.

### Batching and Rate Limits

```python
import asyncio
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(min=1, max=60), stop=stop_after_attempt(5))
async def embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Embed texts in batches with retry and rate limit handling."""
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        all_embeddings.extend([d.embedding for d in response.data])

    return all_embeddings
```

### Cost Estimation

| Corpus size (tokens) | text-embedding-3-small | text-embedding-3-large | voyage-3 |
|---------------------|----------------------|----------------------|----------|
| 10M | $0.20 | $1.30 | $0.60 |
| 100M | $2.00 | $13.00 | $6.00 |
| 1B | $20.00 | $130.00 | $60.00 |

These are one-time ingestion costs. Query embedding costs are negligible (single queries are fractions of a cent).
