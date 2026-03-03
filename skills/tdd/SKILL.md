---
name: tdd
description: "Test-driven development (RED-GREEN-REFACTOR). Use when: implementing features, fixing bugs, writing any production code. Not for: throwaway prototypes, generated code, configuration files. Output: tested code with verified red-green cycle."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill
---

# Test-Driven Development (TDD)

## Trigger

- Keywords: tdd, test first, red green, test driven, write test before code

## When to Use

**Always:**

- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask user first):**

- Throwaway prototypes
- Generated code
- Configuration files

## When NOT to Use

- Understanding code (use `/code-explore`)
- Reviewing code (use `/codex-review-fast`)
- Generating tests for existing code (use `/codex-test-gen`)

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

**No exceptions:**

- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests. Period.

## Red-Green-Refactor

```
RED ──→ Verify Fails ──→ GREEN ──→ Verify Passes ──→ REFACTOR ──→ Verify Still Green ──→ Next
 ↑       Correctly          │                            │                                  │
 │                           │                            │                                  │
 └───────────────────────────┴────── Wrong failure ───────┘──────────────────────────────────┘
```

### RED - Write Failing Test

Write one minimal test showing what should happen.

**Requirements:**

- One behavior per test
- Clear name describing behavior
- Real code (no mocks unless unavoidable)

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Run the test and confirm:

- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

**Test passes?** You're testing existing behavior. Fix test.

**Test errors?** Fix error, re-run until it fails correctly.

### GREEN - Minimal Code

Write simplest code to pass the test.

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN - Watch It Pass

**MANDATORY.**

Confirm:

- Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

**Test fails?** Fix code, not test.

**Other tests fail?** Fix now.

### REFACTOR - Clean Up

After green only:

- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

### Repeat

Next failing test for next feature.

## Good Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes behavior | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

## Integration with sd0x Commands

| Phase | Command | Purpose |
|-------|---------|---------|
| After GREEN | `/verify` | Run full test suite |
| After REFACTOR | `/codex-test-review` | Verify test quality |
| Before commit | `/precommit` | Full pre-commit checks |
| Generate tests | `/codex-test-gen` | Generate tests for existing code |

## Why Order Matters

**"I'll write tests after to verify it works"**

Tests written after code pass immediately. Passing immediately proves nothing:

- Might test wrong thing
- Might test implementation, not behavior
- Might miss edge cases you forgot
- You never saw it catch the bug

Test-first forces you to see the test fail, proving it actually tests something.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested" | Ad-hoc is not systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD will slow me down" | TDD faster than debugging. Pragmatic = test-first. |
| "Manual test faster" | Manual doesn't prove edge cases. You'll re-test every change. |
| "Existing code has no tests" | You're improving it. Add tests for existing code. |

## Red Flags - STOP and Start Over

- Code before test
- Test after implementation
- Test passes immediately
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual"
- "Keep as reference" or "adapt existing code"
- "Already spent X hours, deleting is wasteful"
- "TDD is dogmatic, I'm being pragmatic"
- "This is different because..."

**All of these mean: Delete code. Start over with TDD.**

## Example: Bug Fix

**Bug:** Empty email accepted

**RED**

```python
def test_rejects_empty_email():
    result = submit_form(email="")
    assert result.error == "Email required"
```

**Verify RED**

```
FAIL: AssertionError: expected 'Email required', got None
```

**GREEN**

```python
def submit_form(email: str) -> FormResult:
    if not email.strip():
        return FormResult(error="Email required")
    # ...
```

**Verify GREEN**

```
PASS
```

**REFACTOR** - Extract validation for multiple fields if needed.

## Output

```markdown
## TDD Report

- **Tests written**: <count> new tests
- **Red-green verified**: Each test watched fail then pass
- **Refactoring**: <changes made during refactor phase>
- **Suite status**: All <count> tests passing
- **Gate**: /verify + /codex-review-fast + /precommit
```

## Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression.

Never fix bugs without a test.

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Start over.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask user. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Final Rule

```
Production code -> test exists and failed first
Otherwise -> not TDD
```

No exceptions without user's permission.
