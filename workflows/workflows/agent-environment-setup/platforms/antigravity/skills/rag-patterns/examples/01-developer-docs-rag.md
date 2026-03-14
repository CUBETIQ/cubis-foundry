# Example: RAG Pipeline for Developer Documentation

## Context

A developer tools company wants to build a Q&A chatbot over their documentation corpus:
- 2,000 markdown files covering API references, tutorials, and conceptual guides.
- Users ask questions like "How do I authenticate with OAuth2?" and "What are the parameters for the /users endpoint?"
- The chatbot must cite specific documentation pages in its answers.
- Target latency: < 3 seconds end-to-end.

## Architecture

```
User Query
    |
    v
[Query Preprocessing] --> expand abbreviations, detect intent
    |
    v
[Embedding Model] --> text-embedding-3-small (1536-dim)
    |
    v
[Vector Store: Pinecone] --> top-50 by cosine similarity
    |                          filtered by doc_type metadata
    v
[Re-ranker: Cohere rerank-v3] --> top-5 by cross-encoder relevance
    |
    v
[Prompt Assembly] --> system prompt + top-5 chunks + user query
    |
    v
[LLM: Claude Sonnet] --> grounded answer with citations
    |
    v
[Response + Source Links]
```

## Chunking Strategy

### API References

API reference pages follow a consistent structure: endpoint URL, method, parameters table, request/response examples.

```python
def chunk_api_reference(doc: dict) -> list[dict]:
    """One chunk per API endpoint operation."""
    chunks = []
    for endpoint in doc["endpoints"]:
        chunk_text = f"""## {endpoint['method']} {endpoint['path']}

{endpoint['description']}

### Parameters
{format_params_table(endpoint['parameters'])}

### Request Example
```json
{json.dumps(endpoint['request_example'], indent=2)}
```

### Response Example
```json
{json.dumps(endpoint['response_example'], indent=2)}
```"""
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "doc_type": "api_reference",
                "endpoint": endpoint["path"],
                "method": endpoint["method"],
                "title": doc["title"],
                "version": doc["api_version"]
            }
        })
    return chunks
```

**Rationale:** Each endpoint is a self-contained unit that answers "what does this endpoint do?" Splitting an endpoint across chunks would force the retrieval to return multiple chunks for a single question.

### Tutorial Guides

Tutorials are long-form markdown with headings, prose, and code blocks.

```python
def chunk_tutorial(markdown: str, doc_metadata: dict) -> list[dict]:
    """Chunk by H2 sections with code-block preservation."""
    sections = split_by_heading(markdown, level=2)
    chunks = []

    for section in sections:
        tokens = count_tokens(section["text"])

        if tokens <= 512:
            # Section fits in one chunk
            chunks.append({
                "text": section["text"],
                "metadata": {
                    **doc_metadata,
                    "doc_type": "tutorial",
                    "section": section["heading"]
                }
            })
        else:
            # Split by paragraphs, keeping code blocks atomic
            sub_chunks = split_preserving_code_blocks(
                section["text"],
                max_tokens=512,
                overlap_tokens=64
            )
            for i, sub in enumerate(sub_chunks):
                chunks.append({
                    "text": sub,
                    "metadata": {
                        **doc_metadata,
                        "doc_type": "tutorial",
                        "section": f"{section['heading']} (part {i+1})"
                    }
                })

    return chunks
```

**Rationale:** H2 sections are the natural semantic boundary in tutorials. Code blocks are kept atomic because a split function definition is useless. Overlap of ~64 tokens (roughly 10-15% of 512) ensures boundary-spanning concepts are captured.

### Chunk Size Analysis

| Document type | Chunk count | Median tokens | p95 tokens | Max tokens |
|---------------|-------------|---------------|------------|------------|
| API reference | 3,200 | 280 | 450 | 510 |
| Tutorial | 8,500 | 340 | 500 | 512 |
| Conceptual | 4,100 | 310 | 480 | 512 |
| **Total** | **15,800** | **320** | **490** | **512** |

## Embedding Configuration

```python
from openai import OpenAI

client = OpenAI()

def embed_chunks(chunks: list[dict]) -> list[dict]:
    """Embed chunks in batches of 100."""
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["text"] for c in batch]

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            dimensions=1536
        )

        for j, embedding_data in enumerate(response.data):
            batch[j]["embedding"] = embedding_data.embedding

    return chunks
```

**Model choice:** `text-embedding-3-small` at 1536 dimensions provides strong retrieval quality for technical documentation at low cost ($0.02/1M tokens). For this 50M token corpus, initial embedding costs approximately $1.00.

## Retrieval Pipeline

```python
from pinecone import Pinecone

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index("developer-docs")

def retrieve(query: str, doc_type: str = None, top_k: int = 50) -> list[dict]:
    query_embedding = embed_query(query)

    filter_dict = {}
    if doc_type:
        filter_dict["doc_type"] = {"$eq": doc_type}

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict if filter_dict else None
    )

    return [
        {
            "text": match["metadata"]["text"],
            "score": match["score"],
            "metadata": match["metadata"]
        }
        for match in results["matches"]
    ]
```

## Re-ranking

```python
import cohere

co = cohere.Client(os.environ["COHERE_API_KEY"])

def rerank(query: str, documents: list[dict], top_n: int = 5) -> list[dict]:
    results = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=[d["text"] for d in documents],
        top_n=top_n,
        return_documents=True
    )

    reranked = []
    for result in results.results:
        original = documents[result.index]
        reranked.append({
            **original,
            "rerank_score": result.relevance_score
        })

    return reranked
```

## Prompt Assembly

```python
def build_prompt(query: str, chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks):
        source = chunk["metadata"].get("title", "Unknown")
        section = chunk["metadata"].get("section", "")
        context_parts.append(f"[Source {i+1}: {source} > {section}]\n{chunk['text']}")

    context = "\n\n---\n\n".join(context_parts)

    return f"""Answer the developer's question using ONLY the provided documentation context.
If the context does not contain enough information, say so explicitly.
Cite sources using [Source N] notation.

## Documentation Context

{context}

## Question

{query}"""
```

## Evaluation Results

After building the pipeline, a retrieval eval on 100 representative queries produced:

| Metric | Dense only | Dense + Rerank | Hybrid + Rerank |
|--------|-----------|----------------|-----------------|
| Recall@5 | 0.72 | 0.72 | 0.84 |
| MRR@5 | 0.58 | 0.71 | 0.79 |
| Latency p95 | 180ms | 420ms | 480ms |

The re-ranker improved MRR by 13 points (better ordering) without affecting recall. Adding BM25 hybrid search improved recall by 12 points by catching exact API endpoint names and error codes that dense embeddings missed.
