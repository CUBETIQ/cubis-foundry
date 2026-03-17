# Routing Integration

## Overview

After creating a skill, it must be integrated into the platform routing infrastructure so agents can discover and load it. This involves updating rule files, skill routing matrices, and ensuring the MCP skill tools can find the skill.

## Skill Discovery Flow

```
User request
  → route_resolve (MCP tool)
    → matches skill name or description keywords
    → returns primarySkillHint or primarySkills
      → skill_validate (verify skill exists and is valid)
        → skill_get (load SKILL.md)
          → skill_get_reference (load specific reference on demand)
```

## Rule File Integration

Rule behavior is defined canonically in the shared steering layer, then specialized per platform by overrides and generated outputs.

- Update `workflows/workflows/agent-environment-setup/shared/rules/STEERING.md` when the routing contract itself changes.
- Update `workflows/workflows/agent-environment-setup/shared/rules/overrides/<platform>.md` only for platform-specific deviations.
- Regenerate platform rule files after canonical edits instead of hand-editing every generated platform file.

Each generated platform rule file still exposes a routing matrix or equivalent skill-routing surface, but the source of truth is the shared steering + override layer.

### Skill Routing Matrix Format

```markdown
| Skill | Category | When to Load | Primary Agent |
|-------|----------|--------------|---------------|
| python-best-practices | Language | Python backend, typing, async | @backend-specialist |
| nextjs | Framework | Next.js App Router, RSC | @frontend-specialist |
```

### Matrix Fields

1. **Skill** — the skill's `name` from frontmatter (kebab-case)
2. **Category** — one of: Language, Framework, Design, Testing, Security, DevOps, AI/ML, Workflow, Integration, Meta
3. **When to Load** — brief trigger description (3-8 words)
4. **Primary Agent** — the specialist agent that uses this skill most often

### Rule File Locations

| Platform | File | Path |
|----------|------|------|
| Claude Code | CLAUDE.md | `platforms/claude/rules/CLAUDE.md` |
| Codex CLI | AGENTS.md | `platforms/codex/rules/AGENTS.md` |
| Antigravity | GEMINI.md | `platforms/antigravity/rules/GEMINI.md` |
| Gemini CLI | GEMINI.md | `platforms/gemini/rules/GEMINI.md` |
| Copilot | copilot-instructions.md | `platforms/copilot/rules/copilot-instructions.md` |

## Platform Mirror Creation

### When to Create Mirrors

Create or regenerate platform skill mirrors for every supported platform. The authoring source remains canonical under `workflows/skills/`, but the install/runtime surfaces use generated platform mirrors.

This applies to skills only. Do not reuse the skill mirror process for shared agents, workflow markdown, prompt files, or command files.

### Claude Code Mirror

Path: `platforms/claude/skills/<name>/SKILL.md`

Add platform-specific frontmatter:
```yaml
---
name: skill-name
description: "Use when..."
allowed-tools: [Read, Edit, Write, Bash, Grep, Glob]
context: fork  # if skill delegates to a subagent
agent: specialist-agent  # if context: fork
---
```

### Copilot Mirror

Path: `platforms/copilot/skills/<name>/SKILL.md`

Same format as Claude (Copilot reads Claude format). Add notes about:
- Related prompt files in `.github/prompts/`
- Path-scoped instructions in `.github/instructions/`

### Codex / Gemini / Antigravity

These platforms also receive generated skill mirrors. Keep their frontmatter minimal and let the generated rule files plus MCP/routing behavior carry the platform-specific execution model.

## Agent and Workflow Projections

Shared agents and workflows must go through platform-specific generators because their output format differs by platform.

- Codex agents are emitted as `.toml` native agents.
- Claude and Copilot agents are emitted as markdown with sanitized platform frontmatter.
- Gemini and Antigravity workflows and agent routes are emitted as TOML command files.
- Copilot workflows are emitted as prompt files rather than skill mirrors.

If a change affects custom agents, workflow prompts, or command behavior, update the shared source and rerun the platform asset generator instead of relying on `sync-skill-mirrors`.

## Agent Assignment

Each skill should be assigned a primary agent in the routing matrix. Choose based on domain:

| Domain | Primary Agent |
|--------|---------------|
| Languages (Python, TS, Go, etc.) | @backend-specialist or @frontend-specialist |
| Backend frameworks | @backend-specialist |
| Frontend frameworks | @frontend-specialist |
| Mobile frameworks | @mobile-developer |
| Database/ORM | @database-architect |
| Testing | @test-engineer |
| Security | @security-auditor |
| DevOps | @devops-engineer |
| Design/Architecture | @project-planner |
| AI/ML | @researcher |
| Workflow | @orchestrator |
| Meta | @orchestrator |

## Validation After Integration

After adding a skill to the routing infrastructure:

1. Update canonical skill content under `workflows/skills/<name>/`
2. Update shared steering or platform overrides if the routing contract changed
3. Run `npm run generate:all` or the narrower mirror/rule/platform-asset generation commands
4. Run `npm run test:attributes` — validates frontmatter across all skills
5. Run `npm run check:generated-assets` — verifies platform mirrors are in sync
6. Verify the skill appears in `npm run generate:skills-index`
7. Test `route_resolve` with a prompt that should match the new skill
8. Test `skill_validate` with the new skill's name
9. Test `skill_get` to confirm the SKILL.md loads correctly

## Common Integration Mistakes

1. **Editing generated platform rule files directly** — change shared `STEERING.md` or a platform override, then regenerate
2. **Mismatched names** — directory name, frontmatter name, and routing matrix name must all match
3. **Wrong agent assignment** — assigning a frontend skill to @backend-specialist causes incorrect context loading
4. **Using skill mirror sync for non-skill assets** — agents, prompts, and command files have their own platform-native generation path
5. **Invalid evals.json** — JSON syntax errors cause the eval runner to skip the skill silently
