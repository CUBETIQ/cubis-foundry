# Smart Platform Rule Files Design

## Goal

Replace the current thin project rule files with medium-sized, high-signal rule surfaces for Codex, Claude Code, and Gemini CLI that are smarter than the old minimal stubs without reintroducing context bloat.

## Why

The old `main` branch rule templates were richer and more useful than the current thin `v2` stubs, but they also carried historical taxonomy and deleted-skill noise. The new rule files should preserve the strong routing and execution guidance while aligning to the current Foundry taxonomy and keeping the root files compact.

## Design Targets

- Medium-sized: roughly 180-240 lines each
- Smart: strong route selection, skill loading, MCP usage, and verification guidance
- Lean: no giant specialist catalog, no deleted-skill history, no duplicated workflow manuals
- Platform-native: each file should reflect how that platform actually routes work

## Shared Structure

Each root rule file should contain:

1. A short cognitive contract
2. A strict route decision tree
3. A compact Foundry surface hierarchy
4. A skill loading protocol
5. A compact MCP usage contract
6. Research escalation rules
7. Verification and safety rules
8. Platform-specific execution notes
9. A small table of current canonical Foundry surfaces

## Canonical Foundry Surfaces

The rule files should reference only the current active surfaces:

- Design: `design`, `web-ui-design`, `mobile-ui-design`, `desktop-ui-design`, `design-system`
- Testing: `web-testing`, `android-emulator-testing`, `ios-simulator-testing`
- Common workflows: `/plan`, `/implement`, `/debug`, `/test`, `/review`, `/deploy`, `/loop`, `/design-system`, `/design-screen`, `/design-audit`, `/design-refresh`
- Agent roster: `@orchestrator`, `@planner`, `@explorer`, `@implementer`, `@debugger`, `@tester`, `@reviewer`

## Foundry Surface Hierarchy

The root rule files should teach this order:

1. Direct execution for trivial work
2. Explicit workflow or explicit agent route when user named one
3. `route_resolve` only when the route is unclear
4. `skill_validate` -> `skill_get` only after route selection or exact user naming
5. Supporting references loaded lazily, one at a time

## MCP Contract

The rule files should treat MCP as action and retrieval infrastructure, not as default context stuffing.

- Use MCP routing tools only when needed
- Use MCP skills after route selection
- Use upstream MCP servers for real actions:
  - `playwright` for web testing
  - `mobile-mcp` first for mobile testing
  - CLI fallback for deterministic mobile evidence
- Keep MCP references lazy and exact

## Platform Notes

### Codex

- `AGENTS.md` is the project root instruction file
- Codex subagents in `.codex/agents/*.toml` are real native delegation surfaces
- The rule file should emphasize sandbox-aware routing and minimal context loading

### Claude

- `CLAUDE.md` is the root memory surface
- Claude uses the `Task` tool for subagent delegation
- Deeper scoped policy belongs in `.claude/rules/*.md`, not all inside `CLAUDE.md`

### Gemini

- `.gemini/GEMINI.md` is the main rule file
- Gemini is command-first in this repo
- Specialist behavior should route through commands and MCP, not ad hoc standalone agent files

## Anti-Bloat Rules

Do not include:

- Deleted skill or alias history
- Long specialist biographies
- Full skill catalog dumps
- Repeated workflow manuals
- Old Stitch mirror language
- Legacy QA naming

## Source Inputs

- Official OpenAI guidance for `AGENTS.md` and harness engineering
- Official Anthropic guidance for Claude Code subagents
- Official Gemini CLI guidance for `GEMINI.md` and command-centered usage
- Current Foundry route taxonomy in `v2`

