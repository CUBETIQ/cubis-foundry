---
name: performance-profiling
description: "Use when measuring, analyzing, and optimizing application performance with Core Web Vitals, bundle analysis, runtime profiling, and lighthouse audits."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Performance Profiling

## Purpose

Use when measuring, analyzing, and optimizing application performance with Core Web Vitals, bundle analysis, runtime profiling, and lighthouse audits.

## When to Use

- Measuring and improving Core Web Vitals (LCP, INP, CLS).
- Analyzing bundle size, finding large dependencies, and code splitting.
- Profiling runtime performance in browser Performance or Memory tabs.
- Diagnosing performance bottlenecks (slow API, large payload, memory leak, layout thrash).
- Planning performance optimization with measurement-first discipline.

## Instructions

1. Baseline — measure current performance with Lighthouse, WebPageTest, or browser DevTools.
2. Identify — find the biggest bottleneck using profiling data, not assumptions.
3. Fix — apply targeted optimization for the measured bottleneck.
4. Validate — re-measure to confirm improvement and check for regressions.

### Core Web Vitals targets

| Metric | Good    | Needs Improvement | Poor    |
| ------ | ------- | ----------------- | ------- |
| LCP    | < 2.5s  | 2.5s – 4.0s       | > 4.0s  |
| INP    | < 200ms | 200ms – 500ms     | > 500ms |
| CLS    | < 0.1   | 0.1 – 0.25        | > 0.25  |

### Baseline standards

- Always measure before optimizing — intuition is unreliable for performance.
- Use real user metrics (RUM) alongside synthetic benchmarks.
- Profile on representative hardware, not just developer machines.
- Address the largest bottleneck first for maximum impact.
- Verify optimizations don't introduce regressions elsewhere.

### Quick wins priority

| Priority | Action                           | Typical Impact            |
| -------- | -------------------------------- | ------------------------- |
| 1        | Enable compression (gzip/brotli) | 60-80% transfer reduction |
| 2        | Lazy load below-fold images      | LCP improvement           |
| 3        | Code split routes                | Initial load reduction    |
| 4        | Set proper cache headers         | Repeat visit speed        |
| 5        | Optimize images (WebP/AVIF)      | Transfer size reduction   |

### Common bottlenecks by symptom

| Symptom           | Likely Cause                            | Investigation                      |
| ----------------- | --------------------------------------- | ---------------------------------- |
| Slow initial load | Large bundle, render-blocking resources | Bundle analysis, waterfall         |
| Janky scrolling   | Layout thrash, paint storms             | Performance tab, layers panel      |
| Memory growth     | Detached DOM, event listener leaks      | Memory tab, heap snapshots         |
| Slow interaction  | Long tasks, main thread blocking        | Performance tab, long task markers |

### Constraints

- Never optimize without measuring first.
- Never assume a change improved performance — always validate with data.
- Never sacrifice correctness for performance.
- Avoid premature optimization of code paths that aren't bottlenecks.

## Output Format

Provide measurement data, identified bottlenecks with evidence, optimization recommendations, and before/after comparisons.

## References

No reference files for this skill right now.

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Profile and optimize the Core Web Vitals for our landing page"
- "Analyze our bundle and recommend code splitting strategy"
- "Find and fix the memory leak in our real-time dashboard"
