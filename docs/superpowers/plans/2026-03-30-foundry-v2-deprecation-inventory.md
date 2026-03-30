# Foundry V2 Deprecation Inventory

Definitions:
- `tombstone` — keep the file, but reduce it to a short historical note that points to the current source of truth and says not to execute from it.
- `delete` — remove the file entirely because it is duplicated, misleading, or has no remaining archival value.

## Active Runtime/Code Surfaces Still Worth Auditing
- `mcp/src/index.ts` — top-level MCP status output still presents Stitch as a normal configured provider; this may be valid service support, but should stay deliberate.
- `mcp/src/{server.ts,gateway/**,cbxConfig/**,tools/{routeResolve.ts,registry.ts,mcpGateway.ts,stitch*.ts},upstream/passthrough.ts}` — MCP runtime still models Stitch as a live provider and route target; keep only the service path, not deleted skill-compat behavior.
- `mcp/README.md` — user-facing MCP docs still document Stitch passthrough and should stay accurate now that the design compatibility mirror is removed.
- `workflows/workflows/agent-environment-setup/shared/workflows/{ui-testing.md,test.md,design-screen.md}` — shared workflow docs still deserve a final stale-name sweep after the testing and mirror cleanup.
- `scripts/{generate-mcp-manifest.mjs,generate-mcp-rules-block.mjs,generate-platform-assets.mjs,mcp-http-smoke.mjs}` — generator/help scripts still deserve a final stale-name sweep after the major cleanup passes.

## Guards/Negative Tests To Keep
- `src/cli/catalog/catalog.test.ts` — locks deleted module IDs out of catalog/module resolution.
- `src/cli/catalog/agent-surfaces.test.ts` — keeps core agents free of `qa`/`unit-testing`/`integration-testing`/`playwright-interactive`.
- `src/cli/catalog/shared-workflow-bundle.test.ts` — keeps removed skill IDs out of the shared workflow bundle.
- `src/cli/catalog/generated-instruction-surfaces.test.ts` — guards generated assets and mirror scripts against deleted stitch wrappers.
- `src/cli/catalog/ui-skills.test.ts` — verifies canonical UI skills stay free of the removed `.stitch/DESIGN.md` mirror contract.
- `mcp/src/tools/stitchExecute.test.ts` — ensures canonical design routing replaced deleted stitch wrappers.
- `mcp/src/tools/webTestingRun.test.ts` — pins web testing traces to `web-testing`.
- `mcp/src/tools/mobileTestingRun.test.ts` — pins mobile testing fallback/provider behavior and preserves `providerUsed`.

## Historical Docs To Tombstone
- `docs/superpowers/plans/2026-03-25-foundry-v2-plan-{a-control-plane-bootstrap,b-compiler-pipeline,c-capability-migration-installer-state,d-cli-subsystem-split,e-documentation-system}.md` — earliest bootstrap/planning drafts, now superseded.
- `docs/superpowers/specs/2026-03-25-foundry-v2-unified-control-plane-design.md` — superseded by `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`.
- `docs/superpowers/specs/2026-03-26-agent-workflow-skill-canonical-model.md` — superseded by `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`.
- `docs/superpowers/plans/2026-03-26-foundry-v2-unified-plan.md` — superseded by `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`.
- `docs/superpowers/plans/2026-03-28-foundry-v2-reduction-matrix.md` — useful as history, but superseded by `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-inventory.md` plus the active realignment plan.
- `docs/superpowers/specs/2026-03-30-ui-mobile-mcp-enhancement-design.md` — feature-specific enhancement design; historical after the active realignment spec is collapsed to the single source of truth.
- `docs/superpowers/plans/2026-03-30-ui-mobile-mcp-enhancement-plan.md` — feature-specific enhancement plan; historical after the active realignment plan becomes the only current execution source.

## Historical Docs To Delete
- `docs/superpowers/plans/2026-03-30-deprecated-skill-hard-delete-plan.md` — narrow one-off cleanup plan now fully subsumed by `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`.
- `docs/superpowers/specs/2026-03-30-deprecated-skill-hard-delete-design.md` — narrow one-off hard-delete design now fully subsumed by `docs/superpowers/plans/2026-03-30-foundry-v2-deprecation-cleanup-plan.md`.
