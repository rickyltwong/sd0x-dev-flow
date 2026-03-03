#!/usr/bin/env bash
# SessionStart hook: namespace guidance + skill-awareness primer

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# --- Part 1: Namespace hint (same as namespace-hint.sh) ---
echo "Plugin sd0x-dev-flow: all /command references should be invoked as /sd0x-dev-flow:command"
echo "Plugin scripts: use 'bash scripts/run-skill.sh <skill> <script> [args]' for execution"

# --- Part 2: Skill-awareness primer as additionalContext ---
read -r -d '' PRIMER << 'PRIMER_EOF' || true
Check for applicable skills BEFORE taking action. Skills tell you HOW to approach tasks.

| Scenario | Skill | Command |
|----------|-------|---------|
| Fix a bug | Systematic debugging | /bug-fix |
| New feature | Feature development | /feature-dev |
| Write tests first | TDD (RED-GREEN-REFACTOR) | /tdd |
| Review code | Code review | /codex-review-fast |
| Before claiming done | Verification gate | /verify-completion |
| Explore solutions | Adversarial brainstorm | /codex-brainstorm |
| Verify feature | Read-only verification | /feature-verify |

Red flags -- STOP, you are rationalizing:

| Thought | Reality |
|---------|---------|
| "Too simple for a skill" | Simple things become complex. Use the skill. |
| "I already know the answer" | Skills prevent blind spots. Check first. |
| "Let me just start coding" | Skills tell you HOW to start. Check first. |
| "I'll test after" | TDD requires test FIRST. No exceptions. |
| "Should work now" | Evidence before claims. Run verification. |
| "Skip the process this once" | Process exists because skipping fails. |
PRIMER_EOF

# Escape for JSON
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

PRIMER_ESCAPED=$(escape_for_json "$PRIMER")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${PRIMER_ESCAPED}"
  }
}
EOF

exit 0
