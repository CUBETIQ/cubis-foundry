#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT_DIR/bin/cubis.js"
ANTIGRAVITY_GLOBAL_SKILLS="$HOME/.gemini/antigravity/skills"
CODEX_GLOBAL_SKILLS="$HOME/.agents/skills"
COPILOT_GLOBAL_SKILLS="$HOME/.copilot/skills"

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
node "$CLI" workflows install --platform antigravity --bundle agent-environment-setup --terminal-integration --terminal-verifier codex --yes >/tmp/cbx-a2.log
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
if [ "$(find .agent/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -lt "20" ]; then
  echo "[FAIL] Antigravity expected at least 20 agent files" >&2
  exit 1
fi
[ -d "$ANTIGRAVITY_GLOBAL_SKILLS/api-designer" ]
[ -d .agent/terminal-integration ]
[ -f .agent/terminal-integration/config.json ]
[ -f .agent/terminal-integration/verify-task.ps1 ]
[ -f .agent/terminal-integration/verify-task.sh ]
rg -n '"provider": "codex"' .agent/terminal-integration/config.json >/dev/null
rg -n 'cbx:terminal:verification:start provider=codex version=1' .agent/rules/GEMINI.md >/dev/null
log_ok "Antigravity files installed"

log_step "A2.1 /backend wiring check"
rg -n '^command:\s*"/backend"' .agent/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agent/workflows/backend.md >/dev/null
log_ok "Workflow declares /backend and routes to @backend-specialist"

log_step "A2.2 Antigravity global precedence sync"
node - <<'NODE'
const fs = require('fs');
const file = '.agent/rules/GEMINI.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom antigravity workspace rule must stay" >>.agent/rules/GEMINI.md
if rg -n 'cbx:workflows:auto:start' .agent/rules/GEMINI.md >/dev/null; then
  echo "[FAIL] Failed to clear Antigravity managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform antigravity --scope global >/tmp/cbx-a22.log
rg -n 'cbx:workflows:auto:start platform=antigravity version=1' .agent/rules/GEMINI.md >/dev/null
rg -n 'Custom antigravity workspace rule must stay' .agent/rules/GEMINI.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-a22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-a22.log >/dev/null
log_ok "Antigravity global sync updates workspace rule managed block and preserves custom content"

log_step "A2.3 Rules init (Antigravity)"
node "$CLI" rules init --platform antigravity --scope project --overwrite >/tmp/cbx-a23.log
[ -f .agent/rules/ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n 'cbx:engineering:auto:start platform=antigravity version=1' .agent/rules/GEMINI.md >/dev/null
rg -n 'Build Only What Is Needed \(YAGNI\)' .agent/rules/ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Antigravity rules init creates ENGINEERING_RULES.md, TECH.md, and rule block"

log_step "A3 Antigravity sync dry-run"
cp .agent/rules/GEMINI.md /tmp/cbx-gemini-before.md
node "$CLI" workflows sync-rules --platform antigravity --dry-run >/tmp/cbx-a3.log
cmp -s /tmp/cbx-gemini-before.md .agent/rules/GEMINI.md
log_ok "Dry-run sync did not change rule file"

log_step "A4 Antigravity remove dry-run"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --scope global --dry-run >/tmp/cbx-a4.log
[ -f .agent/workflows/backend.md ]
[ -d .agent/terminal-integration ]
log_ok "Dry-run remove did not delete files"

log_step "A5 Antigravity remove apply"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --scope global --yes >/tmp/cbx-a5.log
[ ! -f .agent/workflows/backend.md ]
[ -f .agent/rules/GEMINI.md ]
[ ! -d .agent/terminal-integration ]
rg -n 'No installed workflows found yet\.' .agent/rules/GEMINI.md >/dev/null
if rg -n 'cbx:terminal:verification:start' .agent/rules/GEMINI.md >/dev/null; then
  echo "[FAIL] Antigravity terminal verification block was not removed" >&2
  exit 1
fi
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
[ -f "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/workflow-plan/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/agent-security-auditor/SKILL.md" ]
rg -n '^name:\s*workflow-backend$' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null
rg -n '^name:\s*agent-backend-specialist$' "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" >/dev/null
node "$CLI" workflows doctor codex --json >/tmp/cbx-c2-doctor.json
rg -n 'Legacy path ./.codex/skills detected' /tmp/cbx-c2-doctor.json >/dev/null
log_ok "Codex install complete and legacy warning detected"

log_step "C2.1 /backend wiring check (Codex files)"
rg -n '^command:\s*"/backend"' .agents/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agents/workflows/backend.md >/dev/null
rg -n '^# Agent Wrapper: @backend-specialist$' "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" >/dev/null
rg -n '^# Workflow Wrapper: /backend$' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null
rg -n '\$agent-backend-specialist' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null
if rg -n '@backend-specialist' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null; then
  echo "[FAIL] Codex workflow wrapper still references @backend-specialist instead of \$agent-backend-specialist" >&2
  exit 1
fi
log_ok "Codex workflow wrapper rewrites @backend-specialist to \$agent-backend-specialist"

log_step "C2.2 Codex global precedence warning"
node - <<'NODE'
const fs = require('fs');
const file = 'AGENTS.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom workspace rule must stay" >>AGENTS.md
if rg -n 'cbx:workflows:auto:start' AGENTS.md >/dev/null; then
  echo "[FAIL] Failed to clear managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform codex --scope global >/tmp/cbx-c22.log
rg -n 'cbx:workflows:auto:start platform=codex version=1' AGENTS.md >/dev/null
rg -n 'Custom workspace rule must stay' AGENTS.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-c22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-c22.log >/dev/null
log_ok "Codex global sync updates workspace AGENTS.md managed block and preserves custom content"

log_step "C2.3 Rules init (Codex)"
node "$CLI" rules init --platform codex --scope project --overwrite >/tmp/cbx-c23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n 'cbx:engineering:auto:start platform=codex version=1' AGENTS.md >/dev/null
rg -n 'Build Only What Is Needed \(YAGNI\)' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Codex rules init creates ENGINEERING_RULES.md, TECH.md, and rule block"

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
if [ "$(find .github/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -lt "20" ]; then
  echo "[FAIL] Copilot expected at least 20 agent files" >&2
  exit 1
fi
[ -d "$COPILOT_GLOBAL_SKILLS/api-designer" ]
rg -n '^name:' "$COPILOT_GLOBAL_SKILLS/accessibility/SKILL.md" >/dev/null
if rg -n '^displayName:' "$COPILOT_GLOBAL_SKILLS/accessibility/SKILL.md" >/dev/null; then
  echo "[FAIL] Copilot SKILL.md still contains unsupported displayName attribute" >&2
  exit 1
fi
if rg -n '^keywords:' "$COPILOT_GLOBAL_SKILLS/accessibility/SKILL.md" >/dev/null; then
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

const skillRoot = path.join(process.env.HOME || '', '.copilot/skills');
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

log_step "P2.2 Copilot global precedence sync"
node - <<'NODE'
const fs = require('fs');
const file = 'AGENTS.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom copilot workspace rule must stay" >>AGENTS.md
if rg -n 'cbx:workflows:auto:start' AGENTS.md >/dev/null; then
  echo "[FAIL] Failed to clear Copilot managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform copilot --scope global >/tmp/cbx-p22.log
rg -n 'cbx:workflows:auto:start platform=copilot version=1' AGENTS.md >/dev/null
rg -n 'Custom copilot workspace rule must stay' AGENTS.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-p22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-p22.log >/dev/null
log_ok "Copilot global sync updates workspace rule managed block and preserves custom content"

log_step "P2.3 Rules init (Copilot)"
node "$CLI" rules init --platform copilot --scope project --overwrite >/tmp/cbx-p23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n 'cbx:engineering:auto:start platform=copilot version=1' AGENTS.md >/dev/null
rg -n 'Build Only What Is Needed \(YAGNI\)' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Copilot rules init creates ENGINEERING_RULES.md, TECH.md, and rule block"

log_step "P3 Sync idempotency"
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3a.log
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3b.log
rg -n 'Action: unchanged' /tmp/cbx-p3b.log >/dev/null
log_ok "Copilot second sync is idempotent"

log_step "P4 Remove apply"
node "$CLI" workflows remove agent-environment-setup --platform copilot --scope global --yes >/tmp/cbx-p4.log
[ ! -f .github/copilot/workflows/backend.md ]
[ ! -f .github/agents/backend-specialist.md ]
[ ! -d "$COPILOT_GLOBAL_SKILLS/api-designer" ]
[ -f AGENTS.md ]
rg -n 'No installed workflows found yet\.' AGENTS.md >/dev/null
log_ok "Copilot bundle removed and managed block kept"

log_step "DONE"
echo "ALL_OK"
