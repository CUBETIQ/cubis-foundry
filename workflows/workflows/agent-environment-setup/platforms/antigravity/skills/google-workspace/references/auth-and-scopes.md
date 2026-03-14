# Auth and Scopes

Load this when configuring OAuth2, service accounts, managing tokens, or selecting API scopes.

## OAuth2 for User-Facing Applications

### Authorization Code Flow with PKCE

Use for web and mobile applications where a user grants access to their Google account.

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://app.example.com/auth/callback'
);

// Step 1: Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',       // Request a refresh token
  scope: ['https://www.googleapis.com/auth/drive.readonly'],
  prompt: 'consent',            // Force consent screen to get refresh token
  code_challenge_method: 'S256',
  code_challenge: codeChallenge, // PKCE challenge
});

// Step 2: Exchange authorization code for tokens
const { tokens } = await oauth2Client.getToken({
  code: authorizationCode,
  codeVerifier: codeVerifier, // PKCE verifier
});
oauth2Client.setCredentials(tokens);

// Step 3: Use the authenticated client
const drive = google.drive({ version: 'v3', auth: oauth2Client });
```

### Token Management

```typescript
// Store tokens securely (encrypted in database, not in files)
async function saveTokens(userId: string, tokens: Credentials) {
  await db.oauthToken.upsert({
    where: { userId },
    create: { userId, accessToken: encrypt(tokens.access_token!), refreshToken: encrypt(tokens.refresh_token!) },
    update: { accessToken: encrypt(tokens.access_token!), ...(tokens.refresh_token && { refreshToken: encrypt(tokens.refresh_token!) }) },
  });
}

// Restore tokens for a returning user
async function getAuthenticatedClient(userId: string) {
  const stored = await db.oauthToken.findUnique({ where: { userId } });
  if (!stored) throw new Error('User not authenticated');

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://app.example.com/auth/callback'
  );

  client.setCredentials({
    access_token: decrypt(stored.accessToken),
    refresh_token: decrypt(stored.refreshToken),
  });

  // Client library handles automatic refresh
  client.on('tokens', async (tokens) => {
    await saveTokens(userId, tokens);
  });

  return client;
}
```

- Access tokens expire after 1 hour. The client library refreshes automatically if a refresh token is available.
- Refresh tokens do not expire unless the user revokes access or the token is unused for 6 months.
- Store refresh tokens encrypted. They grant long-lived access to user data.

## Service Accounts

### Basic Service Account

```typescript
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
```

- Service accounts are for server-to-server operations with no user interaction.
- The service account has its own identity. Share resources (sheets, folders) with its email address.

### Domain-Wide Delegation

Allows the service account to impersonate any user in a Google Workspace domain.

```typescript
const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: 'admin@example.com', // Impersonate this user
});
```

- Requires a Workspace admin to grant the service account access in the Admin Console.
- The `subject` field specifies which user to impersonate.
- Use this for sending emails (Gmail API requires a real user) and managing calendars.

## Scope Reference

### Principle of Least Privilege

Always request the narrowest scope. Broad scopes trigger extended Google review.

| Scope | Access Level |
|-------|-------------|
| `drive.readonly` | Read files and metadata |
| `drive.file` | Files created by or opened with the app |
| `drive` | Full Drive access (triggers review) |
| `spreadsheets.readonly` | Read spreadsheet data |
| `spreadsheets` | Read and write spreadsheet data |
| `calendar.readonly` | Read calendar events |
| `calendar.events` | Read and write events |
| `calendar` | Full calendar access |
| `gmail.readonly` | Read email messages |
| `gmail.send` | Send email only |
| `gmail.modify` | Read, send, and modify (triggers review) |

### Incremental Authorization

Request scopes incrementally as features are used, not all at once during initial login.

```typescript
const authUrl = oauth2Client.generateAuthUrl({
  scope: ['openid', 'email'], // Start with basic profile
  include_granted_scopes: true,
});

// Later, when the user accesses Drive features:
const driveAuthUrl = oauth2Client.generateAuthUrl({
  scope: ['https://www.googleapis.com/auth/drive.readonly'],
  include_granted_scopes: true, // Merge with existing scopes
});
```

## Consent Screen Configuration

1. Create an OAuth consent screen in the Google Cloud Console.
2. Set the application type: Internal (Workspace users only) or External (any Google account).
3. Add only the scopes your application needs.
4. Internal apps skip Google review. External apps with sensitive scopes require review.
5. Add test users during development. Only test users can access unverified apps.

## Error Handling

```typescript
try {
  const response = await drive.files.list({ q: "name = 'test'" });
} catch (error: any) {
  if (error.code === 401) {
    // Token expired or revoked. Re-authenticate.
  } else if (error.code === 403) {
    // Insufficient scopes or insufficient permissions on the resource.
    // Check: is the scope correct? Is the file shared with this account?
  } else if (error.code === 404) {
    // Resource not found or no access.
  } else if (error.code === 429) {
    // Rate limit exceeded. Implement exponential backoff.
  }
}
```

- 403 errors are the most common. They can mean wrong scopes, unshared resources, or disabled APIs.
- Always enable the specific API (Drive, Sheets, Calendar, Gmail) in the Google Cloud Console.
