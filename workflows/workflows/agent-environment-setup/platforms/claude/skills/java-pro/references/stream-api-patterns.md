# Stream API Patterns

## Stream Pipeline Design

Streams are lazy, single-use data pipelines. Design them as declaration of intent, not imperative loops.

```java
// Transform and collect
List<String> activeEmails = users.stream()
    .filter(User::isActive)
    .map(User::email)
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .toList(); // unmodifiable list (Java 16+)

// Early termination — streams short-circuit
Optional<User> admin = users.stream()
    .filter(u -> u.role() == Role.ADMIN)
    .findFirst(); // stops iteration at first match
```

## Collector Patterns

```java
// Group by key
Map<Department, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::department));

// Group and transform values
Map<Department, List<String>> namesByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.mapping(Employee::name, Collectors.toList())
    ));

// Partition (boolean grouping)
Map<Boolean, List<Order>> partitioned = orders.stream()
    .collect(Collectors.partitioningBy(o -> o.total() > 100));

// Statistics
DoubleSummaryStatistics stats = orders.stream()
    .collect(Collectors.summarizingDouble(Order::total));
// stats.getAverage(), stats.getMax(), stats.getCount()

// String joining
String csv = users.stream()
    .map(User::name)
    .collect(Collectors.joining(", ", "[", "]")); // [Alice, Bob, Charlie]

// Collecting to Map with merge function
Map<String, Integer> wordCounts = words.stream()
    .collect(Collectors.toMap(
        w -> w,
        w -> 1,
        Integer::sum // merge function for duplicate keys
    ));
```

## `Optional` Integration

```java
// flatMap to chain optional-returning operations
Optional<String> city = getUserById(id)
    .flatMap(User::address)
    .map(Address::city);

// orElseGet for lazy default
String name = findUser(id)
    .map(User::name)
    .orElseGet(() -> fetchDefaultName()); // lambda called only if empty

// Stream from Optional (Java 9+)
List<User> admins = userIds.stream()
    .map(this::findUser)            // Stream<Optional<User>>
    .flatMap(Optional::stream)       // Stream<User> — drops empties
    .filter(u -> u.role() == Role.ADMIN)
    .toList();
```

## Parallel Streams — When and When Not

```java
// USE parallel when:
// - Large dataset (10,000+ elements)
// - CPU-bound operations per element
// - No shared mutable state
// - Order doesn't matter (or use forEachOrdered)
long count = largeDataset.parallelStream()
    .filter(this::expensiveComputation) // CPU-bound
    .count();

// DO NOT USE parallel when:
// - Small datasets (overhead exceeds benefit)
// - I/O-bound operations (use virtual threads instead)
// - Operations have side effects or shared mutable state
// - Order is important and unordered() is not acceptable
// - Inside a web request handler (contends with other requests)

// Parallel with custom pool (isolate from ForkJoinPool.commonPool)
ForkJoinPool customPool = new ForkJoinPool(4);
List<Result> results = customPool.submit(() ->
    items.parallelStream()
        .map(this::process)
        .toList()
).get();
```

## Stream Gotchas

```java
// Streams are single-use — cannot reuse
Stream<String> stream = list.stream().filter(s -> s.length() > 3);
stream.count();   // OK
stream.toList();  // IllegalStateException: stream has already been operated upon

// Side effects in map/filter are bugs
// BAD — mutation inside map
List<String> results = new ArrayList<>();
items.stream().map(i -> {
    results.add(i.name()); // side effect!
    return i.transform();
}).toList();

// GOOD — collect, don't mutate
List<String> names = items.stream().map(Item::name).toList();
List<Transformed> transformed = items.stream().map(Item::transform).toList();

// flatMap for one-to-many
List<String> allTags = articles.stream()
    .flatMap(a -> a.tags().stream()) // flatten List<List<String>> → List<String>
    .distinct()
    .toList();
```

## Custom Collectors

```java
// Collector that builds a comma-separated string with limit
Collector<String, ?, String> limitedJoin(int limit) {
    return Collector.of(
        () -> new StringJoiner(", "),
        (joiner, item) -> {
            if (joiner.length() < limit) joiner.add(item);
        },
        StringJoiner::merge,
        StringJoiner::toString
    );
}

// Teeing collector — two collectors in one pass (Java 12+)
record Stats(long count, double average) {}

Stats stats = numbers.stream().collect(
    Collectors.teeing(
        Collectors.counting(),
        Collectors.averagingDouble(Double::doubleValue),
        Stats::new
    )
);
```

## Functional Patterns

```java
// Method references over lambdas when possible
names.stream().map(String::toUpperCase)      // clearer than s -> s.toUpperCase()
users.stream().filter(User::isActive)        // clearer than u -> u.isActive()
items.stream().sorted(Comparator.comparing(Item::price))

// Predicate composition
Predicate<User> isActive = User::isActive;
Predicate<User> isAdmin = u -> u.role() == Role.ADMIN;
Predicate<User> activeAdmin = isActive.and(isAdmin);

users.stream().filter(activeAdmin).toList();

// Function composition
Function<String, String> normalize = String::toLowerCase;
Function<String, String> trim = String::strip;
Function<String, String> clean = normalize.andThen(trim);
```
