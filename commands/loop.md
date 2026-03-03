---
description: Persistent execution loop -- keep working until task is done, don't stop early.
argument-hint: <task description> [--max N] [--stop]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

**Must read and follow the skill below before executing this command:**

@skills/loop/SKILL.md

## Context

- Working directory: !`pwd`
- Existing loop state: !`bash -c 'test -f .sd0x_loop_state.json && cat .sd0x_loop_state.json || echo "no active loop"'`

## Task

Manage a persistent execution loop.

### Arguments

```
$ARGUMENTS
```

### Behavior

**Default (start/continue loop):**

1. Parse `$ARGUMENTS` for task description and optional `--max N` (default: 10)
2. Write `.sd0x_loop_state.json` with `active: true`, `iteration: 0`, `max_iterations: N`
3. Begin executing the described task
4. Work iteratively until complete
5. Run `/verify-completion` or `/verify` before deactivating
6. Set `active: false` when done

**With `--stop`:**

1. Read current `.sd0x_loop_state.json`
2. Set `active: false`
3. Report final iteration count and status

### Max Iterations

| Flag | Default | Description |
|------|---------|-------------|
| `--max N` | 10 | Override max iterations |
| `--stop` | - | Deactivate the loop |

## Examples

```bash
/loop implement user authentication with full test coverage
/loop --max 20 refactor the service layer to use dependency injection
/loop --stop
```
