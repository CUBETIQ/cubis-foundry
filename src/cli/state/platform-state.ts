import { homedir } from "node:os";
import { join } from "node:path";

/**
 * The directory name inside the user's home where state files live.
 */
const FOUNDRY_STATE_DIR = ".foundry/state";

/**
 * Cached home directory.  Tests can replace this by calling setFoundryHomedir().
 */
let _homedir: string = homedir();

/**
 * Returns the path to the state file for the given platform.
 */
export function getStatePath(platform: string): string {
  return join(_homedir, FOUNDRY_STATE_DIR, `${platform}.json`);
}

/**
 * Returns the state directory path (~/.foundry/state/).
 * Tests can override this by calling setFoundryHomedir().
 */
export function getStateDir(): string {
  return join(_homedir, FOUNDRY_STATE_DIR);
}

/**
 * Overrides the home directory used by getStatePath() and getStateDir().
 * Call this in `beforeEach` so all state operations use the fake directory.
 */
export function setFoundryHomedir(path: string): void {
  _homedir = path;
}
