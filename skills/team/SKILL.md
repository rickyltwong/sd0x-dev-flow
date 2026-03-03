---
name: team
description: "Spawn and coordinate parallel agent teams using Claude Code native tools. Use when: multi-file tasks, parallel work, distributed implementation. Not for: single-file edits, sequential tasks, research. Output: completed parallel work with verification."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

# Agent Team Skill

## Trigger

- Keywords: team, parallel agents, spawn workers, distribute tasks, coordinated work

## When NOT to Use

- Single-file edits (just do it directly)
- Sequential tasks with tight dependencies (do them in order)
- Pure research or exploration (use code-explore or Agent with Explore type)
- Tasks requiring constant human input

## 4-Phase Workflow

```
Phase 1: Decompose    Phase 2: Create       Phase 3: Spawn &     Phase 4: Complete
                      Team                   Monitor
  |                     |                      |                    |
  v                     v                      v                    v
Break task into    TeamCreate +           Agent(team_name=...)  Verify all tasks
N independent      TaskCreate with        for each worker       done + shutdown +
subtasks           dependencies                                 TeamDelete
```

## Phase 1: Decompose

Break the overall task into independent subtasks suitable for parallel execution.

**Rules:**
- Each subtask must be independently completable
- Minimize cross-task dependencies (use `addBlockedBy` when unavoidable)
- Each subtask should touch different files to avoid conflicts
- Include clear acceptance criteria in each task description

**Example decomposition:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| T1 | Implement user model + migration | None |
| T2 | Implement auth service | Blocked by T1 |
| T3 | Write API endpoint tests | Blocked by T1 |
| T4 | Update documentation | None |

## Phase 2: Create Team

```
1. TeamCreate(team_name="<descriptive-slug>", description="<what we're building>")
2. TaskCreate for each subtask (with description, activeForm)
3. TaskUpdate(addBlockedBy=[...]) for dependent tasks
```

**Task descriptions must include:**
- What to implement (specific files, functions)
- Acceptance criteria (what "done" looks like)
- Any constraints or patterns to follow

## Phase 3: Spawn & Monitor

Spawn one Agent per worker, passing the team name:

```
Agent(
  subagent_type="general-purpose",
  team_name="<team-name>",
  name="worker-1",
  prompt="You are a teammate. Read your assigned task via TaskGet, execute it, mark TaskUpdate(status=completed), then SendMessage to lead with a summary. Check TaskList for next available task."
)
```

**Worker protocol (embedded in each spawn prompt):**

1. `TaskList` -- find assigned or available unblocked tasks
2. `TaskGet(taskId)` -- read full task details
3. Execute the work described in the task
4. `TaskUpdate(taskId, status="completed")` -- mark done
5. `SendMessage(type="message", recipient="lead", content="...", summary="...")` -- report to lead
6. `TaskList` -- check for next available task
7. Repeat until no tasks remain

**Monitoring:**
- Messages from teammates are delivered automatically
- Check TaskList periodically to see progress
- Idle teammates can receive new messages to wake them up

## Phase 4: Complete

1. Verify all tasks are `completed` via `TaskList`
2. Run verification (`/verify` or `/verify-completion`)
3. Send `shutdown_request` to each worker
4. `TeamDelete` to clean up

## Handling Issues

| Issue | Action |
|-------|--------|
| Worker idle > 5 min | Send message to wake: "Continue working on your task" |
| Worker reports failure | Reassign task to another worker or handle directly |
| Task blocked by unresolved dependency | Help unblock or reassign the blocking task |
| Merge conflict between workers | Resolve directly, then notify affected workers |
| All tasks done but verification fails | Create new fix tasks, assign to available workers |

## Task Dependency System

Use `addBlockedBy` to express task ordering:

```
TaskCreate(subject="Implement auth service", ...)  -> returns task ID "2"
TaskCreate(subject="Write auth tests", ...)         -> returns task ID "3"
TaskUpdate(taskId="3", addBlockedBy=["2"])          -> task 3 waits for task 2
```

Workers automatically skip blocked tasks when checking `TaskList`.

## Integration with /loop

Use `/team --loop` for persistent team execution:

1. `/loop` activates the persistent loop state
2. Team lead stays alive while workers execute
3. Lead deactivates loop only after all tasks verified complete

**Activation sequence:**
```
1. Write .sd0x_loop_state.json (active: true)
2. TeamCreate + TaskCreate
3. Spawn workers
4. Monitor until all complete
5. Verify
6. Set .sd0x_loop_state.json active: false
7. TeamDelete
```

## Worker Types

Choose `subagent_type` based on what the worker needs:

| Type | Use When |
|------|----------|
| `general-purpose` | Full implementation work (edit, write, bash) |
| `Explore` | Research-only tasks (no file editing) |
| `Plan` | Planning tasks (no file editing) |

## Naming Convention

| Element | Convention | Example |
|---------|-----------|---------|
| Team name | kebab-case slug | `auth-feature`, `lint-fixes` |
| Worker names | `worker-N` or role-based | `worker-1`, `frontend`, `backend` |
| Task subjects | Imperative form | "Implement user model" |

## Red Flags

| Pattern | Problem |
|---------|---------|
| Spawning workers before creating tasks | Workers have nothing to do |
| Not including worker protocol in spawn prompt | Workers don't know how to coordinate |
| Forgetting TeamDelete after completion | Stale team state persists |
| Tasks that overlap on same files | Merge conflicts between workers |
| No verification after all tasks complete | Incomplete or broken result |
