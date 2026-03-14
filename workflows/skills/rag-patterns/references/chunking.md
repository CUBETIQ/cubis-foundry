# Chunking Strategies

## Overview

Chunking transforms raw documents into retrieval-ready units. The quality of chunking directly determines retrieval precision: good chunks map one concept to one embedding, while bad chunks mix unrelated content or split coherent ideas across boundaries. This reference covers strategies by document type, sizing heuristics, and implementation patterns.

## Core Principles

### One Chunk, One Concept

The ideal chunk contains exactly the information needed to answer one type of question. A chunk that covers authentication AND rate limiting will match queries about either topic but dilute the relevance signal for both.

### Semantic Boundaries Over Token Counts

Split at structural boundaries first (headings, paragraphs, function definitions), then enforce token budgets as a secondary constraint. A 300-token chunk that ends at a heading is better than a 512-token chunk that cuts a paragraph in half.

### Preserve Context

A chunk that starts with "Additionally, the third parameter controls..." is useless without the preceding context. Include enough context (the section heading, the parent topic) so the chunk is self-contained.

## Strategies by Document Type

### Markdown / Technical Documentation

```python
import re
from typing import Optional

def chunk_markdown(
    text: str,
    max_tokens: int = 512,
    overlap_tokens: int = 64,
    heading_level: int = 2
) -> list[dict]:
    """Split markdown by heading level, then by paragraph within long sections."""
    pattern = rf'^({"#" * heading_level}\s+.+)$'
    sections = re.split(pattern, text, flags=re.MULTILINE)

    chunks = []
    current_heading = "Introduction"

    for part in sections:
        if re.match(pattern, part):
            current_heading = part.strip("# ").strip()
            continue

        tokens = count_tokens(part)
        if tokens <= max_tokens:
            chunks.append({"heading": current_heading, "text": part.strip()})
        else:
            sub_chunks = split_by_paragraph(
                part, max_tokens=max_tokens, overlap_tokens=overlap_tokens
            )
            for i, sub in enumerate(sub_chunks):
                chunks.append({
                    "heading": f"{current_heading} (part {i+1})",
                    "text": sub
                })

    return chunks
```

### Source Code

```python
import ast

def chunk_python_file(source: str, file_path: str) -> list[dict]:
    """Chunk Python files by top-level definitions."""
    tree = ast.parse(source)
    chunks = []

    for node in ast.iter_child_nodes(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            start_line = node.lineno - 1
            end_line = node.end_lineno
            chunk_text = "\n".join(source.splitlines()[start_line:end_line])

            # Include the docstring as searchable content
            docstring = ast.get_docstring(node) or ""

            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "type": type(node).__name__,
                    "name": node.name,
                    "file": file_path,
                    "docstring": docstring,
                    "start_line": start_line + 1,
                    "end_line": end_line
                }
            })

    return chunks
```

### Conversational Data

```python
def chunk_conversation(
    messages: list[dict],
    max_turns: int = 6,
    overlap_turns: int = 1
) -> list[dict]:
    """Chunk conversations by turn windows with overlap."""
    chunks = []
    for i in range(0, len(messages), max_turns - overlap_turns):
        window = messages[i:i + max_turns]
        chunk_text = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in window
        )
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "start_turn": i,
                "end_turn": i + len(window) - 1,
                "turn_count": len(window)
            }
        })
    return chunks
```

### Tabular Data

Tables should be chunked row-by-row or section-by-section with the header repeated in each chunk.

```python
def chunk_table(header: str, rows: list[str], rows_per_chunk: int = 10) -> list[dict]:
    """Chunk a table by row groups, repeating the header in each chunk."""
    chunks = []
    for i in range(0, len(rows), rows_per_chunk):
        chunk_rows = rows[i:i + rows_per_chunk]
        chunk_text = header + "\n" + "\n".join(chunk_rows)
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "row_start": i,
                "row_end": i + len(chunk_rows) - 1
            }
        })
    return chunks
```

## Chunk Sizing Heuristics

| Embedding Model | Recommended Chunk Size | Max Context Window |
|----------------|----------------------|-------------------|
| text-embedding-3-small | 256-512 tokens | 8,191 tokens |
| text-embedding-3-large | 256-512 tokens | 8,191 tokens |
| voyage-3 | 256-512 tokens | 32,000 tokens |
| BAAI/bge-small-en-v1.5 | 256-512 tokens | 512 tokens |
| Cohere embed-v3 | 256-512 tokens | 512 tokens |

**Why 256-512 tokens?** Empirical studies consistently show that chunks in this range produce the best retrieval quality. Smaller chunks lose context; larger chunks dilute the embedding with unrelated content.

**Exception:** For models with large context windows (voyage-3, jina-v2), chunks up to 1024 tokens can work if the document structure demands it (e.g., long code functions).

## Overlap Configuration

Overlap ensures that content at chunk boundaries is captured by at least one chunk's embedding.

| Document type | Recommended overlap | Rationale |
|---------------|-------------------|-----------|
| Technical docs | 10-15% (50-75 tokens) | Paragraphs sometimes span concepts across section boundaries. |
| Source code | 0% | Functions and classes are self-contained. Overlap wastes index space. |
| Conversations | 1-2 turns | Context from the previous exchange helps ground the current window. |
| Legal documents | 15-20% (75-100 tokens) | Legal clauses reference adjacent clauses frequently. |

## Code Block Preservation

Code blocks must never be split. A half-function is worse than no function.

```python
def split_preserving_code_blocks(
    text: str,
    max_tokens: int = 512,
    overlap_tokens: int = 64
) -> list[str]:
    """Split text into chunks, keeping code blocks atomic."""
    code_block_pattern = r"```[\s\S]*?```"
    parts = re.split(f"({code_block_pattern})", text)

    chunks = []
    current_chunk = ""

    for part in parts:
        is_code = part.startswith("```")
        part_tokens = count_tokens(part)

        if is_code and part_tokens > max_tokens:
            # Code block exceeds limit -- keep it as its own chunk
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
                current_chunk = ""
            chunks.append(part)
        elif count_tokens(current_chunk + part) <= max_tokens:
            current_chunk += part
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = get_overlap_text(chunks[-1], overlap_tokens) + part if chunks else part

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks
```

## Quality Checks

After chunking, validate the output:

1. **No empty chunks.** Filter out chunks with fewer than 20 tokens.
2. **No giant chunks.** Flag chunks exceeding the embedding model's context window.
3. **Metadata completeness.** Every chunk must have the required metadata fields.
4. **Code block integrity.** Verify that no code fences are opened without closing.
5. **Distribution check.** Plot the token-count histogram. A healthy distribution is unimodal around the target size. Bimodal distributions indicate a chunking rule that produces many tiny and many oversized chunks.
