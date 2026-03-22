#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT_DIR
CLI="$ROOT_DIR/bin/cubis.js"
EXPECTED_WORKFLOW_COUNT="$(find "$ROOT_DIR/workflows/workflows/agent-environment-setup/shared/workflows" -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')"
EXPECTED_AGENT_COUNT="$(find "$ROOT_DIR/workflows/workflows/agent-environment-setup/shared/agents" -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')"
EXPECTED_ROUTE_COMMAND_COUNT="$((EXPECTED_WORKFLOW_COUNT + EXPECTED_AGENT_COUNT))"
export EXPECTED_WORKFLOW_COUNT EXPECTED_AGENT_COUNT EXPECTED_ROUTE_COMMAND_COUNT

CURRENT_STEP="bootstrap"

fail_step() {
  local message="$1"
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "::error title=Smoke workflow failure::${CURRENT_STEP}: ${message}" >&2
  fi
  echo "[FAIL] ${CURRENT_STEP}: ${message}" >&2
  exit 1
}

trap 'status=$?; if [ "$status" -ne 0 ]; then fail_step "command failed (exit $status) at line $LINENO"; fi' ERR

if [ ! -f "$CLI" ]; then
  fail_step "CLI entry not found at $CLI"
fi

TMP_DIR="$(mktemp -d /tmp/cbx-smoke.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT
export HOME="$TMP_DIR/home"
mkdir -p "$HOME"

rg_or_fail() {
  if command -v rg >/dev/null 2>&1; then
    rg "$@"
    return
  fi
  fail_step "ripgrep is required for smoke assertions in this environment"
}

log_step() {
  CURRENT_STEP="$1"
  echo
  echo "== $1 =="
}

log_ok() {
  echo "[OK] $1"
}

assert_file_contains_literal() {
  local file="$1"
  local needle="$2"
  local label="$3"
  if ! grep -Fq "$needle" "$file"; then
    fail_step "$label missing '$needle' in $file"
  fi
}

log_step "Workspace"
echo "TMP=$TMP_DIR"

log_step "Generated asset drift check"
node "$ROOT_DIR/scripts/generate-platform-assets.mjs" --check >/tmp/cbx-generate-assets-check.log
log_ok "Shared -> platform generated assets are in sync"

log_step "Catalog parity precheck"
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const root = process.env.ROOT_DIR;
if (!root) {
  console.error('[FAIL] ROOT_DIR env is required');
  process.exit(1);
}
function listSkillDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && fs.existsSync(path.join(dir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}
const canonical = listSkillDirs(path.join(root, 'workflows', 'skills'));
for (const label of ['copilot', 'claude']) {
  const mirror = listSkillDirs(path.join(root, 'workflows', 'workflows', 'agent-environment-setup', 'platforms', label, 'skills'));
  if (mirror.length !== canonical.length) {
    console.error(`[FAIL] ${label} skill mirror count mismatch: expected ${canonical.length}, got ${mirror.length}`);
    process.exit(1);
  }
}
NODE
log_ok "Canonical and mirrors are in parity"

cd "$TMP_DIR"

log_step "A1 add codex dry-run"
node "$CLI" add codex --dry-run >/tmp/cbx-a1.log
[ ! -d .codex/agents ]
log_ok "Dry-run add does not write codex files"

log_step "A2 add codex apply"
node "$CLI" add codex --yes >/tmp/cbx-a2.log
[ -f AGENTS.md ]
[ -f cbx_manifest.json ]
[ -f cbx_workspace.md ]
[ -d .codex/agents ]
[ -f .codex/agents/implementer.toml ]
[ -f .codex/agents/reviewer.toml ]
[ -f .agents/skills/implement/SKILL.md ]
[ -f .agents/skills/loop/SKILL.md ]
if [ "$(find .codex/agents -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "$EXPECTED_AGENT_COUNT" ]; then
  fail_step "Codex expected exactly $EXPECTED_AGENT_COUNT agent files"
fi
node - <<'NODE'
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('cbx_manifest.json', 'utf8'));
if (!Array.isArray(manifest.installedPlatforms) || !manifest.installedPlatforms.includes('codex')) {
  console.error('[FAIL] Workspace manifest did not record codex as installed');
  process.exit(1);
}
NODE
log_ok "Codex control-plane install writes manifest, summary, agents, and workflow skills"

log_step "A3 add antigravity apply"
node "$CLI" add antigravity --yes >/tmp/cbx-a3.log
[ -f .agents/rules/GEMINI.md ]
[ -d .gemini/commands ]
[ -f .gemini/commands/plan.toml ]
[ -f .gemini/commands/implement.toml ]
[ -f .gemini/commands/debug.toml ]
[ -f .gemini/commands/test.toml ]
[ -f .gemini/commands/review.toml ]
[ -f .gemini/commands/deploy.toml ]
[ -f .gemini/commands/loop.toml ]
[ -f .gemini/commands/agent-orchestrator.toml ]
[ -f .gemini/commands/agent-reviewer.toml ]
if [ "$(find .gemini/commands -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "$EXPECTED_ROUTE_COMMAND_COUNT" ]; then
  fail_step "Antigravity expected exactly $EXPECTED_ROUTE_COMMAND_COUNT Gemini command files"
fi
log_ok "Antigravity install writes the lean 7 workflow and 7 agent commands"

log_step "A4 profile set strict"
node "$CLI" profile set strict >/tmp/cbx-a4.log
node - <<'NODE'
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('cbx_manifest.json', 'utf8'));
if (manifest.hookProfile !== 'strict') {
  console.error(`[FAIL] Expected hookProfile=strict, got ${manifest.hookProfile}`);
  process.exit(1);
}
NODE
log_ok "Workspace profile command updates hook profile in manifest"

log_step "A5 harness audit"
node "$CLI" harness audit --format json >./cbx-a5.json
rg_or_fail -n '"overall": "pass"' ./cbx-a5.json >/dev/null
[ -f .cbx/harness/audit/latest.json ]
log_ok "Harness audit executes and writes the latest audit artifact"

log_step "A6 loop lifecycle"
node "$CLI" loop start --task "Verify loop runtime wiring" --completion-criteria "status file exists" --max-iterations 3 >/tmp/cbx-a6-start.log
LOOP_ID="$(awk -F': ' '/^Loop run:/ {print $2}' /tmp/cbx-a6-start.log | tail -n 1)"
if [ -z "$LOOP_ID" ]; then
  fail_step "Could not parse loop run id from loop start output"
fi
[ -f ".cbx/harness/loops/$LOOP_ID/status.json" ]
node "$CLI" loop status --id "$LOOP_ID" --json >./cbx-a6-status.json
rg_or_fail -n "\"id\": \"$LOOP_ID\"" ./cbx-a6-status.json >/dev/null
rg_or_fail -n '"status": "active"' ./cbx-a6-status.json >/dev/null
node "$CLI" loop stop --id "$LOOP_ID" --reason "smoke test complete" >/tmp/cbx-a6-stop.log
node "$CLI" loop status --id "$LOOP_ID" --json >./cbx-a6-status-stopped.json
rg_or_fail -n '"status": "stopped"' ./cbx-a6-status-stopped.json >/dev/null
log_ok "Loop start/status/stop writes bounded runtime state"

log_step "A7 workflows install backward compatibility (copilot)"
node "$CLI" workflows install --platform copilot --bundle agent-environment-setup --overwrite --yes >/tmp/cbx-a7.log
[ -f .github/copilot-instructions.md ]
[ -d .github/agents ]
[ -d .github/prompts ]
[ -f .github/agents/reviewer.agent.md ]
[ -f .github/prompts/plan.prompt.md ]
[ -f .github/prompts/loop.prompt.md ]
if [ "$(find .github/agents -maxdepth 1 -type f -name '*.agent.md' | wc -l | tr -d ' ')" -ne "$EXPECTED_AGENT_COUNT" ]; then
  fail_step "Copilot expected exactly $EXPECTED_AGENT_COUNT agent files"
fi
if [ "$(find .github/prompts -maxdepth 1 -type f -name '*.prompt.md' | wc -l | tr -d ' ')" -ne "$EXPECTED_WORKFLOW_COUNT" ]; then
  fail_step "Copilot expected exactly $EXPECTED_WORKFLOW_COUNT prompt files"
fi
log_ok "Legacy workflows install still projects the lean catalog to Copilot"

log_step "A8 rules init and sync idempotency"
node "$CLI" rules init --platform codex --scope project --overwrite >/tmp/cbx-a8-rules.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
node "$CLI" workflows sync-rules --platform codex >/tmp/cbx-a8-sync1.log
node "$CLI" workflows sync-rules --platform codex >/tmp/cbx-a8-sync2.log
rg_or_fail -n 'Action: unchanged' /tmp/cbx-a8-sync2.log >/dev/null
log_ok "Rules init works and sync-rules stays idempotent"

log_step "A9 init wizard dry-run"
node "$CLI" init --yes --dry-run --no-banner \
  --bundle agent-environment-setup \
  --stack cli \
  --profile developer \
  --authoring-ai codex \
  --platforms codex \
  --mcps cubis-foundry >/tmp/cbx-a9.log
rg_or_fail -n 'Workspace profile: developer' /tmp/cbx-a9.log >/dev/null
rg_or_fail -n 'Detected stack: cli' /tmp/cbx-a9.log >/dev/null
rg_or_fail -n 'Authoring AI: codex' /tmp/cbx-a9.log >/dev/null
rg_or_fail -n 'Context generation: generate' /tmp/cbx-a9.log >/dev/null
log_ok "Init dry-run reports the new project-first summary"

log_step "A10 init wizard PTY flow"
node "$ROOT_DIR/scripts/run-init-tty-test.mjs" "$CLI" >/tmp/cbx-a10.log
if rg_or_fail -n 'TTY_INIT_OK|TTY_INIT_SKIPPED' /tmp/cbx-a10.log >/dev/null; then
  log_ok "Init wizard PTY path is working or intentionally skipped"
else
  fail_step "Init wizard PTY test did not report success or skip"
fi

log_step "DONE"
echo "ALL_OK"
