---
description: One-shot planning pipeline -- brainstorm, analyze, architect, spec, review, and produce implementation-ready task breakdown for /team execution.
argument-hint: "<task description>" [--skip-brainstorm] [--skip-review] [--brief] [--save-to <path>]
allowed-tools: Read, Grep, Glob, Write, Bash(git:*), Bash(ls:*), Bash(find:*), mcp__codex__codex, mcp__codex__codex-reply
---

**Must read and follow the skill below before executing this command:**

@skills/oneshot-plan/SKILL.md

## Context

- Working directory: !`pwd`
- Project root: !`bash -c 'git rev-parse --show-toplevel 2>/dev/null || pwd'`
- Git branch: !`bash -c 'git branch --show-current 2>/dev/null || echo "not a git repo"'`
- Project structure: !`ls -la src/ 2>/dev/null || ls -la lib/ 2>/dev/null || ls -la . | head -15`
- Existing docs: !`bash -c 'ls docs/features/ 2>/dev/null || echo "no docs/features/"'`

## Task

Run the full oneshot planning pipeline for the given task.

### Arguments

```
$ARGUMENTS
```

### Behavior

1. Parse `$ARGUMENTS` for task description and flags
2. Execute Phase 1: Discovery & Brainstorm (Claude + Codex adversarial debate)
   - Skip if `--skip-brainstorm` flag
3. Execute Phase 2: Parallel Analysis (3 Explore agents: feasibility, architecture, risk)
4. Execute Phase 3: Tech Spec Synthesis (merge all into structured spec)
5. Execute Phase 4: Codex Spec Review (independent validation)
   - Skip if `--skip-review` flag
6. Execute Phase 5: Final Output (save spec + print task breakdown)
7. If `--brief`: Execute Phase 6 (executive brief)

### Flags

| Flag | Description |
|------|-------------|
| `--skip-brainstorm` | Start from Phase 2 (already explored topic) |
| `--skip-review` | Skip Phase 4 Codex spec review |
| `--brief` | Also generate executive brief |
| `--save-to <path>` | Override output file path |

## Examples

```bash
/oneshot-plan "Add user authentication with JWT and OAuth2"
/oneshot-plan "Refactor service layer to repository pattern" --skip-brainstorm
/oneshot-plan "Migrate from REST to GraphQL" --brief
```
