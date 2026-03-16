# Stitch Eval Assertions

## Eval 1: New Screen From Stitch Artifact

This eval checks the default Stitch-first implementation loop for a new web screen: verify availability, inspect enabled tools, fetch the real artifact, then map it into the current stack and design system.

### Assertions

| # | Type | What it checks | Why it matters |
| --- | --- | --- | --- |
| 1 | contains | `stitch_get_status` | A Stitch workflow that does not verify reachability first can fabricate screen details or assume the wrong profile. |
| 2 | contains | `mcp_gateway_status` | Cubis Foundry is the client-facing runtime, so the skill must confirm the MCP gateway is healthy before depending on Stitch passthrough tools. |
| 3 | contains | `stitch_list_enabled_tools` | Stitch environments can expose different upstream capabilities; the skill should discover those instead of hardcoding an assumed toolset. |
| 4 | pattern | `PageShell|Card|Button|design system|token` | The implementation must reuse the repo's existing primitives or tokens rather than dumping raw generated markup into production. |
| 5 | pattern | `responsive|mobile|desktop|accessib` | Production-ready Stitch usage still has to preserve accessibility and responsive behavior. |

### What a passing response looks like

- Starts with Stitch and gateway preflight instead of guessing the artifact.
- Mentions enabled Stitch tool discovery before choosing a retrieval path.
- Maps the design into the existing Next.js route and shared primitives.
- Calls out responsive and accessibility verification as part of the implementation.

---

## Eval 2: Minimal-Diff Stitch Sync For Existing Screen

This eval checks the update workflow: use the latest Stitch artifact as a diff source, preserve working local logic, and patch only the changed UI surface in a mobile implementation.

### Assertions

| # | Type | What it checks | Why it matters |
| --- | --- | --- | --- |
| 1 | contains | `stitch_get_status` | The skill must verify that the refreshed Stitch artifact is actually reachable before claiming design parity. |
| 2 | contains | `stitch_list_enabled_tools` | Tool discovery matters for update flows too, especially when comparing local UI against the current Stitch surface. |
| 3 | pattern | `minimal diff|patch only|changed only|diff` | Refreshing from Stitch should not default to a full rewrite when an implementation already exists. |
| 4 | pattern | `analytics|feature flag|business logic|preserve` | Existing instrumentation and product logic are usually validated already and should survive the UI sync. |
| 5 | pattern | `React Native|mobile|component|accessib|token` | The final patch must respect the target mobile stack and retain design-system and accessibility quality. |

### What a passing response looks like

- Treats Stitch as the source of truth for changed UI details, not for reauthoring the whole screen.
- Preserves analytics hooks, feature flags, and business logic.
- Describes a targeted patch path in React Native or another mobile stack.
- Mentions accessibility, component reuse, and design-token consistency in the final implementation notes.
