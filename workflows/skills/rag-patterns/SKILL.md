---
name: rag-patterns
description: "Use when designing or optimizing Retrieval-Augmented Generation systems: chunking strategies, embedding model selection, vector store configuration, retrieval optimization, hybrid search, re-ranking, and production RAG pipelines."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# RAG Patterns

## Purpose

Guide the design, implementation, and optimization of production-grade Retrieval-Augmented Generation pipelines. Every instruction ensures that documents are chunked for retrieval quality rather than convenience, embeddings capture semantic meaning, retrieval returns the most relevant context, and the generation model produces grounded answers.

## When to Use

- Designing a RAG pipeline for a new knowledge base or document corpus.
- Choosing a chunking strategy for a specific document type (code, legal, technical docs).
- Selecting and configuring embedding models for a domain.
- Setting up or migrating a vector store (Pinecone, Weaviate, Qdrant, pgvector, Chroma).
- Optimizing retrieval quality with re-ranking, hybrid search, or query expansion.
- Debugging RAG systems that produce hallucinated or irrelevant answers.
- Scaling RAG pipelines for latency, throughput, or cost constraints.

## Instructions

1. **Map the document corpus before choosing a chunking strategy** because the optimal chunk size and boundary rules depend on document structure. Code files need function-level chunks, legal documents need section-level, and conversations need turn-level. A universal chunk size wastes retrieval precision.

2. **Chunk at semantic boundaries, not fixed token counts** because splitting mid-sentence or mid-paragraph destroys the semantic coherence that embeddings rely on. Use headings, paragraph breaks, or AST nodes as natural boundaries, then enforce a token budget as a secondary constraint.

3. **Include overlap between adjacent chunks** because queries often match concepts that span a chunk boundary. 10-15% overlap ensures that boundary-spanning content appears in at least one chunk's embedding.

4. **Attach metadata to every chunk at ingestion time** because retrieval without filtering is a brute-force search. Metadata (source document, section title, date, author, document type) enables filtered retrieval that narrows the search space before vector similarity runs.

5. **Select embedding models based on domain benchmarks, not general leaderboards** because MTEB scores on Wikipedia do not predict performance on your legal contracts or API documentation. Run a retrieval eval on 50-100 representative queries from your domain before committing to a model.

6. **Normalize embedding dimensions when using cosine similarity** because unnormalized vectors distort similarity scores. Most vector stores handle this automatically, but verify the configuration to avoid silent precision loss.

7. **Choose the vector store based on operational requirements, not feature lists** because every store handles millions of vectors but they differ on filtering speed, multi-tenancy support, managed vs. self-hosted operations, and cost at scale. Match the store to your deployment model.

8. **Implement hybrid search combining dense vectors and sparse keyword matching** because dense embeddings excel at semantic similarity but miss exact keyword matches (product codes, error messages, proper nouns). BM25 or sparse vectors catch what dense search misses.

9. **Add a re-ranker between retrieval and generation** because the initial retrieval (top-50 by cosine similarity) optimizes for recall while the generation context window needs precision. A cross-encoder re-ranker reorders by relevance and lets you send only the top-5 to the LLM.

10. **Limit the context window to the most relevant chunks** because stuffing 20 chunks into the prompt dilutes the signal and increases latency and cost. Fewer, higher-quality chunks produce better answers than more, lower-quality ones.

11. **Include source citations in the generation prompt** because grounded answers with traceable citations allow users to verify claims and build trust. Instruct the LLM to reference chunk IDs or document titles in its response.

12. **Build a retrieval evaluation set before optimizing** because retrieval improvements without measurement are guesswork. A set of 50-100 queries with known-relevant documents enables Recall@K and MRR metrics that quantify every change.

13. **Monitor retrieval quality in production with user feedback signals** because offline evals do not capture distribution shift. Track "thumbs down" rates, query reformulations, and zero-result queries to detect degradation.

14. **Cache frequent queries and their retrieval results** because identical or near-identical queries hitting the vector store on every request waste latency and compute. Semantic caching (embedding the query and checking cache similarity) reduces redundant retrievals.

15. **Version your ingestion pipeline alongside the embedding model** because re-indexing is expensive and a model change without full re-indexing creates a mixed-embedding index where similarity scores are meaningless across model versions.

16. **Plan for re-indexing from day one** because embedding models improve, chunking strategies evolve, and metadata schemas change. A pipeline that cannot re-index the full corpus within a maintenance window becomes a legacy liability.

## Output Format

Provide architecture diagrams as ASCII or Mermaid, configuration snippets for vector stores and embedding models, chunking implementation code, retrieval pipeline code, and evaluation results as metric tables.

## References

| File | Load when |
| --- | --- |
| `references/chunking.md` | Designing chunking strategies for specific document types. |
| `references/embedding-models.md` | Selecting, configuring, or fine-tuning embedding models. |
| `references/vector-stores.md` | Choosing, configuring, or migrating vector stores. |
| `references/retrieval-optimization.md` | Improving retrieval quality with re-ranking, query expansion, or filtering. |
| `references/hybrid-search.md` | Implementing hybrid dense + sparse search pipelines. |
