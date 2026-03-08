---
name: "web-perf"
description: "Use for measuring and improving web performance with Core Web Vitals, rendering-path analysis, bundle and network prioritization, and framework-aware delivery tradeoffs."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "web-performance"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Core Web Vitals era with INP"
  tags: ["performance", "core-web-vitals", "lcp", "inp", "cls", "bundles", "network"]
---
# Web Perf

## When to use

- Auditing or improving Core Web Vitals and page-load behavior.
- Investigating slow rendering, hydration cost, bundle growth, or network waterfalls.
- Prioritizing frontend performance work by measured impact.
- Reviewing whether framework choices are helping or hurting delivery performance.

## When not to use

- Generic bug debugging with no user-perceived performance issue.
- Pure backend latency analysis with no browser delivery impact.
- Styling or UI work where performance is not an active constraint.

## Core workflow

1. Measure first and identify the user-visible bottleneck.
2. Separate document, network, bundle, render, and interaction causes.
3. Fix the highest-impact path before touching low-value micro-optimizations.
4. Verify the tradeoff does not regress accessibility, caching, or maintainability.
5. Re-measure and report impact in concrete terms.

## Baseline standards

- Prioritize LCP, INP, and CLS with real bottleneck evidence.
- Keep critical resources discoverable and cacheable.
- Reduce hydration and JavaScript cost when server rendering can do the work.
- Treat bundle size, network order, and rendering behavior as one system.
- Prefer targeted fixes over generic “optimize everything” advice.

## Avoid

- Recommending changes with no measured impact.
- Fixating on bundle size while ignoring render path or network ordering.
- Using performance tooling output without codebase context.
- Trading correctness or accessibility for tiny synthetic wins.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/core-web-vitals-triage.md` | You need a stronger playbook for CWV bottleneck isolation, bundle/network/render tradeoffs, and verification after a fix. |
