---
name: huggingface-ml
description: "Use when building ML workflows with Hugging Face, including model loading, inference APIs, fine-tuning with Trainer or PEFT, Hub versioning, and Spaces demos."
---
# Hugging Face ML Integration

## Purpose

Guide the design and implementation of machine learning workflows using the Hugging Face ecosystem, covering model discovery and loading from the Hub, local and remote inference with Transformers and the Inference API, fine-tuning with Trainer and parameter-efficient methods (LoRA, QLoRA), model deployment to production endpoints, and interactive demo creation with Spaces.

## When to Use

- Loading and running pre-trained models from the Hugging Face Hub for inference.
- Calling the Inference API for serverless model execution without managing infrastructure.
- Fine-tuning a base model on custom data with Trainer, PEFT, or TRL.
- Deploying fine-tuned models to Inference Endpoints or custom serving infrastructure.
- Building interactive demos with Gradio on Hugging Face Spaces.
- Evaluating model performance with the `evaluate` library and custom metrics.

## Instructions

1. **Search the Hub for existing models before training from scratch** because the Hub hosts 500k+ models across tasks, and fine-tuning an existing checkpoint is 10-100x cheaper than pre-training.

2. **Use `AutoModel` and `AutoTokenizer` with the model ID for loading** because Auto classes detect the correct architecture from the Hub metadata, avoiding manual class selection errors and supporting future model architectures.

3. **Pin model revisions with the `revision` parameter or commit hash** because models on the Hub are mutable, and an unversioned reference may load a different checkpoint than the one you tested against.

4. **Configure `device_map="auto"` for models that exceed single-GPU memory** because automatic device mapping splits the model across available GPUs and CPU RAM with offloading, enabling inference on hardware that would otherwise OOM.

5. **Use the Inference API with `InferenceClient` for serverless inference** because it eliminates GPU provisioning, scales to zero when idle, and supports rate-limited production workloads without infrastructure management.

6. **Set `InferenceClient` timeout and retry parameters for production calls** because serverless cold starts can exceed default timeouts, and transient failures require exponential backoff to avoid cascading failures.

7. **Fine-tune with `Trainer` and a `TrainingArguments` configuration** because Trainer handles distributed training, mixed precision, gradient accumulation, checkpointing, and evaluation loops without boilerplate code.

8. **Use PEFT (LoRA or QLoRA) for parameter-efficient fine-tuning** because full fine-tuning of large models requires prohibitive GPU memory, and LoRA adapters achieve comparable quality while training less than 1% of parameters.

9. **Prepare datasets with the `datasets` library using streaming for large corpora** because streaming loads data lazily from disk or the Hub, avoiding RAM exhaustion on datasets larger than available memory.

10. **Evaluate models with the `evaluate` library and task-specific metrics** because comparing model quality requires standardized metrics (BLEU, ROUGE, F1, accuracy) computed on held-out test splits with reproducible configurations.

11. **Push fine-tuned models and adapters to the Hub with `push_to_hub`** because the Hub provides versioning, model cards, download tracking, and access control, replacing ad-hoc model storage on cloud buckets.

12. **Deploy production models to Inference Endpoints with autoscaling configuration** because dedicated endpoints provide guaranteed latency, custom container images, and scaling policies that the shared Inference API does not offer.

13. **Build interactive demos with Gradio on Spaces** because stakeholders and users need to test model behavior without writing code, and Spaces provides free hosting with GPU allocation for demos.

14. **Write model cards with training data, evaluation results, and limitation disclosures** because model cards are the standard for ML documentation, and the Hub renders them as the model's landing page.

15. **Quantize models with `bitsandbytes` or GPTQ before deployment** because quantization reduces model size by 2-4x and inference latency proportionally, enabling deployment on smaller GPUs without meaningful quality loss.

16. **Use `safetensors` format for model serialization** because safetensors prevents arbitrary code execution on load (unlike pickle), supports memory-mapped loading for instant startup, and is the Hub default for new models.

## Output Format

```
## Model Selection
[Hub search results, architecture choice, task compatibility]

## Implementation
[Loading, inference, or fine-tuning code with configuration]

## Evaluation
[Metrics, test split results, comparison with baseline]

## Deployment
[Endpoint configuration, autoscaling, monitoring]
```

## References

| File                             | Load when                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `references/model-selection.md` | Loading models, comparing checkpoints, and choosing the right task framing or pipeline.    |
| `references/inference-optimization.md` | Running inference, calling hosted APIs, and tuning latency, batching, and cost.      |
| `references/fine-tuning-guide.md` | Training with Trainer, PEFT/LoRA, dataset preparation, or evaluation.                    |

## Examples

- "Fine-tune Llama 3 on a custom Q&A dataset using QLoRA with the Trainer API."
- "Set up a production Inference Endpoint with autoscaling for a text classification model."
- "Build a Gradio demo on Spaces for a fine-tuned image captioning model."

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
