# Debugging with Sanitizers

## AddressSanitizer (ASan)

Detects: buffer overflow, use-after-free, use-after-return, double-free, memory leaks.

```bash
# Compile with ASan
gcc -fsanitize=address -fno-omit-frame-pointer -g -O1 -o myapp myapp.c
clang -fsanitize=address -fno-omit-frame-pointer -g -O1 -o myapp myapp.c

# Run — crashes with detailed report on first error
./myapp
# Output shows: error type, stack trace, shadow memory state
```

```c
// ASan catches this at runtime
void trigger_heap_overflow(void) {
    int *arr = malloc(10 * sizeof(int));
    arr[10] = 42; // heap-buffer-overflow detected
    free(arr);
}

// ASan catches use-after-free
void trigger_uaf(void) {
    int *p = malloc(sizeof(int));
    free(p);
    *p = 42; // heap-use-after-free detected
}
```

### ASan Options

```bash
# Environment variable to control ASan behavior
export ASAN_OPTIONS="detect_leaks=1:halt_on_error=0:print_stats=1"

# detect_leaks=1    — also report memory leaks at exit
# halt_on_error=0   — continue after first error (find multiple issues)
# print_stats=1     — show memory allocation statistics
# suppressions=file — suppress known false positives
```

## UndefinedBehaviorSanitizer (UBSan)

Detects: signed integer overflow, null pointer dereference, misaligned access, shift overflow, division by zero.

```bash
# Compile with UBSan
gcc -fsanitize=undefined -fno-omit-frame-pointer -g -o myapp myapp.c

# Common sub-sanitizers (can be selected individually)
gcc -fsanitize=signed-integer-overflow,null,alignment,shift -g -o myapp myapp.c
```

```c
// UBSan detects signed overflow
int overflow(void) {
    int x = INT_MAX;
    return x + 1; // runtime error: signed integer overflow
}

// UBSan detects misaligned access
void misaligned(void) {
    char buf[8] = {0};
    int *p = (int *)(buf + 1); // misaligned pointer
    *p = 42; // runtime error: misaligned access
}
```

## ThreadSanitizer (TSan)

Detects: data races, lock-order violations, deadlocks.

```bash
# Compile with TSan (cannot combine with ASan)
gcc -fsanitize=thread -fno-omit-frame-pointer -g -o myapp myapp.c -lpthread
```

```c
// TSan detects this data race
static int counter = 0;

void *increment(void *arg) {
    (void)arg;
    for (int i = 0; i < 1000; i++) {
        counter++; // data race: unsynchronized access
    }
    return NULL;
}

// Fix: use mutex or atomic
#include <stdatomic.h>
static atomic_int counter = 0;

void *increment_safe(void *arg) {
    (void)arg;
    for (int i = 0; i < 1000; i++) {
        atomic_fetch_add(&counter, 1); // no race
    }
    return NULL;
}
```

## MemorySanitizer (MSan) — Clang Only

Detects: reads of uninitialized memory.

```bash
# Clang-only (not available in GCC)
clang -fsanitize=memory -fno-omit-frame-pointer -g -O1 -o myapp myapp.c

# All linked libraries must also be compiled with MSan
# Use with libc++ compiled with MSan for best results
```

## GDB / LLDB Debugging Workflow

```bash
# Compile for debugging
gcc -g -O0 -o myapp myapp.c

# GDB basics
gdb ./myapp
(gdb) break main            # set breakpoint
(gdb) run                   # start execution
(gdb) next                  # step over
(gdb) step                  # step into
(gdb) print variable        # inspect variable
(gdb) backtrace             # show call stack
(gdb) watch *ptr            # break when memory changes
(gdb) info threads          # list threads
(gdb) thread 2              # switch to thread 2

# LLDB equivalents
lldb ./myapp
(lldb) breakpoint set -n main
(lldb) run
(lldb) thread step-over
(lldb) thread step-in
(lldb) frame variable
(lldb) thread backtrace
(lldb) watchpoint set variable counter
```

## Core Dump Analysis

```bash
# Enable core dumps
ulimit -c unlimited

# Set core dump pattern (Linux)
echo "/tmp/core.%e.%p" | sudo tee /proc/sys/kernel/core_pattern

# Analyze core dump
gdb ./myapp /tmp/core.myapp.12345
(gdb) backtrace          # see where it crashed
(gdb) frame 3            # examine specific frame
(gdb) info locals        # see local variables
```

## Valgrind (Alternative to ASan)

```bash
# Memory error detection
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all ./myapp

# Cache profiling
valgrind --tool=cachegrind ./myapp
cg_annotate cachegrind.out.<pid>

# Call graph profiling
valgrind --tool=callgrind ./myapp
kcachegrind callgrind.out.<pid>
```

## Sanitizer Compatibility Matrix

| Sanitizer        | GCC | Clang | Combinable with         |
| ---------------- | --- | ----- | ----------------------- |
| AddressSanitizer | Yes | Yes   | UBSan                   |
| UBSan            | Yes | Yes   | ASan, MSan, TSan        |
| ThreadSanitizer  | Yes | Yes   | UBSan                   |
| MemorySanitizer  | No  | Yes   | UBSan                   |
| LeakSanitizer    | Yes | Yes   | ASan (often integrated) |

Cannot combine: ASan + TSan, ASan + MSan, TSan + MSan.

## CI Integration

```bash
# Run multiple sanitizer builds in CI
# Build 1: ASan + UBSan
cmake -B build-asan -DCMAKE_C_FLAGS="-fsanitize=address,undefined -g -O1"
cmake --build build-asan && ctest --test-dir build-asan

# Build 2: TSan (separate because incompatible with ASan)
cmake -B build-tsan -DCMAKE_C_FLAGS="-fsanitize=thread -g -O1"
cmake --build build-tsan && ctest --test-dir build-tsan

# Build 3: Regular optimized build (for performance tests)
cmake -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release && ctest --test-dir build-release
```
