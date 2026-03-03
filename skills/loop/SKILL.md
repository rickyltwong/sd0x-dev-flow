---
name: loop
description: "Persistent execution loop -- keep working until done. Use when: autonomous tasks, must-complete work, iterative implementation. Not for: simple one-shot tasks, quick fixes. Output: completed task with verification."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

# Persistent Loop Skill

## Trigger

- Keywords: loop, don't stop, keep going, until done, must complete, persist, autonomous

## When NOT to Use

- Simple one-shot tasks (single file edit, quick fix)
- Research or exploration (use code-explore)
- Tasks that need human decisions at every step

## How It Works

A Stop hook (`hooks/persistent-loop.sh`) reads `.sd0x_loop_state.json` from the project directory. While `active: true` and `iteration < max_iterations`, the hook blocks Claude from stopping and increments the iteration counter.

```
Activate state file -> Work on task -> Stop hook fires -> Hook blocks stop
       |                                                        |
       v                                                        v
  .sd0x_loop_state.json                              Iteration incremented
  { active: true, ... }                              Claude continues working
```

## Activation

Write `.sd0x_loop_state.json` to the project root:

```json
{
  "active": true,
  "mode": "loop",
  "iteration": 0,
  "max_iterations": 10,
  "started_at": "2026-03-03T12:00:00Z",
  "last_checked_at": "2026-03-03T12:00:00Z",
  "task": "implement feature X with full test coverage"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `active` | boolean | Must be `true` to block stops |
| `mode` | string | Always `"loop"` |
| `iteration` | number | Current iteration (starts at 0, incremented by hook) |
| `max_iterations` | number | Safety limit (default: 10) |
| `started_at` | string | ISO 8601 timestamp |
| `last_checked_at` | string | Updated by hook on each stop attempt |
| `task` | string | Human-readable task description |

## Deactivation

Set `active: false` when work is complete:

```json
{
  "active": false,
  "iteration": 7,
  "max_iterations": 10,
  "task": "implement feature X with full test coverage"
}
```

Or delete the file entirely.

## Workflow

```
1. Activate   -- Write state file with task description
2. Work       -- Execute the task (edit, test, fix, repeat)
3. Check      -- After each logical milestone, read state to see iteration count
4. Verify     -- Before deactivating, run /verify-completion or /verify
5. Deactivate -- Set active: false (or delete file)
```

## Max Iterations Guidance

| Task Type | Suggested Max |
|-----------|---------------|
| Small feature (1-3 files) | 5 |
| Medium feature (3-10 files) | 10 |
| Large feature / refactor | 20 |
| Multi-step pipeline | 15 |

## Safety Mechanisms

| Mechanism | Behavior |
|-----------|----------|
| Max iterations | Stop allowed when `iteration >= max_iterations` |
| Staleness | Stop allowed when `last_checked_at` > 2 hours ago |
| Context limit | Stop always allowed on `context_limit` stop type |
| HOOK_BYPASS=1 | Stop always allowed |
| Missing jq | Fail-open (stop allowed) |
| Missing state file | Stop allowed |

## Integration with /team

When using `/team --loop`, the loop state keeps the lead agent alive while workers execute. The lead should:

1. Activate loop before spawning workers
2. Monitor TaskList for completion
3. Deactivate loop only after all tasks are verified complete

## Red Flags

| Pattern | Problem |
|---------|---------|
| Forgetting to deactivate | Loop persists across sessions; check on startup |
| "I'll just do one more thing" without checking state | Iteration may be near limit |
| Not running verification before deactivating | Task may be incomplete |
| Setting max_iterations too high | Risk of runaway execution |

## Deactivation Checklist

Before setting `active: false`:

- [ ] All planned work items complete
- [ ] Tests passing (`/verify` or equivalent)
- [ ] No remaining TODOs in scope
- [ ] State file updated with final iteration count
