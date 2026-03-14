# Authentication

Load this reference when implementing login flows, managing auth tokens, or reusing authentication state across tests or workflow steps.

## Authentication Flow Patterns

### Form-based login

The most common pattern. Fill credentials, submit, wait for redirect.

```typescript
async function loginWithForm(page: Page, email: string, password: string) {
  await page.goto('https://app.com/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}
```

### OAuth / SSO redirect flow

OAuth flows redirect to a third-party provider. Handle the full redirect chain.

```typescript
async function loginWithOAuth(page: Page) {
  await page.goto('https://app.com/login');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();

  // Now on Google's login page
  await page.waitForURL('**/accounts.google.com/**');
  await page.getByLabel('Email or phone').fill(process.env.GOOGLE_EMAIL!);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Enter your password').fill(process.env.GOOGLE_PASSWORD!);
  await page.getByRole('button', { name: 'Next' }).click();

  // Wait for redirect back to app
  await page.waitForURL('**/app.com/dashboard');
}
```

### API-based authentication

Bypass the UI entirely by calling the auth API directly:

```typescript
async function loginViaAPI(context: BrowserContext, email: string, password: string) {
  const response = await context.request.post('https://app.com/api/auth/login', {
    data: { email, password },
  });

  const { token } = await response.json();

  // Set the token as a cookie
  await context.addCookies([{
    name: 'auth_token',
    value: token,
    domain: 'app.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 86400,
  }]);
}
```

API login is faster and more reliable than UI login. Use it when:
- The auth API is stable and documented
- You do not need to test the login UI itself
- You want tests to be independent of login page changes

### Multi-factor authentication

MFA complicates automation. Strategies:

| MFA type | Automation approach |
| --- | --- |
| TOTP (authenticator app) | Generate codes with `otplib` library using the secret key |
| SMS/Email OTP | Use a test account with MFA disabled, or mock the OTP endpoint |
| Push notification | Cannot automate; use a test account with MFA disabled |
| Hardware key (FIDO2) | Cannot automate; use a test account with MFA disabled |

```typescript
import { authenticator } from 'otplib';

async function handleTOTP(page: Page, secret: string) {
  const otp = authenticator.generate(secret);
  await page.getByLabel('Verification code').fill(otp);
  await page.getByRole('button', { name: 'Verify' }).click();
}
```

## Global Setup Authentication

Authenticate once before all tests and share the state:

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://app.com/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  // Save state for all tests to reuse
  await context.storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  projects: [
    {
      name: 'authenticated',
      use: { storageState: 'playwright/.auth/user.json' },
    },
    {
      name: 'unauthenticated',
      use: { storageState: { cookies: [], origins: [] } },
    },
  ],
});
```

## Token Refresh Handling

Long-running sessions encounter token expiration. Handle refresh proactively.

### Intercepting 401 responses

```typescript
context.on('response', async (response) => {
  if (response.status() === 401 && !response.url().includes('/auth/')) {
    console.warn('Session expired, triggering refresh');
    await refreshToken(context);
  }
});

async function refreshToken(context: BrowserContext) {
  const response = await context.request.post('https://app.com/api/auth/refresh');
  if (response.ok()) {
    // New cookies are set automatically by the response
    await context.storageState({ path: 'auth-state.json' });
    console.log('Token refreshed and state saved');
  } else {
    throw new Error('Token refresh failed — full re-authentication required');
  }
}
```

### Proactive refresh

Refresh before the token expires rather than reacting to 401s:

```typescript
function scheduleRefresh(context: BrowserContext, tokenExpiresInMs: number) {
  // Refresh at 80% of token lifetime
  const refreshAfter = tokenExpiresInMs * 0.8;

  setTimeout(async () => {
    await refreshToken(context);
    // Schedule the next refresh
    scheduleRefresh(context, tokenExpiresInMs);
  }, refreshAfter);
}
```

## Multi-Role Authentication

Test different user roles by maintaining separate state files:

```typescript
// global-setup.ts
const roles = [
  { name: 'admin', email: 'admin@test.com', password: 'admin-pass' },
  { name: 'editor', email: 'editor@test.com', password: 'editor-pass' },
  { name: 'viewer', email: 'viewer@test.com', password: 'viewer-pass' },
];

async function globalSetup() {
  const browser = await chromium.launch();

  for (const role of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginWithForm(page, role.email, role.password);
    await context.storageState({ path: `playwright/.auth/${role.name}.json` });
    await context.close();
  }

  await browser.close();
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'admin-tests',
      use: { storageState: 'playwright/.auth/admin.json' },
      testMatch: '**/admin/**',
    },
    {
      name: 'editor-tests',
      use: { storageState: 'playwright/.auth/editor.json' },
      testMatch: '**/editor/**',
    },
  ],
});
```

## Credential Security

| Practice | Do | Do not |
| --- | --- | --- |
| Store credentials | Environment variables, CI secrets | Hardcoded in code or config |
| State files | `.gitignore` the auth state directory | Commit state files to version control |
| Test accounts | Dedicated test accounts with minimal permissions | Shared personal accounts |
| CI secrets | GitHub/GitLab encrypted secrets | Plain text in CI config |

```gitignore
# .gitignore
playwright/.auth/
*.auth.json
state/*.json
```

## Debugging Authentication Issues

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Tests fail with 401 after restore | Session expired between runs | Add validation check before using state |
| Login works locally, fails in CI | Different cookie domain or secure flag | Match CI base URL to cookie domain |
| Intermittent auth failures | Race condition in token refresh | Serialize refresh calls with a mutex |
| MFA prompt appears unexpectedly | Test account MFA was enabled | Use a dedicated test account with MFA off |
| Cookies not saved | Domain mismatch (`.app.com` vs `app.com`) | Check cookie domain in state file |
