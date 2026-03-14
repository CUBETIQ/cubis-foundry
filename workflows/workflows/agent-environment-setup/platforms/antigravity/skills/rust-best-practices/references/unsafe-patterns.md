# Rust Unsafe Patterns

## Unsafe Discipline

`unsafe` in Rust does not mean "dangerous" — it means "the programmer is asserting an invariant the compiler cannot verify." Every `unsafe` block must have a `// SAFETY:` comment.

## What Unsafe Allows

Inside an `unsafe` block, you can:

1. Dereference a raw pointer (`*const T`, `*mut T`)
2. Call an `unsafe fn`
3. Access or modify a mutable static variable
4. Implement an `unsafe trait`
5. Access fields of a `union`

**Everything else** (including memory allocation, integer overflow, deadlocks) is not prevented by safe Rust either — `unsafe` is specifically about the five operations above.

## SAFETY Comment Convention

```rust
// SAFETY: `ptr` was obtained from `Box::into_raw` in the constructor,
// and no other code has taken ownership of it since. The pointer is
// guaranteed to be non-null, properly aligned, and pointing to a valid
// `Widget` that has not been dropped.
let widget = unsafe { &*self.ptr };
```

### What a SAFETY Comment Must Explain

1. **Which invariant** you are upholding (e.g., "pointer is non-null and aligned").
2. **Why it holds** at this specific call site (e.g., "because we just allocated it").
3. **What could go wrong** if the invariant were violated (optional but helpful).

## Common Safe Abstractions Over Unsafe

### 1. Wrapper Around Raw Pointer

```rust
pub struct UniquePtr<T> {
    ptr: *mut T,
}

impl<T> UniquePtr<T> {
    /// Create a new UniquePtr from a boxed value.
    pub fn new(value: T) -> Self {
        Self {
            ptr: Box::into_raw(Box::new(value)),
        }
    }

    /// Get an immutable reference to the inner value.
    pub fn get(&self) -> &T {
        // SAFETY: ptr was created from Box::into_raw in new(), and we have
        // exclusive ownership (UniquePtr is !Send, !Sync by default due to
        // raw pointer). The pointer is non-null, aligned, and points to a
        // valid T that has not been dropped because Drop has not run yet.
        unsafe { &*self.ptr }
    }

    /// Get a mutable reference to the inner value.
    pub fn get_mut(&mut self) -> &mut T {
        // SAFETY: same as get(), plus we have &mut self so no other
        // references to the inner value can exist.
        unsafe { &mut *self.ptr }
    }
}

impl<T> Drop for UniquePtr<T> {
    fn drop(&mut self) {
        // SAFETY: ptr was created from Box::into_raw and has not been
        // freed (this is the only Drop impl). Reconstructing the Box
        // transfers ownership back, and Box::drop frees the memory.
        unsafe {
            drop(Box::from_raw(self.ptr));
        }
    }
}
```

### 2. Unsafe Trait Implementation

```rust
/// # Safety
///
/// Implementors must ensure that `as_bytes()` returns a byte slice
/// that is a valid representation of the type, suitable for passing
/// to I/O functions. The slice must not contain uninitialized bytes.
pub unsafe trait AsBytes {
    fn as_bytes(&self) -> &[u8];
}

// SAFETY: u32 has a well-defined byte representation on all platforms.
// All bit patterns of u32 are valid, so the bytes are always initialized.
unsafe impl AsBytes for u32 {
    fn as_bytes(&self) -> &[u8] {
        let ptr = self as *const u32 as *const u8;
        // SAFETY: u32 is 4 bytes, properly aligned, and all bytes are
        // initialized. The lifetime of the returned slice is tied to &self.
        unsafe { std::slice::from_raw_parts(ptr, std::mem::size_of::<u32>()) }
    }
}
```

### 3. FFI (Foreign Function Interface)

```rust
// Declare the external C function
extern "C" {
    fn compress(
        dest: *mut u8,
        dest_len: *mut usize,
        source: *const u8,
        source_len: usize,
    ) -> i32;
}

/// Safe wrapper around the C compress function.
pub fn safe_compress(input: &[u8]) -> Result<Vec<u8>, CompressError> {
    let max_output = input.len() + 128; // compression header overhead
    let mut output = vec![0u8; max_output];
    let mut output_len = max_output;

    // SAFETY:
    // - output.as_mut_ptr() is valid for writes of up to `output_len` bytes
    // - input.as_ptr() is valid for reads of `input.len()` bytes
    // - output_len is initialized to the capacity of the output buffer
    // - The C function does not store the pointers beyond this call
    let result = unsafe {
        compress(
            output.as_mut_ptr(),
            &mut output_len,
            input.as_ptr(),
            input.len(),
        )
    };

    if result != 0 {
        return Err(CompressError::Failed(result));
    }

    output.truncate(output_len);
    Ok(output)
}
```

## unsafe_op_in_unsafe_fn (Edition 2024)

In Rust 2024, `unsafe fn` bodies are no longer implicitly unsafe. You must add `unsafe {}` blocks inside unsafe functions:

```rust
// Rust 2021 — entire body is implicitly unsafe
unsafe fn old_style(ptr: *const u8) -> u8 {
    *ptr // No unsafe block needed
}

// Rust 2024 — must be explicit
unsafe fn new_style(ptr: *const u8) -> u8 {
    // SAFETY: caller guarantees ptr is non-null and points to valid u8
    unsafe { *ptr }
}
```

This makes safety reasoning more granular — each `unsafe` block in an `unsafe fn` gets its own SAFETY comment.

### Enabling Early

```rust
// Enable before edition 2024
#![deny(unsafe_op_in_unsafe_fn)]
```

## Raw Pointer Patterns

### Pointer Arithmetic

```rust
fn sum_array(ptr: *const i32, len: usize) -> i32 {
    let mut sum = 0;
    for i in 0..len {
        // SAFETY: ptr points to an array of at least `len` i32 values.
        // `ptr.add(i)` is within bounds. The values are initialized.
        sum += unsafe { *ptr.add(i) };
    }
    sum
}
```

### NonNull for Non-Nullable Pointers

```rust
use std::ptr::NonNull;

struct Node<T> {
    value: T,
    next: Option<NonNull<Node<T>>>,
}

// NonNull<T> is:
// - Covariant in T (unlike *mut T which is invariant)
// - Guaranteed non-null (enables niche optimization for Option)
// - Still requires unsafe to dereference
```

## Miri Verification

Run `unsafe` code under Miri to detect undefined behavior:

```bash
cargo +nightly miri test
```

### What Miri Catches

```rust
#[test]
fn miri_catches_use_after_free() {
    let ptr = {
        let v = vec![1, 2, 3];
        v.as_ptr()
    }; // v is dropped, ptr is dangling

    // Miri will flag this as undefined behavior:
    // unsafe { println!("{}", *ptr); }
}

#[test]
fn miri_catches_aliasing_violation() {
    let mut x = 42;
    let r1 = &x as *const i32;
    let r2 = &mut x as *mut i32;
    // Miri will flag simultaneous &T and &mut T as UB under
    // Stacked Borrows model
}
```

## When to Avoid Unsafe

1. **Performance optimization without profiling** — safe Rust is fast. Profile first.
2. **Bypassing the borrow checker** — redesign the ownership model instead.
3. **Convenience** — if safe alternatives exist (even if more verbose), use them.
4. **Transmute for type punning** — use `bytemuck` or `zerocopy` crates instead.

## When Unsafe is Justified

1. **FFI**: calling C libraries (no alternative).
2. **Implementing data structures**: intrusive linked lists, custom allocators.
3. **Performance-critical inner loops**: after profiling proves the safe version is too slow.
4. **Hardware access**: memory-mapped I/O, SIMD intrinsics.
5. **Implementing safe abstractions**: `Vec`, `Rc`, `Arc` internally use unsafe.

## Audit Checklist

Before merging `unsafe` code:

- [ ] Every `unsafe` block has a `// SAFETY:` comment
- [ ] The safety invariant is specific and verifiable
- [ ] Tests cover the boundary conditions
- [ ] Miri passes on the test suite
- [ ] The unsafe code is wrapped in a safe public API
- [ ] `#[deny(unsafe_op_in_unsafe_fn)]` is enabled
- [ ] No way to cause UB through the safe API surface
