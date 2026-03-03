---
description: Evidence-based completion gate. Ensures fresh verification evidence before any completion claim.
argument-hint: [claim to verify]
allowed-tools: Read, Grep, Glob, Bash, Skill
---

Must read and follow the skill below before executing this command:

@skills/verify-completion/SKILL.md

## Context

- Git status: !`git status -sb`
- Current branch: !`git branch --show-current`

## Arguments

| Parameter | Description |
|-----------|-------------|
| `[claim]` | The completion claim to verify (e.g., "tests pass", "bug fixed") |

## Workflow

```
IDENTIFY proof -> RUN verification -> READ output -> VERIFY claim -> REPORT with evidence
```

## Key Rules

- NO completion claims without fresh verification evidence
- Run the command, read the output, THEN claim the result
- "Should work" is not evidence

## Verification Commands

| Claim | Run |
|-------|-----|
| Tests pass | `/verify` |
| Code reviewed | `/codex-review-fast` |
| Pre-commit clean | `/precommit` |
| Bug fixed | `/verify` + check regression test |
| Feature complete | `/feature-verify` |

## Examples

```bash
/verify-completion "all tests pass"
/verify-completion "bug #123 is fixed"
/verify-completion "feature ready for PR"
```
