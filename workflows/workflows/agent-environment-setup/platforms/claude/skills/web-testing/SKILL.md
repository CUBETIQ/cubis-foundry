---
name: web-testing
description: Use when running browser QA in a real web session with Playwright
  MCP, deterministic navigation, screenshots, console evidence, network evidence,
  accessibility snapshots, or failure reproduction.
triggers:
  - web testing
  - browser qa
  - playwright mcp
  - console evidence
  - network evidence
  - accessibility snapshots
  - failure reproduction
domains:
  - quality
  - testing
whenToUse: When validating real web flows in a browser and the output should be
  evidence, a defect repro, or a release-readiness verdict.
priority: primary
---

# Web Testing

Canonical browser QA skill for live web flows. Use Playwright MCP first and
follow Playwright best practices so the runtime matches the real browser, the
evidence is reproducible, and the verdict is tied to actual page behavior
rather than static code inspection. Optimize for user-visible behavior,
isolated flow execution, and artifact-backed findings over
implementation-detail assertions.

Resolve `<module-root>` to the installed `web-testing` skill directory before
using sidecars. Module-local helpers below are referenced as
`<module-root>/scripts/...`.

## When to Use

- Validating a live browser flow end to end
- Reproducing a UI bug in the real page
- Capturing screenshots, DOM or accessibility state, console logs, or network failures
- Confirming whether a web release is blocked, degraded, or ready to hand off

## Instructions

1. Start with the real browser/runtime path and confirm Playwright MCP is available, because this skill is for live web execution rather than offline suite authoring.
2. Require an explicit base URL and starting state before interacting, because hidden navigation assumptions make browser QA nondeterministic.
3. Execute one isolated user flow at a time, because a focused path gives a clearer verdict than broad exploratory automation.
4. Use stable selectors in this order: role, label, placeholder, test id, text, CSS last, because semantic locators survive refactors better than layout-driven selectors.
5. Inspect the page before you act, because snapshots and accessibility state often reveal the failure faster than blind clicking.
6. Use artifact capture at key transitions, because screenshots, console output, and network data provide the proof behind the verdict.
7. Wait on concrete UI signals such as text, role state, URL changes, or response completion, because fixed sleeps are fragile and slow.
8. Use one controlled retry only when a step looks transient, because repeated retries hide real instability and waste evidence quality.
9. Treat console errors and failed requests as first-class findings, because a visually correct page can still be broken underneath.
10. Mask or note dynamic content before capturing screenshots, because timestamps, avatars, and rotating content can produce false visual noise.
11. Record the exact blocked step when execution stops, because a precise failure point is more useful than a generic failure summary.
12. Tie the final report to artifact paths and observed behavior, because impressions without evidence are not actionable QA output.

## Output Format

```markdown
## Web Testing Report
- Flow:
- Base URL:
- Start state:
- Success criteria:

## Execution Log
1. [action] -> [observation]
2. [action] -> [observation]

## Evidence
- Screenshots:
- DOM / accessibility snapshots:
- Console summary:
- Network summary:

## Verdict
- Passed:
- Failed:
- Blocked:

## Follow-ups
- ...
```

## References

| File | Load when |
| --- | --- |
| `<module-root>/scripts/console_summarize.py` | Summarizing console output or turning console captures into a compact report. |
| `<module-root>/scripts/network_summarize.py` | Summarizing network captures or scanning for failed requests. |
