# Hugging Face ML Eval Assertions

## Eval 1: Model Fine-Tuning Workflow

This eval tests the complete fine-tuning workflow: PEFT/QLoRA configuration, Trainer setup, dataset preparation, evaluation metrics, and model publishing.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `LoraConfig` — PEFT adapter configuration        | LoRA enables fine-tuning large models by training low-rank adapter matrices instead of all parameters, reducing GPU memory by 10-100x while maintaining quality. |
| 2 | contains | `TrainingArguments` — Training configuration     | Trainer requires TrainingArguments for learning rate, batch size, gradient accumulation, warmup, and precision settings. Omitting it uses defaults that are rarely optimal. |
| 3 | contains | `compute_metrics` — Evaluation function           | Without a compute_metrics function, Trainer only reports loss. F1 and accuracy on the eval split are essential for monitoring classification quality during training. |
| 4 | contains | `BitsAndBytesConfig` — Quantization config       | QLoRA requires 4-bit quantization via BitsAndBytesConfig to fit large models in limited GPU memory. Without it, loading the base model alone exceeds available VRAM. |
| 5 | contains | `push_to_hub` — Hub publishing                   | Publishing to the Hub provides versioned storage, model cards, download tracking, and easy deployment, replacing ad-hoc model file management. |

### What a passing response looks like

- `BitsAndBytesConfig` with `load_in_4bit=True`, nf4 quantization type, and float16 compute dtype.
- `LoraConfig` specifying target modules (q_proj, v_proj), rank, alpha, dropout, and task type.
- Dataset loaded with the `datasets` library, tokenized with the model's tokenizer, split into train/eval.
- `TrainingArguments` with learning rate ~2e-4, cosine scheduler, bf16/fp16, gradient accumulation, and eval strategy.
- `compute_metrics` returning F1 (macro) and accuracy from sklearn or evaluate library.
- `trainer.push_to_hub()` or `model.push_to_hub()` call after training completes.

---

## Eval 2: Inference API Integration

This eval tests production Inference API usage: client configuration, embedding generation, error handling with backoff, and local fallback.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `InferenceClient` — Official client usage        | InferenceClient provides typed methods, automatic retry, and consistent authentication, avoiding raw HTTP calls that miss edge cases in the API protocol. |
| 2 | contains | `feature_extraction` — Embedding task endpoint   | Sentence embeddings are generated through the feature_extraction task, which returns dense vectors suitable for semantic search and similarity computation. |
| 3 | contains | `timeout` — Explicit timeout configuration       | Inference API cold starts can take 10-60 seconds for large models. Without explicit timeouts, client calls hang indefinitely during cold starts or degradation. |
| 4 | contains | `429` — Rate limit handling                      | The Inference API enforces rate limits per model and account tier. Without backoff on 429 responses, the client enters a retry storm that extends the lockout. |
| 5 | contains | `SentenceTransformer` — Local fallback           | A local fallback ensures the search feature continues working when the Inference API is unavailable, maintaining service availability at the cost of latency. |

### What a passing response looks like

- `InferenceClient` initialized with API token and explicit timeout settings.
- Embedding generation using `client.feature_extraction()` with the sentence-transformers model ID.
- Exponential backoff retry logic that detects 429 status codes and waits before retrying.
- Local `SentenceTransformer` model loaded on fallback with the same model ID for embedding consistency.
- Batch embedding support for document indexing using the client's batch capabilities.
