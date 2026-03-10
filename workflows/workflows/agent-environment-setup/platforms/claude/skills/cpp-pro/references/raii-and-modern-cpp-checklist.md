# RAII and Modern C++ Checklist

## RAII ownership patterns

### Smart pointer selection

| Pattern             | Type                 | When to use                                                                   |
| ------------------- | -------------------- | ----------------------------------------------------------------------------- |
| Exclusive ownership | `std::unique_ptr<T>` | Default choice. One owner, zero overhead, move-only.                          |
| Shared ownership    | `std::shared_ptr<T>` | Multiple owners with shared lifetime. Use sparingly — adds refcount overhead. |
| Non-owning observer | `T*` or `T&`         | Borrowing without ownership. Never delete through a raw pointer.              |
| Weak observer       | `std::weak_ptr<T>`   | Observing shared-owned object without preventing destruction.                 |

- Prefer `std::make_unique` and `std::make_shared` over raw `new`. They are exception-safe and more efficient.
- Use custom deleters for non-memory resources: `unique_ptr<FILE, decltype(&fclose)> f(fopen(...), fclose);`

### Rule of five / zero

- **Rule of zero**: If a class only contains RAII members (smart pointers, containers), don't write any special member functions.
- **Rule of five**: If you must write a destructor, also write or delete: copy constructor, copy assignment, move constructor, move assignment.
- Use `= default` and `= delete` explicitly. Never leave special members implicitly generated when the class manages resources.

## Value semantics

- Prefer passing by value for small types (<= 2 words) and types you need to move from.
- Pass large types by `const&` for reading, by `&&` for consuming.
- Use `std::string_view` and `std::span<T>` for non-owning views of contiguous data.
- Return by value — compilers apply NRVO/RVO. Avoid `std::move` on return statements in most cases.

## Move correctness

- After `std::move`, the source object is in a valid-but-unspecified state. Only assign to it or destroy it.
- Mark move constructors and move assignment operators `noexcept` — this enables `std::vector` to use moves on reallocation.
- Test that moved-from objects don't leak resources or crash when destroyed.

## Concepts and constraints (C++20/23)

```cpp
template<typename T>
concept Hashable = requires(T a) {
    { std::hash<T>{}(a) } -> std::convertible_to<std::size_t>;
};

template<Hashable Key, typename Value>
class HashMap { /* ... */ };
```

- Use concepts to replace SFINAE. They produce clear error messages and are readable.
- Define concepts in terms of required expressions, not just type traits.
- Combine concepts with `requires` clauses for complex constraints.

## std::variant and pattern matching

```cpp
using Shape = std::variant<Circle, Rectangle, Triangle>;

double area(const Shape& s) {
    return std::visit(overloaded{
        [](const Circle& c)    { return std::numbers::pi * c.r * c.r; },
        [](const Rectangle& r) { return r.w * r.h; },
        [](const Triangle& t)  { return 0.5 * t.base * t.height; }
    }, s);
}
```

- Use `std::variant` over inheritance for closed type sets. Adding a new alternative causes compile errors at all visit sites.
- Use the `overloaded` pattern (aggregate of lambdas) for exhaustive visiting.

## std::expected (C++23)

```cpp
std::expected<User, Error> find_user(int id) {
    if (auto it = db.find(id); it != db.end())
        return *it;
    return std::unexpected(Error::NotFound);
}
```

- Use `std::expected<T, E>` for recoverable errors in performance-sensitive paths instead of exceptions.
- Chain operations with `.and_then()`, `.transform()`, `.or_else()` for monadic error handling.

## Concurrency checklist

- Use `std::jthread` + `std::stop_token` for threads that need cancellation.
- Use `std::scoped_lock` for multi-mutex locking — prevents deadlocks from inconsistent lock order.
- Use `std::atomic` with `memory_order_relaxed` only when you can prove no ordering dependency exists.
- Run ThreadSanitizer (`-fsanitize=thread`) on all concurrent tests in CI.
