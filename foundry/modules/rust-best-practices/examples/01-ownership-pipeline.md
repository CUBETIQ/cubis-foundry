# Example: Ownership-Driven Data Pipeline

## Scenario

Build a three-stage data pipeline (parse, transform, serialize) where data flows through without unnecessary cloning. The transform stage uses a shared, read-only lookup table.

## Implementation

```rust
use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};

// --- Domain types ---

#[derive(Debug, Deserialize)]
pub struct RawRecord {
    pub id: u64,
    pub name: String,
    pub category_id: u32,
}

#[derive(Debug, Serialize)]
pub struct EnrichedRecord {
    pub id: u64,
    pub name: String,
    pub category_name: String,
    pub tags: Vec<String>,
}

/// Read-only lookup table for category metadata.
/// Shared across transform workers via Arc (no Mutex needed — immutable).
pub struct CategoryLookup {
    categories: HashMap<u32, CategoryInfo>,
}

pub struct CategoryInfo {
    pub name: String,
    pub tags: Vec<String>,
}

impl CategoryLookup {
    pub fn new(categories: HashMap<u32, CategoryInfo>) -> Self {
        Self { categories }
    }

    /// Borrow the category info — no ownership transfer needed.
    pub fn get(&self, id: u32) -> Option<&CategoryInfo> {
        self.categories.get(&id)
    }
}

// --- Pipeline stages ---

/// Stage 1: Parse raw bytes into owned records.
/// Returns Vec<RawRecord> — caller takes ownership of the parsed data.
pub fn parse(input: &[u8]) -> Result<Vec<RawRecord>, PipelineError> {
    // input is borrowed (&[u8]) because we only need to read the bytes.
    // The returned Vec<RawRecord> is owned by the caller.
    serde_json::from_slice(input).map_err(PipelineError::Parse)
}

/// Stage 2: Transform records using the lookup table.
/// Takes ownership of records (Vec<RawRecord>) via move.
/// Borrows the lookup table (&CategoryLookup) — read-only access.
pub fn transform(
    records: Vec<RawRecord>,   // Owned: consumed and destroyed
    lookup: &CategoryLookup,   // Borrowed: read-only, outlives this call
) -> Result<Vec<EnrichedRecord>, PipelineError> {
    records
        .into_iter() // Consumes the Vec, moves each RawRecord out
        .map(|record| {
            let info = lookup
                .get(record.category_id)
                .ok_or(PipelineError::MissingCategory(record.category_id))?;

            Ok(EnrichedRecord {
                id: record.id,
                name: record.name, // Moved from RawRecord — no clone
                category_name: info.name.clone(), // Clone: info is borrowed, we need owned String
                tags: info.tags.clone(),           // Clone: same reason
            })
        })
        .collect()
}

/// Stage 3: Serialize enriched records to JSON bytes.
/// Takes ownership of records — they are consumed during serialization.
pub fn serialize(records: Vec<EnrichedRecord>) -> Result<Vec<u8>, PipelineError> {
    serde_json::to_vec(&records).map_err(PipelineError::Serialize)
}

// --- Error types ---

#[derive(Debug, thiserror::Error)]
pub enum PipelineError {
    #[error("parse error: {0}")]
    Parse(serde_json::Error),
    #[error("missing category: {0}")]
    MissingCategory(u32),
    #[error("serialize error: {0}")]
    Serialize(serde_json::Error),
}

// --- Orchestration ---

/// Run the pipeline: parse -> transform -> serialize.
/// Each stage takes ownership from the previous stage via move.
pub fn run_pipeline(
    input: &[u8],
    lookup: &CategoryLookup,
) -> Result<Vec<u8>, PipelineError> {
    let records = parse(input)?;        // parse returns owned Vec<RawRecord>
    let enriched = transform(records, lookup)?; // records moved into transform
    let output = serialize(enriched)?;  // enriched moved into serialize
    Ok(output)                          // output moved to caller
}

/// Run with concurrent transform workers sharing the lookup table via Arc.
pub async fn run_pipeline_concurrent(
    chunks: Vec<Vec<u8>>,
    lookup: Arc<CategoryLookup>, // Arc: shared ownership across tasks
) -> Result<Vec<Vec<u8>>, PipelineError> {
    let mut handles = Vec::with_capacity(chunks.len());

    for chunk in chunks {
        let lookup = Arc::clone(&lookup); // Cheap reference count increment
        handles.push(tokio::spawn(async move {
            let records = parse(&chunk)?;
            let enriched = transform(records, &lookup)?; // Borrow from Arc
            serialize(enriched)
        }));
    }

    let mut results = Vec::with_capacity(handles.len());
    for handle in handles {
        results.push(handle.await.map_err(|_| {
            PipelineError::Serialize(serde_json::Error::io(
                std::io::Error::new(std::io::ErrorKind::Other, "task panicked"),
            ))
        })??);
    }
    Ok(results)
}
```

## Ownership Decisions Explained

| Data | Strategy | Reason |
| --- | --- | --- |
| `input: &[u8]` | Borrow | Pipeline only reads the raw bytes; caller retains ownership |
| `Vec<RawRecord>` | Move between stages | Linear flow — each stage consumes its input and produces new output |
| `record.name` | Move into `EnrichedRecord` | RawRecord is consumed by `into_iter`, so we can move fields out |
| `CategoryLookup` | Borrow (`&`) in single-thread, `Arc` in concurrent | Read-only — no mutation, no Mutex needed |
| `info.name` | Clone | Info is borrowed from lookup; we need an owned String in the output |
| `Vec<EnrichedRecord>` | Move into serialize | Same linear-flow pattern |
