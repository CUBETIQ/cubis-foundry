# Bisection Strategies

## Git Bisect Fundamentals

Git bisect performs a binary search through commit history to find the exact commit that introduced a bug. It requires two anchors: a known "good" commit and a known "bad" commit.

### Basic Workflow

```bash
# Start bisection
git bisect start

# Mark the current (broken) state as bad
git bisect bad

# Mark a known working commit as good
git bisect good v2.3.0

# Git checks out the midpoint. Test it, then mark:
git bisect good   # if this commit works
git bisect bad    # if this commit is broken

# Repeat until git identifies the first bad commit
# Output: abc1234 is the first bad commit

# Clean up and return to original branch
git bisect reset
```

### Efficiency

Git bisect uses binary search: O(log2 n) steps.

| Commits to Search | Steps Required |
|-------------------|----------------|
| 8 | 3 |
| 16 | 4 |
| 32 | 5 |
| 64 | 6 |
| 128 | 7 |
| 256 | 8 |
| 1024 | 10 |

For 100 commits, expect approximately 7 steps. Each step halves the remaining search space.

## Automated Bisection

### Script-Based Automation

The most powerful feature of git bisect is the `run` command, which executes a script at each step:

```bash
git bisect start
git bisect bad HEAD
git bisect good v2.3.0
git bisect run ./test-script.sh
```

The script must exit with:
- `0` -- This commit is good.
- `1-124, 126-127` -- This commit is bad.
- `125` -- This commit cannot be tested (skip).

### Writing Effective Bisect Scripts

```bash
#!/bin/bash
# bisect-test.sh -- Tests whether the bug is present

set -e

# Step 1: Build the project (skip if build fails)
npm install 2>/dev/null || exit 125
npm run build 2>/dev/null || exit 125

# Step 2: Start the service
npm start &
SERVER_PID=$!
sleep 3

# Step 3: Run the test
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/1)

# Step 4: Clean up
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null || true

# Step 5: Return verdict
if [ "$HTTP_STATUS" = "200" ]; then
  exit 0   # Good: endpoint returns 200
else
  exit 1   # Bad: endpoint broken
fi
```

### Key Script Requirements

| Requirement | Rationale |
|------------|-----------|
| Deterministic | Same commit must produce the same result every time |
| Self-contained | Must set up and tear down without external dependencies |
| Fast | Each run is one step; slow scripts make bisection painful |
| Clean exit codes | 0=good, 1-124=bad, 125=skip, 128+=abort |
| Cleanup on failure | Kill background processes, remove temp files |

## Handling Untestable Commits

### Git Bisect Skip

When a commit cannot be tested (build failure, incomplete migration, broken dependency):

```bash
# Skip the current commit
git bisect skip

# Git tries an adjacent commit instead
# If many adjacent commits are untestable:
git bisect skip v2.3.5..v2.3.8
```

**Limitation:** Skipping reduces bisect efficiency. If the first bad commit is within a skipped range, git cannot pinpoint it precisely and reports a range of suspects.

### Common Untestable Scenarios

| Scenario | Example | Handling |
|----------|---------|----------|
| Build failure | Syntax error fixed in next commit | `git bisect skip` |
| Migration dependency | Database migration requires prior commit's data | Apply migration manually, then test |
| Dependency version conflict | Package.json references unpublished version | `git bisect skip` |
| Infrastructure change | Commit changes CI config, not application | `git bisect skip` (unlikely to cause the bug) |
| Merge commit | Complex merge that cannot be checked out cleanly | `git bisect skip` |

### Manual Workarounds for Migrations

When a commit adds a migration that depends on the previous migration:

```bash
# Option 1: Apply all migrations up to the current point
git stash  # Save current bisect state
git checkout main -- migrations/  # Get all migrations
npm run db:migrate
git stash pop

# Option 2: Use the test database's current schema (if compatible)
# Just skip the migration step in the test script
```

## Advanced Bisect Techniques

### Bisecting Across Renames

If the file was renamed during the commit range, use the current name:

```bash
git bisect start
git bisect bad HEAD
git bisect good abc1234
# Git follows renames automatically through git log --follow
```

### Bisecting Performance Regressions

For non-binary bugs (performance degraded, not broken):

```bash
#!/bin/bash
# bisect-perf.sh -- Tests whether response time exceeds threshold

npm start &
sleep 3

# Run 10 requests, compute average
TOTAL=0
for i in $(seq 1 10); do
  TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/api/endpoint)
  TOTAL=$(echo "$TOTAL + $TIME" | bc)
done
AVG=$(echo "scale=3; $TOTAL / 10" | bc)

kill %1 2>/dev/null

# Threshold: 0.5 seconds average
if (( $(echo "$AVG < 0.500" | bc -l) )); then
  exit 0   # Good: fast enough
else
  exit 1   # Bad: too slow
fi
```

### Bisecting Flaky Bugs

For intermittent issues, run the test multiple times at each step:

```bash
#!/bin/bash
# bisect-flaky.sh -- Tests 20 times, fails if any occurrence

FAILURES=0
for i in $(seq 1 20); do
  if ! curl -sf http://localhost:3000/api/endpoint > /dev/null; then
    FAILURES=$((FAILURES + 1))
  fi
done

if [ "$FAILURES" -gt 0 ]; then
  exit 1   # Bad: at least one failure in 20 attempts
else
  exit 0   # Good: all 20 succeeded
fi
```

## Non-Git Bisection

The bisection strategy applies beyond git commits:

### Configuration Bisection

When a configuration change causes a problem but the config has many options:

```
1. Comment out the bottom half of the config.
2. If the problem persists: it's in the top half.
3. If the problem disappears: it's in the bottom half.
4. Repeat on the identified half.
```

### Dependency Bisection

When upgrading dependencies causes a regression:

```
1. List all changed dependencies (10 packages updated).
2. Revert half of them (5 packages).
3. Test: problem present? Search in remaining 5.
4. Test: problem gone? Search in reverted 5.
5. Repeat.
```

### Code Bisection (Without Version Control)

When debugging in a single file with many recent changes:

```
1. Comment out the bottom half of recent changes.
2. Test.
3. Binary search within the identified half.
```

## Bisection Checklist

Before starting a bisection:

- [ ] Good commit identified (verified working).
- [ ] Bad commit identified (verified broken).
- [ ] Test script written and tested at both endpoints.
- [ ] Test script handles build failures (exit 125).
- [ ] Test script cleans up after itself.
- [ ] Approximate number of steps estimated (log2 of commit count).
- [ ] Time budget allocated (steps * time per step).

After bisection:

- [ ] Guilty commit identified and inspected.
- [ ] Root cause in the commit analyzed.
- [ ] Fix applied and regression test written.
- [ ] Similar changes in other commits reviewed.
