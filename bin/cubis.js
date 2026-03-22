#!/usr/bin/env node

import("../dist/cli/index.js").catch((error) => {
  console.error(
    "\nError: failed to load compiled CLI runtime at dist/cli/index.js.",
  );
  console.error("Run `npm run build:cli` and retry.");
  if (error?.message) {
    console.error(`Details: ${error.message}`);
  }
  process.exit(1);
});
