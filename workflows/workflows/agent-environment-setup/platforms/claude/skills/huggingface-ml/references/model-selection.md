# Model Selection

Load this when searching for pre-trained models, choosing between architectures, or evaluating model suitability for a task.

## Hub Search Strategy

### By Task

The Hub organizes models by task type. Start here when you know what you want to do but not which model to use.

| Task | Top Models | Notes |
|------|-----------|-------|
| Text Classification | `distilbert-base-uncased`, `roberta-base` | Fine-tune on your labels |
| Token Classification (NER) | `bert-base-NER`, `roberta-large-ner` | Pre-trained on CoNLL-2003 |
| Question Answering | `deepset/roberta-base-squad2` | Extractive QA from context |
| Summarization | `facebook/bart-large-cnn`, `google/pegasus-xsum` | Abstractive summarization |
| Translation | `Helsinki-NLP/opus-mt-*` | Language-pair specific |
| Text Generation | `meta-llama/Meta-Llama-3-8B-Instruct` | Chat and instruction following |
| Sentence Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | Fast, good quality for search |
| Image Classification | `google/vit-base-patch16-224` | Vision Transformer |
| Object Detection | `facebook/detr-resnet-50` | End-to-end detection |
| Speech-to-Text | `openai/whisper-large-v3` | Multilingual ASR |

### Filtering on the Hub

```python
from huggingface_hub import HfApi

api = HfApi()

# Search by task and sort by downloads
models = api.list_models(
    task="text-classification",
    sort="downloads",
    direction=-1,
    limit=10,
)

for model in models:
    print(f"{model.modelId}: {model.downloads:,} downloads")
```

### Evaluation Criteria

When comparing models for the same task:

1. **Task alignment** -- Does the model's training task match yours? A sentiment model will not classify support tickets without fine-tuning.
2. **Size vs latency** -- Smaller models (DistilBERT, MiniLM) are 2-5x faster with 5-15% quality loss vs their full-size counterparts.
3. **Downloads and community adoption** -- High download counts indicate community validation and easier debugging.
4. **License** -- Apache 2.0 and MIT are permissive. Models with custom licenses (Llama, Mistral) may have commercial use restrictions.
5. **Model card quality** -- A thorough model card with evaluation results, training data, and limitations indicates a well-maintained model.

## Architecture Selection Guide

### Encoder Models (BERT family)

Best for understanding and classification tasks.

```python
from transformers import AutoModel

# Good for: classification, NER, embeddings, QA
model = AutoModel.from_pretrained("bert-base-uncased")
```

- **BERT**: Foundation encoder. Good baseline for fine-tuning.
- **RoBERTa**: Better pre-training. Usually outperforms BERT.
- **DistilBERT**: 40% smaller, 60% faster, 97% of BERT quality.
- **DeBERTa**: State-of-the-art on many benchmarks. Larger and slower.

### Decoder Models (GPT family)

Best for text generation and instruction following.

```python
from transformers import AutoModelForCausalLM

# Good for: chat, code generation, creative writing, reasoning
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B-Instruct")
```

- **Llama 3**: Strong open model. 8B and 70B sizes.
- **Mistral**: Efficient architecture with sliding window attention.
- **Phi-3**: Small but capable (3.8B). Good for resource-constrained deployment.
- **Gemma**: Google's open model. Good for fine-tuning.

### Encoder-Decoder Models (T5 family)

Best for sequence-to-sequence tasks.

```python
from transformers import AutoModelForSeq2SeqLM

# Good for: summarization, translation, data-to-text
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
```

- **T5/Flan-T5**: Versatile. Frame any task as text-to-text.
- **BART**: Strong for summarization and denoising.
- **mBART**: Multilingual translation and generation.

## Size and Resource Planning

| Model Size | GPU Memory | Inference Latency | Use Case |
|-----------|------------|-------------------|----------|
| < 500M params | 2-4 GB | < 50ms | Real-time APIs, edge deployment |
| 1-3B params | 4-8 GB | 50-200ms | Balanced quality and speed |
| 7-8B params | 16-24 GB | 200-500ms | High quality, dedicated GPU |
| 13-70B params | 40-140 GB | 500ms-5s | Maximum quality, multi-GPU |

### Quantization for Smaller Footprint

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# 4-bit quantization: ~4x memory reduction
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
)
```

- 4-bit quantization reduces a 7B model from ~14 GB to ~4 GB with minimal quality loss.
- 8-bit quantization is a safer choice with less quality degradation.
- GPTQ and AWQ are alternative quantization methods with pre-quantized models available on the Hub.

## Version Pinning

```python
# Pin to a specific revision (commit hash)
model = AutoModel.from_pretrained(
    "bert-base-uncased",
    revision="a265f773a47193eed794233aa2a0f0bb6d3eaa63",
)

# Pin to a specific branch or tag
model = AutoModel.from_pretrained(
    "bert-base-uncased",
    revision="v1.0",
)
```

- Always pin model revisions in production. Hub models can be updated by their authors.
- Use commit hashes for immutable references. Branch names and tags can be moved.
- Store the exact revision in your deployment configuration for reproducibility.
