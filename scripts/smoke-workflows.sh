#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT_DIR
CLI="$ROOT_DIR/bin/cubis.js"
EXPECTED_WORKFLOW_COUNT="$(find "$ROOT_DIR/workflows/workflows/agent-environment-setup/shared/workflows" -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')"
EXPECTED_AGENT_COUNT="$(find "$ROOT_DIR/workflows/workflows/agent-environment-setup/shared/agents" -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')"
EXPECTED_ROUTE_COMMAND_COUNT="$((EXPECTED_WORKFLOW_COUNT + EXPECTED_AGENT_COUNT))"
REP_WORKFLOW="implement"
REP_AGENT="implementer"
REP_SECURITY_AGENT="security-reviewer"
export EXPECTED_WORKFLOW_COUNT EXPECTED_AGENT_COUNT EXPECTED_ROUTE_COMMAND_COUNT

if [ ! -f "$CLI" ]; then
  echo "ERROR: CLI entry not found at $CLI" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d /tmp/cbx-fulltest.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT
export HOME="$TMP_DIR/home"
mkdir -p "$HOME"
ANTIGRAVITY_INSTALLED_SKILLS="$TMP_DIR/.agents/skills"
CODEX_INSTALLED_SKILLS="$TMP_DIR/.agents/skills"
COPILOT_INSTALLED_SKILLS="$TMP_DIR/.github/skills"
export ANTIGRAVITY_INSTALLED_SKILLS CODEX_INSTALLED_SKILLS COPILOT_INSTALLED_SKILLS

rg() {
  if type -P rg >/dev/null 2>&1; then
    local status=0
    set +e
    command rg "$@"
    status=$?
    set -e
    return "$status"
  fi

  while [ "$#" -gt 0 ]; do
    case "$1" in
      -n)
        shift
        ;;
      --)
        shift
        break
        ;;
      -*)
        echo "[FAIL] smoke-workflows.sh fallback rg does not support option: $1" >&2
        return 2
        ;;
      *)
        break
        ;;
    esac
  done

  if [ "$#" -lt 2 ]; then
    echo "[FAIL] smoke-workflows.sh fallback rg expects a pattern and at least one file" >&2
    return 2
  fi

  local pattern="$1"
  shift

  local status=0
  set +e
  perl -ne 'BEGIN { $re = shift @ARGV; $found = 0; } if (/$re/) { $found = 1; } END { exit($found ? 0 : 1); }' -- "$pattern" "$@"
  status=$?
  set -e
  return "$status"
}

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
if [ -d .agents ] || [ -f .agents/rules/GEMINI.md ]; then
  echo "[FAIL] Dry-run wrote Antigravity files" >&2
  exit 1
fi
log_ok "Dry-run did not write Antigravity files"

log_step "A2 Antigravity apply"
node "$CLI" workflows install --platform antigravity --bundle agent-environment-setup --terminal-integration --terminal-verifier codex --yes >/tmp/cbx-a2.log
[ -f .agents/rules/GEMINI.md ]
[ -d .agents/skills ]
[ ! -d .agent ]
[ ! -d .agents/workflows ]
[ ! -d .agents/agents ]
[ -f .gemini/commands/implement.toml ]
[ -f .gemini/commands/spec.toml ]
[ -f .gemini/commands/review.toml ]
[ -f .gemini/commands/deploy.toml ]
[ -f .gemini/commands/agent-implementer.toml ]
[ -f .gemini/commands/agent-orchestrator.toml ]
[ -f .gemini/commands/agent-security-reviewer.toml ]
if [ "$(find .gemini/commands -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "$EXPECTED_ROUTE_COMMAND_COUNT" ]; then
  echo "[FAIL] Antigravity expected exactly $EXPECTED_ROUTE_COMMAND_COUNT Gemini command files" >&2
  exit 1
fi
[ -d "$ANTIGRAVITY_INSTALLED_SKILLS/api-design" ]
[ -d .agents/terminal-integration ]
[ -f .agents/terminal-integration/config.json ]
[ -f .agents/terminal-integration/verify-task.ps1 ]
[ -f .agents/terminal-integration/verify-task.sh ]
rg -n '"provider": "codex"' .agents/terminal-integration/config.json >/dev/null
rg -n '^<!-- cbx:terminal:verification:start provider=codex version=1 -->' .agents/rules/GEMINI.md >/dev/null
assert_file_contains_literal .gemini/commands/implement.toml "official docs next" "Antigravity Gemini command"
assert_file_contains_literal .gemini/commands/implement.toml "secondary evidence" "Antigravity Gemini command"
log_ok "Antigravity files installed"

log_step "A2.1 /implement wiring check"
assert_file_contains_literal .gemini/commands/implement.toml "Execute the native projection of the /implement workflow." "Antigravity implement command"
assert_file_contains_literal .gemini/commands/agent-implementer.toml "Execute the native projection of the @implementer specialist route." "Antigravity implementer command"
assert_file_contains_literal .gemini/commands/implement.toml ".agents/skills/api-design/SKILL.md" "Antigravity implement command skill hint"
assert_file_contains_literal .gemini/commands/spec.toml "Execute the native projection of the /spec workflow." "Antigravity spec command"
assert_file_contains_literal .gemini/commands/spec.toml ".agents/skills/spec-driven-delivery/SKILL.md" "Antigravity spec command skill hint"
log_ok "Command routes for /implement, /spec, and @implementer are installed"

log_step "A2.2 Antigravity global precedence sync"
node - <<'NODE'
const fs = require('fs');
const file = '.agents/rules/GEMINI.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom antigravity workspace rule must stay" >>.agents/rules/GEMINI.md
if rg -n '^<!-- cbx:workflows:auto:start' .agents/rules/GEMINI.md >/dev/null; then
  echo "[FAIL] Failed to clear Antigravity managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform antigravity --scope global >/tmp/cbx-a22.log
rg -n '^<!-- cbx:workflows:auto:start platform=antigravity version=1 -->' .agents/rules/GEMINI.md >/dev/null
rg -n 'Custom antigravity workspace rule must stay' .agents/rules/GEMINI.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-a22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-a22.log >/dev/null
log_ok "Antigravity global sync updates workspace rule managed block and preserves custom content"

log_step "A2.3 Rules init (Antigravity)"
node "$CLI" rules init --platform antigravity --scope project --overwrite >/tmp/cbx-a23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n '^<!-- cbx:engineering:auto:start platform=antigravity version=1 -->' .agents/rules/GEMINI.md >/dev/null
rg -n 'YAGNI' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Antigravity rules init creates ENGINEERING_RULES.md, TECH.md, and rule block"

log_step "A3 Antigravity sync dry-run"
cp .agents/rules/GEMINI.md /tmp/cbx-gemini-before.md
node "$CLI" workflows sync-rules --platform antigravity --dry-run >/tmp/cbx-a3.log
cmp -s /tmp/cbx-gemini-before.md .agents/rules/GEMINI.md
log_ok "Dry-run sync did not change rule file"

log_step "A4 Antigravity remove dry-run"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --scope global --dry-run >/tmp/cbx-a4.log
[ -f .gemini/commands/implement.toml ]
[ -d .agents/terminal-integration ]
log_ok "Dry-run remove did not delete files"

log_step "A5 Antigravity remove apply"
node "$CLI" workflows remove agent-environment-setup --platform antigravity --scope global --yes >/tmp/cbx-a5.log
[ ! -f .gemini/commands/implement.toml ]
[ ! -f .gemini/commands/agent-implementer.toml ]
[ -f .agents/rules/GEMINI.md ]
[ ! -d .agents/terminal-integration ]
[ ! -f .gemini/commands/implement.toml ]
rg -n 'No installed workflows found yet\.' .agents/rules/GEMINI.md >/dev/null
if rg -n '^<!-- cbx:terminal:verification:start' .agents/rules/GEMINI.md >/dev/null; then
  echo "[FAIL] Antigravity terminal verification block was not removed" >&2
  exit 1
fi
log_ok "Bundle removed and managed block kept"

log_step "C1 Codex dry-run install"
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --dry-run >/tmp/cbx-c1.log
[ ! -d .codex/agents ]
log_ok "Dry-run did not write Codex files"

log_step "C2 Codex apply + doctor"
mkdir -p .codex/skills
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --all-skills --overwrite --yes >/tmp/cbx-c2.log
[ -f AGENTS.md ]
[ -d .codex/agents ]
[ ! -d .agents/workflows ]
[ ! -d .agents/agents ]
[ -f .codex/agents/implementer.toml ]
[ -f .codex/agents/orchestrator.toml ]
[ -f .codex/agents/security-reviewer.toml ]
if [ "$(find .codex/agents -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "$EXPECTED_AGENT_COUNT" ]; then
  echo "[FAIL] Codex expected exactly $EXPECTED_AGENT_COUNT agent files" >&2
  exit 1
fi
[ -f "$CODEX_INSTALLED_SKILLS/implement/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/spec/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/plan/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/owasp-security-review/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/nextjs/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/performance-testing/SKILL.md" ]
[ -f "$CODEX_INSTALLED_SKILLS/api-design/SKILL.md" ]
[ ! -d "$CODEX_INSTALLED_SKILLS/backend" ]
[ ! -d "$CODEX_INSTALLED_SKILLS/vercel-functions" ]
[ ! -d "$CODEX_INSTALLED_SKILLS/vercel-deployments" ]
rg -n '^name:\s*implement$' "$CODEX_INSTALLED_SKILLS/implement/SKILL.md" >/dev/null
if [ -d "$CODEX_INSTALLED_SKILLS/workflow-backend" ] || [ -d "$CODEX_INSTALLED_SKILLS/agent-backend-specialist" ]; then
  echo "[FAIL] Codex compatibility wrapper skill directories should no longer be installed" >&2
  exit 1
fi
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/owasp-security-review/SKILL.md" 'OWASP Top 10' "Codex security review content"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/nextjs/SKILL.md" 'App Router' "Codex Next.js content"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/performance-testing/SKILL.md" 'load testing' "Codex performance testing content"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/api-design/SKILL.md" 'GraphQL' "Codex API design content"
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const root = process.env.ROOT_DIR;
const installedRoot = process.env.CODEX_INSTALLED_SKILLS;
if (!root || !installedRoot) {
  console.error('[FAIL] ROOT_DIR and CODEX_INSTALLED_SKILLS env vars are required');
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
    console.error(`[FAIL] Codex installed skills missing canonical skill ${id}`);
    process.exit(1);
  }
}
NODE
node "$CLI" workflows doctor codex --json >/tmp/cbx-c2-doctor.json
rg -n 'Legacy path ./.codex/skills detected' /tmp/cbx-c2-doctor.json >/dev/null
log_ok "Codex install complete and legacy warning detected"

log_step "C2.1 /implement wiring check (Codex files)"
assert_file_contains_literal .codex/agents/implementer.toml 'name = "implementer"' "Codex implementer agent"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/implement/SKILL.md" '# Implement Workflow' "Codex implement workflow skill"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/implement/SKILL.md" '@implementer' "Codex implement workflow skill routing"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/spec/SKILL.md" '# Spec Workflow' "Codex spec workflow skill"
assert_file_contains_literal "$CODEX_INSTALLED_SKILLS/spec/SKILL.md" 'spec-driven-delivery' "Codex spec workflow skill routing"
if rg -n 'Compatibility Alias' "$CODEX_INSTALLED_SKILLS/implement/SKILL.md" >/dev/null; then
  echo "[FAIL] Codex generated workflow skill still contains compatibility alias text" >&2
  exit 1
fi
log_ok "Codex uses native subagents plus generated workflow skills for implement and spec"

log_step "C2.2 Codex global precedence warning"
node - <<'NODE'
const fs = require('fs');
const file = 'AGENTS.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom workspace rule must stay" >>AGENTS.md
if rg -n '^<!-- cbx:workflows:auto:start' AGENTS.md >/dev/null; then
  echo "[FAIL] Failed to clear managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform codex --scope global >/tmp/cbx-c22.log
rg -n '^<!-- cbx:workflows:auto:start platform=codex version=1 -->' AGENTS.md >/dev/null
rg -n 'Custom workspace rule must stay' AGENTS.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-c22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-c22.log >/dev/null
log_ok "Codex global sync updates workspace AGENTS.md managed block and preserves custom content"

log_step "C2.2.1 Codex global sync workflow indexing count"
node "$CLI" workflows sync-rules --platform codex --scope global --dry-run --json >./cbx-c221.json
node - <<'NODE'
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('./cbx-c221.json', 'utf8'));
const expected = Number(process.env.EXPECTED_WORKFLOW_COUNT || '0');
if (payload.workflowsCount !== expected) {
  console.error(`[FAIL] Expected workflowsCount=${expected} for codex global sync dry-run, got ${payload.workflowsCount}`);
  process.exit(1);
}
NODE
log_ok "Codex global sync dry-run reports workflowsCount=$EXPECTED_WORKFLOW_COUNT"

log_step "C2.3 Rules init (Codex)"
node "$CLI" rules init --platform codex --scope project --overwrite >/tmp/cbx-c23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n '^<!-- cbx:engineering:auto:start platform=codex version=1 -->' AGENTS.md >/dev/null
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
rg -n 'cubis-foundry,postman,stitch,playwright' /tmp/cbx-c31.log >/dev/null
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
  --mcps cubis-foundry,postman,stitch,playwright \
  --mcp-scope global \
  --postman-mode minimal \
  --mcp-runtime local >/tmp/cbx-c32.log
rg -n 'Init plan summary:' /tmp/cbx-c32.log >/dev/null
rg -n 'Platforms: codex, antigravity' /tmp/cbx-c32.log >/dev/null
rg -n 'Skill profile: web-backend' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP scope: project' /tmp/cbx-c32.log >/dev/null
rg -n -- '--mcp-scope=global is ignored for install/init' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP runtime: local' /tmp/cbx-c32.log >/dev/null
rg -n 'MCP selections: cubis-foundry, postman, stitch, playwright' /tmp/cbx-c32.log >/dev/null
rg -n 'Postman mode: minimal' /tmp/cbx-c32.log >/dev/null
if rg -n "Stitch is not supported on 'codex'" /tmp/cbx-c32.log >/dev/null; then
  echo "[FAIL] Init wizard still reports Stitch as unsupported on codex" >&2
  exit 1
fi
log_ok "Init wizard accepts explicit non-interactive selections"

log_step "C3.2.2 Init wizard does not generate architecture docs"
mkdir -p init-no-docs
(
  cd init-no-docs
  node "$CLI" init --yes --no-banner \
    --bundle agent-environment-setup \
    --platforms codex \
    --skill-profile web-backend \
    --skills-scope project \
    --mcps cubis-foundry \
    --mcp-runtime local >/tmp/cbx-c322.log
)
[ -f init-no-docs/AGENTS.md ]
[ ! -f init-no-docs/ENGINEERING_RULES.md ]
[ ! -f init-no-docs/TECH.md ]
rg -n 'Install only wires the rule references and workflow assets' /tmp/cbx-c322.log >/dev/null
log_ok "Init wizard leaves ENGINEERING_RULES.md and TECH.md for rules init or build architecture"

log_step "C3.2.1 Init wizard stitch-only cross-platform path"
node "$CLI" init --yes --dry-run --no-banner \
  --platforms codex,claude,copilot,gemini,antigravity \
  --mcps stitch \
  --mcp-runtime local >/tmp/cbx-c321.log
rg -n 'Platforms: codex, claude, copilot, gemini, antigravity' /tmp/cbx-c321.log >/dev/null
rg -n 'MCP selections: stitch' /tmp/cbx-c321.log >/dev/null
if rg -n 'Stitch is not supported on' /tmp/cbx-c321.log >/dev/null; then
  echo "[FAIL] Stitch-only init still reports an unsupported platform" >&2
  exit 1
fi
if [ "$(grep -Fc 'Foundry MCP gateway: enabled (cbx mcp serve)' /tmp/cbx-c321.log)" -ne 5 ]; then
  echo "[FAIL] Stitch-only init did not enable Foundry MCP gateway for all 5 platforms" >&2
  exit 1
fi
log_ok "Init wizard stitch-only mode works across all supported platforms"

log_step "C3.3 Init wizard stitch-only path"
node "$CLI" init --yes --dry-run --no-banner \
  --platforms codex \
  --mcps stitch \
  --mcp-runtime local >/tmp/cbx-c33.log
rg -n 'MCP selections: stitch' /tmp/cbx-c33.log >/dev/null
rg -n 'MCP runtime: local' /tmp/cbx-c33.log >/dev/null
rg -n 'Foundry MCP gateway: enabled \(cbx mcp serve\)' /tmp/cbx-c33.log >/dev/null
rg -n 'Legacy direct MCP cleanup \(.+codex[\\/]stitch\.json\): missing' /tmp/cbx-c33.log >/dev/null
if rg -n 'postman.json' /tmp/cbx-c33.log >/dev/null; then
  echo "[FAIL] Stitch-only init should not install Postman legacy artifacts" >&2
  exit 1
fi
if rg -n 'Postman upstream MCP URL' /tmp/cbx-c33.log >/dev/null; then
  echo "[FAIL] Stitch-only init should not report Postman MCP wiring" >&2
  exit 1
fi
if rg -n 'Ignoring --no-foundry-mcp' /tmp/cbx-c33.log >/dev/null; then
  echo "[FAIL] Stitch-only init should not warn about --no-foundry-mcp unless explicitly requested" >&2
  exit 1
fi
log_ok "Init wizard stitch-only mode avoids forced Postman artifacts and keeps Foundry gateway wiring"

log_step "C3.3.1 Playwright-only install path"
node "$CLI" workflows install --platform codex --bundle agent-environment-setup --playwright --dry-run --yes >/tmp/cbx-c331.log
rg -n 'Playwright MCP: enabled \(http://localhost:8931/mcp\)' /tmp/cbx-c331.log >/dev/null
rg -n 'Platform MCP target \(.+[\\/]\.vscode[\\/]mcp\.json\): would-(create|patch|replace)' /tmp/cbx-c331.log >/dev/null
if rg -n 'Managed MCP definition \(' /tmp/cbx-c331.log >/dev/null; then
  echo "[FAIL] Playwright-only install should not create a Postman MCP definition" >&2
  exit 1
fi
log_ok "Playwright-only install configures runtime target without forcing Postman artifacts"

log_step "C3.3.2 Credential storage and migration regression"
mkdir -p credcheck
(
  export HOME="$TMP_DIR/home"
  export POSTMAN_API_KEY_DEFAULT="pmak_test_123456789"
  export STITCH_API_KEY_DEFAULT="stak_test_987654321"
  mkdir -p "$HOME"
  cd credcheck
  node "$CLI" workflows install --platform codex --bundle agent-environment-setup --postman --stitch --yes >/tmp/cbx-c332-install.log
)
[ -f credcheck/cbx_config.json ]
[ -f credcheck/.vscode/mcp.json ]
[ -f "$TMP_DIR/home/.cbx/credentials.env" ]
rg -n '"apiKeyEnvVar": "POSTMAN_API_KEY_DEFAULT"' credcheck/cbx_config.json >/dev/null
rg -n '"apiKeyEnvVar": "STITCH_API_KEY_DEFAULT"' credcheck/cbx_config.json >/dev/null
rg -n '"cubis-foundry"' credcheck/.vscode/mcp.json >/dev/null
rg -n 'pmak_test_123456789' "$TMP_DIR/home/.cbx/credentials.env" >/dev/null
rg -n 'stak_test_987654321' "$TMP_DIR/home/.cbx/credentials.env" >/dev/null
if rg -n 'pmak_test_123456789|stak_test_987654321' credcheck/cbx_config.json credcheck/.vscode/mcp.json /tmp/cbx-c332-install.log >/dev/null; then
  echo "[FAIL] Secrets leaked into project config, runtime config, or install output" >&2
  exit 1
fi
if rg -n '"postman"|"StitchMCP"' credcheck/.vscode/mcp.json >/dev/null; then
  echo "[FAIL] Codex project runtime still contains legacy direct Postman/Stitch MCP entries" >&2
  exit 1
fi
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const workspace = path.join(process.cwd(), 'credcheck');
const configPath = path.join(workspace, 'cbx_config.json');
const vscodePath = path.join(workspace, '.vscode', 'mcp.json');
const postmanLegacyPath = path.join(workspace, '.cbx', 'mcp', 'codex', 'postman.json');
const stitchLegacyPath = path.join(workspace, '.cbx', 'mcp', 'codex', 'stitch.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
cfg.postman.profiles[0].apiKey = 'pmak_inline_leak';
cfg.stitch.profiles[0].apiKey = 'stak_inline_leak';
fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
fs.mkdirSync(path.dirname(vscodePath), { recursive: true });
fs.writeFileSync(vscodePath, `${JSON.stringify({
  servers: {
    postman: {
      type: 'http',
      url: 'https://mcp.postman.com/mcp',
      headers: { Authorization: 'Bearer pmak_inline_leak' }
    },
    StitchMCP: {
      type: 'stdio',
      command: 'npx',
      args: [
        '-y',
        'mcp-remote',
        'https://stitch.googleapis.com/mcp',
        '--header',
        'X-Goog-Api-Key: stak_inline_leak'
      ]
    }
  }
}, null, 2)}\n`, 'utf8');
fs.mkdirSync(path.dirname(postmanLegacyPath), { recursive: true });
fs.writeFileSync(postmanLegacyPath, `${JSON.stringify({
  headers: { Authorization: 'Bearer pmak_inline_leak' }
}, null, 2)}\n`, 'utf8');
fs.writeFileSync(stitchLegacyPath, `${JSON.stringify({
  args: ['--header', 'X-Goog-Api-Key: stak_inline_leak']
}, null, 2)}\n`, 'utf8');
NODE
(
  export HOME="$TMP_DIR/home"
  cd credcheck
  node "$CLI" workflows config keys doctor --scope project >/tmp/cbx-c332-doctor.log
  node "$CLI" workflows config keys migrate-inline --scope project >/tmp/cbx-c332-migrate.log
)
rg -n 'Credential leak findings: ' /tmp/cbx-c332-doctor.log >/dev/null
rg -n 'credcheck/.vscode/mcp.json' /tmp/cbx-c332-doctor.log >/dev/null
rg -n 'credcheck/.cbx/mcp/codex/postman.json' /tmp/cbx-c332-doctor.log >/dev/null
rg -n 'credcheck/.cbx/mcp/codex/stitch.json' /tmp/cbx-c332-doctor.log >/dev/null
rg -n 'Inline key fields found: 2' /tmp/cbx-c332-migrate.log >/dev/null
rg -n 'Secure platform MCP target:' /tmp/cbx-c332-migrate.log >/dev/null
[ ! -f credcheck/.cbx/mcp/codex/postman.json ]
[ ! -f credcheck/.cbx/mcp/codex/stitch.json ]
if rg -n 'pmak_inline_leak|stak_inline_leak' credcheck/cbx_config.json credcheck/.vscode/mcp.json /tmp/cbx-c332-doctor.log /tmp/cbx-c332-migrate.log >/dev/null; then
  echo "[FAIL] Inline leaked secrets were not scrubbed after migrate-inline" >&2
  exit 1
fi
if rg -n '"postman"|"StitchMCP"' credcheck/.vscode/mcp.json >/dev/null; then
  echo "[FAIL] migrate-inline did not remove legacy direct Postman/Stitch runtime entries" >&2
  exit 1
fi
rg -n '"cubis-foundry"' credcheck/.vscode/mcp.json >/dev/null
log_ok "Secrets stay in the machine vault and migrate-inline repairs leaked legacy artifacts"

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
[ -f .github/copilot-instructions.md ]
[ ! -d .github/copilot/workflows ]
[ -f .github/agents/implementer.md ]
[ -f .github/agents/security-reviewer.md ]
[ -f .github/agents/devops.md ]
[ -f .github/agents/orchestrator.md ]
[ -f .github/agents/tester.md ]
[ -f .github/prompts/implement.prompt.md ]
[ -f .github/prompts/spec.prompt.md ]
[ -f .github/prompts/review.prompt.md ]
[ -f .github/prompts/deploy.prompt.md ]
if [ "$(find .github/agents -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -ne "$EXPECTED_AGENT_COUNT" ]; then
  echo "[FAIL] Copilot expected exactly $EXPECTED_AGENT_COUNT agent files" >&2
  exit 1
fi
if [ "$(find .github/prompts -maxdepth 1 -type f -name '*.prompt.md' | wc -l | tr -d ' ')" -ne "$EXPECTED_WORKFLOW_COUNT" ]; then
  echo "[FAIL] Copilot expected exactly $EXPECTED_WORKFLOW_COUNT prompt files" >&2
  exit 1
fi
[ -d .github/skills ]
[ -d "$COPILOT_INSTALLED_SKILLS/api-design" ]
rg -n '^name:' "$COPILOT_INSTALLED_SKILLS/owasp-security-review/SKILL.md" >/dev/null
if rg -n '^allowed-tools:' "$COPILOT_INSTALLED_SKILLS/owasp-security-review/SKILL.md" >/dev/null; then
  echo "[FAIL] Copilot global skill SKILL.md still contains unsupported allowed-tools attribute" >&2
  exit 1
fi
if rg -n '^priority:' "$COPILOT_INSTALLED_SKILLS/owasp-security-review/SKILL.md" >/dev/null; then
  echo "[FAIL] Copilot global skill SKILL.md still contains unsupported priority attribute" >&2
  exit 1
fi
rg -n 'Platform MCP target \(.+[\\/]\.vscode[\\/]mcp\.json\): (installed|replaced|patched)' /tmp/cbx-p2.log >/dev/null
if rg -n '^skills:' .github/agents/implementer.md >/dev/null; then
  echo "[FAIL] Copilot agent file still contains unsupported skills attribute" >&2
  exit 1
fi
assert_file_contains_literal .github/prompts/implement.prompt.md "official docs as primary evidence" "Copilot workflow prompt"
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

log_step "P2.1 /implement wiring check (Copilot files)"
assert_file_contains_literal .github/prompts/implement.prompt.md "# Workflow Prompt: /implement" "Copilot implement prompt"
assert_file_contains_literal .github/prompts/implement.prompt.md "@implementer" "Copilot implement prompt"
assert_file_contains_literal .github/prompts/spec.prompt.md "# Workflow Prompt: /spec" "Copilot spec prompt"
assert_file_contains_literal .github/prompts/spec.prompt.md "spec-driven-delivery" "Copilot spec prompt"
log_ok "Copilot prompts declare /implement and /spec with the expected routing"

log_step "P2.2 Copilot global precedence sync"
node - <<'NODE'
const fs = require('fs');
const file = '.github/copilot-instructions.md';
const text = fs.readFileSync(file, 'utf8');
const cleaned = text.replace(/\n?<!--\s*cbx:workflows:auto:start[\s\S]*?<!--\s*cbx:workflows:auto:end\s*-->\n?/g, '\n');
fs.writeFileSync(file, cleaned, 'utf8');
NODE
echo "Custom copilot workspace rule must stay" >>.github/copilot-instructions.md
if rg -n '^<!-- cbx:workflows:auto:start' .github/copilot-instructions.md >/dev/null; then
  echo "[FAIL] Failed to clear Copilot managed block before global precedence sync test" >&2
  exit 1
fi
node "$CLI" workflows sync-rules --platform copilot --scope global >/tmp/cbx-p22.log
rg -n '^<!-- cbx:workflows:auto:start platform=copilot version=1 -->' .github/copilot-instructions.md >/dev/null
rg -n 'Custom copilot workspace rule must stay' .github/copilot-instructions.md >/dev/null
rg -n 'Workspace rule file detected at' /tmp/cbx-p22.log >/dev/null
rg -n 'Workspace rule managed block sync action:' /tmp/cbx-p22.log >/dev/null
log_ok "Copilot global sync updates .github/copilot-instructions.md managed block and preserves custom content"

log_step "P2.3 Rules init (Copilot)"
node "$CLI" rules init --platform copilot --scope project --overwrite >/tmp/cbx-p23.log
[ -f ENGINEERING_RULES.md ]
[ -f TECH.md ]
rg -n '^<!-- cbx:engineering:auto:start platform=copilot version=1 -->' .github/copilot-instructions.md >/dev/null
rg -n 'YAGNI' ENGINEERING_RULES.md >/dev/null
rg -n '^# TECH\.md$' TECH.md >/dev/null
log_ok "Copilot rules init creates ENGINEERING_RULES.md, TECH.md, and copilot-instructions rule block"

log_step "P3 Sync idempotency"
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3a.log
node "$CLI" workflows sync-rules --platform copilot >/tmp/cbx-p3b.log
rg -n 'Action: unchanged' /tmp/cbx-p3b.log >/dev/null
log_ok "Copilot second sync is idempotent"

log_step "P4 Remove apply"
node "$CLI" workflows remove agent-environment-setup --platform copilot --scope project --yes >/tmp/cbx-p4.log
[ ! -f .github/agents/implementer.md ]
[ ! -f .github/prompts/implement.prompt.md ]
[ ! -d "$COPILOT_INSTALLED_SKILLS/api-design" ]
[ -f .github/copilot-instructions.md ]
rg -n 'No installed workflows found yet\.' .github/copilot-instructions.md >/dev/null
log_ok "Copilot bundle removed and managed block kept"

log_step "Q1 Claude apply + hook templates"
node "$CLI" workflows install --platform claude --bundle agent-environment-setup --overwrite --yes >/tmp/cbx-q1.log
[ -f CLAUDE.md ]
[ -f .claude/skills/implement/SKILL.md ]
[ -f .claude/skills/spec/SKILL.md ]
[ -f .claude/agents/explorer.md ]
[ ! -d .claude/workflows ]
[ -f .claude/hooks/README.md ]
[ -f .claude/hooks/settings.snippet.json ]
[ -f .claude/hooks/route-research-guard.mjs ]
assert_file_contains_literal .claude/hooks/settings.snippet.json "UserPromptSubmit" "Claude hook settings snippet"
assert_file_contains_literal .claude/hooks/route-research-guard.mjs "skill_validate" "Claude hook script"
assert_file_contains_literal .claude/hooks/route-research-guard.mjs "official docs as primary evidence" "Claude hook script"
assert_file_contains_literal .claude/skills/spec/SKILL.md "# Spec Workflow" "Claude spec workflow skill"
log_ok "Claude install includes route/research hook templates and the spec workflow skill"

log_step "G1 Gemini apply"
node "$CLI" workflows install --platform gemini --bundle agent-environment-setup --overwrite --yes >/tmp/cbx-g1.log
[ -f .gemini/GEMINI.md ]
[ -d .gemini/commands ]
[ -f .gemini/commands/implement.toml ]
[ -f .gemini/commands/spec.toml ]
[ -f .gemini/commands/agent-implementer.toml ]
[ ! -d .gemini/workflows ]
[ ! -d .gemini/skills ]
if [ "$(find .gemini/commands -maxdepth 1 -type f -name '*.toml' | wc -l | tr -d ' ')" -ne "$EXPECTED_ROUTE_COMMAND_COUNT" ]; then
  echo "[FAIL] Gemini expected exactly $EXPECTED_ROUTE_COMMAND_COUNT command files" >&2
  exit 1
fi
assert_file_contains_literal .gemini/commands/implement.toml ".agents/skills/api-design/SKILL.md" "Gemini implement command skill hint"
assert_file_contains_literal .gemini/commands/spec.toml ".agents/skills/spec-driven-delivery/SKILL.md" "Gemini spec command skill hint"
log_ok "Gemini install uses commands only, including the spec workflow"

log_step "X1 Single-project all-platform install"
mkdir -p all-platforms
(
  cd all-platforms
  node "$CLI" workflows install --platform codex --bundle agent-environment-setup --yes >/tmp/cbx-x1-codex.log
  node "$CLI" workflows install --platform antigravity --bundle agent-environment-setup --yes >/tmp/cbx-x1-antigravity.log
  node "$CLI" workflows install --platform claude --bundle agent-environment-setup --yes >/tmp/cbx-x1-claude.log
  node "$CLI" workflows install --platform copilot --bundle agent-environment-setup --yes >/tmp/cbx-x1-copilot.log
  node "$CLI" workflows install --platform gemini --bundle agent-environment-setup --yes >/tmp/cbx-x1-gemini.log
)
[ -f all-platforms/AGENTS.md ]
[ -f all-platforms/.codex/agents/implementer.toml ]
[ -f all-platforms/.agents/skills/spec-driven-delivery/SKILL.md ]
[ -f all-platforms/.agents/skills/spec/SKILL.md ]
[ -f all-platforms/.agents/rules/GEMINI.md ]
[ -f all-platforms/.agents/skills/api-design/SKILL.md ]
[ -f all-platforms/.github/agents/implementer.md ]
[ -f all-platforms/.github/prompts/implement.prompt.md ]
[ -f all-platforms/.github/prompts/spec.prompt.md ]
[ -f all-platforms/CLAUDE.md ]
[ -f all-platforms/.claude/agents/implementer.md ]
[ -f all-platforms/.claude/skills/implement/SKILL.md ]
[ -f all-platforms/.claude/skills/spec/SKILL.md ]
[ -f all-platforms/.gemini/GEMINI.md ]
[ -f all-platforms/.gemini/commands/implement.toml ]
[ -f all-platforms/.gemini/commands/spec.toml ]
assert_file_contains_literal all-platforms/.gemini/commands/spec.toml ".agents/skills/spec-driven-delivery/SKILL.md" "Shared Gemini/Antigravity spec command"
assert_file_contains_literal all-platforms/.claude/skills/spec/SKILL.md "# Spec Workflow" "Shared Claude spec workflow skill"
assert_file_contains_literal all-platforms/.github/prompts/spec.prompt.md "# Workflow Prompt: /spec" "Shared Copilot spec prompt"
assert_file_contains_literal all-platforms/.gemini/commands/implement.toml ".agents/skills/api-design/SKILL.md" "Shared Gemini/Antigravity implement command"
if ! diff -q all-platforms/.gemini/commands/implement.toml "$ROOT_DIR/workflows/workflows/agent-environment-setup/platforms/gemini/commands/implement.toml" >/dev/null; then
  echo "[FAIL] Shared .gemini/commands implement.toml drifted from the canonical generated command" >&2
  exit 1
fi
log_ok "All supported platforms install into one project without clobbering shared native surfaces"

log_step "DONE"
echo "ALL_OK"
