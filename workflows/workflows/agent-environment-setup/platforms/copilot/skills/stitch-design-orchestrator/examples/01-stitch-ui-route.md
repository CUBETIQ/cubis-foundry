# Example: Workflow-First Stitch UI Route

Prompt shape:

> Use Stitch to generate a billing dashboard screen for our web app, then implement it in the existing frontend.

Expected sequence:

1. Load `frontend-design` and lock the style contract plus thesis set.
2. Use `design` to choose the owning surface and decide whether canonical design state is stale.
3. Ensure `docs/foundation/DESIGN.md` exists or refresh it with `design-system`, then mirror it with `stitch-design-system` if Stitch needs persistent context.
4. Run `stitch-prompt-enhancement`.
5. Verify Stitch MCP status and list enabled tools.
6. Use the smallest Stitch tool path.
7. Fetch the final screen artifact with `get_screen`.
8. Hand off to `stitch-implementation-handoff`.
