---
name: prompt-engineering
description: "Use when designing system prompts, crafting few-shot examples, implementing chain-of-thought reasoning, extracting structured output from LLMs, or building tool-use patterns for agent systems."
---
# Prompt Engineering

## Purpose

Guide the design and optimization of prompts that reliably produce correct, structured, and safe LLM outputs. Every instruction ensures that prompts are clear to the model, testable by the team, and maintainable as requirements evolve.

## When to Use

- Designing a system prompt for a new LLM-powered feature or agent.
- Crafting few-shot examples to steer model behavior on domain-specific tasks.
- Implementing chain-of-thought reasoning for multi-step problem solving.
- Extracting structured data (JSON, tables, enums) from unstructured LLM output.
- Building tool-use and function-calling patterns for agentic workflows.
- Debugging prompts that produce inconsistent, hallucinated, or off-target responses.
- Optimizing prompt token cost without sacrificing output quality.
- Diagnosing prompt regressions after a model upgrade or prompt change.

## Instructions

1. **Define the task specification before writing the prompt** because a prompt without a clear spec is untestable. Write down what the model should do, what inputs it receives, what output format is required, and what behavior is forbidden. The spec becomes the eval criteria.

2. **Structure the system prompt with labeled sections** because models follow structured instructions more reliably than prose paragraphs. Use sections like Role, Task, Constraints, Output Format, and Examples. Labeled structure also makes prompts auditable and diff-friendly.

3. **State the role and expertise level explicitly** because the model's calibration of confidence, vocabulary, and detail level adjusts based on the stated role. "You are a senior security engineer" produces different output than "You are a helpful assistant."

4. **List constraints as explicit prohibitions, not implied expectations** because models follow "NEVER do X" more reliably than hoping they infer boundaries. Implicit constraints produce edge-case failures that are hard to reproduce and debug.

5. **Provide 3-5 few-shot examples that span the difficulty range** because examples teach patterns more effectively than instructions alone. Include an easy case, a medium case, a hard case, and an edge case. Each example should demonstrate the exact output format.

6. **Make few-shot examples diverse and representative** because models pattern-match on example distributions. If all examples are about error handling, the model will bias toward error-handling responses even for unrelated queries.

7. **Use chain-of-thought prompting for multi-step reasoning** because direct answer prompts skip the reasoning trace that catches errors. Instruct the model to think step-by-step and show its work before producing the final answer.

8. **Separate the reasoning trace from the final output** because downstream systems need to parse the answer without extracting it from reasoning text. Use XML tags, JSON fields, or explicit delimiters to fence the thinking from the result.

9. **Enforce structured output with explicit schemas and examples** because asking for "JSON output" without a schema produces inconsistent field names, types, and structures. Provide the exact JSON schema with a complete example in the prompt.

10. **Use XML tags or delimiters to fence input data** because the model cannot distinguish user-provided content from instructions without explicit boundaries. Unfenced input enables prompt injection.

11. **Define tool-use patterns with typed function signatures and usage examples** because vague tool descriptions cause the model to misuse tools, pass wrong arguments, or invoke tools when it should not. Each tool needs a name, description, typed parameters, and 1-2 usage examples.

12. **Implement guardrails as layered defenses, not single checks** because any single guardrail can be bypassed. Combine system prompt constraints, input validation, output validation, and content filtering for defense in depth.

13. **Version prompts and track changes like code** because prompt changes affect output behavior. A git diff of the prompt alongside the eval results creates an audit trail that explains why behavior changed.

14. **Test prompts with adversarial inputs before deployment** because production users will send inputs the designer never imagined. Test with prompt injections, empty inputs, extremely long inputs, non-English text, and inputs that contradict the system prompt.

15. **Optimize for token efficiency without sacrificing clarity** because longer prompts cost more and may hit context limits. Remove redundant instructions, compress examples, and use references instead of repetition. But never sacrifice clarity for brevity.

16. **Iterate prompts with eval-driven feedback loops** because intuition-driven prompt editing produces local optima. Write evals first, measure the current prompt, make one change, re-measure, and keep changes that improve scores.

17. **Handle model-specific differences in prompt design** because Claude, GPT-4, and Gemini respond differently to identical prompts. Claude follows XML-structured prompts well, GPT-4 excels with function-calling mode, and system prompt placement affects each model differently.

18. **Document prompt design decisions and rationale** because future maintainers need context to make safe changes. Record why specific phrasing, examples, or constraints were chosen so lessons are not re-learned through trial and error.

## Output Format

Provide system prompts as formatted text blocks with labeled sections, few-shot examples as input/output pairs, structured output schemas as JSON Schema definitions, tool-use patterns as function signatures with descriptions, and optimization recommendations as before/after comparisons with eval results.

## References

| File | Load when |
| --- | --- |
| `references/system-prompts.md` | Designing or reviewing system prompts for LLM features and agents. |
| `references/few-shot-design.md` | Crafting few-shot examples for in-context learning. |
| `references/chain-of-thought.md` | Implementing chain-of-thought, tree-of-thought, or step-by-step reasoning. |
| `references/structured-output.md` | Extracting JSON, tables, or typed data from LLM outputs. |
| `references/tool-use.md` | Building tool-use and function-calling patterns for agents. |

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
