# RAG Patterns Eval Assertions

## Eval 1: Chunking Strategy for Technical Docs

This eval tests the skill's ability to design a document-type-aware chunking strategy with proper semantic boundaries, overlap, metadata, and size constraints.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `semantic boundary` -- structure-aware chunking | Fixed-size chunking destroys document structure. Technical docs have headings, sections, and endpoints that define natural chunk boundaries. |
| 2 | contains | `overlap` -- inter-chunk overlap | Queries matching concepts at chunk boundaries return no results without overlap. 10-15% overlap is standard for retrieval quality. |
| 3 | contains | `metadata` -- chunk metadata schema | Metadata enables filtered retrieval (e.g., search only API references, filter by version). Without metadata, every query searches the full index. |
| 4 | contains | `code block` -- code-specific handling | Code examples are atomic units. A function split across two chunks is useless for developer Q&A. The strategy must keep code blocks intact. |
| 5 | contains | `token` -- token-based size constraints | Character-based limits do not account for tokenizer behavior. Embedding models have token limits, and the LLM context window is measured in tokens. |

### What a passing response looks like

- Three distinct chunking strategies for the three document types (API refs, tutorials, changelogs).
- API references chunked by endpoint (one chunk per operation with description, parameters, and response schema).
- Tutorials chunked by section with heading-based boundaries, code blocks kept intact, and 10-15% overlap.
- Changelogs chunked by release version.
- A metadata schema with fields: doc_type, title, section, version, api_endpoint (nullable), language (for code).
- Chunk size target of 256-512 tokens with a hard ceiling and soft floor.
- A code-block preservation rule: if a code block would push the chunk over the limit, the code block becomes its own chunk with the preceding paragraph as context.

---

## Eval 2: Hybrid Search Implementation

This eval tests the skill's ability to implement a complete hybrid search pipeline with dense + sparse retrieval, fusion scoring, and re-ranking.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `BM25` -- sparse retrieval component | Dense embeddings encode meaning but miss exact lexical matches. Error codes like "ERR-4502" and SKUs need keyword matching. |
| 2 | contains | `fusion` -- result merging strategy | Dense and sparse retrievers return separate ranked lists. Without a principled fusion strategy, the pipeline cannot combine their strengths. |
| 3 | contains | `re-rank` -- cross-encoder re-ranking | Initial retrieval optimizes for recall (find everything that might be relevant). Re-ranking optimizes for precision (put the best results first). |
| 4 | contains | `Qdrant` -- vector store implementation | The eval specifies Qdrant. The implementation must use Qdrant's sparse vector support or payload indexing, not a generic abstraction. |
| 5 | contains | `weight` -- configurable fusion weights | The optimal dense/sparse balance varies by query type. Keyword-heavy queries need more sparse weight; conceptual queries need more dense weight. |

### What a passing response looks like

- An indexing pipeline that stores both dense vectors and sparse representations (BM25 or SPLADE) in Qdrant.
- A query pipeline that: (a) embeds the query with the dense model, (b) generates a sparse query representation, (c) retrieves top-50 from each, (d) fuses results with RRF or weighted scoring, (e) re-ranks top-20 with a cross-encoder, (f) returns top-5 to the LLM.
- Qdrant-specific configuration showing named vectors or sparse vector fields.
- Configurable weights with a sensible default (e.g., 0.6 dense, 0.4 sparse) and guidance on tuning.
- A worked example showing how "error code ERR-4502 payment failed" benefits from hybrid search vs. dense-only.
