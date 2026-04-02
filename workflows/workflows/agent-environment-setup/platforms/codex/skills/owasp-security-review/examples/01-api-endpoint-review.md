# Example 1: OWASP Review of a REST API Endpoint

## User Prompt

> Review this Express.js authentication endpoint for OWASP Top 10 vulnerabilities:
>
> ```javascript
> app.post('/login', async (req, res) => {
>   const { username, password } = req.body;
>   const user = await db.query(
>     `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
>   );
>   if (user.rows.length > 0) {
>     const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, 'my-secret-key');
>     res.json({ token, message: `Welcome ${username}` });
>   } else {
>     res.status(401).json({ error: 'Invalid credentials', attempted_user: username });
>   }
> });
> ```

## Expected Response

### OWASP Security Review Report

#### Scope
Single REST API endpoint: `POST /login` — authentication handler in Express.js.

#### Findings

| # | Title | OWASP Category | Severity | CVSS | Location | Status |
|---|-------|----------------|----------|------|----------|--------|
| 1 | SQL Injection in login query | A03:2025 Injection | Critical | 9.8 | login.js:3 | Open |
| 2 | Plaintext password comparison | A02:2025 Cryptographic Failures | Critical | 9.1 | login.js:3 | Open |
| 3 | Hardcoded JWT secret | A02:2025 Cryptographic Failures | High | 8.6 | login.js:6 | Open |
| 4 | Username enumeration via error response | A07:2025 Authentication Failures | Medium | 5.3 | login.js:9 | Open |
| 5 | JWT without expiration | A08:2025 Data Integrity Failures | Medium | 6.5 | login.js:6 | Open |

#### Detailed Findings

**Finding 1: SQL Injection (Critical)**
- **Description:** User-supplied `username` and `password` are concatenated directly into a SQL query string.
- **Impact:** An attacker can bypass authentication, extract the entire database, or execute arbitrary SQL commands.
- **Remediation:** Use parameterized queries:
  ```javascript
  const user = await db.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  ```

**Finding 2: Plaintext Password Storage/Comparison (Critical)**
- **Description:** Passwords are compared in plaintext in the SQL query, indicating passwords are stored without hashing.
- **Impact:** Any database breach exposes all user passwords in cleartext.
- **Remediation:** Store passwords using bcrypt. Compare with `bcrypt.compare()` after fetching the user by username only.

**Finding 3: Hardcoded JWT Secret (High)**
- **Description:** The JWT signing key `'my-secret-key'` is hardcoded in source code.
- **Impact:** Anyone with code access can forge valid JWT tokens for any user or role.
- **Remediation:** Load the JWT secret from an environment variable or secrets manager. Use RS256 with a key pair for better security.

**Finding 4: Username Enumeration (Medium)**
- **Description:** The error response includes `attempted_user`, and different responses for valid vs. invalid users may allow enumeration.
- **Impact:** Attackers can confirm which usernames exist, enabling targeted attacks.
- **Remediation:** Return a generic "Invalid credentials" message. Remove `attempted_user` from the response.

**Finding 5: JWT Without Expiration (Medium)**
- **Description:** `jwt.sign()` is called without an `expiresIn` option.
- **Impact:** Tokens are valid forever. A stolen token provides permanent access.
- **Remediation:** Add expiration: `jwt.sign(payload, secret, { expiresIn: '1h' })`.

#### Recommendations (Priority Order)
1. Fix SQL injection immediately — use parameterized queries
2. Implement bcrypt password hashing — migrate all stored passwords
3. Move JWT secret to environment variable or vault
4. Add JWT expiration and refresh token flow
5. Standardize error responses to prevent enumeration
