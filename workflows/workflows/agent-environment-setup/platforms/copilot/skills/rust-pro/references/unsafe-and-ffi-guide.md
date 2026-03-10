# Unsafe and FFI Guide

## When Unsafe Is Justified

Unsafe Rust is a power tool for situations where the type system cannot prove safety. Every `unsafe` block must:

1. **Document the invariant** it relies on in a comment above the block.
2. **Be as small as possible** — put only the unsafe operation inside the block, not surrounding logic.
3. **Have a safe wrapper** — expose a safe public API that upholds the invariant.

```rust
/// Returns a slice of the buffer without bounds checking.
///
/// # Safety
/// `start` and `end` must be within bounds of `buf`, and `start <= end`.
unsafe fn slice_unchecked(buf: &[u8], start: usize, end: usize) -> &[u8] {
    // SAFETY: caller guarantees start <= end and both are in bounds
    buf.get_unchecked(start..end)
}

// Safe wrapper that validates before calling unsafe
fn slice_checked(buf: &[u8], start: usize, end: usize) -> Option<&[u8]> {
    if start <= end && end <= buf.len() {
        // SAFETY: we just verified the bounds
        Some(unsafe { buf.get_unchecked(start..end) })
    } else {
        None
    }
}
```

## Common Unsafe Operations

| Operation               | Why unsafe                                  | Invariant to document                                                     |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `*ptr` dereference      | Pointer may be null, dangling, or unaligned | Pointer is valid, aligned, and points to initialized memory               |
| `slice::from_raw_parts` | Length may exceed allocation                | Pointer + length must describe valid, initialized memory                  |
| `transmute`             | Reinterprets bits arbitrarily               | Source and target types have same size, alignment, and valid bit patterns |
| `unsafe impl Send/Sync` | Compiler can't verify thread safety         | Type's internal synchronization guarantees cross-thread safety            |
| Union field access      | Accessing wrong variant is UB               | Active variant is the one being accessed                                  |

## FFI Basics with `extern "C"`

```rust
// Declare foreign functions
extern "C" {
    fn strlen(s: *const std::ffi::c_char) -> usize;
    fn printf(fmt: *const std::ffi::c_char, ...) -> i32;
}

// Safe wrapper
fn safe_strlen(s: &std::ffi::CStr) -> usize {
    // SAFETY: CStr guarantees null-terminated, valid pointer
    unsafe { strlen(s.as_ptr()) }
}

// Expose Rust function to C
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}
```

## String Conversion at FFI Boundaries

```rust
use std::ffi::{CStr, CString, c_char};

// Rust → C: create CString, pass pointer
fn call_c_api(name: &str) -> Result<(), std::ffi::NulError> {
    let c_name = CString::new(name)?; // fails if name contains \0
    // SAFETY: c_name is valid for the duration of this call
    unsafe { c_api_set_name(c_name.as_ptr()) };
    Ok(())
    // c_name is dropped here — do NOT return the pointer
}

// C → Rust: receive pointer, convert to &str
/// # Safety
/// `ptr` must be a valid, null-terminated C string.
unsafe fn receive_c_string(ptr: *const c_char) -> String {
    // SAFETY: caller guarantees ptr is valid null-terminated string
    let c_str = unsafe { CStr::from_ptr(ptr) };
    c_str.to_string_lossy().into_owned()
}
```

## Raw Pointer Rules

```rust
// Creating raw pointers is safe — dereferencing is unsafe
let x = 42;
let ptr: *const i32 = &x;           // safe
let value = unsafe { *ptr };        // unsafe — must verify ptr is valid

// Mutable raw pointers
let mut y = 42;
let ptr: *mut i32 = &mut y;
unsafe { *ptr = 100 };              // SAFETY: ptr derived from valid &mut

// NEVER do this — creates aliased mutable pointers
let mut v = vec![1, 2, 3];
let p1 = v.as_mut_ptr();
let p2 = v.as_mut_ptr(); // both point to same memory — UB to write through both
```

## `Pin` for Self-Referential Types

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    data: String,
    ptr: *const String,  // points to self.data
    _pin: PhantomPinned,
}

impl SelfReferential {
    fn new(data: String) -> Pin<Box<Self>> {
        let mut boxed = Box::new(SelfReferential {
            data,
            ptr: std::ptr::null(),
            _pin: PhantomPinned,
        });
        let ptr = &boxed.data as *const String;
        // SAFETY: we own the box and haven't shared the Pin yet
        unsafe { boxed.as_mut().get_unchecked_mut().ptr = ptr };
        // After this, the value cannot be moved
        unsafe { Pin::new_unchecked(boxed) }
    }
}
```

## Unsafe Trait Implementations

```rust
// Only implement Send/Sync manually when you can prove safety
struct SharedBuffer {
    ptr: *mut u8,
    len: usize,
    lock: std::sync::Mutex<()>, // provides synchronization
}

// SAFETY: SharedBuffer synchronizes access through its internal Mutex.
// The raw pointer is only accessed while the Mutex is held.
unsafe impl Send for SharedBuffer {}
unsafe impl Sync for SharedBuffer {}
```

## Audit Checklist for Unsafe Code

Before merging any `unsafe` block:

1. **Is there a safe alternative?** Check if `std` or a well-audited crate provides the same operation safely.
2. **Is the `SAFETY` comment present?** Every `unsafe` block must have a `// SAFETY:` comment explaining why it's sound.
3. **Is the unsafe scope minimal?** Only the unsafe operation itself should be inside the block.
4. **Is there a safe public wrapper?** Unsafe internals should never be exposed to callers.
5. **Does Miri pass?** Run `cargo +nightly miri test` to detect undefined behavior.
6. **Are raw pointers valid?** Verify non-null, aligned, pointing to initialized memory, not aliased with mutable references.
7. **Are lifetimes correct?** The pointed-to data must outlive the pointer.

```bash
# Run Miri to detect UB in unsafe code
cargo +nightly miri test
cargo +nightly miri run
```
