# Common Undefined Behavior and Portability

## Undefined Behavior Catalog

These are the most common sources of UB in C code. Sanitizers catch many at runtime, but prevention through coding discipline is the primary defense.

### Signed Integer Overflow

```c
// UB — signed overflow is undefined in C
int x = INT_MAX;
x += 1; // UB: compiler may assume this never happens and optimize accordingly

// SAFE — check before arithmetic
if (x <= INT_MAX - 1) {
    x += 1;
}

// SAFE — use unsigned for wrapping arithmetic
unsigned int y = UINT_MAX;
y += 1; // defined: wraps to 0
```

### Null Pointer Dereference

```c
// UB — dereferencing NULL
int *p = NULL;
int val = *p; // UB

// SAFE — check before dereference
if (p != NULL) {
    int val = *p;
}

// Gotcha: compiler may remove NULL checks after dereference
int val = *p;        // if this executes, compiler assumes p != NULL
if (p == NULL) { ... } // compiler may optimize this away as "unreachable"
```

### Buffer Overflow and Out-of-Bounds Access

```c
// UB — reading/writing past allocation
int arr[10];
arr[10] = 42; // UB: index 10 is one past the end

// UB — string function overflow
char buf[8];
strcpy(buf, "this string is too long"); // UB: writes past buf

// SAFE — use bounded functions
char buf[8];
strncpy(buf, source, sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\0'; // ensure null termination

// Better: use snprintf for formatted strings
snprintf(buf, sizeof(buf), "%s", source);
```

### Use After Free and Double Free

```c
// UB — use after free
char *data = malloc(100);
free(data);
data[0] = 'x'; // UB: data is freed

// UB — double free
free(data);
free(data); // UB: second free on already-freed pointer

// SAFE — NULL after free
free(data);
data = NULL; // prevents use-after-free (dereference NULL → crash, not silent corruption)
```

### Strict Aliasing Violations

```c
// UB — accessing memory through incompatible pointer type
float f = 3.14f;
int *ip = (int *)&f;
int bits = *ip; // UB: strict aliasing violation

// SAFE — use memcpy for type punning
float f = 3.14f;
int bits;
memcpy(&bits, &f, sizeof(bits)); // defined behavior

// SAFE — union-based type punning (C99+, implementation-defined but widely supported)
union { float f; int i; } u;
u.f = 3.14f;
int bits = u.i;
```

### Uninitialized Variable Reads

```c
// UB — reading uninitialized automatic variable
int x;
printf("%d\n", x); // UB: x has indeterminate value

// SAFE — always initialize
int x = 0;
```

## Implementation-Defined Behavior Traps

These are defined by the compiler/platform but differ across implementations:

| Behavior                      | Varies by           | Recommendation                                                    |
| ----------------------------- | ------------------- | ----------------------------------------------------------------- |
| `sizeof(int)`                 | Platform            | Use fixed-width types (`int32_t`, `uint64_t`) for data structures |
| Bit-shift of negative values  | Compiler            | Avoid shifting signed integers; use unsigned                      |
| Struct padding and alignment  | Compiler + platform | Use `offsetof`, `_Alignof`; pack with attributes only when needed |
| Char signedness (`char`)      | Compiler            | Use `signed char` or `unsigned char` explicitly for arithmetic    |
| Evaluation order of arguments | Compiler            | Avoid side effects in function argument expressions               |

## Cross-Platform Portability

```c
// Use fixed-width integers for portable data structures
#include <stdint.h>

typedef struct {
    uint32_t id;
    int64_t timestamp;
    uint16_t flags;
} __attribute__((packed)) WireMessage; // packed for network protocol

// Endianness-safe serialization
#include <arpa/inet.h> // or use manual byte swapping

void serialize(const WireMessage *msg, uint8_t *buf) {
    uint32_t id_be = htonl(msg->id);
    memcpy(buf, &id_be, sizeof(id_be));
    // ... continue for other fields
}

// Feature detection with preprocessor
#if defined(__linux__)
    #include <sys/epoll.h>
#elif defined(__APPLE__)
    #include <sys/event.h>
#elif defined(_WIN32)
    #include <winsock2.h>
#endif
```

## Compiler Warning Flags for UB Detection

```bash
# GCC — maximum diagnostic coverage
gcc -Wall -Wextra -Wpedantic -Werror \
    -Wformat=2 -Wformat-overflow -Wformat-truncation \
    -Wconversion -Wsign-conversion \
    -Wshadow -Wdouble-promotion \
    -Wnull-dereference -Wuninitialized \
    -Wstrict-aliasing=2 \
    -fstack-protector-strong

# Clang — additional checks
clang -Weverything -Wno-padded -Wno-disabled-macro-expansion \
      -fsanitize=undefined,address
```
