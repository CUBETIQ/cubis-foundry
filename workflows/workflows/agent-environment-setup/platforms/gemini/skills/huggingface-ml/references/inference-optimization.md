# Inference Optimization

Load this when optimizing model inference latency, memory usage, or throughput for production deployment.

## Device and Memory Management

### Automatic Device Mapping

```python
from transformers import AutoModelForCausalLM

# Automatically distribute across available GPUs and CPU
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B-Instruct",
    device_map="auto",
    torch_dtype=torch.float16,
)
```

- `device_map="auto"` splits the model across available GPUs. If GPU memory is insufficient, it offloads layers to CPU.
- `torch_dtype=torch.float16` halves memory usage with minimal quality impact for inference.
- Use `device_map="balanced"` to distribute evenly across GPUs.
- Use `max_memory={"cuda:0": "10GB", "cpu": "30GB"}` to set per-device limits.

### Explicit Device Placement

```python
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = AutoModel.from_pretrained("bert-base-uncased").to(device)
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

inputs = tokenizer("Hello world", return_tensors="pt").to(device)
with torch.no_grad():
    outputs = model(**inputs)
```

## Quantization

### BitsAndBytes (Dynamic Quantization)

```python
from transformers import BitsAndBytesConfig

# 4-bit quantization
config_4bit = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",           # Normal Float 4-bit
    bnb_4bit_compute_dtype=torch.float16, # Compute in fp16
    bnb_4bit_use_double_quant=True,       # Quantize the quantization constants
)

# 8-bit quantization (less aggressive, higher quality)
config_8bit = BitsAndBytesConfig(load_in_8bit=True)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=config_4bit,
    device_map="auto",
)
```

### GPTQ (Static Quantization)

Pre-quantized models are available on the Hub with `-GPTQ` suffix.

```python
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "TheBloke/Llama-2-7B-Chat-GPTQ",
    device_map="auto",
)
```

- GPTQ is faster than BitsAndBytes at inference because quantization is done offline.
- Requires a calibration dataset during quantization. Pre-quantized models skip this step.

### AWQ (Activation-Aware Weight Quantization)

```python
model = AutoModelForCausalLM.from_pretrained(
    "TheBloke/Llama-2-7B-Chat-AWQ",
    device_map="auto",
)
```

- AWQ preserves important weights at higher precision, providing better quality than uniform quantization.
- Generally faster than GPTQ with comparable quality.

## Batching Strategies

### Static Batching

```python
# Pad all sequences to the same length
inputs = tokenizer(
    texts,
    padding=True,
    truncation=True,
    max_length=512,
    return_tensors="pt",
).to(device)

with torch.no_grad():
    outputs = model(**inputs)
```

- Simple but wasteful: short sequences are padded to the longest sequence length.
- Good for uniform-length inputs (fixed-length classification).

### Dynamic Batching by Length

```python
from itertools import groupby

def batch_by_length(texts: list[str], bucket_size: int = 64) -> list[list[str]]:
    """Group texts into buckets of similar length to minimize padding."""
    sorted_texts = sorted(texts, key=lambda t: len(t.split()))
    return [
        list(group)
        for _, group in groupby(
            sorted_texts,
            key=lambda t: len(t.split()) // bucket_size
        )
    ]
```

- Groups texts by approximate length, reducing padding waste by 30-50%.
- Essential for variable-length inputs like documents and queries.

## Pipeline Optimization

### Pipeline with GPU and Batching

```python
from transformers import pipeline

classifier = pipeline(
    "text-classification",
    model=model_id,
    device=0,           # GPU index
    batch_size=32,       # Process 32 texts at a time
    torch_dtype=torch.float16,
)

results = classifier(texts, truncation=True, max_length=512)
```

### Pipeline with Multiple GPUs

```python
classifier = pipeline(
    "text-classification",
    model=model_id,
    device_map="auto",
)
```

## Caching and Warm-Up

### Model Caching

```python
import os

# Set cache directory (default: ~/.cache/huggingface)
os.environ["HF_HOME"] = "/data/hf_cache"
os.environ["TRANSFORMERS_CACHE"] = "/data/hf_cache/transformers"

# Models are cached on first download and loaded from cache on subsequent calls
model = AutoModel.from_pretrained(model_id)  # downloads once, cached after
```

### KV-Cache for Generation

```python
# KV-cache is enabled by default for generation
outputs = model.generate(
    input_ids,
    max_new_tokens=256,
    use_cache=True,  # default; reuses key-value pairs from previous tokens
)
```

- KV-cache avoids recomputing attention for already-generated tokens.
- Memory usage grows linearly with sequence length. For very long sequences, consider sliding window attention models.

## ONNX Runtime Acceleration

```python
from optimum.onnxruntime import ORTModelForSequenceClassification

# Export and load model in ONNX format
model = ORTModelForSequenceClassification.from_pretrained(
    model_id,
    export=True,  # converts to ONNX on first load
)

# Use the same pipeline API
classifier = pipeline("text-classification", model=model, tokenizer=tokenizer)
```

- ONNX Runtime provides 1.5-3x speedup over PyTorch for encoder models.
- Best gains on CPU inference. GPU gains are model-dependent.
- Use `optimum` library for seamless integration with Transformers.

## Inference API (Serverless)

```python
from huggingface_hub import InferenceClient

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token="hf_YOUR_TOKEN",
    timeout=30,
)

# Text generation
response = client.text_generation(
    "Explain quantum computing in simple terms.",
    max_new_tokens=200,
    temperature=0.7,
)

# Embeddings
embeddings = client.feature_extraction("Hello, world!")
```

- Serverless: no GPU provisioning, scales to zero.
- Rate-limited: use Inference Endpoints for production throughput.
- Set `timeout` and implement retry logic for cold starts.

## Benchmarking

```python
import time
import torch

def benchmark_inference(model, tokenizer, text, n_runs=100):
    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    # Warm up
    for _ in range(10):
        with torch.no_grad():
            model(**inputs)

    # Benchmark
    torch.cuda.synchronize()
    start = time.perf_counter()
    for _ in range(n_runs):
        with torch.no_grad():
            model(**inputs)
    torch.cuda.synchronize()
    elapsed = time.perf_counter() - start

    print(f"Average: {elapsed / n_runs * 1000:.1f}ms per inference")
    print(f"Throughput: {n_runs / elapsed:.0f} inferences/second")
```

- Always warm up the model before benchmarking to exclude initialization costs.
- Use `torch.cuda.synchronize()` to ensure GPU operations complete before timing.
- Benchmark with representative input lengths, not just short strings.
