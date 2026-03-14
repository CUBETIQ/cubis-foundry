# Plan: Platform-Native Adaptation of Skills, Agents & Workflows

## Context

The 67-skill canonical library is complete in `workflows/skills/`. Platform mirrors exist for Claude and Copilot (skills), and agents/workflows exist for all 4 platforms. However, **all mirrors are byte-for-byte copies** — they don't use each platform's native format. The user asked: "why doesn't each skill follow its own platform format, same goes to workflow and custom agent?"

The fix: modify the two generation scripts (`sync-skill-mirrors.mjs` and `generate-platform-assets.mjs`) to produce **platform-tailored output** instead of verbatim copies. This is a scripted approach — manual editing of 250+ files would be unmaintainable.

## What Changes

### Skills (sync-skill-mirrors.mjs)

**Claude mirrors** currently: verbatim copy of canonical SKILL.md
**Claude mirrors after:** Add `allowed-tools`, `context: fork` (when skill delegates), `agent` (fork target), `user-invocable: true`, `argument-hint`. Append Claude platform notes to body referencing `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, MCP skill tools.

**Copilot mirrors** currently: strips unsupported frontmatter keys but body is untouched
**Copilot mirrors after:** Also append Copilot platform notes (`.github/prompts/`, `.github/instructions/`, no subagent spawning). Replace `$ARGUMENTS` → "user input", remove `context:fork` references in body.

### Agents (generate-platform-assets.mjs)

**Codex agents** currently: verbatim copy of shared agents
**After:** Body text: "subagent" → "posture", "delegate to @specialist" → "adopt the specialist posture", "spawn" → "switch reasoning mode". Add Codex note about postures.

**Antigravity agents** currently: verbatim copy
**After:** Body references Agent Manager for parallel coordination. Replace "Task tool" → "Agent Manager".

**Claude/Copilot agents:** Already correct (Claude = verbatim which is fine since shared format IS Claude format; Copilot strips keys via `buildCopilotAgentMarkdown`).

### Workflows (generate-platform-assets.mjs)

**Codex workflows** currently: verbatim copy
**After:** Replace `@agent-name` with posture references. Add network restriction note.

**Antigravity workflows** currently: verbatim copy (TOML commands already exist separately)
**After:** Body references `.agent/` paths, Agent Manager.

**Claude/Copilot workflows:** Already correct.

## Implementation Steps

### Step 1: Create skill-platform-attributes.json (~67 entries)

**File:** `workflows/skills/_schema/skill-platform-attributes.json`

Maps each skill to its Claude-specific fields:

```json
{
  "python-best-practices": {
    "allowedTools": ["Read", "Grep", "Glob", "Bash", "Edit", "Write"],
    "contextFork": false,
    "userInvocable": true,
    "argumentHint": "Python module, file, or pattern to analyze"
  },
  "systematic-debugging": {
    "allowedTools": ["Read", "Grep", "Glob", "Bash", "Edit", "Write"],
    "contextFork": true,
    "forkAgent": "debugger",
    "userInvocable": true,
    "argumentHint": "Bug description or error message"
  }
}
```

**Category defaults for `allowedTools`:**
| Category | Tools |
|----------|-------|
| Language/Framework | Read, Grep, Glob, Bash, Edit, Write |
| Testing/Debugging | Read, Grep, Glob, Bash, Edit, Write |
| Security | Read, Grep, Glob, Bash (no Edit/Write — audit only) |
| Design/Architecture | Read, Grep, Glob (advisory only) |
| DevOps/Integration | Read, Grep, Glob, Bash, Edit, Write |
| Workflow/Meta | Read, Grep, Glob, Bash, Edit, Write |
| AI/ML | Read, Grep, Glob, Bash |

**Skills with `contextFork: true`:**
systematic-debugging → debugger, pentest-skill → penetration-tester, owasp-security-review → security-auditor, unit-testing → test-engineer, integration-testing → test-engineer, performance-testing → performance-optimizer, database-design → database-architect, frontend-design → frontend-specialist, ci-cd-pipeline → devops-engineer, docker-compose-dev → devops-engineer, kubernetes-deploy → devops-engineer, code-review → reviewer, mcp-server-builder → backend-specialist

### Step 2: Create platform body note templates (5 files)

**Dir:** `workflows/skills/_schema/platform-notes/`

Short (3-5 line) platform-specific appendix blocks:

- `claude.md` — `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, MCP skill tools, `context:fork`
- `copilot.md` — `.github/prompts/`, `.github/instructions/`, no subagent spawning
- `codex.md` — postures, network restrictions, AGENTS.md references
- `gemini.md` — `activate_skill`, `.gemini/` paths, no `context:fork`
- `antigravity.md` — Agent Manager, `.agent/` paths, TOML commands

### Step 3: Modify sync-skill-mirrors.mjs

**File:** `scripts/sync-skill-mirrors.mjs`

Changes:

1. Load `skill-platform-attributes.json` at startup
2. New function `enrichClaudeSkillMarkdown(markdown, skillId, attrs)`:
   - Parse frontmatter, inject `allowed-tools`, `context`, `agent`, `user-invocable`, `argument-hint`
   - Remove `license`, `compatibility`, `metadata` (canonical-only fields)
   - Append Claude platform notes to body
3. Modify `sanitizeSkillMarkdownForCopilot(markdown)` → `transformCopilotSkillMarkdown(markdown)`:
   - Keep existing frontmatter stripping
   - Add body sanitization: replace `$ARGUMENTS` → "user input", remove `context:fork` mentions
   - Append Copilot platform notes
4. In `copyFilteredSkillDir`: use enriched/transformed content for SKILL.md based on `label`

### Step 4: Modify generate-platform-assets.mjs

**File:** `scripts/generate-platform-assets.mjs`

Changes:

1. New function `buildCodexAgentMarkdown(sharedMarkdown)`:
   - Keep full frontmatter
   - Body regex: `sub-?agent` → "posture", `[Dd]elegate to @` → "Adopt the posture of", `spawn` → "switch to"
   - Append: "Codex note: Specialists are internal reasoning postures, not spawned processes."

2. New function `buildAntigravityAgentMarkdown(sharedMarkdown)`:
   - Keep full frontmatter
   - Body: Add "Use Agent Manager for parallel agent coordination."
   - Replace "Task tool" → "Agent Manager"

3. New function `buildCodexWorkflowMarkdown(sharedMarkdown)`:
   - Replace `@agent-name` references with posture language
   - Add network restriction note

4. New function `buildAntigravityWorkflowMarkdown(sharedMarkdown)`:
   - Replace `@agent-name` with `.agent/agents/` references
   - Reference Agent Manager

5. In `buildExpectedMaps`: use new functions instead of `agent.raw` for codex/antigravity

### Step 5: Run generation and verify

```bash
node scripts/sync-skill-mirrors.mjs          # Regenerate skill mirrors
node scripts/generate-platform-assets.mjs     # Regenerate agents/workflows
node scripts/sync-skill-mirrors.mjs --check   # Verify skill mirrors
node scripts/generate-platform-assets.mjs --check  # Verify agents/workflows
```

Spot-check 5 skills across platforms:

- `python-best-practices` (language, no fork)
- `systematic-debugging` (testing, context:fork → debugger)
- `owasp-security-review` (security, restricted tools)
- `nextjs` (framework, no fork)
- `skill-creator` (meta)

## Critical Files

| File                                                      | Action                                                  |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `scripts/sync-skill-mirrors.mjs`                          | Modify — add Claude enrichment + Copilot body transform |
| `scripts/generate-platform-assets.mjs`                    | Modify — add Codex/Antigravity agent+workflow builders  |
| `workflows/skills/_schema/skill-platform-attributes.json` | Create — 67-entry skill attribute catalog               |
| `workflows/skills/_schema/platform-notes/*.md`            | Create — 5 platform body note templates                 |

## Output Impact

| Platform    | Asset         | Count    | Change                                          |
| ----------- | ------------- | -------- | ----------------------------------------------- |
| Claude      | Skill mirrors | 67       | Add allowed-tools, context:fork, platform notes |
| Copilot     | Skill mirrors | 67       | Add Copilot notes, sanitize Claude refs in body |
| Codex       | Agents        | ~24      | Posture language in body                        |
| Codex       | Workflows     | ~20      | Posture language, network note                  |
| Antigravity | Agents        | ~24      | Agent Manager references                        |
| Antigravity | Workflows     | ~18      | Agent Manager, .agent/ paths                    |
| **Total**   |               | **~220** | Regenerated with platform-native format         |
