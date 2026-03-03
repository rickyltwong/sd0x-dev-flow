---
description: Spawn and coordinate a parallel agent team for multi-file tasks.
argument-hint: N:type "task description" [--loop]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

**Must read and follow the skill below before executing this command:**

@skills/team/SKILL.md

## Context

- Working directory: !`pwd`
- Git branch: !`bash -c 'git branch --show-current 2>/dev/null || echo "not a git repo"'`

## Task

Spawn and coordinate a parallel agent team.

### Arguments

```
$ARGUMENTS
```

### Behavior

1. Parse `$ARGUMENTS`:
   - `N:type` -- number of workers and agent type (e.g., `3:general-purpose`)
   - Task description in quotes
   - `--loop` flag (optional): activate persistent loop alongside team
2. Decompose the task into N independent subtasks (Phase 1)
3. If `--loop`: write `.sd0x_loop_state.json` with `active: true`
4. Create team and tasks (Phase 2)
5. Spawn N workers with the specified agent type (Phase 3)
6. Monitor and coordinate until all tasks complete (Phase 4)
7. Run verification (`/verify` or equivalent)
8. If `--loop`: set `active: false` in `.sd0x_loop_state.json`
9. Shut down workers and delete team

### Agent Types

| Type | Description | Tools |
|------|-------------|-------|
| `general-purpose` | Full implementation | All tools |
| `Explore` | Research only | Read-only tools |
| `Plan` | Planning only | Read-only tools |

## Examples

```bash
/team 3:general-purpose "fix all lint errors across the codebase"
/team 2:general-purpose "implement auth service and write tests" --loop
/team 4:general-purpose "refactor service layer into separate modules"
```
