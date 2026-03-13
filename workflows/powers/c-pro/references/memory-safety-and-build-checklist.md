# Memory Safety and Build Checklist

## Ownership rules

- Every heap allocation has exactly one owner. Document who allocates and who frees.
- Functions that return allocated memory must document whether the caller owns the result.
- Functions that receive pointers must document whether they borrow or take ownership.
- Use naming conventions to signal ownership: `create_*` allocates (caller frees), `get_*` borrows (caller must not free).

## Buffer safety

- Always pass buffer size alongside buffer pointer. Never rely on null terminators for binary data.
- Check return values of `snprintf`, `read`, `recv` — they may write fewer bytes than requested.
- Use `sizeof(array)` only on stack-allocated arrays, never on decayed pointers.
- Prefer bounded variants: `strnlen` over `strlen`, `snprintf` over `sprintf`, `strncpy` with explicit termination.

## Initialization

- Initialize all stack variables at declaration. Uninitialized reads are undefined behavior.
- Zero-initialize structs with `= {0}` or `memset` before populating fields.
- Use compound literals `(struct Foo){.field = val}` for partial initialization — remaining fields are zero.

## Arena allocator pattern

```c
// Simple arena: bump allocator with single free at scope end
typedef struct { char *base; size_t offset; size_t capacity; } Arena;
void *arena_alloc(Arena *a, size_t size);  // bump offset, return pointer
void arena_reset(Arena *a);                // reset offset to 0
```

- Allocate arena at scope entry, reset or free at scope exit. No per-object free needed.
- Useful for request-scoped or frame-scoped allocations (servers, games, parsers).

## Sanitizer configuration

| Sanitizer                  | Flag                             | Catches                                                       |
| -------------------------- | -------------------------------- | ------------------------------------------------------------- |
| AddressSanitizer           | `-fsanitize=address`             | Use-after-free, buffer overflow, stack overflow, memory leaks |
| UndefinedBehaviorSanitizer | `-fsanitize=undefined`           | Signed overflow, null deref, alignment, shift out of range    |
| ThreadSanitizer            | `-fsanitize=thread`              | Data races, lock order violations                             |
| MemorySanitizer            | `-fsanitize=memory` (Clang only) | Reads of uninitialized memory                                 |

- Run ASAN + UBSAN together in CI debug builds. TSAN requires a separate build (incompatible with ASAN).
- Set `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1` for strict leak detection.

## Build system hygiene

- Pin compiler version in CI (e.g., `gcc-13`, `clang-17`). Document minimum required version.
- Use `-Wall -Wextra -Werror -Wpedantic -Wconversion -Wshadow` for maximum diagnostic coverage.
- Run builds on at least GCC + Clang. They catch different issues.
- Use `compile_commands.json` (CMake: `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`) for IDE and static analyzer integration.
- Enable LTO (`-flto`) for release builds. Verify with tests — LTO can expose bugs that per-TU compilation hides.

## ABI boundary review

- Export only the minimum necessary symbols. Use `__attribute__((visibility("default")))` or export maps.
- Keep struct layouts stable across versions. Add fields at the end, never reorder.
- Use opaque pointers (`typedef struct Foo Foo;`) for types whose layout callers should not depend on.
- Version-check shared libraries at load time when ABI stability is critical.
