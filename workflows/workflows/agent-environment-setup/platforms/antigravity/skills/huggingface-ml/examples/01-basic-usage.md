# Example: Text Classification with Hugging Face Transformers

## Scenario

A team is building a customer support ticket routing system. They need to classify incoming support tickets into categories (billing, technical, account, general) using a pre-trained text classification model from the Hugging Face Hub. The system should load the model locally for low-latency inference, handle batch classification for processing backlogs, and include a confidence threshold to flag uncertain predictions for human review.

## Prompt

"Set up a text classification pipeline using Hugging Face Transformers to categorize customer support tickets into billing, technical, account, and general categories. Use a pre-trained model from the Hub, implement batch classification, and add a confidence threshold for uncertain predictions."

## Expected Output

### Model Selection and Loading

```python
# classify.py
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import torch

MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
# For production, fine-tune on your own labeled data. This example uses a
# pre-trained sentiment model to demonstrate the pipeline pattern.

# Option 1: High-level pipeline (simplest)
classifier = pipeline(
    "text-classification",
    model=MODEL_ID,
    device=0 if torch.cuda.is_available() else -1,
)

# Option 2: Manual loading (more control)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID,
    revision="main",  # Pin to a specific revision in production
)
model.eval()

if torch.cuda.is_available():
    model = model.cuda()
```

### Classification Service

```python
# ticket_classifier.py
from dataclasses import dataclass
from transformers import pipeline
import torch

CATEGORIES = ["billing", "technical", "account", "general"]
CONFIDENCE_THRESHOLD = 0.75

@dataclass
class ClassificationResult:
    ticket_id: str
    text: str
    category: str
    confidence: float
    needs_review: bool

class TicketClassifier:
    def __init__(self, model_id: str, device: int = -1):
        self.classifier = pipeline(
            "text-classification",
            model=model_id,
            device=device,
            top_k=None,  # Return scores for all labels
        )

    def classify_one(self, ticket_id: str, text: str) -> ClassificationResult:
        results = self.classifier(text, truncation=True, max_length=512)
        top_result = max(results[0], key=lambda x: x["score"])

        return ClassificationResult(
            ticket_id=ticket_id,
            text=text[:200],
            category=top_result["label"],
            confidence=top_result["score"],
            needs_review=top_result["score"] < CONFIDENCE_THRESHOLD,
        )

    def classify_batch(
        self, tickets: list[dict[str, str]], batch_size: int = 32
    ) -> list[ClassificationResult]:
        texts = [t["text"] for t in tickets]
        ids = [t["id"] for t in tickets]

        # Pipeline handles batching internally
        all_results = self.classifier(
            texts,
            truncation=True,
            max_length=512,
            batch_size=batch_size,
        )

        classifications = []
        for ticket_id, text, results in zip(ids, texts, all_results):
            top_result = max(results, key=lambda x: x["score"])
            classifications.append(
                ClassificationResult(
                    ticket_id=ticket_id,
                    text=text[:200],
                    category=top_result["label"],
                    confidence=top_result["score"],
                    needs_review=top_result["score"] < CONFIDENCE_THRESHOLD,
                )
            )

        return classifications
```

### FastAPI Integration

```python
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ticket_classifier import TicketClassifier

app = FastAPI()
classifier = TicketClassifier(
    model_id="your-org/ticket-classifier-v2",
    device=0,  # GPU
)

class TicketRequest(BaseModel):
    ticket_id: str
    text: str

class BatchRequest(BaseModel):
    tickets: list[TicketRequest]

class ClassificationResponse(BaseModel):
    ticket_id: str
    category: str
    confidence: float
    needs_review: bool

@app.post("/classify", response_model=ClassificationResponse)
def classify_ticket(request: TicketRequest):
    result = classifier.classify_one(request.ticket_id, request.text)
    return ClassificationResponse(
        ticket_id=result.ticket_id,
        category=result.category,
        confidence=result.confidence,
        needs_review=result.needs_review,
    )

@app.post("/classify/batch", response_model=list[ClassificationResponse])
def classify_batch(request: BatchRequest):
    tickets = [{"id": t.ticket_id, "text": t.text} for t in request.tickets]
    results = classifier.classify_batch(tickets)
    return [
        ClassificationResponse(
            ticket_id=r.ticket_id,
            category=r.category,
            confidence=r.confidence,
            needs_review=r.needs_review,
        )
        for r in results
    ]
```

### Usage

```python
# Single classification
import requests

response = requests.post("http://localhost:8000/classify", json={
    "ticket_id": "TKT-001",
    "text": "I was charged twice for my subscription last month and need a refund."
})
print(response.json())
# {"ticket_id": "TKT-001", "category": "billing", "confidence": 0.94, "needs_review": false}

# Batch classification
response = requests.post("http://localhost:8000/classify/batch", json={
    "tickets": [
        {"ticket_id": "TKT-002", "text": "Cannot log into my account after password reset"},
        {"ticket_id": "TKT-003", "text": "The API returns 500 errors on the /users endpoint"},
        {"ticket_id": "TKT-004", "text": "How do I change my email address?"},
    ]
})
```

## Key Decisions

- **Pipeline API over manual model inference** -- the pipeline handles tokenization, batching, and post-processing automatically, reducing boilerplate and error-prone manual tensor handling.
- **`top_k=None` to return all label scores** -- allows computing confidence as the gap between the top prediction and alternatives, and supports the confidence threshold check.
- **Confidence threshold with human review flag** -- tickets below 75% confidence are flagged for manual review rather than silently misrouted, balancing automation with accuracy.
- **Batch classification** -- processes ticket backlogs efficiently by leveraging GPU parallelism through the pipeline's internal batching.
- **Model revision pinning** -- production deployments pin to a specific model revision to prevent unexpected behavior changes when the model is updated on the Hub.
