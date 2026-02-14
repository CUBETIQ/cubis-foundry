```
// templates/failure_message_mapper.tmpl
//
// Map Failure to safe user message.

String userMessageFromFailure(Failure f) {
  return f.when(
    server: (m) => m ?? 'Something went wrong. Please try again.',
    network: (m) => m ?? 'No internet connection. Please check and retry.',
    cache: (m) => m ?? 'Saved data is unavailable. Please refresh.',
    auth: (m) => m ?? 'Session expired. Please sign in again.',
    validation: (m) => m ?? 'Please check your input and try again.',
    unknown: (m) => m ?? 'Unexpected error. Please try again.',
  );
}
```
