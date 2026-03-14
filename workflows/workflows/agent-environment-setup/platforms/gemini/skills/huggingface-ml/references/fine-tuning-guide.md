# Fine-Tuning Guide

Load this when training with Trainer, using PEFT/LoRA, preparing datasets, or evaluating fine-tuned models.

## Dataset Preparation

### Loading from the Hub

```python
from datasets import load_dataset

# Load a public dataset
dataset = load_dataset("imdb", split="train")

# Load a specific configuration
dataset = load_dataset("glue", "mrpc", split="train")

# Stream large datasets without downloading fully
dataset = load_dataset("c4", "en", streaming=True)
```

### Loading Custom Data

```python
from datasets import Dataset, DatasetDict

# From a list of dictionaries
data = [
    {"text": "Great product!", "label": 1},
    {"text": "Terrible experience.", "label": 0},
]
dataset = Dataset.from_list(data)

# From CSV/JSON files
dataset = load_dataset("csv", data_files="train.csv")
dataset = load_dataset("json", data_files={"train": "train.jsonl", "test": "test.jsonl"})

# Create train/test split
split = dataset.train_test_split(test_size=0.2, seed=42)
# split["train"], split["test"]
```

### Preprocessing

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

def preprocess(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length",
    )

tokenized = dataset.map(preprocess, batched=True, remove_columns=["text"])
```

- Use `batched=True` for 10-100x faster preprocessing.
- `remove_columns` drops raw text columns that the model does not need.
- For large datasets, use `num_proc=4` for multi-process preprocessing.

## Full Fine-Tuning with Trainer

```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=4,  # Number of classification labels
)
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    weight_decay=0.01,
    eval_strategy="steps",
    eval_steps=500,
    save_strategy="steps",
    save_steps=500,
    save_total_limit=3,           # Keep only the 3 best checkpoints
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    logging_steps=100,
    fp16=True,                    # Mixed precision training
    dataloader_num_workers=4,
    report_to="wandb",            # or "tensorboard", "none"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

trainer.train()
```

### Custom Metrics

```python
import evaluate
import numpy as np

accuracy = evaluate.load("accuracy")
f1 = evaluate.load("f1")
precision = evaluate.load("precision")
recall = evaluate.load("recall")

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    return {
        "accuracy": accuracy.compute(predictions=predictions, references=labels)["accuracy"],
        "f1": f1.compute(predictions=predictions, references=labels, average="weighted")["f1"],
        "precision": precision.compute(predictions=predictions, references=labels, average="weighted")["precision"],
        "recall": recall.compute(predictions=predictions, references=labels, average="weighted")["recall"],
    }
```

## PEFT: LoRA Fine-Tuning

LoRA trains a small set of adapter weights (< 1% of model parameters) instead of the full model.

```python
from peft import LoraConfig, get_peft_model, TaskType

# Configure LoRA
lora_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,       # or CAUSAL_LM, SEQ_2_SEQ_LM
    r=16,                              # Rank of the adapter matrices
    lora_alpha=32,                     # Scaling factor
    lora_dropout=0.1,
    target_modules=["query", "value"], # Which layers to adapt
    bias="none",
)

# Wrap the model
model = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=4)
model = get_peft_model(model, lora_config)

# Print trainable parameters
model.print_trainable_parameters()
# trainable params: 294,912 || all params: 109,482,240 || trainable%: 0.27%
```

### QLoRA (Quantized LoRA)

Combines 4-bit quantization with LoRA for training large models on consumer GPUs.

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Load model in 4-bit
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B",
    quantization_config=bnb_config,
    device_map="auto",
)

# Prepare for training
model = prepare_model_for_kbit_training(model)

# Add LoRA
lora_config = LoraConfig(
    r=64,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
```

- QLoRA enables fine-tuning a 7B model on a single 24GB GPU.
- `prepare_model_for_kbit_training` handles gradient checkpointing and layer freezing.

## Pushing to the Hub

```python
# After training
trainer.push_to_hub("your-org/ticket-classifier-v2")

# Or manually
model.push_to_hub("your-org/ticket-classifier-v2")
tokenizer.push_to_hub("your-org/ticket-classifier-v2")

# Push LoRA adapter only (much smaller)
model.push_to_hub("your-org/ticket-classifier-lora-v2")
```

## Training Tips

### Learning Rate

- **Full fine-tuning**: 1e-5 to 5e-5 for BERT-size models.
- **LoRA**: 1e-4 to 3e-4 (adapters can tolerate higher learning rates).
- **Large models (7B+)**: 1e-5 to 2e-5 for full fine-tuning, 1e-4 for LoRA.

### Batch Size and Gradient Accumulation

```python
TrainingArguments(
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    # Effective batch size = 4 * 8 = 32
)
```

- If GPU memory limits batch size, use gradient accumulation to simulate larger batches.
- Larger effective batch sizes generally lead to more stable training.

### Early Stopping

```python
from transformers import EarlyStoppingCallback

trainer = Trainer(
    ...,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)
```

- Stops training when the evaluation metric does not improve for N evaluations.
- Requires `load_best_model_at_end=True` and `eval_strategy` set to `"steps"` or `"epoch"`.

### Reproducibility

```python
from transformers import set_seed

set_seed(42)  # Sets seed for torch, numpy, and random
```

- Set seed before training for reproducible results.
- Note: some operations (attention dropout, data shuffling) may still vary across hardware.
