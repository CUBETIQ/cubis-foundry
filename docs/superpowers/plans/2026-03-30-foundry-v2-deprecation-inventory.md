# Foundry V2 Deprecation Inventory

Definitions:
- `tombstone` — keep the file, but reduce it to a short historical note that points to the current source of truth and says not to execute from it.
- `delete` — remove the file entirely because it is duplicated, misleading, or has no remaining archival value.

## Active Runtime/Code Surfaces To Rewrite
- `src/cli/{core.ts,commands/register.ts,init/**,mcp/commands.ts,mobile/**,web/**}` — CLI help, onboarding, and QA commands still advertise `stitch`, `mobile-qa`, and `web-qa`.
- `src/cli/foundry/state.ts` — workspace-state summaries still surface `.stitch/DESIGN.md` as a first-class file instead of explicitly labeling it as compatibility-only state.
- `mcp/src/index.ts` — top-level MCP status output still presents Stitch as a normal configured provider, which needs a deliberate keep-vs-reduce decision during cleanup.
- `mcp/src/{server.ts,gateway/**,cbxConfig/**,tools/{routeResolve.ts,registry.ts,mcpGateway.ts,stitch*.ts},upstream/passthrough.ts}` — MCP runtime still models `stitch` as a live provider and route target.
- `mcp/src/tools/webQaRun.ts` — the canonical web QA runner still uses `web_qa_run` naming and `artifacts/web-qa`, which should be normalized if the old QA naming is fully retired.
- `mcp/src/tools/mobileQaRun.ts` — the canonical mobile QA runner still uses `mobile_qa_run` naming and `artifacts/mobile-qa`, which should be normalized if the old QA naming is fully retired.
- `mcp/runtime/{mobile-qa-runner.mjs,web-qa-runner.mjs}` — runtime helpers still encode the removed `qa` naming.
- `mcp/README.md` — user-facing MCP docs still document Stitch passthrough and legacy config paths.
- `workflows/workflows/agent-environment-setup/manifest.json` — shared platform manifest still emits `mobile-qa` and `web-qa` workflow artifacts instead of purely canonical testing/design routes.
- `workflows/workflows/agent-environment-setup/shared/agents/tester.md` — still participates in the old `web-qa` / `mobile-qa` naming layer.
- `workflows/workflows/agent-environment-setup/shared/rules/STEERING.md` — still carries explicit Stitch/design-generation compatibility wording that should be collapsed if Stitch is no longer treated as a first-class user route.
- `workflows/workflows/agent-environment-setup/shared/workflows/{mobile-qa.md,web-qa.md,ui-testing.md,test.md,implement.md,design-screen.md,design-refresh.md}` — shared workflow docs still carry stale QA naming or design-generation compatibility wording.
- `workflows/design-datasets/{component-motifs.json,layout-patterns.json,mobile-patterns.json,motion-patterns.json,style-directions.json,token-language.json}` — design datasets still encode `stitch` in `platformScope`, which keeps deprecated design-generation labeling alive in active data.
- `foundry/modules/design/SKILL.md` — still carries `frontend-design*` and `design-audit` compatibility aliases plus anti-pattern wording tied to the fragmented stack.
- `foundry/modules/design/references/execution-contract.md` — still treats `.stitch/DESIGN.md` as a downstream deliverable and needs an explicit keep-as-compatibility-only or remove decision.
- `foundry/modules/design-system/SKILL.md` — still instructs users to mirror canonical state into `.stitch/DESIGN.md`; keep only if the compatibility mirror remains an intentional supported output.
- `foundry/modules/design-system/templates/claude.j2` — mirrors the same `.stitch/DESIGN.md` compatibility contract as the canonical skill body and must stay aligned with the final decision.
- `foundry/modules/mobile-ui-design/SKILL.md` — still exposes the `frontend-design-mobile-patterns` compatibility alias even though the fragmented module tree is gone.
- `scripts/{generate-mcp-manifest.mjs,generate-mcp-rules-block.mjs,generate-platform-assets.mjs,mcp-http-smoke.mjs,validate-cli-help.mjs}` — generator/help scripts still teach, assert, or reinforce stale names.
- `scripts/validate-skill-packaging.mjs` — packaging validation still treats `.stitch/DESIGN.md` as a special compatibility path and should be kept only if that mirror survives final cleanup.

## Guards/Negative Tests To Keep
- `src/cli/catalog/catalog.test.ts` — locks deleted module IDs out of catalog/module resolution.
- `src/cli/catalog/agent-surfaces.test.ts` — keeps core agents free of `qa`/`unit-testing`/`integration-testing`/`playwright-interactive`.
- `src/cli/catalog/shared-workflow-bundle.test.ts` — keeps removed skill IDs out of the shared workflow bundle.
- `src/cli/catalog/generated-instruction-surfaces.test.ts` — guards generated assets and mirror scripts against deleted stitch wrappers.
- `src/cli/catalog/ui-skills.test.ts` — verifies canonical UI skills and the compatibility mirror boundary stay aligned.
- `mcp/src/tools/stitchExecute.test.ts` — ensures canonical design routing replaced deleted stitch wrappers.
- `mcp/src/tools/webQaRun.test.ts` — pins web QA traces to `web-testing`.
- `mcp/src/tools/mobileQaRun.test.ts` — pins mobile QA fallback/provider behavior and preserves `providerUsed`.

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
