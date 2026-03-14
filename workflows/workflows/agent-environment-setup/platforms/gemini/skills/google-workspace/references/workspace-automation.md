# Workspace Automation

Load this when building multi-service workflows, batch operations, push notifications, or automated processes with Google Workspace APIs.

## Batch Requests

Combine up to 100 API calls into a single HTTP request to reduce latency and quota consumption.

### Google API Client Batching

```typescript
import { google } from 'googleapis';

const drive = google.drive({ version: 'v3', auth });

// Create a batch request
const batch = new google.Batch();

const fileIds = ['file1', 'file2', 'file3', 'file4', 'file5'];

for (const fileId of fileIds) {
  batch.add(
    drive.files.get({ fileId, fields: 'id, name, mimeType, modifiedTime' })
  );
}

const responses = await batch.execute();
```

### Manual Batch with Promise.allSettled

When the client library batch API is not available or practical:

```typescript
async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5,
): Promise<Array<{ status: 'fulfilled'; value: R } | { status: 'rejected'; reason: any }>> {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map(processor)
    );
    results.push(...chunkResults);

    // Respect rate limits: pause between batches
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Usage
const results = await batchProcess(
  fileIds,
  async (fileId) => {
    const res = await drive.files.get({ fileId, fields: 'id, name' });
    return res.data;
  },
  10 // process 10 files concurrently
);
```

## Push Notifications (Watch API)

### Drive Change Notifications

```typescript
import { v4 as uuidv4 } from 'uuid';

// Register a watch channel
const channel = await drive.files.watch({
  fileId: 'spreadsheet_id_here',
  requestBody: {
    id: uuidv4(),                    // Unique channel ID
    type: 'web_hook',
    address: 'https://api.example.com/webhooks/drive',
    expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
});

// Channel expires. Set up a cron job to renew before expiration.
console.log('Channel ID:', channel.data.id);
console.log('Resource ID:', channel.data.resourceId);
console.log('Expiration:', channel.data.expiration);
```

### Calendar Change Notifications

```typescript
const watchResponse = await calendar.events.watch({
  calendarId: 'primary',
  requestBody: {
    id: uuidv4(),
    type: 'web_hook',
    address: 'https://api.example.com/webhooks/calendar',
  },
});
```

### Webhook Handler

```typescript
// POST /webhooks/drive
app.post('/webhooks/drive', (req, res) => {
  const channelId = req.headers['x-goog-channel-id'];
  const resourceState = req.headers['x-goog-resource-state'];
  const resourceId = req.headers['x-goog-resource-id'];

  // Verify this is a known channel
  if (!isValidChannel(channelId)) {
    return res.status(403).send('Unknown channel');
  }

  if (resourceState === 'sync') {
    // Initial sync notification -- confirms the channel is active
    return res.status(200).send('OK');
  }

  if (resourceState === 'update' || resourceState === 'change') {
    // Resource changed. Fetch the latest state.
    processResourceChange(resourceId);
  }

  res.status(200).send('OK');
});
```

### Stopping a Watch Channel

```typescript
await drive.channels.stop({
  requestBody: {
    id: channelId,
    resourceId: resourceId,
  },
});
```

- Channels expire after at most 7 days. Renew before expiration.
- The webhook receives a notification that something changed, not what changed. You must fetch the resource to see the new state.
- Always respond with HTTP 200 quickly. Google retries on non-2xx responses.

## Drive Automation Patterns

### Recursive Folder Listing

```typescript
async function listAllFiles(
  drive: any,
  folderId: string,
  files: any[] = []
): Promise<any[]> {
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of response.data.files ?? []) {
      files.push(file);
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        await listAllFiles(drive, file.id, files);
      }
    }

    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}
```

### File Export (Google Docs to PDF)

```typescript
async function exportAsPdf(drive: any, fileId: string): Promise<Buffer> {
  const response = await drive.files.export(
    { fileId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data);
}
```

## Calendar Automation

### Free/Busy Availability Check

```typescript
const response = await calendar.freebusy.query({
  requestBody: {
    timeMin: new Date('2024-03-01T09:00:00Z').toISOString(),
    timeMax: new Date('2024-03-01T17:00:00Z').toISOString(),
    items: [
      { id: 'user1@example.com' },
      { id: 'user2@example.com' },
    ],
  },
});

for (const [calendarId, data] of Object.entries(response.data.calendars!)) {
  const busy = (data as any).busy;
  console.log(`${calendarId}: ${busy.length} busy periods`);
}
```

### Recurring Events

```typescript
const event = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: 'Weekly Standup',
    start: { dateTime: '2024-03-04T09:00:00', timeZone: 'America/New_York' },
    end: { dateTime: '2024-03-04T09:15:00', timeZone: 'America/New_York' },
    recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=52'],
    attendees: [
      { email: 'team@example.com' },
    ],
  },
});
```

## Error Recovery Patterns

### Partial Failure Tracking

```typescript
interface OperationResult {
  id: string;
  success: boolean;
  error?: string;
}

async function processWithRecovery<T>(
  items: T[],
  processor: (item: T) => Promise<string>,
  getId: (item: T) => string,
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];

  for (const item of items) {
    try {
      await processor(item);
      results.push({ id: getId(item), success: true });
    } catch (error: any) {
      results.push({
        id: getId(item),
        success: false,
        error: error.message ?? String(error),
      });
    }
  }

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.warn(`${failed.length}/${results.length} operations failed:`,
      failed.map(f => `${f.id}: ${f.error}`).join(', ')
    );
  }

  return results;
}
```

### Idempotent Operations

- Use `fileId` checks before creating files to avoid duplicates on retry.
- Use `eventId` for calendar events to prevent duplicate events.
- Store operation IDs in your database to track completed steps in multi-service workflows.
- Design each step to be safely re-runnable. Check for existing resources before creating new ones.
