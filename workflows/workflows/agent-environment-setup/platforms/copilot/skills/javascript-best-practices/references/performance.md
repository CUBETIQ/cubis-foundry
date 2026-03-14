# Performance Reference

## Profiling Before Optimizing

### Node.js Profiling

```bash
# CPU profile with V8 built-in
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Flame graph with clinic.js
npx clinic flame -- node app.js
npx clinic doctor -- node app.js

# Heap snapshot
node --inspect app.js
# Open chrome://inspect -> Memory -> Take heap snapshot
```

### Chrome DevTools Performance

1. Open DevTools -> Performance tab
2. Click Record, perform the action, click Stop
3. Look for long tasks (>50ms) in the Main thread
4. Check "Bottom-Up" tab for the most expensive functions
5. Look for layout thrashing (repeated style recalculation + layout)

### Deno Benchmarking

```javascript
Deno.bench('JSON.parse small object', () => {
  JSON.parse('{"id": 1, "name": "test"}');
});

Deno.bench('structuredClone vs JSON roundtrip', { group: 'clone' }, (b) => {
  const obj = { a: 1, b: [2, 3], c: { d: new Date() } };
  b.start();
  structuredClone(obj);
  b.end();
});
```

## Memory Optimization

### Avoid Memory Leaks

```javascript
// LEAK: Event listeners without cleanup
class DataStream {
  constructor(emitter) {
    // BAD: arrow function creates a new reference each time,
    // preventing removal
    emitter.on('data', (d) => this.process(d));
  }
}

// FIXED: Named handler + cleanup
class DataStream {
  #handler;
  #emitter;

  constructor(emitter) {
    this.#emitter = emitter;
    this.#handler = (d) => this.process(d);
    emitter.on('data', this.#handler);
  }

  [Symbol.dispose]() {
    this.#emitter.off('data', this.#handler);
  }
}
```

### Streams for Large Data

```javascript
// BAD: loads entire file into memory
const data = await readFile('large-dataset.json', 'utf-8');
const records = JSON.parse(data); // Two copies in memory

// GOOD: stream-process line by line
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const processLargeFile = async (path) => {
  const stream = createReadStream(path, { encoding: 'utf-8' });
  const lines = createInterface({ input: stream });

  let count = 0;
  for await (const line of lines) {
    const record = JSON.parse(line);
    await processRecord(record);
    count++;
  }
  return count;
};
```

### Node.js pipeline for Backpressure-Safe Piping

```javascript
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';

const transform = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const line = chunk.toString();
    const record = JSON.parse(line);
    record.processedAt = Date.now();
    callback(null, JSON.stringify(record) + '\n');
  },
});

await pipeline(
  createReadStream('input.jsonl'),
  transform,
  createWriteStream('output.jsonl')
);
// Backpressure handled automatically: if the writer is slow,
// the reader pauses.
```

## Startup Time Optimization

### Lazy Imports

```javascript
// BAD: imports everything at startup even if rarely used
import sharp from 'sharp';       // 50ms to import
import puppeteer from 'puppeteer'; // 200ms to import

// GOOD: defer expensive imports
const resizeImage = async (buffer) => {
  const { default: sharp } = await import('sharp');
  return sharp(buffer).resize(800, 600).toBuffer();
};
```

### Snapshot for Faster Cold Starts

```bash
# Node.js startup snapshot (experimental)
node --build-snapshot --snapshot-blob=snapshot.blob app.js
node --snapshot-blob=snapshot.blob app.js
# Skips parsing and compiling on subsequent starts
```

## Bundle Size Reduction

### Analyze Bundle Contents

```bash
# Vite
npx vite-bundle-visualizer

# esbuild
esbuild src/index.js --bundle --analyze=verbose --outfile=/dev/null

# webpack
npx webpack-bundle-analyzer stats.json
```

### Reduce Bundle Size

```javascript
// 1. Use specific imports instead of entire libraries
// BAD: imports all of lodash (71KB min)
import _ from 'lodash';
// GOOD: import individual functions (4KB)
import debounce from 'lodash-es/debounce';
// BETTER: use native alternatives
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// 2. Dynamic import for route-level code splitting
const AdminPanel = lazy(() => import('./admin/AdminPanel.js'));

// 3. Mark packages as side-effect-free
// package.json: "sideEffects": false
// Or per-file: "sideEffects": ["./src/polyfills.js"]
```

## Runtime Performance Patterns

### Object Shape Optimization

```javascript
// V8 optimizes objects with consistent shapes (hidden classes).
// BAD: adding properties conditionally creates different shapes
const createUser = (data) => {
  const user = { name: data.name };
  if (data.email) user.email = data.email;  // Different shape!
  if (data.age) user.age = data.age;        // Another shape!
  return user;
};

// GOOD: always initialize all properties (even if undefined)
const createUser = (data) => ({
  name: data.name,
  email: data.email ?? null,
  age: data.age ?? null,
});
```

### Avoid Megamorphic Call Sites

```javascript
// BAD: passing different object shapes to the same function
// causes V8 to deoptimize (megamorphic inline cache)
const getLength = (thing) => thing.length;
getLength([1, 2, 3]);      // Array shape
getLength('hello');          // String shape
getLength({ length: 5 });   // Object shape
// V8 gives up optimizing this function after 4+ shapes

// GOOD: separate functions for different types or use a
// consistent interface
```

### Typed Arrays for Numeric Processing

```javascript
// Regular arrays use 8 bytes per element (boxed)
const regular = new Array(1_000_000).fill(0);

// Typed arrays use exact bytes per element (unboxed)
const float64 = new Float64Array(1_000_000);  // 8 bytes, but faster access
const uint32 = new Uint32Array(1_000_000);    // 4 bytes per element
const uint8 = new Uint8Array(1_000_000);      // 1 byte per element

// 10-100x faster for numeric computation
```

### Web Workers for CPU-Bound Tasks

```javascript
// Main thread
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
});

const result = await new Promise((resolve) => {
  worker.onmessage = (e) => resolve(e.data);
  worker.postMessage({ data: largeArray });
});

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

## Performance Checklist

| Area | Check | Tool |
| --- | --- | --- |
| Bundle size | < 100KB gzipped for initial load | `vite-bundle-visualizer` |
| Time to Interactive | < 3s on mid-tier mobile | Chrome Lighthouse |
| Memory | No unbounded growth over time | Chrome DevTools Memory |
| CPU | No main-thread tasks > 50ms | Chrome DevTools Performance |
| Network | Concurrent request count < 6 per origin | Network tab waterfall |
| Server startup | < 500ms cold start | `node --prof`, `time node app.js` |
