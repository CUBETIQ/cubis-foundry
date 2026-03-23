# Assertions Reference - ui-testing-harness

## Eval 001: Single Scenario Harness Build

### Assertion 1 - Fixed scenario structure

- Type: pattern
- What: output should mention a scenario or manifest with a style direction, motif, and layout
- Why: the harness compares fixed inputs; without a locked scenario contract, UI quality cannot be measured consistently

### Assertion 2 - Normalized research

- Type: pattern
- What: output should mention normalized research, internal datasets, or Foundry-owned notes
- Why: execution should not rely on raw external prompt pages because that makes the harness non-reproducible

### Assertion 3 - Runnable fixture

- Type: pattern
- What: output should mention a runnable local fixture and a real interaction state
- Why: the harness needs observable UI behavior, not just screenshots or descriptive prose

### Assertion 4 - Playwright charter

- Type: pattern
- What: output should mention a Playwright or QA charter
- Why: deterministic evidence capture is part of the harness contract

### Assertion 5 - Artifacts and gaps

- Type: pattern
- What: output should mention a scorecard, prompt trace, artifacts, or gaps
- Why: the harness only matters if it can turn UI review into concrete Foundry improvements

## Eval 002: Batch Harness Review

### Assertion 1 - Comparative review

- Type: pattern
- What: output should treat the work as a five-scenario or batch comparison
- Why: repeated failures across scenarios are more important than isolated observations

### Assertion 2 - Anti-slop focus

- Type: pattern
- What: output should mention style drift, default fallback, or generic UI
- Why: the core purpose of the harness is to catch AI-slop behavior

### Assertion 3 - Responsive review

- Type: pattern
- What: output should review mobile and desktop behavior
- Why: many generated UIs only look acceptable on one viewport

### Assertion 4 - Provenance review

- Type: pattern
- What: output should mention provenance, prompt trace, or datasets
- Why: unexplained style decisions make debugging impossible

### Assertion 5 - Systemic gaps

- Type: pattern
- What: output should map repeated failures into Foundry gaps with owner area and fix
- Why: the harness should improve the product workflow, not just critique example files
