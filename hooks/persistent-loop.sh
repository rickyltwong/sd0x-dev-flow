#!/usr/bin/env bash
# Persistent Loop Stop Hook - Block stop while loop is active
# Exit 0 = allow stop, Exit 2 = block stop
#
# Reads .sd0x_loop_state.json from project directory.
# If active and below max_iterations: increments iteration, blocks stop.
# If inactive, at limit, stale, or missing: allows stop.
#
# Safety:
# - context_limit stop type: always allow (prevents deadlock)
# - Staleness: last_checked_at > 2 hours ago -> allow stop
# - HOOK_BYPASS=1: allow stop
# - Missing jq: fail-open (allow stop)

set -euo pipefail

if [[ "${HOOK_BYPASS:-}" == "1" ]]; then
  echo "[Persistent Loop] BYPASS mode, skipping checks" >&2
  exit 0
fi

# Read JSON input from stdin
INPUT=$(cat)

# Check for context_limit stop type (always allow to prevent deadlock)
if command -v jq &> /dev/null; then
  STOP_TYPE=$(echo "$INPUT" | jq -r '.stop_hook_type // empty' 2>/dev/null || true)
  if [[ "$STOP_TYPE" == "context_limit" ]]; then
    echo "[Persistent Loop] Context limit reached, allowing stop" >&2
    exit 0
  fi
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
  echo "[Persistent Loop] jq not installed, allowing stop" >&2
  exit 0
fi

STATE_FILE=".sd0x_loop_state.json"

if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "{}")

ACTIVE=$(echo "$STATE" | jq -r '.active // false' 2>/dev/null)
if [[ "$ACTIVE" != "true" ]]; then
  exit 0
fi

ITERATION=$(echo "$STATE" | jq -r '.iteration // 0' 2>/dev/null)
MAX_ITERATIONS=$(echo "$STATE" | jq -r '.max_iterations // 10' 2>/dev/null)

# Check staleness: if last_checked_at > 2 hours ago, allow stop
LAST_CHECKED=$(echo "$STATE" | jq -r '.last_checked_at // empty' 2>/dev/null)
if [[ -n "$LAST_CHECKED" ]]; then
  if command -v date &> /dev/null; then
    LAST_EPOCH=$(date -d "$LAST_CHECKED" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${LAST_CHECKED%%Z*}" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    STALE_THRESHOLD=7200  # 2 hours
    if [[ "$LAST_EPOCH" != "0" ]] && (( NOW_EPOCH - LAST_EPOCH > STALE_THRESHOLD )); then
      echo "[Persistent Loop] State is stale (>2h), allowing stop" >&2
      exit 0
    fi
  fi
fi

# Check if at max iterations
if (( ITERATION >= MAX_ITERATIONS )); then
  echo "[Persistent Loop] Max iterations reached ($ITERATION/$MAX_ITERATIONS), allowing stop" >&2
  exit 0
fi

# Active and below limit: increment iteration, update timestamp, block stop
NEW_ITERATION=$((ITERATION + 1))
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

UPDATED_STATE=$(echo "$STATE" | jq \
  --argjson iter "$NEW_ITERATION" \
  --arg now "$NOW" \
  '.iteration = $iter | .last_checked_at = $now' 2>/dev/null)

if [[ -n "$UPDATED_STATE" ]]; then
  echo "$UPDATED_STATE" > "$STATE_FILE"
fi

TASK=$(echo "$STATE" | jq -r '.task // "task in progress"' 2>/dev/null)

echo "[Persistent Loop] Blocking stop: iteration $NEW_ITERATION/$MAX_ITERATIONS" >&2
printf '{"decision":"block","reason":"[LOOP iteration %d/%d] %s"}\n' "$NEW_ITERATION" "$MAX_ITERATIONS" "$TASK"
exit 2
