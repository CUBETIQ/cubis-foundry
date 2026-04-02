# Debugger Workflows

## When to Use a Debugger

Debuggers are most valuable when you need to inspect runtime state at a specific point in execution. They complement -- but do not replace -- logging and testing.

### Debugger vs. Logging

| Situation | Better Tool | Rationale |
|-----------|------------|-----------|
| Known failure point, need state inspection | Debugger | Set breakpoint, inspect variables |
| Unknown failure point, need to find it | Logging | Add strategic logs, scan for anomalies |
| Intermittent bug in production | Logging | Debuggers disrupt production traffic |
| Complex object graph to inspect | Debugger | Visual inspection of nested state |
| Multi-request flow | Logging + Tracing | Debugger context resets per request |
| Algorithm correctness | Debugger | Step through logic, watch values change |

## Breakpoint Strategies

### Unconditional Breakpoints

Stop execution at a specific line. Use when you know where the problem is and want to inspect state.

```
Line 42: const result = calculateDiscount(price, coupon);
                                                          <- Breakpoint here
Line 43: if (result < 0) {
```

### Conditional Breakpoints

Stop only when a condition is met. Essential for bugs that occur with specific data.

```javascript
// VS Code: right-click breakpoint -> Edit Condition
// Condition: userId === 'user_789' && order.total > 1000

// Chrome DevTools: right-click line number -> Add conditional breakpoint
// Condition: request.headers['x-debug'] === 'true'
```

### Logpoints (Non-Breaking)

Print a message without stopping execution. Useful for understanding flow without disrupting timing.

```
// VS Code: right-click line number -> Add Logpoint
// Message: "processOrder called with: {orderId}, total: {order.total}"
```

### Exception Breakpoints

Break when an exception is thrown, before it is caught. Reveals where errors originate, not just where they are handled.

```
// VS Code: Run and Debug -> Breakpoints section
// Check: "Uncaught Exceptions"
// Check: "Caught Exceptions" (when investigating swallowed errors)

// Chrome DevTools: Sources -> Breakpoints -> "Pause on exceptions"
```

### Data Breakpoints (Watchpoints)

Break when a variable's value changes. Available in native debuggers (GDB, LLDB) and some IDE debuggers.

```
// GDB
watch myVariable         # Break on write
rwatch myVariable        # Break on read
awatch myVariable        # Break on read or write

// VS Code (C/C++, Rust):
// Right-click variable in Variables panel -> "Break on Value Change"
```

## IDE Debugger Workflows

### VS Code (JavaScript/TypeScript)

#### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Current Test",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["jest", "--runInBand", "${relativeFile}"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": { "NODE_ENV": "development" },
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

#### Key Operations

| Action | Shortcut (Mac) | Shortcut (Win/Linux) |
|--------|---------------|---------------------|
| Continue | F5 | F5 |
| Step Over | F10 | F10 |
| Step Into | F11 | F11 |
| Step Out | Shift+F11 | Shift+F11 |
| Toggle Breakpoint | F9 | F9 |
| Debug Console | Cmd+Shift+Y | Ctrl+Shift+Y |

### VS Code (Python)

```json
{
  "name": "Debug Python",
  "type": "debugpy",
  "request": "launch",
  "program": "${file}",
  "args": [],
  "env": { "PYTHONDONTWRITEBYTECODE": "1" }
}
```

### Chrome DevTools (Frontend JavaScript)

1. Open DevTools (F12).
2. Go to Sources tab.
3. Find file in the file tree or use Cmd+P to search.
4. Click line number to set breakpoint.
5. Trigger the action that causes the bug.
6. Inspect variables in the Scope panel.
7. Use Console to evaluate expressions in the current scope.

### IntelliJ/JetBrains (Java, Kotlin, Go)

- **Evaluate Expression:** Alt+F8 during pause. Run arbitrary code in current context.
- **Drop Frame:** Restart the current method without restarting the entire application.
- **Force Return:** Return a specific value from the current method without executing the rest.
- **Hot Swap:** Replace class bytecode without restarting (Java only).

## Remote Debugging

### Node.js Remote Debug

```bash
# On the remote server
node --inspect=0.0.0.0:9229 app.js

# Local: forward the port
ssh -L 9229:localhost:9229 user@remote-server

# VS Code: attach to localhost:9229
```

### Python Remote Debug

```python
# On the remote server
import debugpy
debugpy.listen(("0.0.0.0", 5678))
debugpy.wait_for_client()  # Pauses until debugger attaches
```

### Docker Container Debugging

```yaml
# docker-compose.debug.yml
services:
  app:
    build: .
    command: node --inspect=0.0.0.0:9229 src/index.js
    ports:
      - "3000:3000"
      - "9229:9229"   # Debug port
```

## Debugging Techniques

### Binary Search Through Code

When the failure point is unknown within a large function:

1. Set a breakpoint at the middle of the function.
2. If the state is correct at the midpoint, the bug is in the second half.
3. If the state is already wrong, the bug is in the first half.
4. Repeat until you find the exact line where state becomes incorrect.

### Reverse Debugging

Some debuggers support stepping backward through execution:

- **rr (Linux):** Record execution and replay backward.
- **UndoDB:** Commercial reverse debugger for C/C++.
- **IntelliJ:** "Drop Frame" to re-enter the current method.

```bash
# Record execution with rr
rr record ./my_program

# Replay and debug
rr replay
# Now you can use "reverse-continue", "reverse-step", etc.
```

### Post-Mortem Debugging

Debug a crashed process from its core dump:

```bash
# Generate core dump on crash (Linux)
ulimit -c unlimited
./my_program  # Crashes and generates core file

# Analyze with GDB
gdb ./my_program core
(gdb) bt          # Backtrace: see the call stack at crash
(gdb) frame 3     # Jump to frame 3
(gdb) info locals  # See local variables
```

### Memory Debugging

```bash
# Valgrind (C/C++): detect memory leaks and access errors
valgrind --leak-check=full ./my_program

# AddressSanitizer (compile-time, C/C++/Rust)
gcc -fsanitize=address -g my_program.c -o my_program
./my_program  # Reports memory errors with source location
```

## Debugger Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|-------------|---------|-----------------|
| Stepping through every line | Slow, loses context | Set breakpoints at key points |
| No hypothesis before debugging | Undirected exploration | Form theory, set targeted breakpoints |
| Debugging in production | Blocks requests, security risk | Use logging, tracing, or staging |
| printf debugging instead of breakpoints | Requires code changes and redeployment | Use logpoints or conditional breakpoints |
| Ignoring the call stack | Missing context of how you got here | Always check the call stack first |
| Not using watch expressions | Manually checking variables each step | Set watches for key values |
