---
name: llm-eval
description: "Use when designing LLM evaluation suites, writing assertions, building benchmarks, running human evals, implementing automated scoring, or detecting regressions across model or prompt versions."
allowed-tools: Read Grep Glob Bash
user-invocable: true
argument-hint: "Eval suite, benchmark, or LLM output to evaluate"
---

# LLM Eval

## Purpose

Guide the design and execution of rigorous LLM evaluation pipelines. Every instruction ensures that evaluation results are reproducible, assertions are meaningful, scoring is defensible, and regressions are caught before they reach production.

## When to Use

- Designing an evaluation suite for a new LLM-powered feature or chatbot.
- Writing assertion sets that test functional correctness, safety, and style.
- Building automated scoring pipelines with LLM-as-judge or deterministic checks.
- Running human evaluation campaigns with calibrated annotators.
- Detecting performance regressions after prompt changes, model upgrades, or fine-tuning.
- Comparing model variants on cost, latency, and quality trade-offs.

## Instructions

1. **Define the evaluation objective before choosing metrics** because a chatbot eval measures different things than a code-generation eval. Misaligned metrics produce misleading pass rates that mask real quality problems.

2. **Separate deterministic assertions from judgmental assertions** because string-match and schema-validation checks are cheap and reproducible, while LLM-as-judge or human ratings introduce variance that must be tracked separately.

3. **Write at least five assertions per eval case** because single-assertion tests create a false sense of confidence. Multiple orthogonal assertions catch partial successes that a single check would miss.

4. **Include negative test cases that should be refused or handled gracefully** because models that pass every positive case may still fail on adversarial, ambiguous, or out-of-scope inputs. Negative cases test guardrails.

5. **Pin the model version, temperature, and system prompt in every eval run** because uncontrolled variables make results non-reproducible. A passing eval that cannot be repeated is evidence of nothing.

6. **Use stratified sampling when building eval datasets** because biased distributions (e.g., 90% easy cases) inflate accuracy. Strata should cover difficulty levels, input lengths, edge cases, and domain segments.

7. **Design LLM-as-judge prompts with explicit rubrics and scoring anchors** because vague judge instructions produce high inter-run variance. Anchored rubrics (score 1 = wrong, 3 = partial, 5 = perfect with reasoning) reduce drift.

8. **Calibrate human evaluators with a shared golden set before production annotation** because uncalibrated raters disagree on subjective dimensions. Golden-set calibration aligns raters and reveals dimension ambiguity early.

9. **Compute inter-annotator agreement (Cohen's kappa or Krippendorff's alpha) for every human eval** because raw average scores hide disagreement. Low agreement signals that the rubric or task definition needs revision, not that evaluators are wrong.

10. **Automate regression detection by comparing current run scores against a baseline snapshot** because manual eyeballing of score tables misses slow degradation. Automated thresholds (e.g., >2% drop triggers alert) enforce discipline.

11. **Store every eval run as an immutable artifact with inputs, outputs, scores, and metadata** because post-hoc debugging requires the exact conditions of the run. Overwriting previous results destroys regression evidence.

12. **Report confidence intervals, not just point estimates** because a 92% pass rate from 25 samples has a wide confidence interval that could include 80%. Sample size determines how much the result can be trusted.

13. **Test latency and cost alongside quality** because a prompt change that improves quality by 3% but doubles latency may be a net negative in production. Eval suites must capture operational metrics.

14. **Version-control eval datasets and assertion definitions alongside code** because eval drift (silent changes to test cases) makes historical comparisons meaningless. Eval code is production code.

15. **Run evals in CI on every prompt or model change** because manual eval runs get skipped under deadline pressure. Automated gates prevent regressions from reaching deployment.

16. **Review eval coverage quarterly and retire stale cases** because product features evolve and old test cases may no longer exercise relevant behavior. Stale evals waste compute and create false confidence.

## Output Format

Provide eval suite designs as structured JSON or YAML with assertion definitions, scoring rubrics as numbered tables, regression reports as before/after comparisons with statistical significance, and implementation code for scoring pipelines.

## References

| File | Load when |
| --- | --- |
| `references/eval-frameworks.md` | Choosing or configuring an eval framework (OpenAI Evals, Braintrust, Promptfoo, custom). |
| `references/assertion-patterns.md` | Writing deterministic and judgmental assertions for LLM outputs. |
| `references/scoring-methods.md` | Implementing LLM-as-judge, rubric-based scoring, or composite metrics. |
| `references/regression-detection.md` | Setting up automated regression detection, baselines, and alerting. |
| `references/human-eval.md` | Designing human evaluation campaigns, calibration, and agreement metrics. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
