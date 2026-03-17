---
name: receiving-code-review
description: "Use when responding to code review feedback, incorporating reviewer suggestions, handling disagreements constructively, iterating through review cycles, or learning from repeated feedback patterns."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---
# Receiving Code Review

## Purpose

Transform code review from a defensive ordeal into a high-leverage learning opportunity. This skill provides a systematic approach to processing reviewer feedback, responding constructively, incorporating changes efficiently, and extracting lasting lessons from repeated patterns — reducing review cycles, strengthening team relationships, and accelerating personal growth as an engineer.

## When to Use

- Responding to reviewer comments on a pull request
- Deciding how to handle feedback you disagree with
- Iterating through multiple review rounds efficiently
- Learning from repeated reviewer feedback to avoid future issues
- Managing conflicting feedback from multiple reviewers
- Determining when to push back and when to accept suggestions

## Instructions

1. **Read all feedback before responding** — read every comment across the entire PR before writing any response, because reacting comment-by-comment leads to contradictory responses and misses cross-cutting themes that reviewers are collectively surfacing.

2. **Respond to every comment** — acknowledge every piece of feedback with either a resolution, a question, or a brief "Done", because unacknowledged comments signal disrespect for the reviewer's time and leave ambiguity about whether the feedback was seen or ignored.

3. **Distinguish blocking from non-blocking feedback** — identify which comments are must-fix (correctness, security, breaking changes) versus nice-to-have (style, naming, minor refactors), because treating all feedback as equally urgent wastes time on low-impact changes while potentially delaying critical fixes.

4. **Ask clarifying questions when feedback is ambiguous** — when a comment isn't clear, ask a specific follow-up question rather than guessing the reviewer's intent, because misinterpreting feedback leads to wasted implementation effort and additional review rounds.

5. **Make requested changes promptly** — address blocking feedback as quickly as possible after the review is complete (not piecemeal during the review), because fast turnaround keeps the reviewer's context fresh and prevents the PR from going stale in the queue.

6. **Explain trade-offs when pushing back** — when you disagree with feedback, present your reasoning with specific trade-offs rather than simply declining, because reviewers are more receptive to well-reasoned alternatives than unexplained resistance, and the discussion often surfaces a better solution than either original proposal.

7. **Use suggestion commits for small fixes** — adopt GitHub's suggestion feature or create small fixup commits for trivial changes (typos, naming, formatting), because atomic change tracking makes it easy for reviewers to verify their feedback was addressed without re-reviewing the entire diff.

8. **Batch responses rather than replying piecemeal** — collect all your responses and push all changes together in a single update, because piecemeal updates trigger multiple notification rounds that fragment the reviewer's attention and make it harder to see the complete resolution.

9. **Update PR description when scope changes** — modify the PR description to reflect any scope changes, new limitations, or additional context that emerged during review, because the description is the permanent record of the change and future readers will rely on it, not the review comments.

10. **Resolve conversations only when addressed** — mark a comment as resolved only after the feedback has been genuinely addressed (code changed, question answered, or explicit agreement to defer), because prematurely resolving conversations hides unfinished work from reviewers.

11. **Re-request review after addressing all comments** — explicitly re-request review with a summary of what changed rather than waiting for reviewers to notice your updates, because reviewers manage multiple PRs and a clear "ready for re-review" signal moves yours back to the top of their queue.

12. **Learn from repeated feedback patterns** — track feedback themes you receive across multiple reviews (missing tests, unclear naming, insufficient error handling) and proactively address these in future PRs, because systematic pattern recognition converts reactive feedback into proactive quality habits.

13. **Handle conflicting reviewer opinions** — when two reviewers disagree, surface the conflict explicitly and propose a resolution rather than picking one reviewer's side silently, because hidden conflicts lead to flip-flopping changes across review rounds and erode trust.

14. **Manage review cycles without scope creep** — resist the temptation to expand scope based on review feedback and instead create follow-up issues for good ideas that are out of scope, because unbounded scope growth turns focused PRs into sprawling changes that are harder to review, test, and revert.

## Output Format

When responding to review feedback, provide:

1. **Feedback summary** — categorized list of all reviewer comments (blocking/non-blocking/questions)
2. **Response plan** — how each comment will be addressed (fix, discuss, defer)
3. **Changes made** — summary of code changes in response to feedback
4. **Open questions** — any feedback that needs further discussion
5. **Re-review request** — clear signal that changes are ready for re-review with context

## References

| File | Purpose |
|------|---------|
| `references/feedback-response-patterns.md` | Templates for responding to different types of review feedback constructively |
| `references/disagreement-resolution.md` | Strategies for handling pushback and resolving conflicts during code review |
| `references/review-iteration.md` | Techniques for efficiently iterating through multiple review cycles |

## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
