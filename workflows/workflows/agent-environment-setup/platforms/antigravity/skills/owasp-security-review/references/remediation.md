# Remediation Playbook

## Overview

This playbook provides specific, actionable remediation guidance for common vulnerability classes. Each section includes the vulnerable pattern, the fix pattern, and language-specific examples.

## SQL Injection Remediation

### Vulnerable Pattern
```javascript
// String concatenation
const query = "SELECT * FROM users WHERE id = " + userId;
// Template literals
const query = `SELECT * FROM users WHERE name = '${name}'`;
```

### Fix Pattern
```javascript
// Parameterized query (Node.js/pg)
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1 AND name = $2',
  [userId, name]
);

// ORM (Prisma)
const user = await prisma.user.findUnique({
  where: { id: parseInt(userId) }
});
```

### By Language

| Language | ORM/Library | Parameterized Pattern |
|----------|------------|----------------------|
| Node.js | pg | `pool.query('SELECT $1', [param])` |
| Node.js | Prisma | `prisma.model.findMany({ where: {} })` |
| Python | psycopg2 | `cursor.execute('SELECT %s', (param,))` |
| Python | SQLAlchemy | `session.query(Model).filter_by(id=param)` |
| Java | JDBC | `PreparedStatement ps = conn.prepareStatement("SELECT ?")` |
| Go | database/sql | `db.Query("SELECT $1", param)` |
| PHP | PDO | `$stmt = $pdo->prepare('SELECT ?')` |

## XSS Remediation

### Vulnerable Pattern
```javascript
// Reflected XSS
res.send(`<h1>${req.query.name}</h1>`);
// DOM XSS
element.innerHTML = userInput;
// React
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

### Fix Pattern
```javascript
// Server-side: use template engine with auto-escaping
// Express + EJS (auto-escapes by default with <%=)
res.render('page', { name: req.query.name });

// Client-side: use textContent instead of innerHTML
element.textContent = userInput;

// React: default JSX escaping (already safe)
<div>{userInput}</div>

// When HTML is needed: sanitize with DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### Content Security Policy
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'none';
```

## Broken Access Control Remediation

### Vulnerable Pattern
```javascript
// No authorization check — any authenticated user can access any user's data
app.get('/api/users/:id/profile', authenticate, (req, res) => {
  const profile = await db.getProfile(req.params.id);
  res.json(profile);
});
```

### Fix Pattern
```javascript
// Object-level authorization check
app.get('/api/users/:id/profile', authenticate, async (req, res) => {
  const requestedId = req.params.id;
  const requesterId = req.user.id;

  // Check ownership or admin role
  if (requestedId !== requesterId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const profile = await db.getProfile(requestedId);
  res.json(profile);
});

// Better: centralized authorization middleware
const authorize = (resource) => async (req, res, next) => {
  const allowed = await policyEngine.check({
    subject: req.user,
    action: req.method,
    resource: resource,
    resourceId: req.params.id,
  });
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  next();
};

app.get('/api/users/:id/profile', authenticate, authorize('user.profile'), handler);
```

## Authentication Hardening

### Password Storage
```javascript
// WRONG
const hash = crypto.createHash('md5').update(password).digest('hex');

// CORRECT — bcrypt with cost factor 12
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const match = await bcrypt.compare(inputPassword, storedHash);
```

### JWT Best Practices
```javascript
// WRONG
const token = jwt.sign({ userId: user.id }, 'secret');

// CORRECT
const token = jwt.sign(
  {
    sub: user.id,
    role: user.role,
    iss: 'auth.example.com',
    aud: 'api.example.com',
  },
  process.env.JWT_PRIVATE_KEY,
  {
    algorithm: 'RS256',
    expiresIn: '1h',
  }
);

// Verification must validate all claims
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
  issuer: 'auth.example.com',
  audience: 'api.example.com',
});
```

## Security Headers Configuration

### Express.js (using Helmet)
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### Nginx
```nginx
add_header Content-Security-Policy "default-src 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

## Remediation Priority Framework

| Priority | Criteria | Timeline |
|----------|----------|----------|
| P0 | Active exploitation or data breach | Immediate (hours) |
| P1 | Critical severity, easily exploitable | Within 24 hours |
| P2 | High severity, requires authentication | Within 1 week |
| P3 | Medium severity, limited impact | Within 1 month |
| P4 | Low severity, defense-in-depth | Next maintenance window |

## Verification Checklist

After applying any remediation:

- [ ] Vulnerability is no longer reproducible with original exploit
- [ ] SAST tools no longer flag the pattern
- [ ] DAST scan confirms runtime fix
- [ ] No regressions in application functionality
- [ ] Fix deployed to all affected environments
- [ ] Similar patterns audited across codebase
