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

Each platform has a rule file with a skill routing matrix. When adding a new skill, update the matrix in every platform's rule file.

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

Create platform-specific mirrors for Claude Code and Copilot. Other platforms use the canonical version.

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

No mirror needed. The canonical version is used directly. Routing is handled by the platform rule file.

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

1. Run `npm run test:attributes` — validates frontmatter across all skills
2. Run `npm run check:generated-assets` — verifies platform mirrors are in sync
3. Verify the skill appears in `npm run generate:skills-index`
4. Test `route_resolve` with a prompt that should match the new skill
5. Test `skill_validate` with the new skill's name
6. Test `skill_get` to confirm the SKILL.md loads correctly

## Common Integration Mistakes

1. **Forgetting to update all 5 platform rule files** — every platform needs the skill in its routing matrix
2. **Mismatched names** — directory name, frontmatter name, and routing matrix name must all match
3. **Wrong agent assignment** — assigning a frontend skill to @backend-specialist causes incorrect context loading
4. **Missing mirror creation** — Claude and Copilot platforms need mirrors with platform-specific frontmatter
5. **Invalid evals.json** — JSON syntax errors cause the eval runner to skip the skill silently
