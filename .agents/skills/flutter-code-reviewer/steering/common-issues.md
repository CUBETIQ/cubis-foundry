# Common Issues

> Reference for: Code Reviewer
> Load when: Identifying code problems

## N+1 Query Problem

```dart
// N+1 queries - BAD
final posts = await postRepository.findAll();
for (final post in posts) {
  post.author = await userRepository.findById(post.authorId); // N queries!
}

// Single query with join - GOOD
final posts = await postRepository.findAllWithAuthors();

// Or batch load
final posts = await postRepository.findAll();
final authorIds = posts.map((p) => p.authorId).toList();
final authors = await userRepository.findByIds(authorIds);
```

## Missing Error Handling

```dart
// Unhandled error - BAD
final data = await api.fetchData();

// Proper error handling - GOOD
try {
  final response = await api.fetchData();
  return Result.success(response);
} on DioException catch (e) {
  logger.error('Failed to fetch data', error: e);
  return Result.failure(NetworkFailure(e.message));
} catch (e, st) {
  logger.error('Unexpected error', error: e, stackTrace: st);
  return Result.failure(UnknownFailure(e.toString()));
}
```

## Magic Numbers/Strings

```dart
// Magic number - BAD
if (user.age >= 18) { ... }
Future.delayed(Duration(milliseconds: 86400000));

// Named constant - GOOD
const minimumAge = 18;
const oneDay = Duration(days: 1);

if (user.age >= minimumAge) { ... }
Future.delayed(oneDay);
```

## Deep Nesting

```dart
// Deep nesting - BAD
if (user != null) {
  if (user.isActive) {
    if (user.hasPermission) {
      doSomething();
    }
  }
}

// Early returns - GOOD
if (user == null || !user.isActive || !user.hasPermission) {
  return;
}
doSomething();
```

## God Functions

```dart
// Does too much - BAD
Future<void> processOrder(Order order) async {
  // validate
  // check inventory
  // process payment
  // send email
  // update database
  // log analytics
}

// Single responsibility - GOOD
Future<void> processOrder(Order order) async {
  await validateOrder(order);
  await reserveInventory(order);
  await chargePayment(order);
  await sendConfirmation(order);
}
```

## Mutable Shared State

```dart
// Shared mutable - BAD
final config = {'debug': false};
void enableDebug() {
  config['debug'] = true;
}

// Immutable pattern - GOOD (Freezed)
@freezed
class Config with _$Config {
  const factory Config({@Default(false) bool debug}) = _Config;
}
```

## Missing Null Checks

```dart
// Unsafe access - BAD
final name = user.profile.name;

// Safe access - GOOD
final name = user?.profile?.name ?? 'Unknown';
```

## Riverpod-Specific Issues

```dart
// ref.read in build - BAD
Widget build(BuildContext context, WidgetRef ref) {
  final data = ref.read(dataProvider); // WRONG!
}

// ref.watch in build - GOOD
Widget build(BuildContext context, WidgetRef ref) {
  final data = ref.watch(dataProvider);
}

// Calling methods in build - BAD (infinite loop)
Widget build(BuildContext context, WidgetRef ref) {
  ref.read(controllerProvider.notifier).loadMore(); // INFINITE LOOP!
}

// In-place mutation - BAD
state = state..items.add(newItem); // Same reference!

// Immutable update - GOOD
state = state.copyWith(items: [...state.items, newItem]);
```

## Design Principles Checklist

- **SRP** (Single Responsibility): one reason to change
- **OCP** (Open/Closed): extend behavior without modifying core
- **LSP** (Liskov): subtypes remain substitutable
- **ISP** (Interface Segregation): small, focused interfaces
- **DIP** (Dependency Inversion): depend on abstractions
- **KISS**: simplest solution that works
- **DRY**: avoid duplicated logic; extract shared code
- **YAGNI**: avoid speculative features

## Quick Reference

| Issue                  | Impact          | Fix                       |
| ---------------------- | --------------- | ------------------------- |
| N+1 queries            | Performance     | Eager load or batch       |
| Missing error handling | Reliability     | Try/catch + Result type   |
| Magic numbers          | Maintainability | Named constants           |
| Deep nesting           | Readability     | Early returns             |
| God functions          | Testability     | Single responsibility     |
| Mutable shared state   | Bugs            | Immutable patterns        |
| Missing null checks    | Crashes         | Null-aware operators      |
| ref.read in build      | Bugs            | Use ref.watch             |
| In-place mutation      | State bugs      | copyWith / spread         |
