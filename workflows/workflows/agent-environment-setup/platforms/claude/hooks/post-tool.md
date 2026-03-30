# Post-Tool Hook Guide

Use post-tool hooks to inspect the result of a tool invocation and enforce follow-up expectations.

Recommended checks:

- flag commands that changed files without a subsequent verification step
- summarize newly created files or directories for auditability
- detect suspicious output patterns such as leaked credentials or ignored failures
- remind the agent to run focused checks after write-heavy shell commands or code-editing tools
- remind web flows to keep evidence user-visible when Playwright MCP was used
- remind mobile flows to preserve CLI fallback evidence when `mobile-mcp` was used for semantic traversal

Post-tool hooks should be informative first and blocking only when the output is clearly unsafe.

Verification reminders should emphasize:

- exact commands or checks that still need to run
- whether the work proved browser behavior, mobile behavior, or only static code changes
- what evidence is still missing before completion can be claimed
