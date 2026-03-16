# Example: Prompt Enhancement Before Implementation

Prompt shape:

> Use Stitch to make the dashboard better and more polished.

Improved internal brief before touching code:

1. Target surface: existing dashboard landing page.
2. Framework: preserve the repo's current web stack and component primitives.
3. Scope: refresh layout structure, spacing, hierarchy, and states from the latest Stitch artifact.
4. Reuse constraints: keep existing navigation, data plumbing, and validated business logic.
5. Quality bar: preserve accessibility, responsive behavior, and token usage.

Expected workflow:

1. Rewrite the vague request into a concrete implementation brief like the one above.
2. Verify Stitch availability with `stitch_get_status`, `mcp_gateway_status`, and `stitch_list_enabled_tools`.
3. Fetch the matching Stitch artifact instead of guessing which screen the user meant.
4. Patch the local dashboard with minimal diffs.
5. Summarize the exact changes and any unavoidable drift from Stitch.
