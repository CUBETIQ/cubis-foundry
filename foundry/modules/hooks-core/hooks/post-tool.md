# Post-Tool Hook Guide

Use post-tool hooks to inspect the result of a tool invocation and enforce follow-up expectations.

Recommended checks:

- flag commands that changed files without a subsequent verification step
- summarize newly created files or directories for auditability
- detect suspicious output patterns such as leaked credentials or ignored failures

Post-tool hooks should be informative first and blocking only when the output is clearly unsafe.
