# Pre-Tool Hook Guide

Use pre-tool hooks to stop unsafe or low-signal actions before they happen.

Recommended checks:

- block obviously destructive git commands without explicit approval
- require focused targets for broad file operations
- warn when a tool call would bypass documented repository workflows

Hooks should fail closed only for genuinely dangerous actions. Everything else should return a clear warning message with the expected correction.
