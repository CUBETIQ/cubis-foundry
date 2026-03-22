#!/usr/bin/env node

import { rm } from "node:fs/promises";
import path from "node:path";

await rm(path.resolve("dist", "cli"), { recursive: true, force: true });
