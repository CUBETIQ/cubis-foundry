# Foundry Foundation Docs Handoff

Date: 2026-04-03  
Repo: `/Users/phumrin/Documents/Cubis Foundry`  
Branch: `v2`  
HEAD: `05c62f4c1db5d2b70c885c3abc6d3aaaf40b8fd1`

## Current Branch State

- Active checkout: `v2`
- Latest pushed commit: `05c62f4c` (`feat(foundry): expand architecture build foundation docs`)
- Worktree status at handoff time: clean
- Remote status: `origin/v2` includes `05c62f4c`

## What Landed

This branch update expands `cbx build architecture` so the managed foundation-doc contract now includes:

- `docs/foundation/STRUCTURE.md`
- `docs/foundation/DESIGN.md`

The change also updates:

- architecture-build scaffolding
- architecture-build prompt contract
- README generated-doc listing
- context-doc capability metadata
- generated platform command surfaces for Gemini and Antigravity
- architecture-build tests and related coverage

## Last Successful Verification

The latest full repo verification run that completed successfully in this session was:

```bash
npm run test:ci
```

That run passed:

- generated asset checks
- skill mirror checks
- MCP manifest checks
- MCP rule checks
- `test:attributes`
- `test:cli-help`
- `test:build-architecture`
- `test:smoke`

## Real Platform Testing Summary

Real temp-workspace `build architecture` testing was run across supported platforms instead of relying only on repo stubs.

Shared temp root from the first multi-platform pass:

- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ`

Observed outcomes:

- `codex`: reached real `codex exec`, scaffolded `docs/foundation/*`, then hung inside Codex CLI without completing generation
- `claude`: failed immediately because the local Claude CLI account was not logged in
- `gemini`: timed out in the default local setup
- `copilot`: timed out; local `copilot` command behaved like a prompt/install shim rather than a ready standalone CLI
- `antigravity`: timed out; likely shares Gemini-path issues

Per-platform result JSON files are in:

- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ/codex/result-codex.json`
- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ/claude/result-claude.json`
- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ/gemini/result-gemini.json`
- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ/copilot/result-copilot.json`
- `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-real-platforms-JH6iBJ/antigravity/result-antigravity.json`

## Gemini Investigation Status

Claude was explicitly skipped after the user confirmed there is no Claude account. Debugging effort then focused on Gemini.

Key findings:

1. `gemini --help` and `gemini --version` hang when run against the real local path `~/.gemini`.
2. The same Gemini CLI works normally when run against a clean temp `HOME`.
3. A full copy of the real `~/.gemini` directory also works when relocated to a temp path.
4. Therefore the hang is path-specific to the real `~/.gemini` location and its live runtime state, not obviously caused by one copied config file.
5. Once Gemini startup is isolated away from that path issue, actual prompt execution still fails with Google permission denial:
   - `Permission 'cloudaicompanion.companions.generateChat' denied`

Useful Gemini temp artifacts:

- working full-copy temp home:
  - `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-gemini-fullcopy-xUrN3p`
- isolated Gemini build run:
  - temp home: `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-gemini-build-home-nBKCK9`
  - temp workspace: `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/cbx-gemini-build-9eZqQz`
- Gemini API error report:
  - `/var/folders/bg/702ybqv14yv94_mflvq_tjwm0000gn/T/gemini-client-error-generateJson-api-2026-04-03T07-26-39-266Z.json`

Additional Gemini notes:

- the real `~/.gemini/antigravity-browser-profile/Default/LOCK` file appears stale
- `lsof` showed no process holding that lock at inspection time
- many stale Chromium-style `LOCK` files exist under the real browser profile
- file-content isolation did not reproduce the hang when copied elsewhere

## Suggested Next Steps

Resume with Gemini only.

Recommended order:

1. Non-destructively back up the real `~/.gemini/antigravity-browser-profile` and `~/.gemini/tmp` paths.
2. Re-test `gemini --help` and `gemini --version` against the real `~/.gemini` path.
3. If Gemini startup recovers, rerun `cbx build architecture --platform gemini` in a fresh temp workspace.
4. If startup works but content generation still fails, fix the Google auth/project permission problem for `cloudaicompanion.companions.generateChat`.
5. Revisit `antigravity` only after Gemini is stable, since that path likely depends on the same Gemini runtime health.

## Resume Commands

From repo root:

```bash
git checkout v2
git pull origin v2
npm run build:cli
```

Gemini quick checks:

```bash
gemini --help
gemini --version
```

Repo verification:

```bash
npm run test:ci
```
