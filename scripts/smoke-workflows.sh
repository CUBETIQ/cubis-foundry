#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT_DIR
CLI="$ROOT_DIR/bin/cubis.js"
ANTIGRAVITY_GLOBAL_SKILLS="$HOME/.gemini/antigravity/skills"
CODEX_GLOBAL_SKILLS="$HOME/.agents/skills"
COPILOT_GLOBAL_SKILLS="$HOME/.copilot/skills"
export ANTIGRAVITY_GLOBAL_SKILLS CODEX_GLOBAL_SKILLS COPILOT_GLOBAL_SKILLS

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

assert_file_contains_literal() {
  local file="$1"
  local needle="$2"
  local label="$3"
  if ! grep -Fq "$needle" "$file"; then
    echo "[FAIL] $label missing '$needle' in $file" >&2
    exit 1
  fi
}

assert_workflow_contract() {
  local workflow_dir="$1"
  local label="$2"
  for file in "$workflow_dir"/*.md; do
    [ -f "$file" ] || continue
    if ! rg -n '^## When to use$' "$file" >/dev/null; then
      echo "[FAIL] $label workflow missing '## When to use': $(basename "$file")" >&2
      exit 1
    fi
    if ! rg -n '^## Workflow steps$' "$file" >/dev/null; then
      echo "[FAIL] $label workflow missing '## Workflow steps': $(basename "$file")" >&2
      exit 1
    fi
    if ! rg -n '^## Context notes$' "$file" >/dev/null; then
      echo "[FAIL] $label workflow missing '## Context notes': $(basename "$file")" >&2
      exit 1
    fi
    if ! rg -n '^## Verification$' "$file" >/dev/null; then
      echo "[FAIL] $label workflow missing '## Verification': $(basename "$file")" >&2
      exit 1
    fi
  done
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
  console.error('[FAIL] ROOT_DIR env is required for parity precheck');
  process.exit(1);
}
const canonicalRoots = [
  path.join(root, 'workflows', 'skills')
];
const mirrors = {
  copilot: path.join(root, 'workflows', 'workflows', 'agent-environment-setup', 'platforms', 'copilot', 'skills'),
  claude: path.join(root, 'workflows', 'workflows', 'agent-environment-setup', 'platforms', 'claude', 'skills')
};
function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && fs.existsSync(path.join(dir, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}
const canonicalAccumulator = new Set();
for (const rootDir of canonicalRoots) {
  for (const id of listDirs(rootDir)) {
    canonicalAccumulator.add(id);
  }
}
const canonical = [...canonicalAccumulator].sort();
const canonicalSet = new Set(canonical);
for (const [label, mirrorRoot] of Object.entries(mirrors)) {
  const mirror = listDirs(mirrorRoot);
  if (mirror.length !== canonical.length) {
    console.error(`[FAIL] ${label} mirror count mismatch: expected ${canonical.length}, got ${mirror.length}`);
    process.exit(1);
  }
  for (const id of canonical) {
    const file = path.join(mirrorRoot, id, 'SKILL.md');
    if (!fs.existsSync(file)) {
      console.error(`[FAIL] ${label} mirror missing SKILL.md for ${id}`);
      process.exit(1);
    }
  }
  for (const id of mirror) {
    if (!canonicalSet.has(id)) {
      console.error(`[FAIL] ${label} mirror contains non-canonical skill ${id}`);
      process.exit(1);
    }
  }
}
NODE
log_ok "Canonical and mirrors are in parity with SKILL.md present"
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
[ -f .agent/workflows/orchestrate.md ]
[ -f .agent/workflows/review.md ]
[ -f .agent/workflows/refactor.md ]
[ -f .agent/workflows/release.md ]
[ -f .agent/workflows/incident.md ]
[ -f .agent/agents/backend-specialist.md ]
[ -f .agent/agents/orchestrator.md ]
[ -f .agent/agents/security-auditor.md ]
[ -f .gemini/commands/backend.toml ]
[ -f .gemini/commands/review.toml ]
[ -f .gemini/commands/vercel.toml ]
if [ "$(find .agent/workflows -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -ne "19" ]; then
  echo "[FAIL] Antigravity expected exactly 19 workflow files" >&2
  exit 1
fi
if [ "$(find .gemini/commands -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "19" ]; then
  echo "[FAIL] Antigravity expected exactly 19 Gemini command files" >&2
  exit 1
fi
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
assert_workflow_contract .agent/workflows "Antigravity"
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
rg -n 'YAGNI' .agent/rules/ENGINEERING_RULES.md >/dev/null
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
[ ! -f .gemini/commands/backend.toml ]
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
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --all-skills --overwrite --yes >/tmp/cbx-c2.log
[ -f AGENTS.md ]
[ -f .agents/workflows/backend.md ]
[ -f .agents/workflows/orchestrate.md ]
[ -f .agents/workflows/release.md ]
[ -f .agents/workflows/security.md ]
[ -f .agents/workflows/database.md ]
[ -f .agents/workflows/mobile.md ]
[ -f .agents/workflows/devops.md ]
[ -f .agents/workflows/qa.md ]
if [ "$(find .agents/workflows -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -ne "19" ]; then
  echo "[FAIL] Codex expected exactly 19 workflow files" >&2
  exit 1
fi
[ ! -d .agents/agents ]
[ -f "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/workflow-plan/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/agent-security-auditor/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-runtime/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-delivery/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-security/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-ai/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-functions/SKILL.md" ]
[ -f "$CODEX_GLOBAL_SKILLS/vercel-deployments/SKILL.md" ]
rg -n '^name:\s*workflow-backend$' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null
rg -n '^name:\s*agent-backend-specialist$' "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" >/dev/null
assert_file_contains_literal "$CODEX_GLOBAL_SKILLS/vercel-functions/SKILL.md" 'metadata:' "Codex deprecated skill metadata"
assert_file_contains_literal "$CODEX_GLOBAL_SKILLS/vercel-functions/SKILL.md" 'deprecated: true' "Codex deprecated skill metadata"
assert_file_contains_literal "$CODEX_GLOBAL_SKILLS/vercel-functions/SKILL.md" 'replaced_by: vercel-runtime' "Codex deprecated skill metadata"
assert_file_contains_literal "$CODEX_GLOBAL_SKILLS/nextjs-react-expert/SKILL.md" 'replaced_by: react-best-practices' "Codex deprecated skill metadata"
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const root = process.env.ROOT_DIR;
const installedRoot = process.env.CODEX_GLOBAL_SKILLS;
if (!root || !installedRoot) {
  console.error('[FAIL] ROOT_DIR and CODEX_GLOBAL_SKILLS env vars are required');
  process.exit(1);
}
const canonicalRoots = [
  path.join(root, 'workflows', 'skills')
];
const canonicalSet = new Set();
for (const canonicalRoot of canonicalRoots) {
  if (!fs.existsSync(canonicalRoot)) continue;
  for (const entry of fs.readdirSync(canonicalRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    if (!fs.existsSync(path.join(canonicalRoot, entry.name, 'SKILL.md'))) continue;
    canonicalSet.add(entry.name);
  }
}
const canonical = [...canonicalSet];
for (const id of canonical) {
  const skillFile = path.join(installedRoot, id, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    console.error(`[FAIL] Codex global skills missing canonical skill ${id}`);
    process.exit(1);
  }
}
NODE
assert_workflow_contract .agents/workflows "Codex"
node "$CLI" workflows doctor codex --json >/tmp/cbx-c2-doctor.json
rg -n 'Legacy path ./.codex/skills detected' /tmp/cbx-c2-doctor.json >/dev/null
log_ok "Codex install complete and legacy warning detected"

log_step "C2.1 /backend wiring check (Codex files)"
rg -n '^command:\s*"/backend"' .agents/workflows/backend.md >/dev/null
rg -n '@backend-specialist' .agents/workflows/backend.md >/dev/null
rg -n '^# Agent Compatibility Alias: @backend-specialist$' "$CODEX_GLOBAL_SKILLS/agent-backend-specialist/SKILL.md" >/dev/null
rg -n '^# Workflow Compatibility Alias: /backend$' "$CODEX_GLOBAL_SKILLS/workflow-backend/SKILL.md" >/dev/null
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

log_step "C2.2.1 Codex global sync workflow indexing count"
node "$CLI" workflows sync-rules --platform codex --scope global --dry-run --json >./cbx-c221.json
node - <<'NODE'
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('./cbx-c221.json', 'utf8'));
if (payload.workflowsCount !== 19) {
  console.error(`[FAIL] Expected workflowsCount=19 for codex global sync dry-run, got ${payload.workflowsCount}`);
  process.exit(1);
}
NODE
log_ok "Codex global sync dry-run reports workflowsCount=19"

log_step "C2.3 Rules init (Codex)"
node "$CLI" rules init --platform codex --scope project --overwrite >/tmp/cbx-c23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n 'cbx:engineering:auto:start platform=codex version=1' AGENTS.md >/dev/null
rg -n 'YAGNI' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Codex rules init creates ENGINEERING_RULES.md, TECH.md, and rule block"

log_step "C3 Removed alias guidance"
if node "$CLI" skills install --platform codex --bundle agent-environment-setup --dry-run >/tmp/cbx-c3.log 2>&1; then
  echo "[FAIL] Expected skills alias command to fail after alias removal" >&2
  exit 1
fi
rg -n "'skills' has been removed" /tmp/cbx-c3.log >/dev/null
rg -n "cbx workflows" /tmp/cbx-c3.log >/dev/null
if node "$CLI" install --platform codex --bundle agent-environment-setup --dry-run >/tmp/cbx-c3-install.log 2>&1; then
  echo "[FAIL] Expected install alias command to fail after alias removal" >&2
  exit 1
fi
rg -n "'install' has been removed" /tmp/cbx-c3-install.log >/dev/null
if node "$CLI" platforms >/tmp/cbx-c3-platforms.log 2>&1; then
  echo "[FAIL] Expected platforms alias command to fail after alias removal" >&2
  exit 1
fi
rg -n "'platforms' has been removed" /tmp/cbx-c3-platforms.log >/dev/null
log_ok "Removed skills alias prints migration guidance"

log_step "C3.1 Init wizard help"
node "$CLI" init --help >/tmp/cbx-c31.log
rg -n '^Usage: cbx init \[options\]$' /tmp/cbx-c31.log >/dev/null
rg -n 'guided interactive install wizard' /tmp/cbx-c31.log >/dev/null
rg -n -- '--platforms <items>' /tmp/cbx-c31.log >/dev/null
rg -n -- '--mcps <items>' /tmp/cbx-c31.log >/dev/null
rg -n -- '--mcp-runtime <runtime>' /tmp/cbx-c31.log >/dev/null
log_ok "Init wizard command is registered and discoverable"

log_step "C3.1.1 Init wizard true TTY flow"
node "$ROOT_DIR/scripts/run-init-tty-test.mjs" "$CLI" >/tmp/cbx-c311.log
if rg -n 'TTY_INIT_OK' /tmp/cbx-c311.log >/dev/null; then
  log_ok "Init wizard interactive path works in PTY mode"
elif rg -n 'TTY_INIT_SKIPPED' /tmp/cbx-c311.log >/dev/null; then
  log_ok "Init wizard PTY flow skipped because expect is unavailable"
else
  echo "[FAIL] Init wizard PTY test did not report success or skip state" >&2
  exit 1
fi

log_step "C3.2 Init wizard non-interactive explicit selections"
node "$CLI" init --yes --dry-run --no-banner \
  --bundle agent-environment-setup \
  --platforms codex,antigravity \
  --skill-profile web-backend \
  --skills-scope project \
  --mcps cubis-foundry,postman,stitch \
  --mcp-scope global \
  --postman-mode minimal \
  --mcp-runtime local >/tmp/cbx-c32.log
rg -n 'Init plan summary:' /tmp/cbx-c32.log >/dev/null
rg -n 'Platforms: codex, antigravity' /tmp/cbx-c32.log >/dev/null
rg -n 'Skill profile: web-backend' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP scope: global' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP runtime: local' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP selections: cubis-foundry, postman, stitch' /tmp/cbx-c32.log >/dev/null
rg -n 'Postman mode: minimal' /tmp/cbx-c32.log >/dev/null
rg -n "Stitch is not supported on 'codex'" /tmp/cbx-c32.log >/dev/null
log_ok "Init wizard accepts explicit non-interactive selections"

log_step "C3.3 Init wizard stitch-only path"
node "$CLI" init --yes --dry-run --no-banner \
  --platforms antigravity \
  --mcps stitch \
  --mcp-runtime local >/tmp/cbx-c33.log
rg -n 'MCP selections: stitch' /tmp/cbx-c33.log >/dev/null
rg -n 'MCP runtime: local' /tmp/cbx-c33.log >/dev/null
rg -n 'Stitch MCP definition' /tmp/cbx-c33.log >/dev/null
if rg -n 'postman.json' /tmp/cbx-c33.log >/dev/null; then
  echo "[FAIL] Stitch-only init should not install Postman MCP definition" >&2
  exit 1
fi
log_ok "Init wizard stitch-only mode avoids forced Postman artifacts"

log_step "C3.4 Remove-all dry-run surfaces"
node "$CLI" workflows remove-all --scope all --dry-run --yes >/tmp/cbx-c34.log
rg -n '^Remove-all summary:$' /tmp/cbx-c34.log >/dev/null
rg -n 'Scopes: project, global' /tmp/cbx-c34.log >/dev/null
node "$CLI" remove all --scope all --dry-run --yes >/tmp/cbx-c341.log
rg -n '^Remove-all summary:$' /tmp/cbx-c341.log >/dev/null
log_ok "Remove-all works from workflows and top-level command surfaces"

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
node "$CLI" workflows install --platform copilot --bundle agent-environment-setup --overwrite --yes >/tmp/cbx-p2.log
[ -f AGENTS.md ]
[ -f .github/copilot-instructions.md ]
[ -f .github/copilot/workflows/backend.md ]
[ -f .github/copilot/workflows/orchestrate.md ]
[ -f .github/copilot/workflows/release.md ]
[ -f .github/copilot/workflows/security.md ]
[ -f .github/copilot/workflows/database.md ]
[ -f .github/copilot/workflows/mobile.md ]
[ -f .github/copilot/workflows/devops.md ]
[ -f .github/copilot/workflows/qa.md ]
if [ "$(find .github/copilot/workflows -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -ne "19" ]; then
  echo "[FAIL] Copilot expected exactly 19 workflow files" >&2
  exit 1
fi
[ -f .github/agents/backend-specialist.md ]
[ -f .github/agents/security-auditor.md ]
[ -f .github/agents/devops-engineer.md ]
[ -f .github/agents/orchestrator.md ]
[ -f .github/agents/test-engineer.md ]
[ -f .github/prompts/workflow-backend.prompt.md ]
[ -f .github/prompts/workflow-review.prompt.md ]
[ -f .github/prompts/workflow-vercel.prompt.md ]
if [ "$(find .github/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -lt "20" ]; then
  echo "[FAIL] Copilot expected at least 20 agent files" >&2
  exit 1
fi
if [ "$(find .github/prompts -maxdepth 1 -type f -name '*.prompt.md' | wc -l | tr -d ' ')" -ne "19" ]; then
  echo "[FAIL] Copilot expected exactly 19 prompt files" >&2
  exit 1
fi
[ ! -d .github/skills ]
[ -d "$COPILOT_GLOBAL_SKILLS/api-designer" ]
rg -n '^name:' "$COPILOT_GLOBAL_SKILLS/clean-code/SKILL.md" >/dev/null
if rg -n '^allowed-tools:' "$COPILOT_GLOBAL_SKILLS/clean-code/SKILL.md" >/dev/null; then
  echo "[FAIL] Copilot global skill SKILL.md still contains unsupported allowed-tools attribute" >&2
  exit 1
fi
if rg -n '^priority:' "$COPILOT_GLOBAL_SKILLS/clean-code/SKILL.md" >/dev/null; then
  echo "[FAIL] Copilot global skill SKILL.md still contains unsupported priority attribute" >&2
  exit 1
fi
rg -n 'Prefer workspace \.vscode/mcp\.json as the primary supported path' /tmp/cbx-p2.log >/dev/null
if rg -n '^skills:' .github/agents/backend-specialist.md >/dev/null; then
  echo "[FAIL] Copilot agent file still contains unsupported skills attribute" >&2
  exit 1
fi
assert_workflow_contract .github/copilot/workflows "Copilot"
node - <<'NODE'
const fs = require('fs');
const path = require('path');

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
const file = '.github/copilot-instructions.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom copilot workspace rule must stay" >>.github/copilot-instructions.md
if rg -n 'cbx:workflows:auto:start' .github/copilot-instructions.md >/dev/null; then
  echo "[FAIL] Failed to clear Copilot managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform copilot --scope global >/tmp/cbx-p22.log
rg -n 'cbx:workflows:auto:start platform=copilot version=1' .github/copilot-instructions.md >/dev/null
rg -n 'Custom copilot workspace rule must stay' .github/copilot-instructions.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-p22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-p22.log >/dev/null
log_ok "Copilot global sync updates .github/copilot-instructions.md managed block and preserves custom content"

log_step "P2.3 Rules init (Copilot)"
node "$CLI" rules init --platform copilot --scope project --overwrite >/tmp/cbx-p23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n 'cbx:engineering:auto:start platform=copilot version=1' .github/copilot-instructions.md >/dev/null
rg -n 'YAGNI' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Copilot rules init creates ENGINEERING_RULES.md, TECH.md, and copilot-instructions rule block"

log_step "P3 Sync idempotency"
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3a.log
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3b.log
rg -n 'Action: unchanged' /tmp/cbx-p3b.log >/dev/null
log_ok "Copilot second sync is idempotent"

log_step "P4 Remove apply"
node "$CLI" workflows remove agent-environment-setup --platform copilot --scope global --yes >/tmp/cbx-p4.log
[ ! -f .github/copilot/workflows/backend.md ]
[ ! -f .github/agents/backend-specialist.md ]
[ ! -f .github/prompts/workflow-backend.prompt.md ]
[ ! -d "$COPILOT_GLOBAL_SKILLS/api-designer" ]
[ -f .github/copilot-instructions.md ]
rg -n 'No installed workflows found yet\.' .github/copilot-instructions.md >/dev/null
log_ok "Copilot bundle removed and managed block kept"

log_step "DONE"
echo "ALL_OK"
