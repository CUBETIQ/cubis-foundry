# Common Security Pitfalls Reference

## Overview

This reference catalogs the most frequently encountered security mistakes in modern web applications, APIs, and cloud-native architectures. Each pitfall includes the vulnerable pattern, why it matters, and the fix.

## Authentication Pitfalls

### 1. Storing Passwords in Plaintext or Weak Hash

**Vulnerable:**
```python
# MD5 — broken, rainbow-tableable
password_hash = hashlib.md5(password.encode()).hexdigest()

# SHA-256 without salt — rainbow-tableable
password_hash = hashlib.sha256(password.encode()).hexdigest()
```

**Fixed:**
```python
# bcrypt with cost factor (recommended)
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))

# Argon2 (modern, memory-hard)
from argon2 import PasswordHasher
ph = PasswordHasher()
password_hash = ph.hash(password)
```

### 2. JWT Without Expiration

**Vulnerable:**
```javascript
const token = jwt.sign({ userId: user.id }, secret);
// Token is valid forever
```

**Fixed:**
```javascript
const token = jwt.sign({ userId: user.id }, secret, {
  expiresIn: '1h',
  issuer: 'auth.myapp.com',
  audience: 'api.myapp.com'
});
```

### 3. Session Fixation

**Vulnerable:** Session ID does not change after login.

**Fixed:** Regenerate session ID after authentication:
```javascript
req.session.regenerate((err) => {
  req.session.userId = user.id;
  // ... continue
});
```

## Input Handling Pitfalls

### 4. SQL Injection via String Concatenation

**Vulnerable:**
```javascript
db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

**Fixed:**
```javascript
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

### 5. Command Injection

**Vulnerable:**
```python
import os
os.system(f"ping -c 4 {user_input}")
# User input: "8.8.8.8; cat /etc/passwd"
```

**Fixed:**
```python
import subprocess
subprocess.run(["ping", "-c", "4", user_input], check=True)
# Arguments are passed as array — shell interpretation disabled
```

### 6. Path Traversal

**Vulnerable:**
```javascript
const filePath = `./uploads/${req.params.filename}`;
res.sendFile(filePath);
// Attack: GET /files/../../../etc/passwd
```

**Fixed:**
```javascript
const path = require('path');
const safePath = path.join('./uploads', path.basename(req.params.filename));
// path.basename strips directory traversal sequences
```

### 7. Mass Assignment

**Vulnerable:**
```javascript
// User can set any field including isAdmin
const user = await User.create(req.body);
```

**Fixed:**
```javascript
// Explicitly pick allowed fields
const { name, email } = req.body;
const user = await User.create({ name, email, isAdmin: false });
```

## Configuration Pitfalls

### 8. Debug Mode in Production

**Vulnerable:** Django with `DEBUG = True`, Express with `NODE_ENV=development`, Spring Boot Actuator endpoints exposed.

**Impact:** Stack traces reveal file paths, versions, query parameters, and framework internals.

### 9. CORS Wildcard

**Vulnerable:**
```javascript
app.use(cors({ origin: '*' }));
```

**Impact:** Any website can make authenticated requests to your API.

**Fixed:**
```javascript
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true
}));
```

### 10. Missing Rate Limiting

**Vulnerable:** Login endpoint accepts unlimited requests.

**Impact:** Brute-force attacks, credential stuffing.

**Fixed:**
```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts'
});
app.post('/login', loginLimiter, loginHandler);
```

## Cryptography Pitfalls

### 11. Hardcoded Secrets

**Vulnerable:**
```javascript
const JWT_SECRET = 'my-super-secret-key-2024';
```

**Fixed:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable required');
```

### 12. Insecure Random for Security-Sensitive Values

**Vulnerable:**
```javascript
// Math.random() is NOT cryptographically secure
const token = Math.random().toString(36).substring(2);
```

**Fixed:**
```javascript
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
```

## API Pitfalls

### 13. Exposing Internal IDs

**Vulnerable:** Sequential integer IDs allow enumeration (`/api/users/1`, `/api/users/2`, ...).

**Fixed:** Use UUIDs or opaque tokens for external-facing identifiers.

### 14. Over-Fetching in API Responses

**Vulnerable:**
```javascript
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user); // Includes password_hash, internal_notes, etc.
});
```

**Fixed:**
```javascript
const user = await User.findById(req.params.id)
  .select('id name email avatar createdAt');
res.json(user);
```

### 15. Missing Content-Type Validation

**Vulnerable:** API accepts any content type, potentially enabling XXE or other parser-specific attacks.

**Fixed:**
```javascript
app.use(express.json({ type: 'application/json', limit: '1mb' }));
// Reject requests with wrong Content-Type
```

## Error Handling Pitfalls

### 16. Leaking Stack Traces

**Vulnerable:**
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});
```

**Fixed:**
```javascript
app.use((err, req, res, next) => {
  console.error(err); // Log internally
  res.status(500).json({ error: 'Internal server error' });
});
```

## Dependency Pitfalls

### 17. No Lockfile

**Vulnerable:** Only `package.json` with ranges — builds are non-reproducible and vulnerable to supply chain attacks.

**Fixed:** Always commit lockfiles (`package-lock.json`, `yarn.lock`, `poetry.lock`). Use `npm ci` instead of `npm install` in CI.

### 18. Ignoring Audit Warnings

**Vulnerable:** `npm audit` shows 47 vulnerabilities, all ignored.

**Fixed:** Triage each finding. Update what can be updated. Document accepted risks. Block PRs on critical/high.

## Container Pitfalls

### 19. Running as Root in Container

**Vulnerable:** No `USER` directive in Dockerfile.

**Impact:** Container escape gives root on host. Any file write vulnerability has maximum impact.

**Fixed:**
```dockerfile
RUN adduser -D appuser
USER appuser
```

### 20. Secrets in Docker Layers

**Vulnerable:**
```dockerfile
COPY .env .
RUN npm install  # .env is in a layer even if deleted later
```

**Fixed:** Use `.dockerignore` to exclude secrets. Mount secrets at runtime.
