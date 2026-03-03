---
name: bug-fix
description: "Bug fix workflow with systematic debugging. Use when: fixing bugs, resolving issues, regression fixes, test failures, unexpected behavior. Not for: new features (use feature-dev), understanding code (use code-explore). Output: root-cause fix + regression test + review gate."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git:*), Bash(yarn:*), Bash(gh:*)
---

# Bug Fix Skill

## Trigger

- Keywords: bug, issue, fix, error, broken, failing, debug, investigate, unexpected behavior

## When NOT to Use

- New feature development (use feature-dev)
- Just want to understand code (use code-explore)
- Code review (use codex-review-fast)

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## Workflow

```
Phase 1        Phase 2         Phase 3          Phase 4        Phase 5
Root Cause ──→ Pattern    ──→ Hypothesis  ──→  Fix + Test ──→ Review
Investigation  Analysis       & Testing        (TDD cycle)    Gate
  │              │               │                │              │
  ▼              ▼               ▼                ▼              ▼
Read errors   Find working   Form theory     Write test     /verify
Reproduce     examples       Test minimally  Minimal fix    /codex-review-fast
Check changes Compare        One variable    Verify         /precommit
Trace data    differences    at a time
```

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

### 1. Read Error Messages Carefully

- Don't skip past errors or warnings
- Read stack traces completely
- Note line numbers, file paths, error codes

### 2. Reproduce Consistently

- Can you trigger it reliably?
- What are the exact steps?
- If not reproducible, gather more data -- don't guess

### 3. Check Recent Changes

| Source | Action |
|--------|--------|
| GitHub Issue | `gh issue view <number>` |
| Error message | `Grep("error message")` |
| Code history | `/git-investigate` |
| Git diff | `git diff`, recent commits |
| Config changes | New dependencies, env differences |

### 4. Gather Evidence in Multi-Component Systems

**WHEN system has multiple components:**

```
For EACH component boundary:
  - Log what data enters component
  - Log what data exits component
  - Verify environment/config propagation
  - Check state at each layer

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify failing component
THEN investigate that specific component
```

### 5. Trace Data Flow

- Where does bad value originate?
- What called this with bad value?
- Keep tracing up until you find the source
- Fix at source, not at symptom

**Output root cause analysis:**

- Problem location: `src/xxx.ts:123`
- Root cause: (specific cause)
- Impact scope: (which features are affected)

## Phase 2: Pattern Analysis

### 1. Find Working Examples

- Locate similar working code in same codebase
- What works that's similar to what's broken?

### 2. Compare Against References

- If implementing pattern, read reference implementation COMPLETELY
- Don't skim -- read every line

### 3. Identify Differences

- What's different between working and broken?
- List every difference, however small
- Don't assume "that can't matter"

### 4. Understand Dependencies

- What other components does this need?
- What settings, config, environment?
- What assumptions does it make?

## Phase 3: Hypothesis and Testing

### Scientific Method

1. **Form single hypothesis** -- "I think X is the root cause because Y"
2. **Test minimally** -- SMALLEST possible change, one variable at a time
3. **Verify before continuing** -- Did it work? Yes -> Phase 4. No -> NEW hypothesis
4. **Don't stack fixes** -- DON'T add more fixes on top of a failed one

## Phase 4: Fix + Test (TDD Cycle)

### 1. Write Failing Regression Test

**Bug fixes must have tests at the corresponding level:**

| Bug Type | Required | Recommended |
|----------|----------|-------------|
| Logic error | Unit | - |
| Service issue | Unit | Integration |
| API issue | Integration | E2E |
| User flow | E2E | - |

Detailed guide: [testing-guide.md](./references/testing-guide.md)

### 2. Implement Single Fix

| Principle | Description |
|-----------|-------------|
| Minimal changes | Only modify what is necessary |
| Root cause | Fix the root cause, not the symptom |
| One change | ONE fix at a time, no bundled refactoring |
| No new issues | Confirm changes don't affect other features |

### 3. Verify Fix

- Regression test passes now?
- No other tests broken?
- Issue actually resolved?

### 4. If Fix Doesn't Work

- **< 3 attempts:** Return to Phase 1, re-analyze with new information
- **>= 3 attempts:** STOP and question the architecture (see below)

### 4.5. If 3+ Fixes Failed: Question Architecture

**Pattern indicating architectural problem:**

- Each fix reveals new shared state/coupling/problem in different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

**STOP and question fundamentals:**

- Is this pattern fundamentally sound?
- Are we "sticking with it through sheer inertia"?
- Should we refactor architecture vs. continue fixing symptoms?

**Discuss with user before attempting more fixes.**

## Phase 5: Review Gate

```bash
/verify              # Run tests
/codex-review-fast   # Code review
/codex-test-review   # Test review
/precommit           # Pre-commit checks
```

**Follow @rules/auto-loop.md**

```
Fix -> Review -> Issues found -> Fix again -> ... -> Pass
```

## Red Flags - STOP and Follow Process

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems:" (listing fixes without investigation)
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals new problem in different place

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5).

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms is not understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Output

```markdown
## Bug Fix Report

- **Root cause**: (analysis from Phase 1-2)
- **Hypothesis**: (from Phase 3)
- **Fix**: (description of changes)
- **Regression test**: (test result with evidence)
- **Gate**: Pass / Needs further investigation
```

## Verification

- [ ] Root cause identified (not just symptoms)
- [ ] Issue confirmed fixed
- [ ] Regression test written at corresponding level
- [ ] Watched regression test fail before fix (red-green)
- [ ] All tests passing
- [ ] Code review passed

## Examples

```
Input: Fix issue #123 - calculation error
Action: Read error -> Reproduce -> Trace data -> Find root cause -> Write Unit Test -> Fix -> /verify -> /codex-review-fast
```

```
Input: API returning 500 error
Action: Read logs -> Check recent changes -> Trace request flow -> Write Integration Test -> Fix -> /verify -> /codex-review-fast
```
