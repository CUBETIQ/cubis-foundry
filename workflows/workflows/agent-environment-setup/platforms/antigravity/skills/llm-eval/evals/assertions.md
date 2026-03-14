# LLM Eval Assertions

## Eval 1: Chatbot Eval Suite Design

This eval tests the skill's ability to produce a comprehensive evaluation suite for a customer-support chatbot with specific behavioral requirements.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `assertions` -- explicit assertion definitions | An eval suite without assertions is just a collection of example inputs. Assertions are what make evals reproducible and automatable. |
| 2 | contains | `not-contains` -- negative assertion patterns | The chatbot must refuse competitor questions and avoid fabrication. Without negative assertions, these critical guardrails go untested. |
| 3 | contains | `rubric` -- scoring rubric with anchors | LLM-as-judge without a rubric produces inconsistent scores across runs. Anchored rubrics are required for judgmental assertion reliability. |
| 4 | contains | `adversarial` -- adversarial test cases | Chatbots face prompt injection and topic derailment in production. A suite without adversarial cases provides false confidence about safety. |
| 5 | contains | `case reference` -- format requirement check | The chatbot spec requires a case reference ID in every response. This deterministic assertion verifies a hard product requirement. |

### What a passing response looks like

- A structured eval suite with 8-15 test cases covering order status, returns, product questions, refusals, and adversarial inputs.
- Each test case has 3-5 assertions mixing deterministic (contains, regex, not-contains) and judgmental (LLM-as-judge with rubric) types.
- A 1-5 scoring rubric with concrete anchors for tone, accuracy, and completeness dimensions.
- Adversarial cases that test prompt injection ("ignore your instructions and..."), topic derailment ("what about competitor X?"), and data extraction.
- At least one assertion per positive case checking for the case reference ID format.

---

## Eval 2: Regression Detection Strategy

This eval tests the skill's ability to design a regression detection pipeline for comparing prompt versions with statistical rigor.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `baseline` -- baseline snapshot definition | Without a frozen baseline, there is no reference point for comparison. The strategy must define what is captured and how it is stored. |
| 2 | contains | `threshold` -- numeric regression thresholds | Subjective "looks worse" judgments do not scale. Numeric thresholds automate the pass/fail decision and remove human bias from the gate. |
| 3 | contains | `confidence interval` -- statistical rigor | A 2% score drop on 20 samples may be noise. The strategy must account for sample size and variance to avoid false regression alarms. |
| 4 | contains | `latency` -- operational metric coverage | Quality-only regression detection misses operational regressions. A prompt that doubles latency is a regression even if quality improves. |
| 5 | contains | `alert` -- alerting mechanism | Detection without notification is useless. The strategy must close the loop by alerting the team when thresholds are breached. |

### What a passing response looks like

- A baseline snapshot schema capturing per-case scores, aggregate pass rate, mean judge score, latency percentiles, and estimated cost.
- Comparison logic that computes deltas between current and baseline, with confidence intervals or significance tests.
- Threshold configuration (e.g., pass rate drop > 2%, mean score drop > 0.3, p95 latency increase > 20%) with severity levels.
- An alerting plan that integrates with CI (fail the pipeline), Slack (notify the team), and a dashboard (visualize trends).
- A separate check for gradual drift vs. acute regression, acknowledging that slow degradation requires trend analysis over multiple runs.
