# Sheets API Patterns

Load this when reading, writing, formatting, or batch-updating Google Sheets data.

## Reading Data

### Basic Read

```typescript
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: 'Sheet1!A1:D100',
  valueRenderOption: 'UNFORMATTED_VALUE',
  dateTimeRenderOption: 'SERIAL_NUMBER',
});

const rows = response.data.values; // string[][] | undefined
```

### Value Render Options

| Option | Returns | Use When |
|--------|---------|----------|
| `FORMATTED_VALUE` | Display strings: "$1,234.56" | Showing to users directly |
| `UNFORMATTED_VALUE` | Raw values: 1234.56 | Processing numbers in code |
| `FORMULA` | Cell formulas: "=SUM(A1:A10)" | Auditing or copying formulas |

- Default is `FORMATTED_VALUE`, which returns strings for all numeric cells. Always override for data processing.
- `UNFORMATTED_VALUE` returns numbers as numbers and booleans as booleans.

### Date-Time Render Options

| Option | Returns |
|--------|---------|
| `SERIAL_NUMBER` | Days since Dec 30, 1899: 45000 |
| `FORMATTED_STRING` | Locale-formatted: "2023-03-15" |

### Reading Multiple Ranges

```typescript
const response = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges: ['Sheet1!A1:B10', 'Sheet2!A1:C5', 'Config!A1:A20'],
  valueRenderOption: 'UNFORMATTED_VALUE',
});

const [sheet1Data, sheet2Data, configData] = response.data.valueRanges!;
```

- Batch reads count as one API call. Always prefer `batchGet` over multiple `get` calls.

## Writing Data

### Single Range Write

```typescript
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: 'Sheet1!A1:C3',
  valueInputOption: 'RAW',
  requestBody: {
    values: [
      ['Name', 'Score', 'Grade'],
      ['Alice', 95, 'A'],
      ['Bob', 82, 'B'],
    ],
  },
});
```

### Value Input Options

| Option | Behavior | Use When |
|--------|----------|----------|
| `RAW` | Stores values as-is | Writing numbers, IDs, timestamps |
| `USER_ENTERED` | Parses like user typed it | Writing formulas, letting Sheets auto-detect types |

- `RAW` prevents "1/1" from becoming a date. Use for data pipelines.
- `USER_ENTERED` is required when writing formulas like `=SUM(A1:A10)`.
- Never use `USER_ENTERED` for user-provided text -- they might accidentally inject formulas.

### Batch Write

```typescript
await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: {
    valueInputOption: 'RAW',
    data: [
      { range: 'Sheet1!A1', values: [['Updated Name']] },
      { range: 'Sheet1!C5', values: [[99]] },
      { range: 'Sheet2!B2:C2', values: [['Active', new Date().toISOString()]] },
    ],
  },
});
```

### Appending Rows

```typescript
await sheets.spreadsheets.values.append({
  spreadsheetId: SHEET_ID,
  range: 'Sheet1!A:D',          // Append after last row with data
  valueInputOption: 'RAW',
  insertDataOption: 'INSERT_ROWS', // or 'OVERWRITE'
  requestBody: {
    values: [
      ['New Item', 42, 'Category A', new Date().toISOString()],
    ],
  },
});
```

- `INSERT_ROWS` adds new rows. `OVERWRITE` writes into existing empty rows.
- The range only determines which sheet and columns to use. Sheets finds the last row automatically.

## Formatting and Structure

### Conditional Formatting, Borders, Colors

Use `spreadsheets.batchUpdate` with structured requests (not `values` API).

```typescript
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: {
    requests: [
      {
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      {
        autoResizeDimensions: {
          dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 5 },
        },
      },
    ],
  },
});
```

### Creating a New Sheet Tab

```typescript
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: {
    requests: [
      {
        addSheet: {
          properties: {
            title: 'Q1 Report',
            gridProperties: { rowCount: 1000, columnCount: 10 },
          },
        },
      },
    ],
  },
});
```

## Preserving Formulas

When updating cells adjacent to formulas:

1. Read the range with `valueRenderOption: 'FORMULA'` to see which cells contain formulas.
2. Write only to non-formula cells using specific cell ranges, not entire row ranges.
3. Use `RAW` input option for data cells; formulas are not affected if you do not write to their cells.

```typescript
// Bad: overwrites the entire row including formula in column D
await sheets.spreadsheets.values.update({
  range: 'Sheet1!A2:D2',
  requestBody: { values: [['Name', 100, 'Cat', 'oops formula gone']] },
});

// Good: write only to columns A-C, preserving the formula in D
await sheets.spreadsheets.values.update({
  range: 'Sheet1!A2:C2',
  requestBody: { values: [['Name', 100, 'Cat']] },
});
```

## Pagination for Large Sheets

The Sheets API returns all rows in a range by default. For very large sheets:

```typescript
async function readInChunks(sheetId: string, sheetName: string, chunkSize = 1000) {
  const allRows: any[][] = [];
  let startRow = 2; // skip header

  while (true) {
    const range = `${sheetName}!A${startRow}:Z${startRow + chunkSize - 1}`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = response.data.values ?? [];
    if (rows.length === 0) break;

    allRows.push(...rows);
    startRow += chunkSize;
  }

  return allRows;
}
```

## Quota Management

- **Read requests**: 60 per minute per user, 300 per minute per project.
- **Write requests**: 60 per minute per user, 300 per minute per project.
- Batch operations (batchGet, batchUpdate) count as one request regardless of sub-operations.
- Always use batch operations when performing multiple reads or writes.
- Implement exponential backoff for 429 (rate limit) errors.
