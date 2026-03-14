# Example: Git Bisect for a Memory Leak Regression

## Context

After deploying version 3.2.0 (containing 62 commits), the Node.js API server's memory usage grows steadily and triggers OOM kills after 4 hours. Version 3.1.0 was stable. The team needs to find the responsible commit.

## User Prompt

> Our API server started leaking memory after the 3.2.0 deploy. It OOM-kills after about 4 hours. Version 3.1.0 was fine. There are 62 commits between the two releases. Help me use git bisect to find which commit introduced the leak, and explain how to handle commits that can't be tested independently.

## Skill Response

### Step 1: Define Good/Bad Criteria

The bisection needs an objective, automatable test for "leaking" vs. "not leaking":

```bash
# Test script: benchmarks/memory-leak-check.sh
#!/bin/bash
# Start the server, run load for 5 minutes, check memory growth.
# Exit 0 = good (no leak), Exit 1 = bad (leak detected).

set -e

# Start server in background, record PID
npm start &
SERVER_PID=$!
sleep 5  # Wait for startup

# Record initial memory (RSS in KB)
INITIAL_RSS=$(ps -o rss= -p $SERVER_PID)

# Run moderate load for 5 minutes
k6 run --duration 5m --vus 20 benchmarks/basic-load.js 2>/dev/null

# Record final memory
FINAL_RSS=$(ps -o rss= -p $SERVER_PID)

# Kill server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null || true

# Calculate growth percentage
GROWTH=$(( (FINAL_RSS - INITIAL_RSS) * 100 / INITIAL_RSS ))

echo "Memory: ${INITIAL_RSS}KB -> ${FINAL_RSS}KB (${GROWTH}% growth)"

# Threshold: > 50% growth in 5 minutes indicates a leak
if [ "$GROWTH" -gt 50 ]; then
    echo "VERDICT: BAD (memory leak detected)"
    exit 1
else
    echo "VERDICT: GOOD (memory stable)"
    exit 0
fi
```

### Step 2: Start the Bisection

```bash
# Mark the known good and bad commits
git bisect start
git bisect bad v3.2.0      # 62 commits, confirmed leaking
git bisect good v3.1.0     # confirmed stable

# Expected steps: log2(62) ≈ 6 steps to find the culprit
echo "Bisection will take approximately 6 steps"
```

### Step 3: Automate with the Test Script

```bash
# Run the bisection automatically
git bisect run bash benchmarks/memory-leak-check.sh
```

The automated flow:

```
Step 1: Testing commit abc1234 (midpoint, ~31 commits from each end)
  Memory: 52000KB -> 54000KB (3% growth)
  VERDICT: GOOD
  -> Bug is in the newer half (31 commits remain)

Step 2: Testing commit def5678 (midpoint of newer half)
  Memory: 52000KB -> 112000KB (115% growth)
  VERDICT: BAD
  -> Bug is in older half of this range (15 commits remain)

Step 3: Testing commit ghi9012 (midpoint)
  Memory: 52000KB -> 53000KB (1% growth)
  VERDICT: GOOD
  -> 8 commits remain

Step 4: Testing commit jkl3456 (midpoint)
  Memory: 52000KB -> 98000KB (88% growth)
  VERDICT: BAD
  -> 4 commits remain

Step 5: Testing commit mno7890 (midpoint)
  CANNOT BUILD - migration requires previous commit's schema
  -> git bisect skip

Step 5b: Testing commit pqr1234 (adjacent)
  Memory: 52000KB -> 51000KB (-1% growth)
  VERDICT: GOOD
  -> 2 commits remain

Step 6: Testing commit stu5678
  Memory: 52000KB -> 105000KB (101% growth)
  VERDICT: BAD
  -> FOUND: stu5678 is the first bad commit
```

### Handling Untestable Commits

Three scenarios and their solutions:

| Scenario | Example | Solution |
|----------|---------|----------|
| Build fails | Syntax error fixed in next commit | `git bisect skip` -- bisect tests an adjacent commit |
| Migration dependency | Database migration needs earlier commit's schema | `git bisect skip` -- or apply migration manually before testing |
| Infrastructure change | Commit changes Docker config, not app code | `git bisect skip` -- unlikely to cause memory leak |

```bash
# When a commit can't be tested, skip it
git bisect skip

# If multiple consecutive commits can't be tested, skip a range
git bisect skip v3.1.5..v3.1.8
```

### Step 4: Analyze the Guilty Commit

```bash
# Show the identified commit
git bisect log   # Shows the full bisection history
git show stu5678 # Inspect the responsible commit
```

**Guilty commit message:**
```
feat: add response caching middleware

Adds an in-memory LRU cache for GET responses to reduce
database load on frequently accessed endpoints.
```

**The problem:**

```javascript
// src/middleware/responseCache.js (introduced in stu5678)
const cache = new Map();  // No size limit!

app.use((req, res, next) => {
  if (req.method === 'GET') {
    const key = req.originalUrl;
    if (cache.has(key)) {
      return res.json(cache.get(key));
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body);  // Caches every unique URL forever
      return originalJson(body);
    };
  }
  next();
});
```

**Root cause:** The cache is an unbounded `Map` that stores every unique URL (including query parameters). URLs with pagination, timestamps, or unique IDs create infinite cache entries.

### Step 5: Fix and Verify

```javascript
// Fixed: use LRU cache with size limit and TTL
const LRU = require('lru-cache');
const cache = new LRU({
  max: 500,           // Maximum 500 entries
  ttl: 1000 * 60 * 5, // 5-minute TTL
});
```

**Verify the fix:**
```bash
# Run the same memory test against the fix
bash benchmarks/memory-leak-check.sh
# Memory: 52000KB -> 54000KB (3% growth) - GOOD
```

### Step 6: Clean Up Bisection

```bash
# Return to original branch
git bisect reset
```

### Post-Bisection Checklist

- [x] Guilty commit identified: `stu5678`
- [x] Root cause understood: unbounded in-memory cache
- [x] Fix applied: LRU cache with size limit and TTL
- [x] Regression test added: memory growth test in CI
- [x] Similar patterns searched: `grep -rn "new Map()" src/` -- no other unbounded caches found
- [x] Post-mortem documented with prevention measures

### Key Takeaways

1. **Automate the bisection test** -- A script with clear pass/fail criteria eliminates human judgment variance and speeds up the process.
2. **`git bisect skip` handles untestable commits** -- Don't force-test commits that can't build; skip them and let bisect try adjacent ones.
3. **5 minutes is enough to detect a memory leak** -- You don't need to wait 4 hours; a shorter test with a lower threshold (50% growth vs. OOM) works for bisection.
4. **Logarithmic efficiency matters** -- 6 steps to search 62 commits. Linear scanning would have taken hours.
5. **Always analyze why the commit was missed in review** -- An unbounded `Map` should have been caught by code review or a linting rule.
