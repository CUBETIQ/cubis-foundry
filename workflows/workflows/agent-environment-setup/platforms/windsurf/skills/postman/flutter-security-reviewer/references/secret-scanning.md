# Secret Scanning

> Reference for: Security Reviewer
> Load when: Scanning for hardcoded secrets

## Manual Grep Patterns

```bash
# Common secret patterns
grep -rn "api_key\|apikey\|api-key" --include="*.dart" .
grep -rn "secret\|password\|passwd" --include="*.dart" .
grep -rn "private_key\|privatekey" --include="*.dart" .
grep -rn "access_token\|accesstoken" --include="*.dart" .

# Firebase/Google
grep -rn "AIza[0-9A-Za-z_-]{35}" .
grep -rn "firebase" --include="*.dart" .

# AWS credentials
grep -rn "AKIA[0-9A-Z]{16}" .
grep -rn "aws_secret_access_key" .

# Base64 encoded (potential secrets)
grep -rn "[A-Za-z0-9+/]{40,}=" .

# JWT tokens
grep -rn "eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\." .
```

## Common Secret Patterns

| Type              | Pattern                          | Example                    |
| ----------------- | -------------------------------- | -------------------------- |
| AWS Access Key    | `AKIA[0-9A-Z]{16}`               | AKIAIOSFODNN7EXAMPLE       |
| AWS Secret Key    | 40 char base64                   | wJalrXUtnFEMI/K7MDENG...   |
| Firebase API Key  | `AIza[0-9A-Za-z_-]{35}`          | AIzaSyC...                 |
| GitHub Token      | `ghp_[A-Za-z0-9]{36}`            | ghp_xxxxxxxxxxxx           |
| Slack Token       | `xox[baprs]-`                    | xoxb-xxx-xxx               |
| Stripe Key        | `sk_live_[A-Za-z0-9]{24}`        | sk_live_xxxx               |
| Private Key       | `-----BEGIN.*PRIVATE KEY-----`  | RSA/EC keys                |
| JWT               | `eyJ[A-Za-z0-9_-]*\.eyJ`         | Encoded tokens             |

## Flutter-Specific Locations to Check

```bash
# Check these files for hardcoded secrets
lib/core/config/
lib/firebase_options.dart
android/app/google-services.json
ios/Runner/GoogleService-Info.plist
.env files
pubspec.yaml (sometimes contains keys)
```

## What to Look For

### Hardcoded API Keys
```dart
// BAD - Hardcoded
const apiKey = 'sk_live_abc123xyz';
const firebaseKey = 'AIzaSyC...';

// GOOD - Environment variable or secure storage
final apiKey = const String.fromEnvironment('API_KEY');
final apiKey = await secureStorage.read(key: 'api_key');
```

### Hardcoded URLs with Credentials
```dart
// BAD
const dbUrl = 'postgres://user:password@host:5432/db';

// GOOD
final dbUrl = const String.fromEnvironment('DATABASE_URL');
```

### Debug/Test Credentials
```dart
// BAD - Test credentials in production code
const testUser = 'admin';
const testPassword = 'admin123';

// GOOD - Only in test files, never committed
// Use environment variables or test fixtures
```

## Remediation Steps

1. **Rotate immediately** - Consider secret compromised
2. **Remove from code** - Replace with environment variable
3. **Remove from git history** - Use BFG or git filter-branch
4. **Add to .gitignore** - Prevent future commits
5. **Use secure storage** - flutter_secure_storage for runtime secrets
6. **Use --dart-define** - For build-time configuration

```bash
# Build with environment variables
flutter build apk --dart-define=API_KEY=$API_KEY

# Access in code
const apiKey = String.fromEnvironment('API_KEY');
```

## Pre-commit Prevention

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

## Quick Reference

| Location                    | Risk Level | Action                      |
| --------------------------- | ---------- | --------------------------- |
| Source code (.dart)         | Critical   | Remove, use env vars        |
| Config files                | High       | Move to .gitignore          |
| Git history                 | Critical   | Rewrite history             |
| Build artifacts             | Medium     | Ensure not committed        |
| Comments/TODOs              | Medium     | Remove sensitive info       |
