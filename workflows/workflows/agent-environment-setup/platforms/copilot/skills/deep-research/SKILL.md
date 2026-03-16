---
name: deep-research
description: Use when investigating latest vendor behavior, comparing tools or platforms, verifying claims beyond the repo, or gathering external evidence before implementation.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Deep Research

## Purpose

Run a disciplined research pass before implementation when the repo alone is not enough. This skill keeps research evidence-driven: inspect the local codebase first, escalate to official docs when freshness or public comparison matters, then use labeled community evidence only when it adds practical context.

## When to Use

- Verifying latest SDK, CLI, API, or platform behavior
- Comparing tools, frameworks, hosted services, or implementation approaches
- Checking whether public docs and the local repo disagree
- Gathering external evidence before planning a migration or new capability
- Producing a structured research brief that hands off cleanly into implementation

## Instructions

1. **Define the research question before collecting sources** because vague research sprawls quickly. Restate the target topic, freshness requirement, comparison axis, and what decision the findings need to support.

2. **Inspect the repo first** because many questions are already answerable from local code, configs, tests, docs, or generated assets. Do not browse externally until the local evidence is exhausted or clearly insufficient.

3. **Decide whether external research is actually required** because not every task needs web evidence. Escalate only when freshness matters, public comparison matters, or the user explicitly asks to research or verify.

4. **Follow the source ladder strictly** because evidence quality matters. Use official docs, upstream repositories, standards, and maintainer material as primary sources before looking at blogs, issue threads, or Reddit.

5. **Capture concrete source details** because research without provenance is hard to trust. Record exact links, relevant dates, versions, and any repo files that support or contradict the external evidence.

6. **Cross-check important claims across more than one source when possible** because public docs, repos, and community advice can drift. If sources disagree, say so explicitly instead of smoothing over the conflict.

7. **Use Reddit and other community sources only as labeled secondary evidence** because they can surface practical gotchas but are not authoritative. Treat them as implementation color, not final truth.

8. **Separate verified facts from inference** because downstream planning depends on confidence. Mark what is directly supported by repo evidence or official sources versus what you infer from patterns or secondary signals.

9. **Keep the output decision-oriented** because the goal is not to dump links. Tie each finding back to the implementation, workflow, agent, or skill decision it affects.

10. **Recommend the next route explicitly** because research is usually a handoff, not the end of the task. Name the next workflow, agent, or exact skill that should continue the work.

11. **State the remaining gaps and risks** because incomplete research is still useful when the uncertainty is visible. Call out what you could not verify, what may have changed recently, and what assumptions remain.

12. **Avoid over-quoting and over-collecting** because research quality comes from synthesis, not volume. Prefer concise summaries with high-signal citations over long pasted excerpts.

13. **When the task turns into implementation, stop researching and hand off** because mixing discovery and execution usually creates drift. Deliver the research brief first, then route into the correct workflow or specialist.

## Output Format

Deliver:

1. **Research question** — topic, freshness requirement, and decision to support
2. **Verified facts** — repo evidence and primary-source findings
3. **Secondary/community evidence** — labeled lower-trust supporting signals
4. **Gaps / unknowns** — unresolved questions or contradictory evidence
5. **Recommended next route** — direct execution, workflow, agent, or exact skill to use next

## References

Load only the file needed for the current question.

| File | Load when |
| --- | --- |
| `references/source-ladder.md` | Need the repo-first and source-priority policy for official docs versus community evidence. |
| `references/research-output.md` | Need the structured output format, evidence labeling rules, or handoff pattern. |
| `references/comparison-checklist.md` | Comparing vendors, frameworks, or tools and need a concrete evaluation frame. |

## Examples

Use these when the task shape already matches.

| File | Use when |
| --- | --- |
| `examples/01-latest-docs-check.md` | Verifying a latest capability or doc claim before implementation. |
| `examples/02-ecosystem-comparison.md` | Comparing multiple tools or platforms with official-first sourcing. |
| `examples/03-research-to-implementation-handoff.md` | Turning research findings into a concrete next workflow or specialist handoff. |

## Copilot Research Flow

- Restate the research question, freshness requirement, and comparison scope before gathering sources.
- Use repo evidence and `#file:` context first, then bring in official docs, then labeled community evidence only if it adds implementation color.
- Finish with the next recommended route so the research result can hand off cleanly into a workflow, prompt file, or agent.

## Copilot Platform Notes

- Skill files are stored under `.github/prompts/` (prompt files) and `.github/instructions/` (instruction files).
- Copilot does not support subagent spawning — all skill guidance executes within the current conversation context.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context`, `agent`, and `allowed-tools` are not supported; guidance is advisory only.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
