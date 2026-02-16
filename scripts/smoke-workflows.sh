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
[ ! -d .agents/agents ]
[ -f .agents/skills/workflow-backend/SKILL.md ]
[ -f .agents/skills/workflow-plan/SKILL.md ]
[ -f .agents/skills/agent-backend-specialist/SKILL.md ]
[ -f .agents/skills/agent-security-auditor/SKILL.md ]
rg -n '^name:\s*workflow-backend$' .agents/skills/workflow-backend/SKILL.md >/dev/null
rg -n '^name:\s*agent-backend-specialist$' .agents/skills/agent-backend-specialist/SKILL.md >/dev/null
node "$CLI" workflows doctor codex --json >/tmp/cbx-c2-doctor.json
rg -n 'Legacy path ./.codex/skills detected' /tmp/cbx-c2-doctor.json >/dev/null
log_ok "Codex install complete and legacy warning detected"

log_step "C2.1 /backend wiring check (Codex files)"
rg -n '^command:\s*"/backend"' .agents/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agents/workflows/backend.md >/dev/null
rg -n '^# Agent Wrapper: @backend-specialist$' .agents/skills/agent-backend-specialist/SKILL.md >/dev/null
rg -n '^# Workflow Wrapper: /backend$' .agents/skills/workflow-backend/SKILL.md >/dev/null
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

log_step "P1 Copilot dry-run install"
node "$CLI" workflows install --platform copilot --bundle agent-environment-setup --dry-run >/tmp/cbx-p1.log
[ ! -d .github/agents ]
[ ! -d .github/skills ]
log_ok "Dry-run did not write Copilot files"

log_step "P2 Copilot apply + doctor"
node "$CLI" workflows install --platform copilot --bundle agent-environment-setup --yes >/tmp/cbx-p2.log
[ -f AGENTS.md ]
[ -f .github/copilot/workflows/backend.md ]
[ -f .github/copilot/workflows/orchestrate.md ]
[ -f .github/copilot/workflows/release.md ]
[ -f .github/copilot/workflows/security.md ]
[ -f .github/copilot/workflows/database.md ]
[ -f .github/copilot/workflows/mobile.md ]
[ -f .github/copilot/workflows/devops.md ]
[ -f .github/copilot/workflows/qa.md ]
[ -f .github/agents/backend-specialist.md ]
[ -f .github/agents/security-auditor.md ]
[ -f .github/agents/devops-engineer.md ]
[ -f .github/agents/orchestrator.md ]
[ -f .github/agents/test-engineer.md ]
[ "$(find .github/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" = "20" ]
[ -d .github/skills/api-designer ]
rg -n '^name:' .github/skills/accessibility/SKILL.md >/dev/null
if rg -n '^displayName:' .github/skills/accessibility/SKILL.md >/dev/null; then
  echo "[FAIL] Copilot SKILL.md still contains unsupported displayName attribute" >&2
  exit 1
fi
if rg -n '^keywords:' .github/skills/accessibility/SKILL.md >/dev/null; then
  echo "[FAIL] Copilot SKILL.md still contains unsupported keywords attribute" >&2
  exit 1
fi
if rg -n '^skills:' .github/agents/backend-specialist.md >/dev/null; then
  echo "[FAIL] Copilot agent file still contains unsupported skills attribute" >&2
  exit 1
fi
node - <<'NODE'
const fs = require('fs');
const path = require('path');

const allowedSkillKeys = new Set(['compatibility', 'description', 'license', 'metadata', 'name']);
const allowedAgentKeys = new Set([
  'name',
  'description',
  'tools',
  'target',
  'infer',
  'mcp-servers',
  'metadata',
  'model',
  'handoffs',
  'argument-hint'
]);

function topLevelKeys(frontmatter) {
  return [...new Set(
    frontmatter
      .split(/\r?\n/)
      .filter((line) => line && !/^\s/.test(line))
      .map((line) => (line.match(/^([A-Za-z0-9_-]+)\s*:/) || [])[1])
      .filter(Boolean)
  )];
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? m[1] : null;
}

const skillRoot = path.join(process.cwd(), '.github/skills');
for (const skillId of fs.readdirSync(skillRoot)) {
  const file = path.join(skillRoot, skillId, 'SKILL.md');
  if (!fs.existsSync(file)) continue;
  const fm = frontmatter(fs.readFileSync(file, 'utf8'));
  if (!fm) continue;
  const unsupported = topLevelKeys(fm).filter((k) => !allowedSkillKeys.has(k));
  if (unsupported.length) {
    console.error(`[FAIL] Copilot skill ${skillId} has unsupported keys: ${unsupported.join(', ')}`);
    process.exit(1);
  }
}

const agentRoot = path.join(process.cwd(), '.github/agents');
for (const fileName of fs.readdirSync(agentRoot).filter((f) => f.endsWith('.md'))) {
  const file = path.join(agentRoot, fileName);
  const fm = frontmatter(fs.readFileSync(file, 'utf8'));
  if (!fm) continue;
  const unsupported = topLevelKeys(fm).filter((k) => !allowedAgentKeys.has(k));
  if (unsupported.length) {
    console.error(`[FAIL] Copilot agent ${fileName} has unsupported keys: ${unsupported.join(', ')}`);
    process.exit(1);
  }
}
NODE
node "$CLI" workflows doctor copilot --json >/tmp/cbx-p2-doctor.json
rg -n '"platform": "copilot"' /tmp/cbx-p2-doctor.json >/dev/null
if rg -n 'Unsupported top-level Copilot agent attributes detected' /tmp/cbx-p2-doctor.json >/dev/null; then
  echo "[FAIL] Doctor still reports unsupported Copilot agent attributes after normalization" >&2
  exit 1
fi
log_ok "Copilot install complete and doctor output generated"

log_step "P2.1 /backend wiring check (Copilot files)"
rg -n '^command:\s*"/backend"' .github/copilot/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .github/copilot/workflows/backend.md >/dev/null
log_ok "Copilot workflow declares /backend and routes to @backend-specialist"

log_step "P3 Sync idempotency"
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3a.log
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3b.log
rg -n 'Action: unchanged' /tmp/cbx-p3b.log >/dev/null
log_ok "Copilot second sync is idempotent"

log_step "P4 Remove apply"
node "$CLI" workflows remove agent-environment-setup --platform copilot --yes >/tmp/cbx-p4.log
[ ! -f .github/copilot/workflows/backend.md ]
[ ! -f .github/agents/backend-specialist.md ]
[ ! -d .github/skills/api-designer ]
[ -f AGENTS.md ]
rg -n 'No installed workflows found yet\.' AGENTS.md >/dev/null
log_ok "Copilot bundle removed and managed block kept"

log_step "DONE"
echo "ALL_OK"
