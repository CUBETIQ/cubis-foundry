# Move Semantics and Value Types

## Move Constructor and Assignment

```cpp
class Buffer {
    std::unique_ptr<uint8_t[]> data_;
    size_t size_;

public:
    // Move constructor — steal resources
    Buffer(Buffer&& other) noexcept
        : data_(std::move(other.data_))
        , size_(std::exchange(other.size_, 0)) {}

    // Move assignment — release current, steal from other
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            data_ = std::move(other.data_);
            size_ = std::exchange(other.size_, 0);
        }
        return *this;
    }

    // Rule of Five: if you define move ops, define or delete all five
    Buffer(const Buffer&) = delete;            // expensive copy not needed
    Buffer& operator=(const Buffer&) = delete;
    ~Buffer() = default;
};
```

## When to `std::move`

```cpp
// MOVE when transferring ownership
void process(std::vector<int> data) { /* owns data */ }
std::vector<int> v = {1, 2, 3};
process(std::move(v)); // v is now in moved-from state

// DO NOT move from const objects — silently copies instead
const std::string s = "hello";
std::string t = std::move(s); // copies! const prevents move

// DO NOT move return values — defeats copy elision (NRVO)
std::string make_string() {
    std::string result = "hello";
    return result;         // GOOD: NRVO applies
    // return std::move(result); // BAD: prevents NRVO
}

// DO NOT use after move — object is in valid but unspecified state
std::vector<int> v = {1, 2, 3};
auto w = std::move(v);
// v.size() — legal but unspecified
// v.push_back(4) — legal, v is usable again
```

## Perfect Forwarding

```cpp
// Forward arguments preserving value category (lvalue/rvalue)
template<typename... Args>
auto make_unique_wrapper(Args&&... args) {
    return std::make_unique<Widget>(std::forward<Args>(args)...);
}

// Forwarding reference (T&& with template deduction) vs rvalue reference
template<typename T>
void forward_ref(T&& arg) {         // forwarding reference: T is deduced
    inner(std::forward<T>(arg));
}

void rvalue_ref(Widget&& arg) {      // rvalue reference: type is fixed
    inner(std::move(arg));           // use move, not forward
}
```

## Value Categories

| Category    | Can take address? | Can move from?        | Examples                                          |
| ----------- | ----------------- | --------------------- | ------------------------------------------------- |
| **lvalue**  | Yes               | Only with `std::move` | `x`, `*p`, `a[i]`, function returning `T&`        |
| **prvalue** | No                | Yes (implicit)        | `42`, `std::string("hi")`, function returning `T` |
| **xvalue**  | Yes\*             | Yes                   | `std::move(x)`, function returning `T&&`          |

## Copy Elision (Guaranteed since C++17)

```cpp
// Guaranteed copy elision — no copy/move constructor call
Widget make_widget() {
    return Widget(42); // prvalue: directly constructed in caller's storage
}

Widget w = make_widget(); // no copy, no move — guaranteed

// NRVO (Named Return Value Optimization) — not guaranteed but common
Widget make_named() {
    Widget w(42);
    w.configure();
    return w; // NRVO: likely elided, but not guaranteed
}
```

## `std::exchange` for Clean Moves

```cpp
// std::exchange replaces value and returns old value — ideal for moves
class Socket {
    int fd_;
public:
    Socket(Socket&& other) noexcept
        : fd_(std::exchange(other.fd_, -1)) {} // steal fd, leave -1

    ~Socket() {
        if (fd_ != -1) ::close(fd_);
    }
};
```

## Reference Wrappers

```cpp
// std::reference_wrapper for storing references in containers
std::vector<std::reference_wrapper<Widget>> widgets;
Widget w1, w2;
widgets.push_back(std::ref(w1));
widgets.push_back(std::ref(w2));

// Useful with algorithms that copy elements
std::sort(widgets.begin(), widgets.end(),
    [](const Widget& a, const Widget& b) { return a.id() < b.id(); });
```

## Moved-From State Obligations

A moved-from object must be in a valid state that supports:

1. Destruction (destructor runs)
2. Assignment (can be reused)

No other guarantees are required. Standard library types guarantee "valid but unspecified" state.

```cpp
// GOOD — reuse after move
std::string s = "hello";
std::string t = std::move(s);
s = "world"; // valid: assign new value
s.clear();   // valid: explicit reset
```
