````markdown
---
inclusion: manual
name: web-perf
description: "Use for measuring and improving web performance with Core Web Vitals, rendering-path analysis, bundle and network prioritization, and framework-aware delivery tradeoffs."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Web Perf

## Purpose

Use for measuring and improving web performance with Core Web Vitals, rendering-path analysis, bundle and network prioritization, and framework-aware delivery tradeoffs.

## When to Use

- Auditing or improving Core Web Vitals and page-load behavior.
- Investigating slow rendering, hydration cost, bundle growth, or network waterfalls.
- Prioritizing frontend performance work by measured impact.
- Reviewing whether framework choices are helping or hurting delivery performance.

## Instructions

1. Measure first and identify the user-visible bottleneck.
2. Separate document, network, bundle, render, and interaction causes.
3. Fix the highest-impact path before touching low-value micro-optimizations.
4. Verify the tradeoff does not regress accessibility, caching, or maintainability.
5. Re-measure and report impact in concrete terms.

### Baseline standards

- Prioritize LCP, INP, and CLS with real bottleneck evidence.
- Keep critical resources discoverable and cacheable.
- Reduce hydration and JavaScript cost when server rendering can do the work.
- Treat bundle size, network order, and rendering behavior as one system.
- Prefer targeted fixes over generic “optimize everything” advice.

### Constraints

- Avoid recommending changes with no measured impact.
- Avoid fixating on bundle size while ignoring render path or network ordering.
- Avoid using performance tooling output without codebase context.
- Avoid trading correctness or accessibility for tiny synthetic wins.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/core-web-vitals-triage.md` | You need a stronger playbook for CWV bottleneck isolation, bundle/network/render tradeoffs, and verification after a fix. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with web perf best practices in this project"
- "Review my web perf implementation for issues"
````
