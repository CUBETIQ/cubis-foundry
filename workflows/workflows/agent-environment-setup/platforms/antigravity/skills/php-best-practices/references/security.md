# PHP Security Reference

## SQL Injection Prevention

### Always use prepared statements

```php
<?php declare(strict_types=1);

// BAD — SQL injection vulnerability
$stmt = $pdo->query("SELECT * FROM users WHERE email = '{$email}'");

// GOOD — prepared statement with positional parameters
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);

// GOOD — prepared statement with named parameters
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email AND status = :status');
$stmt->execute(['email' => $email, 'status' => $status]);
```

### PDO configuration

```php
<?php declare(strict_types=1);

$pdo = new PDO($dsn, $user, $pass, [
    // Use real prepared statements, not emulated
    PDO::ATTR_EMULATE_PREPARES => false,
    // Throw exceptions on errors
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    // Return associative arrays by default
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    // Use strict typing for bound parameters
    PDO::ATTR_STRINGIFY_FETCHES => false,
]);
```

### Query builder safety

When using Doctrine DBAL or Eloquent query builders, parameters are automatically bound:

```php
<?php declare(strict_types=1);

// Doctrine DBAL — parameters are bound
$qb = $connection->createQueryBuilder()
    ->select('*')
    ->from('users')
    ->where('email = :email')
    ->setParameter('email', $email);

// BAD — even with query builders, raw interpolation is dangerous
$qb->where("email = '{$email}'"); // SQL INJECTION!
```

## Cross-Site Scripting (XSS) Prevention

### Output encoding

```php
<?php declare(strict_types=1);

// HTML context — escape for HTML entities
echo htmlspecialchars($userInput, ENT_QUOTES | ENT_HTML5, 'UTF-8');

// Templating engines (Twig, Blade) auto-escape by default
// Twig: {{ user.name }} — auto-escaped
// Twig: {{ user.bio|raw }} — DANGEROUS, only for trusted HTML

// JSON context — use json_encode flags
echo json_encode($data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
```

### Content Security Policy

```php
<?php declare(strict_types=1);

// Set CSP header to prevent inline scripts
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
```

## Session Security

### Secure session configuration

```php
<?php declare(strict_types=1);

// In php.ini or at runtime
ini_set('session.cookie_httponly', '1');     // Prevent JS access
ini_set('session.cookie_secure', '1');       // HTTPS only
ini_set('session.cookie_samesite', 'Lax');   // CSRF protection
ini_set('session.use_strict_mode', '1');     // Reject uninitialized session IDs
ini_set('session.use_only_cookies', '1');    // No URL session IDs
ini_set('session.sid_length', '48');         // Longer session IDs
ini_set('session.sid_bits_per_character', '6'); // More entropy
```

### Session regeneration

```php
<?php declare(strict_types=1);

// Regenerate session ID on privilege change (login, role change)
function loginUser(User $user): void
{
    // Destroy old session to prevent fixation
    session_regenerate_id(true);

    $_SESSION['user_id'] = $user->id;
    $_SESSION['user_role'] = $user->role->value;
    $_SESSION['login_time'] = time();
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
}

// Validate session integrity on each request
function validateSession(): bool
{
    if (!isset($_SESSION['user_id'])) {
        return false;
    }

    // Detect session hijacking via IP change
    if ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR']) {
        session_destroy();
        return false;
    }

    // Expire sessions after inactivity
    if (time() - ($_SESSION['last_activity'] ?? 0) > 1800) {
        session_destroy();
        return false;
    }

    $_SESSION['last_activity'] = time();
    return true;
}
```

## Password Handling

### Hashing

```php
<?php declare(strict_types=1);

// Hash with Argon2id (recommended) or bcrypt
$hash = password_hash($plaintext, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,  // 64 MB
    'time_cost' => 4,         // 4 iterations
    'threads' => 3,
]);

// Verify — timing-safe comparison built in
if (password_verify($plaintext, $hash)) {
    // Authenticated
}

// Check if hash needs upgrading (algorithm or cost changed)
if (password_needs_rehash($hash, PASSWORD_ARGON2ID)) {
    $newHash = password_hash($plaintext, PASSWORD_ARGON2ID);
    updateUserHash($userId, $newHash);
}
```

### Never do this

```php
// BAD — reversible, no salt, fast to brute-force
$hash = md5($password);
$hash = sha1($password);
$hash = hash('sha256', $password . $salt); // DIY salting is fragile
```

## CSRF Protection

### Token-based CSRF protection

```php
<?php declare(strict_types=1);

// Generate token
function generateCsrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Validate token
function validateCsrfToken(string $token): bool
{
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

// In form
echo '<input type="hidden" name="_token" value="' . htmlspecialchars(generateCsrfToken()) . '">';

// On submission
if (!validateCsrfToken($_POST['_token'] ?? '')) {
    http_response_code(403);
    exit('CSRF validation failed');
}
```

### SameSite cookie (modern approach)

`SameSite=Lax` (or `Strict`) prevents the browser from sending cookies with cross-site requests, mitigating CSRF without tokens for GET-safe endpoints.

## Input Validation

### Validate at the boundary

```php
<?php declare(strict_types=1);

final readonly class CreateUserRequest
{
    public function __construct(
        public string $name,
        public string $email,
        public int $age,
    ) {
        if (trim($name) === '' || mb_strlen($name) > 255) {
            throw new ValidationException('name', 'Name must be 1-255 characters');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('email', 'Invalid email address');
        }
        if ($age < 0 || $age > 150) {
            throw new ValidationException('age', 'Age must be 0-150');
        }
    }
}

// Usage — validation happens at construction
$request = new CreateUserRequest(
    name: trim($_POST['name'] ?? ''),
    email: trim($_POST['email'] ?? ''),
    age: (int) ($_POST['age'] ?? 0),
);
```

### filter_var for common validations

| Filter | Validates |
| --- | --- |
| `FILTER_VALIDATE_EMAIL` | Email format |
| `FILTER_VALIDATE_URL` | URL format |
| `FILTER_VALIDATE_IP` | IP address |
| `FILTER_VALIDATE_INT` | Integer with optional range |
| `FILTER_VALIDATE_DOMAIN` | Domain name (PHP 7+) |

## Deserialization Safety

### Never unserialize untrusted data

```php
<?php declare(strict_types=1);

// BAD — arbitrary object instantiation, remote code execution
$data = unserialize($_COOKIE['preferences']); // DANGEROUS

// GOOD — use JSON for data exchange
$data = json_decode($_COOKIE['preferences'], true, 512, JSON_THROW_ON_ERROR);

// If you must use unserialize, restrict allowed classes
$data = unserialize($input, ['allowed_classes' => [AllowedClass::class]]);
```

## File Upload Security

```php
<?php declare(strict_types=1);

function handleUpload(array $file): string
{
    // Validate upload error
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new \RuntimeException('Upload failed');
    }

    // Validate MIME type (check content, not just extension)
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!in_array($mimeType, $allowedTypes, true)) {
        throw new \RuntimeException("Invalid file type: {$mimeType}");
    }

    // Validate size
    if ($file['size'] > 5 * 1024 * 1024) { // 5 MB limit
        throw new \RuntimeException('File too large');
    }

    // Generate safe filename — NEVER use the original filename
    $extension = match ($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => throw new \RuntimeException('Unsupported type'),
    };
    $safeName = bin2hex(random_bytes(16)) . '.' . $extension;

    // Move to upload directory outside web root
    $destination = '/var/uploads/' . $safeName;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new \RuntimeException('Failed to move uploaded file');
    }

    return $safeName;
}
```

## HTTP Security Headers

```php
<?php declare(strict_types=1);

// Set security headers (in middleware or bootstrap)
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 0'); // Disabled — CSP is the modern replacement
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'");
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

## Security Checklist

| Category | Check |
| --- | --- |
| SQL | All queries use prepared statements |
| XSS | All output is context-encoded |
| CSRF | State-changing requests require token or SameSite cookie |
| Auth | Passwords hashed with Argon2id or bcrypt |
| Session | HttpOnly, Secure, SameSite flags set |
| Session | Regenerated on privilege change |
| Upload | MIME validated, filename generated, stored outside web root |
| Headers | HSTS, CSP, X-Content-Type-Options set |
| Dependencies | `composer audit` runs in CI |
| Serialization | No `unserialize()` on untrusted data |
