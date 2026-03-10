---
name: skill-creator
description: Create, test, improve, and package portable AI skills using the Agent Skills SKILL.md format across Claude Code, Codex, and GitHub Copilot, with Gemini conversion when needed. Use this when the user wants to build, repair, benchmark, or iterate on a reusable skill package.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Skill Creator

## Purpose

Create and improve reusable AI skill packages with a human-in-the-loop loop: define the skill, draft it, test it with the skill enabled, evaluate results qualitatively and quantitatively, rewrite based on signal, and repeat until the package is good enough to scale.

## When to Use

- The user wants to create a new skill package under `workflows/skills/<name>`.
- The user wants to repair or modernize an existing `SKILL.md` package.
- The user wants evals, benchmarks, or review tooling for a skill package.
- The user wants to package one canonical skill for Claude Code, Codex, GitHub Copilot, and optionally Gemini.

## Instructions

1. Decide what the skill should do before writing files. Confirm the task boundary, activation phrases, expected outputs, supported platforms, and whether the skill needs objective evals.

2. Write a first draft of the skill package. Keep one canonical `SKILL.md` as the source of truth. Add sidecars only when they reduce prompt bloat or remove repeated work.

3. Create a small test set first. Add a few realistic prompts to `evals/` and keep them representative of the skill's actual use cases, not just ideal happy paths.

4. Run the skill with the skill enabled on the test prompts. Prefer Claude with access to the skill for the first qualitative pass so you can inspect whether the instructions actually trigger the right behavior.

5. While runs are happening, draft or refine the quantitative evals. If quantitative evals already exist, review them, keep the ones that are still useful, and adjust only the ones that no longer match the intended behavior.

6. Explain the evals to the user before over-optimizing against them. The user should understand what each prompt, assertion, or benchmark is measuring and what a pass or fail means.

7. Review the outputs both qualitatively and quantitatively. Use `eval-viewer/generate_review.py` so the user can inspect side-by-side outputs and benchmark summaries instead of relying only on raw JSON.

8. Rewrite the skill based on user feedback and the strongest benchmark signal. Fix root causes, not just individual failing prompts, and treat obvious flaws in the quantitative results as design feedback for the skill.

9. Repeat the loop until the results are stable enough. Keep iterating until the user is satisfied or the skill behavior has clearly plateaued.

10. Expand the test set and rerun at larger scale only after the small-set loop is working. Do not scale weak evals or unclear instructions.

11. Use the right script for the job:
    - `scripts/run_loop.py` is the original Claude-oriented optimization loop built on `run_eval.py`.
    - `scripts/run_loop_universal.py` is the portable loop built on `run_eval_universal.py` and `platform_adapter.py`.
    - Prefer the universal loop when the package is intended to stay portable across Claude Code, Codex, Copilot, and Gemini-style workflows.

## Output Format

Produce a canonical skill package with:

- a valid root `SKILL.md`
- any needed `references/`, `scripts/`, `assets/`, `evals/`, and `eval-viewer/` files
- a small initial prompt/eval set
- review outputs the user can inspect
- clear next-step changes when another iteration is required

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/platform-formats.md` | You need deployment or compatibility rules for Claude Code, Codex, Copilot, or Gemini conversion. |
| `references/schemas.md` | You need the JSON structure for evals, grading artifacts, or review payloads. |

## Scripts

Use the existing tooling instead of re-inventing the loop:

- `scripts/run_eval.py` for the original Claude-oriented eval pass
- `scripts/run_loop.py` for iterative improvement on the original eval path
- `scripts/run_eval_universal.py` for the cross-platform eval path
- `scripts/run_loop_universal.py` for the portable iterative loop
- `scripts/aggregate_benchmark.py` to summarize quantitative benchmark results
- `eval-viewer/generate_review.py` to generate a reviewable output bundle for the user
- `scripts/package_skill.py` when the skill is ready to distribute
- `scripts/platform_adapter.py` when Gemini conversion or cross-platform deployment is required

## Examples

- "Create a skill for reviewing Flutter Riverpod code and set up a first batch of eval prompts."
- "Repair this skill package, rerun the viewer, and help me interpret the benchmark regressions."
- "Turn this prompt workflow into a reusable skill and iterate until the user-approved eval set passes."
