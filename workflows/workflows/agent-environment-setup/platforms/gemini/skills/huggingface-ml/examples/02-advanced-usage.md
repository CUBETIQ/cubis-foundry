# Example: RAG System with Hugging Face Embeddings and Reranking

## Scenario

A team is building a Retrieval-Augmented Generation (RAG) system for an internal knowledge base. The system must embed documents using a Hugging Face sentence-transformers model, store embeddings in a vector database, retrieve relevant context at query time, rerank candidates for precision, and feed the top results to a language model for answer generation. The pipeline must handle document chunking, embedding batching for large corpora, and hybrid search combining semantic and keyword matching.

## Prompt

"Build a RAG pipeline using Hugging Face models for embeddings and reranking. Use sentence-transformers for document and query embeddings, a cross-encoder for reranking retrieved candidates, and the Inference API for answer generation. Support document chunking, batch embedding, and hybrid search with BM25 + semantic similarity."

## Expected Output

### Document Chunking

```python
# rag/chunker.py
from dataclasses import dataclass

@dataclass
class Chunk:
    doc_id: str
    chunk_index: int
    text: str
    metadata: dict

def chunk_document(
    doc_id: str,
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
    metadata: dict | None = None,
) -> list[Chunk]:
    """Split document into overlapping chunks by token count approximation."""
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_text = " ".join(words[start:end])
        chunks.append(
            Chunk(
                doc_id=doc_id,
                chunk_index=len(chunks),
                text=chunk_text,
                metadata=metadata or {},
            )
        )
        start += chunk_size - chunk_overlap

    return chunks
```

### Embedding Service

```python
# rag/embedder.py
import torch
import numpy as np
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(
        self,
        model_id: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str | None = None,
    ):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SentenceTransformer(model_id, device=self.device)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def embed_texts(
        self, texts: list[str], batch_size: int = 64, show_progress: bool = False
    ) -> np.ndarray:
        """Embed a list of texts. Returns array of shape (n, dimension)."""
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            normalize_embeddings=True,  # Required for cosine similarity via dot product
            convert_to_numpy=True,
        )
        return embeddings

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query. Returns array of shape (dimension,)."""
        return self.model.encode(
            query,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
```

### Vector Store Integration

```python
# rag/vector_store.py
import chromadb
import numpy as np
from rag.chunker import Chunk
from rag.embedder import EmbeddingService

class VectorStore:
    def __init__(self, collection_name: str, embedder: EmbeddingService):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self.embedder = embedder

    def index_chunks(self, chunks: list[Chunk], batch_size: int = 100):
        """Index chunks with their embeddings."""
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            texts = [c.text for c in batch]
            embeddings = self.embedder.embed_texts(texts, batch_size=batch_size)

            self.collection.add(
                ids=[f"{c.doc_id}:{c.chunk_index}" for c in batch],
                embeddings=embeddings.tolist(),
                documents=texts,
                metadatas=[{**c.metadata, "doc_id": c.doc_id} for c in batch],
            )

    def semantic_search(
        self, query: str, top_k: int = 20
    ) -> list[dict]:
        """Retrieve top-k chunks by semantic similarity."""
        query_embedding = self.embedder.embed_query(query)

        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        return [
            {
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i],  # Convert distance to similarity
            }
            for i in range(len(results["ids"][0]))
        ]
```

### Hybrid Search with BM25

```python
# rag/hybrid_search.py
from rank_bm25 import BM25Okapi
from rag.vector_store import VectorStore

class HybridSearcher:
    def __init__(self, vector_store: VectorStore, corpus: list[dict]):
        self.vector_store = vector_store
        self.corpus = corpus
        # Build BM25 index
        tokenized = [doc["text"].lower().split() for doc in corpus]
        self.bm25 = BM25Okapi(tokenized)
        self.doc_lookup = {doc["id"]: doc for doc in corpus}

    def search(
        self,
        query: str,
        top_k: int = 20,
        semantic_weight: float = 0.7,
        bm25_weight: float = 0.3,
    ) -> list[dict]:
        # Semantic search
        semantic_results = self.vector_store.semantic_search(query, top_k=top_k)
        semantic_scores = {r["id"]: r["score"] for r in semantic_results}

        # BM25 keyword search
        tokenized_query = query.lower().split()
        bm25_scores_raw = self.bm25.get_scores(tokenized_query)
        max_bm25 = max(bm25_scores_raw) if max(bm25_scores_raw) > 0 else 1
        bm25_scores = {
            self.corpus[i]["id"]: bm25_scores_raw[i] / max_bm25
            for i in range(len(self.corpus))
        }

        # Combine scores with reciprocal rank fusion
        all_ids = set(semantic_scores.keys()) | set(
            k for k, v in bm25_scores.items() if v > 0
        )
        combined = []
        for doc_id in all_ids:
            score = (
                semantic_weight * semantic_scores.get(doc_id, 0)
                + bm25_weight * bm25_scores.get(doc_id, 0)
            )
            combined.append({"id": doc_id, "score": score})

        combined.sort(key=lambda x: x["score"], reverse=True)
        return combined[:top_k]
```

### Cross-Encoder Reranker

```python
# rag/reranker.py
from sentence_transformers import CrossEncoder

class Reranker:
    def __init__(self, model_id: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_id)

    def rerank(
        self, query: str, candidates: list[dict], top_k: int = 5
    ) -> list[dict]:
        """Rerank candidates using a cross-encoder for higher precision."""
        if not candidates:
            return []

        pairs = [(query, c["text"]) for c in candidates]
        scores = self.model.predict(pairs)

        for candidate, score in zip(candidates, scores):
            candidate["rerank_score"] = float(score)

        reranked = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]
```

### RAG Pipeline with Answer Generation

```python
# rag/pipeline.py
from huggingface_hub import InferenceClient
from rag.embedder import EmbeddingService
from rag.vector_store import VectorStore
from rag.reranker import Reranker

class RAGPipeline:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.vector_store = VectorStore("knowledge_base", self.embedder)
        self.reranker = Reranker()
        self.llm = InferenceClient(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            token="hf_YOUR_TOKEN",
            timeout=30,
        )

    def answer(self, question: str) -> dict:
        # Step 1: Retrieve candidates
        candidates = self.vector_store.semantic_search(question, top_k=20)

        # Step 2: Rerank for precision
        reranked = self.reranker.rerank(question, candidates, top_k=5)

        # Step 3: Build context from top results
        context = "\n\n---\n\n".join(
            f"[Source: {r['metadata'].get('doc_id', 'unknown')}]\n{r['text']}"
            for r in reranked
        )

        # Step 4: Generate answer with LLM
        prompt = f"""Based on the following context, answer the question.
If the context does not contain enough information, say so.

Context:
{context}

Question: {question}

Answer:"""

        response = self.llm.text_generation(
            prompt, max_new_tokens=500, temperature=0.1
        )

        return {
            "answer": response,
            "sources": [
                {"doc_id": r["metadata"].get("doc_id"), "score": r["rerank_score"]}
                for r in reranked
            ],
        }
```

### Usage

```python
from rag.pipeline import RAGPipeline
from rag.chunker import chunk_document

pipeline = RAGPipeline()

# Index documents
documents = load_knowledge_base()  # your document loader
for doc in documents:
    chunks = chunk_document(doc["id"], doc["content"], metadata={"title": doc["title"]})
    pipeline.vector_store.index_chunks(chunks)

# Query
result = pipeline.answer("How do I configure SSO for our enterprise plan?")
print(result["answer"])
print("Sources:", result["sources"])
```

## Key Decisions

- **sentence-transformers for bi-encoder embeddings** -- bi-encoders embed queries and documents independently, enabling pre-computation of document embeddings for fast retrieval at scale.
- **Cross-encoder reranker as a second stage** -- cross-encoders are more accurate than bi-encoders but too slow for full-corpus search. Using them to rerank the top 20 candidates balances accuracy with latency.
- **Normalized embeddings with cosine similarity** -- `normalize_embeddings=True` allows using dot product as cosine similarity, which is faster and supported natively by most vector databases.
- **Hybrid search with BM25** -- semantic search misses exact keyword matches (product names, error codes). BM25 complements semantic search for higher recall on technical queries.
- **Chunking with overlap** -- 64-word overlap ensures that relevant context split across chunk boundaries is captured in at least one chunk.
- **Inference API for generation** -- avoids hosting a large language model locally. The API handles scaling and GPU allocation.
