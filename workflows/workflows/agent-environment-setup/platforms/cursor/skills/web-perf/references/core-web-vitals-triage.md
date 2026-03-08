# Core Web Vitals Triage

Load this when web performance work needs a more explicit process.

## Measure first

- Start with real bottleneck evidence: LCP, INP, CLS, bundle, waterfall, or render trace.
- Separate document, network, bundle, render, and interaction causes.

## Fix selection

- Prioritize the highest user-visible bottleneck.
- Reduce hydration and JavaScript cost when server rendering can do the work.
- Keep cacheability, preload strategy, and render path aligned.

## Verification

- Re-measure after every meaningful change.
- Check accessibility and correctness did not regress.
- Report impact in concrete user-visible terms, not only lab-score movement.
