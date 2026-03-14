# Example: Google Sheets Data Read/Write with Node.js

## Scenario

A team is building an inventory management dashboard that reads product data from a Google Sheet maintained by the operations team and writes back updated stock counts after warehouse scans. The application uses a service account for server-to-server authentication, reads data with proper type handling, writes updates while preserving existing formulas in calculated columns, and implements error handling for quota limits.

## Prompt

"Build a Node.js service that reads product inventory from a Google Sheet and writes updated stock counts. Use a service account for authentication. Read the 'Inventory' sheet preserving proper types (numbers, dates). Write stock updates to specific cells without overwriting formulas in the 'Total Value' column. Handle rate limiting with exponential backoff."

## Expected Output

### Service Account Setup

```typescript
// lib/google-auth.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function getAuthClient(): JWT {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
  return auth;
}

export function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}
```

### Read Inventory Data

```typescript
// services/inventory-reader.ts
import { getSheetsClient } from '../lib/google-auth';

interface Product {
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  lastUpdated: Date | null;
  // totalValue is a formula column -- we read it but never write to it
  totalValue: number;
}

const SPREADSHEET_ID = process.env.INVENTORY_SHEET_ID!;
const RANGE = 'Inventory!A2:F500'; // Skip header row

export async function readInventory(): Promise<Product[]> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueRenderOption: 'UNFORMATTED_VALUE', // Get raw numbers, not "$1,234.56"
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows.map((row) => ({
    sku: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    currentStock: Number(row[2] ?? 0),
    reorderPoint: Number(row[3] ?? 0),
    lastUpdated: row[4] ? new Date(row[4]) : null,
    totalValue: Number(row[5] ?? 0),
  }));
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const inventory = await readInventory();
  return inventory.find((p) => p.sku === sku) ?? null;
}
```

### Write Stock Updates

```typescript
// services/inventory-writer.ts
import { getSheetsClient } from '../lib/google-auth';
import { retryWithBackoff } from '../lib/retry';

const SPREADSHEET_ID = process.env.INVENTORY_SHEET_ID!;

interface StockUpdate {
  sku: string;
  newStock: number;
  rowIndex: number; // 0-based index in the data range (row 2 = index 0)
}

export async function updateStock(updates: StockUpdate[]): Promise<void> {
  const sheets = getSheetsClient();

  // Build batch update: only write to stock column (C) and timestamp column (E)
  // Column F (Total Value) contains a formula -- never overwrite it
  const data = updates.map((update) => {
    const sheetRow = update.rowIndex + 2; // +2 for header row and 1-based indexing
    return [
      {
        range: `Inventory!C${sheetRow}`,
        values: [[update.newStock]],
      },
      {
        range: `Inventory!E${sheetRow}`,
        values: [[new Date().toISOString()]],
      },
    ];
  }).flat();

  await retryWithBackoff(async () => {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW', // Write values as-is, don't interpret as formulas
        data,
      },
    });
  });
}

export async function appendNewProduct(
  sku: string,
  name: string,
  stock: number,
  reorderPoint: number,
): Promise<void> {
  const sheets = getSheetsClient();

  await retryWithBackoff(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A:F',
      valueInputOption: 'USER_ENTERED', // Allow formulas in the appended row
      requestBody: {
        values: [[
          sku,
          name,
          stock,
          reorderPoint,
          new Date().toISOString(),
          `=C{ROW}*VLOOKUP(A{ROW},Prices!A:B,2,FALSE)`, // Formula for total value
        ]],
      },
    });
  });
}
```

### Retry with Exponential Backoff

```typescript
// lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelayMs: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.response?.status ?? error?.code;

      // Retry on rate limit (429) and server errors (500, 503)
      if (attempt < maxRetries && (status === 429 || status >= 500)) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(
          `Request failed with ${status}, retrying in ${Math.round(delay)}ms ` +
          `(attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### API Route

```typescript
// app/api/inventory/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readInventory } from '@/services/inventory-reader';
import { updateStock } from '@/services/inventory-writer';

export async function POST(req: NextRequest) {
  const { updates } = await req.json() as {
    updates: Array<{ sku: string; newStock: number }>;
  };

  // Read current inventory to find row indices
  const inventory = await readInventory();
  const skuToRow = new Map(
    inventory.map((p, index) => [p.sku, index])
  );

  const stockUpdates = updates
    .filter((u) => skuToRow.has(u.sku))
    .map((u) => ({
      sku: u.sku,
      newStock: u.newStock,
      rowIndex: skuToRow.get(u.sku)!,
    }));

  if (stockUpdates.length === 0) {
    return NextResponse.json({ error: 'No matching SKUs found' }, { status: 400 });
  }

  await updateStock(stockUpdates);

  return NextResponse.json({
    updated: stockUpdates.length,
    skus: stockUpdates.map((u) => u.sku),
  });
}
```

## Key Decisions

- **Service account over OAuth2** -- server-to-server operations do not involve a user, so a service account with domain delegation is appropriate and avoids token refresh handling.
- **`UNFORMATTED_VALUE` for reads** -- returns raw numbers and booleans instead of locale-formatted strings, preventing parsing errors (e.g., "$1,234.56" as a string instead of 1234.56 as a number).
- **`RAW` valueInputOption for stock writes** -- ensures numbers are stored as numbers, not accidentally interpreted as dates or formulas by Sheets' auto-detection.
- **`USER_ENTERED` for appending with formulas** -- allows the formula in the Total Value column to be interpreted by Sheets when appending new rows.
- **Selective column writes** -- the batch update targets only columns C and E, preserving the formula in column F (Total Value) that references external data.
- **Exponential backoff with jitter** -- Google Sheets API enforces 60 requests per minute per user. Backoff with random jitter prevents thundering herd when multiple instances retry simultaneously.
