---
name: "error-ux-observability"
description: "Map backend failures to user-friendly messages, implement proper logging levels, and ensure observable error handling"
---
# Error UX & Observability

## Overview

This power helps you translate technical errors into user-friendly messages, implement proper logging for debugging, and ensure errors are observable in production.

## When to Use

- Implementing error handling in repositories/use cases
- Mapping API errors to UI messages
- Adding logging to track issues
- Reviewing error handling code
- Debugging production issues

## Quick Reference

### Failure to UI Message Mapping

```dart
// ✅ Map technical errors to user-friendly messages
String getErrorMessage(Failure failure) {
  return failure.when(
    network: () => 'No internet connection. Please check your network.',
    server: (code, message) {
      if (code == 401) return 'Session expired. Please login again.';
      if (code == 403) return 'You don\'t have permission for this action.';
      if (code == 404) return 'Resource not found.';
      if (code >= 500) return 'Server error. Please try again later.';
      return message ?? 'Something went wrong.';
    },
    validation: (errors) => errors.values.first,
    unauthorized: () => 'Please login to continue.',
    notFound: () => 'Item not found.',
    unknown: (error) => 'An unexpected error occurred.',
  );
}
```

### Logging Levels

```dart
// ✅ Use appropriate log levels
logger.debug('Cache hit for attendance data'); // Development only
logger.info('User logged in: userId=${user.id}'); // Important events
logger.warning('API rate limit approaching'); // Potential issues
logger.error('Failed to sync attendance', error: e, stackTrace: st); // Errors
logger.fatal('Database corruption detected'); // Critical failures
```

### Error Context

```dart
// ✅ Include context in errors
try {
  await repository.submitLeave(leaveRequest);
} catch (e, st) {
  logger.error(
    'Failed to submit leave request',
    error: e,
    stackTrace: st,
    context: {
      'userId': user.id,
      'leaveType': leaveRequest.type,
      'startDate': leaveRequest.startDate,
    },
  );
  rethrow;
}
```

## Error Handling Patterns

### Repository Layer

```dart
@override
Future<Result<Attendance>> submitAttendance(AttendanceRequest request) async {
  try {
    final response = await _remoteDataSource.submit(request);
    return Result.success(response);
  } on DioException catch (e) {
    logger.error('Submit attendance failed', error: e);
    return Result.failure(_mapDioError(e));
  } catch (e, st) {
    logger.error('Unexpected error', error: e, stackTrace: st);
    return Result.failure(Failure.unknown(e.toString()));
  }
}
```

### Controller Layer

```dart
Future<void> submit() async {
  final prev = state;
  state = const AsyncLoading();
  
  final result = await ref.read(featureRepositoryProvider).submit(request);
  
  result.when(
    success: (data) => ref.invalidateSelf(),
    failure: (failure) {
      logger.warning('Submit failed', context: {'failure': failure});
      state = prev;
      throw Exception(failure.message);
    },
  );
}
```

### UI Layer

```dart
ref.listen(controllerProvider, (prev, next) {
  next.whenOrNull(
    error: (error, _) {
      final message = error is Failure 
        ? getErrorMessage(error)
        : 'An unexpected error occurred';
      OneSnackbar.error(context, message);
    },
  );
});
```

## Logging Best Practices

1. **Never log sensitive data** (passwords, tokens, PII)
2. **Include context** (userId, action, timestamp)
3. **Use structured logging** (key-value pairs)
4. **Log at appropriate levels** (debug/info/warning/error/fatal)
5. **Include stack traces for errors**

## References

Load detailed guidance only when needed.

| File | Load when |
| --- | --- |
| `references/failure_to_ui.md` | Mapping backend/domain failures into user-facing messages and screen states |
| `references/logging_levels.md` | Deciding which log level and structure to use for an event or failure |

## Templates

- `failure_message_mapper` - Failure to UI message mapper template
