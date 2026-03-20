# Example: Workflow-First Stitch UI Route

Prompt shape:

> Use Stitch to generate a billing dashboard screen for our web app, then implement it in the existing frontend.

Expected sequence:

1. Load `frontend-design` with `visual-direction` and `design-tokens`.
2. Run `stitch-prompt-enhancement`.
3. Ensure `docs/foundation/DESIGN.md` exists or refresh it with `stitch-design-system`.
4. Verify Stitch MCP status and list enabled tools.
5. Use the smallest Stitch tool path.
6. Fetch the final screen artifact with `get_screen`.
7. Hand off to `stitch-implementation-handoff`.
