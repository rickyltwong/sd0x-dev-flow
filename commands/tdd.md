---
description: Test-driven development workflow. Enforces RED-GREEN-REFACTOR cycle for all production code.
argument-hint: "<feature or bug description>" [--bug]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

Must read and follow the skill below before executing this command:

@skills/tdd/SKILL.md

## Context

- Git status: !`git status -sb`
- Current branch: !`git branch --show-current`

## Arguments

| Parameter | Description |
|-----------|-------------|
| `<description>` | Feature or bug to implement with TDD |
| `--bug` | Bug fix mode: write regression test first |

## Workflow

```
RED ──→ Verify Fails ──→ GREEN ──→ Verify Passes ──→ REFACTOR ──→ Verify Green ──→ Next
```

## Key Rules

- NO production code without a failing test first
- Watch each test fail before implementing
- Write minimal code to pass each test
- Follow @rules/auto-loop.md after implementation

## Review Gate

After all tests pass:

```bash
/verify              # Run full test suite
/codex-review-fast   # Code review
/codex-test-review   # Test quality review
/precommit           # Pre-commit checks
```

## Examples

```bash
/tdd "Add email validation to signup form"
/tdd "Implement retry logic with exponential backoff"
/tdd --bug "Fix: empty email accepted in form submission"
```
