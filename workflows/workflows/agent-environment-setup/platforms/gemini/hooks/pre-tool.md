# Pre-Tool Hook Guide

Use pre-tool hooks to stop unsafe or low-signal actions before they happen.

Recommended checks:

- block obviously destructive git commands without explicit approval
- require focused targets for broad file operations
- warn when a tool call would bypass documented repository workflows
- warn when a browser task is about to use generic shell/browser tooling instead of Playwright MCP
- warn when a mobile test task is about to skip `mobile-mcp` without a reason or skip CLI fallback when deterministic evidence is required

Hooks should fail closed only for genuinely dangerous actions. Everything else should return a clear warning message with the expected correction.

Policy reminders:

- honor exact workflow, agent, or skill routes before broad rerouting
- keep Playwright MCP as the default browser runtime
- keep `mobile-mcp` as the preferred semantic mobile runtime
- keep CLI fallback available for reproducible logs, launch state, screenshots, and replayable evidence
