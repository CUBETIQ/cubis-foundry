# Template and Concepts Patterns

## Concepts (C++20/23)

Concepts replace SFINAE with readable, composable constraints.

```cpp
#include <concepts>

// Basic concept usage
template<std::integral T>
T add(T a, T b) { return a + b; }

// Custom concept
template<typename T>
concept Serializable = requires(T t, std::ostream& os) {
    { t.serialize(os) } -> std::same_as<void>;
    { T::deserialize(os) } -> std::same_as<T>;
};

// Use in function template
template<Serializable T>
void save(const T& obj, const std::filesystem::path& path) {
    std::ofstream file(path);
    obj.serialize(file);
}

// Concept with multiple requirements
template<typename T>
concept Hashable = requires(T a) {
    { std::hash<T>{}(a) } -> std::convertible_to<std::size_t>;
    requires std::equality_comparable<T>;
};

// Constrained auto
void process(std::ranges::range auto&& r) {
    for (auto&& elem : r) {
        // works with any range
    }
}
```

## Concept Composition

```cpp
// Combine concepts with &&, ||
template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template<typename T>
concept OrderedNumeric = Numeric<T> && std::totally_ordered<T>;

// Subsumption — more constrained overload wins
template<std::integral T>
void process(T val) { /* integral-specific */ }

template<Numeric T>
void process(T val) { /* fallback for floating point */ }

// int → matches std::integral (more constrained), calls first overload
// double → matches Numeric, calls second overload
```

## Variadic Templates

```cpp
// Fold expressions (C++17) — clean variadic operations
template<typename... Args>
auto sum(Args... args) {
    return (args + ...); // right fold
}

// Print all arguments
template<typename... Args>
void print_all(Args&&... args) {
    ((std::cout << args << " "), ...); // comma fold
    std::cout << "\n";
}

// Constrained variadic
template<std::convertible_to<std::string_view>... Args>
std::string join(std::string_view sep, Args&&... args) {
    std::string result;
    ((result += std::string(args) + std::string(sep)), ...);
    if (!result.empty()) result.resize(result.size() - sep.size());
    return result;
}
```

## `constexpr` and `consteval`

```cpp
// constexpr — evaluable at compile time or runtime
constexpr int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

constexpr int ct = factorial(10);  // computed at compile time
int rt = factorial(runtime_val);    // computed at runtime

// consteval — MUST be evaluated at compile time
consteval int compile_time_only(int n) {
    return n * n;
}

constexpr int x = compile_time_only(5); // OK
// int y = compile_time_only(runtime_val); // ERROR: not a constant expression

// constexpr containers (C++20)
constexpr auto make_primes() {
    std::array<int, 5> primes{};
    // ... sieve algorithm
    return primes;
}
constexpr auto primes = make_primes(); // computed at compile time

// if constexpr — compile-time branching
template<typename T>
auto to_string(const T& val) {
    if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(val);
    } else if constexpr (std::is_same_v<T, std::string>) {
        return val;
    } else {
        static_assert(false, "unsupported type");
    }
}
```

## CTAD (Class Template Argument Deduction)

```cpp
// Deduction guides — compiler deduces template arguments
std::vector v = {1, 2, 3};        // deduces vector<int>
std::pair p = {"hello", 42};      // deduces pair<const char*, int>
std::optional o = 3.14;           // deduces optional<double>

// Custom deduction guide
template<typename T>
struct Wrapper {
    T value;
    Wrapper(T v) : value(std::move(v)) {}
};

// Deduction guide for string literals
Wrapper(const char*) -> Wrapper<std::string>;

auto w = Wrapper("hello"); // deduces Wrapper<std::string>, not Wrapper<const char*>
```

## Type Traits and `static_assert`

```cpp
#include <type_traits>

// Compile-time type validation
template<typename T>
class Container {
    static_assert(std::is_nothrow_move_constructible_v<T>,
        "Container requires nothrow movable types for exception safety");
    static_assert(!std::is_reference_v<T>,
        "Container cannot store references — use reference_wrapper");
    // ...
};

// Conditional types
template<typename T>
using storage_type = std::conditional_t<
    sizeof(T) <= sizeof(void*),
    T,                    // small: store by value
    std::unique_ptr<T>    // large: store by pointer
>;
```

## CRTP (Curiously Recurring Template Pattern)

Static polymorphism without virtual dispatch overhead.

```cpp
template<typename Derived>
class Comparable {
public:
    bool operator!=(const Derived& other) const {
        return !(static_cast<const Derived&>(*this) == other);
    }
    bool operator>(const Derived& other) const {
        return other < static_cast<const Derived&>(*this);
    }
    // Derived must implement operator== and operator<
};

class Temperature : public Comparable<Temperature> {
    double celsius_;
public:
    explicit Temperature(double c) : celsius_(c) {}

    bool operator==(const Temperature& other) const {
        return celsius_ == other.celsius_;
    }
    bool operator<(const Temperature& other) const {
        return celsius_ < other.celsius_;
    }
};
```
