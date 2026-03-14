# Eval Frameworks

## Overview

Choosing the right eval framework determines how quickly you can iterate on test cases, how reliably results reproduce, and how easily the pipeline integrates with CI/CD. This reference covers the major options, their trade-offs, and configuration patterns.

## Framework Comparison

| Framework | Best for | Language | Judge support | CI integration | Cost model |
|-----------|----------|----------|---------------|----------------|------------|
| Promptfoo | Prompt iteration, multi-provider comparison | Node.js/CLI | LLM-as-judge, Python functions | GitHub Actions, any CI | Open source |
| Braintrust | Production monitoring + eval | Python/TS SDK | Built-in scorers, custom | API-based | SaaS (free tier) |
| OpenAI Evals | OpenAI model evaluation | Python | Model-graded evals | CLI-based | Open source |
| Langsmith | LangChain ecosystem evaluation | Python | Built-in evaluators | API-based | SaaS (free tier) |
| Custom harness | Full control, non-standard needs | Any | Whatever you build | Whatever you build | Engineering time |

## Promptfoo Configuration

Promptfoo is the most flexible open-source option for multi-provider prompt evaluation.

### Basic Configuration

```yaml
# promptfoo.yaml
description: "Customer support chatbot eval"

providers:
  - id: anthropic:messages:claude-sonnet-4-20250514
    config:
      temperature: 0.3
      max_tokens: 1024
  - id: openai:gpt-4o
    config:
      temperature: 0.3
      max_tokens: 1024

prompts:
  - file://prompts/support-v2.txt
  - file://prompts/support-v3.txt

tests:
  - file://evals/test-cases.yaml

defaultTest:
  options:
    transformVars: "{ ...vars, timestamp: new Date().toISOString() }"

outputPath: results/eval-{{timestamp}}.json
```

### Test Case Format

```yaml
# evals/test-cases.yaml
- vars:
    user_message: "What is the status of my order #12345?"
  assert:
    - type: contains
      value: "order"
    - type: not-contains
      value: "I don't know"
    - type: llm-rubric
      value: |
        The response must:
        1. Acknowledge the specific order number
        2. Provide or request information to look up status
        3. Include a case reference ID
        4. Maintain professional tone
      threshold: 0.8
    - type: javascript
      value: "output.length < 500"
```

## Braintrust Configuration

Braintrust combines evaluation with production logging and experiment tracking.

```python
import braintrust
from autoevals import Factuality, ClosedQA

project = braintrust.init(project="support-chatbot")

@braintrust.traced
def run_eval(input_message: str, expected_behavior: str):
    response = call_chatbot(input_message)

    factuality = Factuality()
    fact_score = factuality(
        input=input_message,
        output=response,
        expected=expected_behavior
    )

    closed_qa = ClosedQA()
    qa_score = closed_qa(
        input=input_message,
        output=response,
        criteria="Response includes a case reference ID and maintains professional tone"
    )

    return {
        "output": response,
        "scores": {
            "factuality": fact_score.score,
            "quality": qa_score.score
        }
    }
```

## Custom Harness Pattern

When existing frameworks do not fit, build a minimal harness with these components:

```python
from dataclasses import dataclass, field
from typing import Callable
import json
import hashlib
from datetime import datetime, timezone

@dataclass
class Assertion:
    type: str  # contains, not-contains, regex, json-schema, llm-judge
    value: str
    description: str

@dataclass
class EvalCase:
    name: str
    description: str
    input: str
    assertions: list[Assertion]

@dataclass
class RunMetadata:
    model: str
    temperature: float
    system_prompt_hash: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class EvalResult:
    case_name: str
    output: str
    assertion_results: list[dict]
    latency_ms: float
    token_count: int

class EvalHarness:
    def __init__(self, metadata: RunMetadata):
        self.metadata = metadata
        self.results: list[EvalResult] = []

    def run_case(self, case: EvalCase, model_fn: Callable) -> EvalResult:
        start = time.time()
        output = model_fn(case.input)
        latency = (time.time() - start) * 1000

        assertion_results = []
        for assertion in case.assertions:
            result = self._check_assertion(assertion, output)
            assertion_results.append(result)

        return EvalResult(
            case_name=case.name,
            output=output,
            assertion_results=assertion_results,
            latency_ms=latency,
            token_count=count_tokens(output)
        )

    def _check_assertion(self, assertion: Assertion, output: str) -> dict:
        if assertion.type == "contains":
            passed = assertion.value.lower() in output.lower()
        elif assertion.type == "not-contains":
            passed = assertion.value.lower() not in output.lower()
        elif assertion.type == "regex":
            passed = bool(re.search(assertion.value, output))
        else:
            passed = None  # Requires judge evaluation
        return {"assertion": assertion, "passed": passed}
```

## Framework Selection Criteria

1. **If you need multi-provider comparison:** Use Promptfoo. It natively supports running the same test cases across providers and prompt variants.

2. **If you are in the LangChain ecosystem:** Use Langsmith for its native integration with LangChain traces and feedback.

3. **If you need production monitoring alongside eval:** Use Braintrust for its combined experiment + monitoring workflow.

4. **If you need full control or have non-text modalities:** Build a custom harness. The 200 lines of code above cover 80% of use cases.

5. **If you are evaluating OpenAI models specifically:** OpenAI Evals has model-graded eval types tuned for their models.

## CI Integration Pattern

Regardless of framework, the CI integration follows the same pattern:

```yaml
# .github/workflows/eval.yml
name: LLM Eval
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'evals/**'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g promptfoo
      - run: promptfoo eval --output results.json
      - run: promptfoo eval --output results.json --compare-to baseline.json --threshold 0.95
      - uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: results.json
```
