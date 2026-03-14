# Prompt Engineering Eval Assertions

## Eval 1: System Prompt Design for Code Assistant

This eval tests the skill's ability to design a production-ready system prompt with role definition, constraints, output format, few-shot examples, and safety guardrails for a Python code assistant.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `role` -- explicit role definition | Without a role definition, the model defaults to generic assistant behavior. The role calibrates expertise, vocabulary, and confidence level for Python-specific output. |
| 2 | contains | `NEVER` -- explicit prohibitions | Positive instructions ("try to avoid filesystem access") are weaker than explicit prohibitions ("NEVER access the filesystem unless explicitly requested"). Guardrails must be unambiguous. |
| 3 | contains | `def ` -- Python function in examples | Few-shot examples must demonstrate the exact output format. A code assistant prompt without code examples leaves the model guessing about formatting, type annotations, and docstring style. |
| 4 | contains | `docstring` -- docstring requirement | This is a hard requirement from the spec. The prompt must both instruct and demonstrate docstring usage so the model consistently includes them in every function. |
| 5 | contains | `reasoning` -- chain-of-thought instruction | The spec requires the assistant to explain reasoning before code. This must be an explicit instruction, not an assumption that the model will naturally explain itself. |

### What a passing response looks like

- A system prompt with clearly labeled sections: Role, Task, Constraints, Output Format, Examples.
- Role defined as a Python expert with type annotation and PEP 8 expertise.
- Constraints section with explicit NEVER/DO NOT rules for filesystem and network access.
- Output format specifying: (1) reasoning explanation, then (2) code block with type annotations and docstrings.
- 2-3 few-shot examples showing user request -> reasoning -> typed Python function with docstring.
- Examples spanning difficulty: a simple utility function, a function with error handling, and an edge case (e.g., request involving filesystem access that gets appropriately refused).

---

## Eval 2: Structured Output Extraction

This eval tests the skill's ability to design a robust extraction pipeline with JSON schema enforcement, validation, and fallback handling for customer feedback analysis.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `json` -- JSON output format | Structured extraction must produce machine-parseable JSON, not prose descriptions of the extracted fields. JSON enables deterministic downstream processing. |
| 2 | contains | `enum` -- constrained field values | Unconstrained fields (e.g., free-text sentiment) produce inconsistent values across runs. Enums enforce consistency and prevent the model from inventing categories. |
| 3 | contains | `validation` -- output validation logic | LLMs do not guarantee schema compliance. Without validation, malformed outputs propagate as silent data corruption in the pipeline. |
| 4 | contains | `fallback` -- error recovery strategy | Production systems must handle extraction failures gracefully. A pipeline that crashes on malformed JSON is not production-grade. |
| 5 | contains | `example` -- few-shot extraction example | Examples are the most reliable way to enforce output format. A complete input/output example reduces schema violations by 60-80% compared to instructions alone. |

### What a passing response looks like

- A system prompt with the JSON schema embedded and an explicit instruction to respond only with valid JSON.
- A JSON Schema definition with required fields, enum constraints, and string length limits.
- 1-2 few-shot examples showing customer email input and the expected JSON output.
- Validation code that: parses JSON, checks required fields, validates enum values, checks string lengths.
- A fallback strategy: (a) retry with a simplified prompt, (b) extract partial fields from malformed output, (c) flag for human review if all retries fail.
- Notes on model differences: Claude responds well to XML-fenced examples, GPT-4 responds well to function-calling mode for structured output.
