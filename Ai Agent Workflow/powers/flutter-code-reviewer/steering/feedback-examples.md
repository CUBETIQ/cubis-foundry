# Feedback Examples

> Reference for: Code Reviewer
> Load when: Writing review feedback

## Good vs Bad Feedback

### Be Specific, Not Vague

```markdown
BAD: "This is confusing"

GOOD: "This function handles both validation and persistence. Consider
      splitting into `validateUser()` and `saveUser()` for single
      responsibility and easier testing."
```

### Be Actionable, Not Just Critical

```markdown
BAD: "Fix the query"

GOOD: "This will cause N+1 queries - one per post. Use eager loading
      or batch fetch authors in a single query."
```

### Be Constructive, Not Demanding

```markdown
BAD: "Add tests"

GOOD: "Missing test for the case when `email` is already taken. Add a test
      that verifies the error state is returned with appropriate message."
```

### Ask Questions, Don't Assume

```markdown
BAD: "This is wrong"

GOOD: "I notice this returns null instead of throwing. Is that intentional?
      The other methods throw on not-found. Should this be consistent?"
```

## Praise Examples

Reinforce good patterns with specific praise:

```markdown
"Great use of early returns here - much more readable than nested ifs!"

"Nice extraction of this validation logic into a reusable function."

"Excellent error messages - they'll help debugging in production."

"Good choice using Freezed here instead of mutable state."

"Appreciate the comprehensive test coverage, especially the edge cases."

"Clean use of ref.watch vs ref.read - exactly right!"
```

## Feedback by Category

### Critical (Must Fix)

```markdown
**[CRITICAL] Rebuild Loop**
Location: `lib/features/home/views/home_view.dart:45`

Calling controller method in build causes infinite loop:
```dart
Widget build(context, ref) {
  ref.read(homeControllerProvider.notifier).loadData(); // INFINITE LOOP!
}
```

Fix: Move to useEffect or call from user action:
```dart
useEffect(() {
  ref.read(homeControllerProvider.notifier).loadData();
  return null;
}, []);
```
```

### Major (Should Fix)

```markdown
**[MAJOR] Performance: N+1 Query**
Location: `lib/features/posts/data/post_repository.dart:23`

Current code fetches users in a loop (N+1 problem):
```dart
for (final post in posts) {
  post.author = await userRepository.findById(post.authorId);
}
```

Suggestion: Batch load users:
```dart
final authorIds = posts.map((p) => p.authorId).toSet().toList();
final authors = await userRepository.findByIds(authorIds);
final authorMap = {for (var a in authors) a.id: a};
for (final post in posts) {
  post.author = authorMap[post.authorId];
}
```

Impact: ~100 extra DB queries per request with current approach.
```

### Minor (Nice to Have)

```markdown
**[MINOR] Naming: Unclear variable**
Location: `lib/core/utils/date_utils.dart:12`

`d` is unclear. Consider `createdDate` or `timestamp` for better readability.

**[MINOR] Style: Prefer const**
Location: `lib/core/config/app_config.dart:8`

`var config` is never reassigned. Use `final` for immutability.
```

## Question Format

```markdown
**[QUESTION]**
Location: `lib/features/orders/data/order_repository.dart:67`

What's the expected behavior when the user has an existing pending order?
Should this:
- Return the existing order?
- Create a new one anyway?
- Return an error?
```

## Summary Format

```markdown
## Summary

Overall this is a solid implementation of the user registration flow.
The validation logic is clean and the error handling is comprehensive.

**Blocking Issues**: 1 critical (rebuild loop)
**Suggestions**: 2 major, 3 minor

Once the rebuild loop is fixed, this is ready to merge. The major
suggestions are performance improvements worth considering.
```

## Quick Reference

| Feedback Type | Tone          | Required Action       |
| ------------- | ------------- | --------------------- |
| Critical      | Firm, clear   | Must fix before merge |
| Major         | Suggestive    | Should fix            |
| Minor         | Optional      | Nice to have          |
| Praise        | Positive      | None - reinforcement  |
| Question      | Curious       | Response needed       |
