---
name: verify-completion
description: "Evidence-based completion gate. Use when: about to claim work is complete, fixed, or passing, before committing or creating PRs. Not for: running tests (use /verify), code review (use /codex-review-fast). Output: verified completion claim with evidence."
allowed-tools: Read, Grep, Glob, Bash, Skill
---

# Verification Before Completion

## Trigger

- Keywords: done, complete, finished, all tests pass, ready to commit, ready for PR, fixed

## When to Use

**ALWAYS before:**

- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task

## When NOT to Use

- Running tests (use `/verify`)
- Code review (use `/codex-review-fast`)
- Feature development (use `/feature-dev`)

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Integration with sd0x Commands

| Claim | Verification Command |
|-------|---------------------|
| Tests pass | `/verify` |
| Code is clean | `/precommit` |
| Code is reviewed | `/codex-review-fast` |
| Bug is fixed | `/verify` + regression test |
| Feature complete | `/feature-verify` |

## Key Patterns

**Tests:**

```
Correct:  [Run /verify] [See: 34/34 pass] "All tests pass"
Wrong:    "Should pass now" / "Looks correct"
```

**Build:**

```
Correct:  [Run build] [See: exit 0] "Build passes"
Wrong:    "Linter passed" (linter doesn't check compilation)
```

**Requirements:**

```
Correct:  Re-read plan -> Create checklist -> Verify each -> Report gaps or completion
Wrong:    "Tests pass, phase complete"
```

**Agent delegation:**

```
Correct:  Agent reports success -> Check VCS diff -> Verify changes -> Report actual state
Wrong:    Trust agent report
```

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- ANY wording implying success without having run verification

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence is not evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter is not compiler |
| "Agent said success" | Verify independently |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |
| "Tests passed earlier" | Fresh evidence required |

## Output

```markdown
## Verification Report

- **Claim**: <what was claimed>
- **Command**: <verification command run>
- **Evidence**: <output summary with counts/exit codes>
- **Status**: Verified / Not verified
```

## Relationship to Stop Guard

- **stop-guard** = hook-level enforcement (blocks stopping without review)
- **verify-completion** = behavior-level discipline (prevents false claims)
- They are complementary: stop-guard catches mechanical violations, this skill prevents intellectual dishonesty

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
