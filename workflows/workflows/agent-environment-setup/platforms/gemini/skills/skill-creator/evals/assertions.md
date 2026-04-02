# Skill Creator — Eval Assertions

## Eval 1: Create a new GraphQL Gateway skill

### Assertion 1: Valid YAML frontmatter
The skill-creator must generate a SKILL.md with properly formatted YAML frontmatter between `---` delimiters. Required fields: name (kebab-case), description (string), license (MIT or Apache-2.0), metadata (object with author and version), compatibility (string listing platforms).

### Assertion 2: Trigger-based description
The description field must start with "Use when" and list 3-6 specific scenarios where the skill should be loaded. This is critical because the description drives the skill routing engine — vague descriptions cause mis-routing.

### Assertion 3: WHAT + WHY instructions
Each numbered instruction must state what to do AND why, using "because" to connect the action to its rationale. This format enables the LLM to adapt instructions to context rather than following them mechanically.

### Assertion 4: References table
The SKILL.md must include a References table with columns for File and "Load when" conditions. Each reference should point to a file in the `references/` directory. This enables progressive disclosure — loading detailed context only when needed.

### Assertion 5: Valid evals
The skill-creator must produce an evals.json file with valid JSON containing at least 2 eval objects. Each eval must have a `prompt` field (the test scenario) and an `assertions` array with at least 5 items (behavioral checks on the skill's output).

## Eval 2: Evaluate python-best-practices skill

### Assertion 1: Reads existing evals
Before running evaluations, the skill-creator must read the target skill's evals.json to understand what prompts and assertions to test. This ensures the evaluation uses the skill's own test suite rather than inventing ad-hoc checks.

### Assertion 2: Individual assertion checking
Each assertion must be checked independently and reported separately. Lumping assertions together as "mostly passed" loses the granularity needed to identify specific instruction weaknesses.

### Assertion 3: Evidence-based reporting
Every pass/fail verdict must include specific evidence — a quote or summary from the skill's output that supports the verdict. Without evidence, the eval results are opinions rather than measurements.

### Assertion 4: Flaky assertion detection
The skill-creator should identify assertions that might pass inconsistently across runs — typically assertions that depend on exact phrasing rather than behavioral substance. These should be flagged for rewriting.

### Assertion 5: Actionable improvements
For failed assertions, the skill-creator must provide specific suggestions for improving the skill's instructions to increase the pass rate. Generic advice like "improve the instructions" is not actionable.
