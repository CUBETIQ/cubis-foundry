import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { getStateDir, getStatePath } from "./platform-state.js";

export interface InstalledAsset {
  path: string;
  checksum: string;
  installedAt: string;
  sourceModule: string;
}

export interface InstallState {
  schemaVersion: number;
  platform: string;
  version: string;
  installedAt: string;
  assets: InstalledAsset[];
}

/**
 * Reads the state file for a given platform.
 * Returns null if the file does not exist.
 */
export function readState(platform: string): InstallState | null {
  const filePath = getStatePath(platform);
  if (!existsSync(filePath)) {
    return null;
  }
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as InstallState;
}

/**
 * Writes the state file for a given platform.
 * Creates the ~/.foundry/state/ directory if it does not exist.
 */
export function writeState(platform: string, state: InstallState): void {
  const filePath = getStatePath(platform);
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

/**
 * Reads the current state for a platform, passes it to the updater function,
 * and writes the result back.  Returns the updated state.
 *
 * If the platform state does not exist, the updater receives null and must
 * return a valid initial state.
 */
export function patchState(
  platform: string,
  updater: (state: InstallState | null) => InstallState,
): InstallState {
  const current = readState(platform);
  const updated = updater(current);
  writeState(platform, updated);
  return updated;
}

/**
 * Returns the list of platform keys that have a state file in ~/.foundry/state/.
 */
export function listInstalledPlatforms(): string[] {
  const stateDir = getStateDir();
  if (!existsSync(stateDir)) {
    return [];
  }
  return readdirSync(stateDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/**
 * Deletes the state file for a given platform.  Idempotent — does nothing
 * if the file does not exist.
 */
export function clearState(platform: string): void {
  const filePath = getStatePath(platform);
  if (existsSync(filePath)) {
    rmSync(filePath);
  }
}
