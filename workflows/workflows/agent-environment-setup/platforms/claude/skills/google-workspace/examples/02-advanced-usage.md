# Example: Multi-Service Workflow Automation

## Scenario

A team is building an automated onboarding system for new employees. When HR adds a new employee to a Google Sheet, the system should: (1) create a Google Calendar event for the orientation meeting, (2) create a personal Google Drive folder with onboarding documents copied from a template, (3) send a welcome email via Gmail with links to the folder and calendar event, and (4) update the Sheet with status and links. The system uses OAuth2 with domain-wide delegation for a service account that impersonates the HR admin.

## Prompt

"Build an automated employee onboarding workflow that reads new hires from a Google Sheet, creates a Calendar orientation event, sets up a Drive folder with template documents, sends a Gmail welcome message, and updates the Sheet with completion status. Use a service account with domain-wide delegation. Coordinate all four APIs with error handling and partial failure recovery."

## Expected Output

### Multi-Scope Authentication

```typescript
// lib/workspace-auth.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
];

export function getImpersonatedClient(impersonateEmail: string): JWT {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
    subject: impersonateEmail, // Domain-wide delegation: act as this user
  });
}

export function getClients(impersonateEmail: string) {
  const auth = getImpersonatedClient(impersonateEmail);
  return {
    sheets: google.sheets({ version: 'v4', auth }),
    calendar: google.calendar({ version: 'v3', auth }),
    drive: google.drive({ version: 'v3', auth }),
    gmail: google.gmail({ version: 'v1', auth }),
  };
}
```

### Read New Hires from Sheet

```typescript
// services/new-hire-reader.ts
interface NewHire {
  rowIndex: number;
  name: string;
  email: string;
  department: string;
  startDate: string;
  manager: string;
  managerEmail: string;
  status: string;
}

export async function getUnprocessedHires(
  sheets: any,
  spreadsheetId: string
): Promise<NewHire[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'New Hires!A2:H100',
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = response.data.values ?? [];

  return rows
    .map((row: any[], index: number) => ({
      rowIndex: index + 2,
      name: row[0] ?? '',
      email: row[1] ?? '',
      department: row[2] ?? '',
      startDate: row[3] ?? '',
      manager: row[4] ?? '',
      managerEmail: row[5] ?? '',
      status: row[6] ?? '',
    }))
    .filter((hire: NewHire) => hire.status === '' || hire.status === 'pending');
}
```

### Create Calendar Orientation Event

```typescript
// services/calendar-service.ts
export async function createOrientationEvent(
  calendar: any,
  hire: NewHire
): Promise<string> {
  const startDate = new Date(hire.startDate);
  startDate.setHours(9, 0, 0); // 9:00 AM

  const endDate = new Date(startDate);
  endDate.setHours(12, 0, 0); // 12:00 PM

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Orientation: ${hire.name}`,
      description: `New employee orientation for ${hire.name} (${hire.department}).\n\nManager: ${hire.manager}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: hire.email },
        { email: hire.managerEmail },
        { email: 'hr-onboarding@example.com' },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 1 day before
          { method: 'popup', minutes: 60 },
        ],
      },
    },
    sendUpdates: 'all',
  });

  return event.data.htmlLink!;
}
```

### Create Drive Folder with Templates

```typescript
// services/drive-service.ts
export async function createOnboardingFolder(
  drive: any,
  hire: NewHire,
  templateFolderId: string
): Promise<{ folderId: string; folderUrl: string }> {
  // Create personal onboarding folder
  const folder = await drive.files.create({
    requestBody: {
      name: `Onboarding - ${hire.name}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.ONBOARDING_ROOT_FOLDER_ID],
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  // Copy template documents into the new folder
  const templates = await drive.files.list({
    q: `'${templateFolderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    supportsAllDrives: true,
  });

  for (const template of templates.data.files ?? []) {
    await drive.files.copy({
      fileId: template.id,
      requestBody: {
        name: template.name.replace('{{name}}', hire.name),
        parents: [folder.data.id],
      },
      supportsAllDrives: true,
    });
  }

  // Share folder with the new hire
  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: hire.email,
    },
    sendNotificationEmail: false,
    supportsAllDrives: true,
  });

  // Share with manager (read-only)
  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: {
      role: 'reader',
      type: 'user',
      emailAddress: hire.managerEmail,
    },
    sendNotificationEmail: false,
    supportsAllDrives: true,
  });

  return { folderId: folder.data.id, folderUrl: folder.data.webViewLink };
}
```

### Send Welcome Email via Gmail

```typescript
// services/gmail-service.ts
export async function sendWelcomeEmail(
  gmail: any,
  hire: NewHire,
  calendarLink: string,
  folderUrl: string
): Promise<void> {
  const subject = `Welcome to the team, ${hire.name}!`;
  const htmlBody = `
    <h2>Welcome to ${hire.department}!</h2>
    <p>Hi ${hire.name},</p>
    <p>We're excited to have you join us on ${hire.startDate}.</p>
    <h3>Your onboarding resources:</h3>
    <ul>
      <li><a href="${calendarLink}">Orientation meeting</a> (${hire.startDate}, 9:00 AM - 12:00 PM)</li>
      <li><a href="${folderUrl}">Onboarding documents folder</a></li>
    </ul>
    <p>Your manager ${hire.manager} (${hire.managerEmail}) will be your primary contact.</p>
    <p>See you soon!</p>
    <p>HR Team</p>
  `;

  // Build RFC 2822 message
  const message = [
    `To: ${hire.email}`,
    `Cc: ${hire.managerEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}
```

### Orchestrator with Partial Failure Recovery

```typescript
// services/onboarding-orchestrator.ts
import { getClients } from '../lib/workspace-auth';
import { getUnprocessedHires } from './new-hire-reader';
import { createOrientationEvent } from './calendar-service';
import { createOnboardingFolder } from './drive-service';
import { sendWelcomeEmail } from './gmail-service';

export async function processNewHires() {
  const clients = getClients(process.env.HR_ADMIN_EMAIL!);
  const spreadsheetId = process.env.ONBOARDING_SHEET_ID!;
  const templateFolderId = process.env.TEMPLATE_FOLDER_ID!;

  const hires = await getUnprocessedHires(clients.sheets, spreadsheetId);

  for (const hire of hires) {
    const result: Record<string, string> = {};
    let status = 'complete';

    try {
      result.calendarLink = await createOrientationEvent(clients.calendar, hire);
    } catch (err) {
      console.error(`Calendar failed for ${hire.name}:`, err);
      result.calendarLink = 'FAILED';
      status = 'partial';
    }

    try {
      const folder = await createOnboardingFolder(clients.drive, hire, templateFolderId);
      result.folderUrl = folder.folderUrl;
    } catch (err) {
      console.error(`Drive failed for ${hire.name}:`, err);
      result.folderUrl = 'FAILED';
      status = 'partial';
    }

    try {
      await sendWelcomeEmail(
        clients.gmail, hire,
        result.calendarLink ?? '#',
        result.folderUrl ?? '#',
      );
    } catch (err) {
      console.error(`Gmail failed for ${hire.name}:`, err);
      status = 'partial';
    }

    // Update the Sheet with results regardless of partial failures
    await clients.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `New Hires!G${hire.rowIndex}:J${hire.rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          status,
          result.calendarLink ?? '',
          result.folderUrl ?? '',
          new Date().toISOString(),
        ]],
      },
    });
  }
}
```

## Key Decisions

- **Domain-wide delegation with `subject` impersonation** -- the service account acts as the HR admin so that calendar events and emails come from a real person, not a service account address.
- **Four narrow scopes instead of broad access** -- requesting only `spreadsheets`, `calendar`, `drive`, and `gmail.send` reduces the security surface and simplifies consent review.
- **Partial failure recovery** -- each API call is wrapped independently so that a Drive failure does not block the calendar event or email. The Sheet records partial status for manual follow-up.
- **`supportsAllDrives: true` on Drive operations** -- ensures the service works with both personal and shared drives, preventing silent failures when the onboarding folder is on a shared drive.
- **RFC 2822 message construction for Gmail** -- the Gmail API requires base64url-encoded MIME messages. Building the message manually avoids heavy email library dependencies.
- **Sheet as the source of truth** -- the orchestrator reads pending hires and writes status back to the same Sheet, making the process visible to HR without a separate dashboard.
