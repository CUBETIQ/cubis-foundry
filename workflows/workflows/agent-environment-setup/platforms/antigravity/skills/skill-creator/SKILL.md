---
name: skill-creator
description: "Use when creating or updating skills, evaluating skill performance, or benchmarking instruction quality. Covers skill authoring, edits, eval design, and iterative improvement of skill behavior."
---
# Skill Creator

## Purpose

Meta-skill for creating, editing, evaluating, and benchmarking skills in the Cubis Foundry skill library. Provides the full skill development lifecycle — from initial creation through eval-driven iteration to production-grade quality. References the complete 65-skill library as examples of the Pro Skill Standard.

## When to Use

- Creating a new skill from scratch for the Foundry library or a custom project.
- Editing or improving an existing skill's instructions, references, or evals.
- Running evals to test skill output quality against assertions.
- Benchmarking skill performance with variance analysis across multiple runs.
- Adapting skills for different platforms (Claude Code, Codex, Gemini CLI, Antigravity, Copilot).
- Reviewing skill quality against the Pro Skill Standard checklist.

## Modes

### Mode 1: Create
Build a new skill from scratch with all required files.

### Mode 2: Edit
Improve an existing skill's instructions, add references, or fix eval failures.

### Mode 3: Eval
Run a skill's evals and report pass/fail with actionable feedback.

### Mode 4: Benchmark
Run evals multiple times, compute variance, and identify flaky assertions.

## Instructions

1. **Determine the mode before starting** — ask the user if unclear, because each mode has different inputs and outputs. Default to Create if the user says "make a skill" or "new skill."

2. **For Create mode: gather the skill's domain, target audience, and trigger conditions** — these determine the skill name, description, and instruction scope, because a well-scoped skill has clear boundaries that prevent overlap with other skills.

3. **Choose a skill name that is kebab-case, descriptive, and unique** — check the existing skill library (65 skills across 10 categories) for naming conflicts, because duplicate or ambiguous names cause routing failures in the MCP skill tools.

4. **Write the YAML frontmatter with all required fields** — name, description (with trigger conditions), license, metadata (author, version), and compatibility, because the frontmatter is parsed by the platform loader and invalid frontmatter causes silent skill loading failures.

5. **Write the description as a trigger specification** — start with "Use when..." followed by 3-6 specific trigger conditions, because the description is the primary input to the skill routing engine and vague descriptions cause mis-routing.

6. **Structure the body with mandatory sections** — Purpose (1 paragraph), When to Use (bullet list), Instructions (12-18 numbered items), Output Format, and References table, because this structure is the Pro Skill Standard and parsers expect it.

7. **Write each instruction as WHAT + WHY** — state what to do, then explain why with "because..." reasoning, because instructions without reasoning are followed mechanically without adaptation to context.

8. **Order instructions by execution sequence** — setup/prerequisites first, then core workflow, then verification/cleanup, because numbered instructions imply ordering and out-of-order instructions cause confusion.

9. **Include 12-18 instructions** — fewer than 12 leaves critical guidance gaps, more than 18 causes instruction fatigue and selective following, because the sweet spot balances completeness with adherence.

10. **Create 3-6 reference files** — each 80-150 lines covering a deep subtopic, because references enable progressive disclosure (loading detail only when needed) and keep the main SKILL.md focused.

11. **Create evals with 2+ prompts and 5 assertions each** — evals are the skill's test suite, because untested skills degrade silently when instructions are modified.

12. **Write assertions that test behavioral output, not exact strings** — use "identifies X", "recommends Y", "addresses Z" patterns, because LLM output varies in phrasing but should be consistent in substance.

13. **Create 2 usage examples** — one basic (01-basic-usage.md) and one advanced (02-advanced-usage.md), because examples serve as both documentation and additional eval material.

14. **For Edit mode: read the existing skill first, then identify specific gaps** — compare against the Pro Skill Standard checklist before making changes, because unfocused edits introduce inconsistencies.

15. **For Eval mode: run each eval prompt through the skill and check assertions** — report pass/fail per assertion with specific evidence, because binary pass/fail without evidence makes iteration impossible.

16. **For Benchmark mode: run evals 3+ times and compute assertion pass rates** — flag assertions with less than 80% pass rate as flaky, because flaky assertions indicate either ambiguous instructions or overly specific assertions.

17. **For platform adaptations: tailor frontmatter and instruction references per platform** — Claude Code gets full frontmatter (allowed-tools, workflow or Agent Manager routing, agent), Codex/Gemini/Antigravity get name+description only, Copilot matches Claude format, because each platform parses different frontmatter fields.

18. **Validate the complete skill package before declaring done** — check JSON validity of evals.json, verify all reference files mentioned in the table exist, confirm examples are complete, because broken references and invalid JSON cause runtime failures.

## Pro Skill Standard Checklist

- [ ] SKILL.md has valid YAML frontmatter with all required fields
- [ ] Description starts with "Use when..." and lists 3-6 trigger conditions
- [ ] Purpose section is exactly 1 paragraph
- [ ] When to Use has 4-8 bullet points
- [ ] Instructions have 12-18 items in WHAT + WHY format
- [ ] Output Format section describes expected output structure
- [ ] References table lists 3-6 files with "Load when" conditions
- [ ] All referenced files exist in references/ directory
- [ ] Each reference file is 80-150 lines of deep technical content
- [ ] evals/evals.json is valid JSON with 2+ eval objects
- [ ] Each eval has a prompt and 5+ assertions
- [ ] evals/assertions.md explains each assertion in human-readable form
- [ ] examples/01-*.md and 02-*.md exist with complete examples
- [ ] No placeholders, TODOs, or stub content anywhere

## Output Format

### Create Mode
```
## Skill Package: <name>
[Complete file manifest with all created files]

## Quality Check
[Pro Skill Standard checklist with pass/fail per item]
```

### Eval Mode
```
## Eval Results: <skill-name>
| Eval | Assertion | Result | Evidence |
|------|-----------|--------|----------|
```

### Benchmark Mode
```
## Benchmark: <skill-name> (N runs)
| Assertion | Pass Rate | Status |
|-----------|-----------|--------|
```

## Skill Library Reference (65 Skills)

### Category A — Languages (10)
python-best-practices, typescript-best-practices, golang-best-practices, rust-best-practices, javascript-best-practices, java-best-practices, kotlin-best-practices, swift-best-practices, csharp-best-practices, php-best-practices

### Category B — Frameworks (19)
go-fiber, nestjs, fastapi, express-nodejs, gin-golang, laravel, django-drf, spring-boot, nextjs, react, vuejs, svelte-sveltekit, react-native, t3-stack, remix, prisma, sqlalchemy, drizzle-orm

### Category C — Design/Architecture (7)
frontend-design, system-design, microservices-design, api-design, database-design, architecture-doc, tech-doc

### Category D — Testing/QA (7)
playwright-interactive, playwright-persistent-browser, electron-qa, unit-testing, integration-testing, performance-testing, systematic-debugging

### Category E — Security (5)
owasp-security-review, pentest-skill, vibesec, secret-management, sanitize-pii

### Category F — DevOps (4)
ci-cd-pipeline, docker-compose-dev, kubernetes-deploy, observability

### Category G — AI/ML (3)
llm-eval, rag-patterns, prompt-engineering

### Category H — Workflow (6)
git-workflow, code-review, sadd, kaizen-iteration, requesting-code-review, receiving-code-review

### Category I — Integrations (6)
stripe-integration, expo-app, react-native-callstack, huggingface-ml, google-workspace, mcp-server-builder

### Category J — Meta (1)
skill-creator

## References

| File | Load when |
| --- | --- |
| `references/pro-skill-standard.md` | Creating or reviewing a skill against quality standards. |
| `references/platform-adaptations.md` | Adapting a skill for different platforms (Claude, Codex, Gemini, Antigravity, Copilot). |
| `references/eval-design.md` | Designing evals, writing assertions, or interpreting eval results. |
| `references/skill-anatomy.md` | Understanding the structure and purpose of each file in a skill package. |
| `references/routing-integration.md` | Integrating a skill into the routing matrix and rule files. |

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
