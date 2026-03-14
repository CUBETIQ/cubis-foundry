# Modules & Bundling Reference

## ESM vs CJS: Choosing the Right Format

### ESM (ECMAScript Modules) -- Default for New Code

ESM is the language-standard module system. It provides static analysis, tree-shaking, and top-level `await`.

```javascript
// Named exports -- preferred for tree-shaking
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// Default export -- use sparingly, one per module
export default class Calculator { /* ... */ }

// Re-export for public API surfaces
export { add, subtract } from './math.js';

// Namespace import -- when you need the whole module
import * as math from './math.js';
```

### CJS (CommonJS) -- Legacy and Server-Only

CJS is synchronous and dynamic. It cannot be tree-shaken by bundlers.

```javascript
// CJS is still used in: Node.js config files (jest.config.js),
// older libraries, and tools that don't support ESM yet.
const { readFile } = require('node:fs/promises');
module.exports = { myFunction };
```

### package.json Configuration for ESM

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./utils": {
      "import": "./dist/utils.js",
      "require": "./dist/utils.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

Key fields:
- **`"type": "module"`** -- `.js` files are ESM; use `.cjs` for CommonJS files.
- **`"exports"`** -- Controls what consumers can import. Replaces `"main"` and `"module"`.
- **`"sideEffects": false`** -- Tells bundlers every module is safe to tree-shake.
- **Condition order matters**: `"types"` before `"default"` in each condition block.

### __dirname / __filename Replacement in ESM

```javascript
// CJS had __dirname and __filename as globals
// ESM uses import.meta.url instead

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read a file relative to this module
const configPath = join(__dirname, '../config.json');
```

## Bundling Strategies

### Vite (Browser and SSR)

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2024',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

### esbuild (Server and CLI)

```javascript
// build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/index.js',
  external: ['node:*'],  // Don't bundle Node built-ins
  sourcemap: true,
});
```

### tsup (Library Dual-Format)

```javascript
// tsup.config.js
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,  // Single-file output for libraries
  sourcemap: true,
});
```

## Tree-Shaking and Barrel Files

Barrel files (`index.js` that re-exports everything) are the most common tree-shaking blocker.

```javascript
// BAD: barrel re-exports everything
// consumers/index.js
export * from './userService.js';
export * from './orderService.js';
export * from './analyticsService.js';
// Importing { userService } still pulls in orderService and analyticsService
// if the bundler cannot prove they are side-effect-free.

// GOOD: explicit exports
// consumers/index.js
export { UserService } from './userService.js';
export { OrderService } from './orderService.js';
// Only export what the public API needs
```

### Verifying Tree-Shaking

```bash
# Check bundle contents with esbuild
esbuild src/index.js --bundle --analyze | grep "output size"

# Visualize with rollup-plugin-visualizer (Vite)
npx vite-bundle-visualizer
```

## Dynamic Import for Code-Splitting

```javascript
// Lazy-load heavy modules only when needed
const processImage = async (buffer) => {
  const { default: sharp } = await import('sharp');
  return sharp(buffer).resize(800, 600).webp().toBuffer();
};

// Conditional loading based on environment
const logger = await import(
  process.env.NODE_ENV === 'production'
    ? './logger-prod.js'
    : './logger-dev.js'
);
```

## Import Maps (Browser-Native)

```html
<!-- No bundler needed for modern browsers -->
<script type="importmap">
{
  "imports": {
    "lodash-es": "https://cdn.skypack.dev/lodash-es",
    "@/": "./src/"
  }
}
</script>
<script type="module">
import { debounce } from 'lodash-es';
import { App } from '@/app.js';
</script>
```
