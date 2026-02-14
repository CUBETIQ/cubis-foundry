#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT_DIR/bin/cubis.js"

if [ ! -f "$CLI" ]; then
  echo "ERROR: CLI entry not found at $CLI" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d /tmp/cbx-fulltest.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

log_ok() {
  echo "[OK] $1"
}

log_step() {
  echo "\n== $1 =="
}

log_step "Workspace"
echo "TMP=$TMP_DIR"
cd "$TMP_DIR"

log_step "A1 Antigravity dry-run install"
node "$CLI" workflows install --platform antigravity --bundle agent-environment-setup --dry-run >/tmp/cbx-a1.log
if [ -d .agent ] || [ -f .agent/rules/GEMINI.md ]; then
  echo "[FAIL] Dry-run wrote Antigravity files" >&2
  exit 1
fi
log_ok "Dry-run did not write Antigravity files"

log_step "A2 Antigravity apply"
node "$CLI" workflows install --platform antigravity --bundle agent-environment-setup --yes >/tmp/cbx-a2.log
[ -f .agent/rules/GEMINI.md ]
[ -f .agent/workflows/backend.md ]
[ -f .agent/workflows/security.md ]
[ -f .agent/workflows/database.md ]
[ -f .agent/workflows/mobile.md ]
[ -f .agent/workflows/devops.md ]
[ -f .agent/workflows/qa.md ]
[ -f .agent/agents/backend-specialist.md ]
[ -f .agent/agents/orchestrator.md ]
[ -f .agent/agents/security-auditor.md ]
[ "$(find .agent/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" = "20" ]
[ -d .agent/skills/api-designer ]
log_ok "Antigravity files installed"

log_step "A2.1 /backend wiring check"
rg -n '^command:\s*"/backend"' .agent/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agent/workflows/backend.md >/dev/null
log_ok "Workflow declares /backend and routes to @backend-specialist"

log_step "A3 Antigravity sync dry-run"
cp .agent/rules/GEMINI.md /tmp/cbx-gemini-before.md
node "$CLI" workflows sync-rules --platform antigravity --dry-run >/tmp/cbx-a3.log
cmp -s /tmp/cbx-gemini-before.md .agent/rules/GEMINI.md
log_ok "Dry-run sync did not change rule file"

log_step "A4 Antigravity remove dry-run"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --dry-run >/tmp/cbx-a4.log
[ -f .agent/workflows/backend.md ]
log_ok "Dry-run remove did not delete files"

log_step "A5 Antigravity remove apply"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --yes >/tmp/cbx-a5.log
[ ! -f .agent/workflows/backend.md ]
[ -f .agent/rules/GEMINI.md ]
rg -n 'No installed workflows found yet\.' .agent/rules/GEMINI.md >/dev/null
log_ok "Bundle removed and managed block kept"

log_step "C1 Codex dry-run install"
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --dry-run >/tmp/cbx-c1.log
[ ! -d .agents/workflows ]
log_ok "Dry-run did not write Codex files"

log_step "C2 Codex apply + doctor"
mkdir -p .codex/skills
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --yes >/tmp/cbx-c2.log
[ -f AGENTS.md ]
[ -f .agents/workflows/backend.md ]
[ -f .agents/workflows/orchestrate.md ]
[ -f .agents/workflows/release.md ]
[ -f .agents/workflows/security.md ]
[ -f .agents/workflows/database.md ]
[ -f .agents/workflows/mobile.md ]
[ -f .agents/workflows/devops.md ]
[ -f .agents/workflows/qa.md ]
[ -f .agents/agents/backend-specialist.md ]
[ -f .agents/agents/security-auditor.md ]
[ -f .agents/agents/devops-engineer.md ]
[ -f .agents/agents/orchestrator.md ]
[ -f .agents/agents/test-engineer.md ]
[ "$(find .agents/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" = "20" ]
node "$CLI" workflows doctor codex --json >/tmp/cbx-c2-doctor.json
rg -n 'Legacy path ./.codex/skills detected' /tmp/cbx-c2-doctor.json >/dev/null
log_ok "Codex install complete and legacy warning detected"

log_step "C2.1 /backend wiring check (Codex files)"
rg -n '^command:\s*"/backend"' .agents/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agents/workflows/backend.md >/dev/null
log_ok "Codex workflow declares /backend and routes to @backend-specialist"

log_step "C3 Skills alias dry-run"
node "$CLI" skills install --platform codex --bundle agent-environment-setup --dry-run >/tmp/cbx-c3.log
rg -n "\[deprecation\] 'cbx skills \.\.\.' is now an alias" /tmp/cbx-c3.log >/dev/null
log_ok "Skills alias still works with deprecation warning"

log_step "C4 Sync idempotency"
node "$CLI" workflows sync-rules --platform codex >/tmp/cbx-c4a.log
node "$CLI" workflows sync-rules --platform codex >/tmp/cbx-c4b.log
rg -n 'Action: unchanged' /tmp/cbx-c4b.log >/dev/null
log_ok "Second sync is idempotent"

log_step "DONE"
echo "ALL_OK"
