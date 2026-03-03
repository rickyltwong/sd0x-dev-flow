---
name: oneshot-plan
description: "One-shot planning pipeline: brainstorm -> feasibility -> architecture -> tech spec -> review -> task breakdown. Produces implementation-ready output for /team execution. Use when: planning a feature end-to-end, need comprehensive plan before coding."
allowed-tools: Read, Grep, Glob, Write, Bash(git:*), Bash(ls:*), Bash(find:*), mcp__codex__codex, mcp__codex__codex-reply
---

# Oneshot Plan

## Trigger

- Keywords: oneshot plan, full plan, plan everything, comprehensive plan, plan and execute, end-to-end plan

## When NOT to Use

- Quick bug fix (use `/bug-fix`)
- Already have a tech spec (use `/team` directly)
- Only need brainstorming (use `/codex-brainstorm`)
- Only need architecture advice (use `/codex-architect`)

## Workflow

```
Phase 1: Discovery          Phase 2: Parallel Analysis       Phase 3: Synthesis
┌──────────────────┐        ┌──────────────────────────┐     ┌──────────────────┐
│ Codebase research│        │ Agent A: Feasibility     │     │ Merge all outputs│
│ + Codex debate   │───────>│ Agent B: Architecture    │────>│ into tech spec   │
│ (brainstorm)     │        │ Agent C: Risk assessment │     │ + task breakdown  │
└──────────────────┘        └──────────────────────────┘     └──────────────────┘
         │                                                            │
         v                                                            v
Phase 4: Codex Review                                    Phase 5: Final Output
┌──────────────────┐                                     ┌──────────────────────┐
│ Independent spec │                                     │ Tech spec document   │
│ review by Codex  │────────────────────────────────────>│ Task breakdown       │
│ + fix findings   │                                     │ /team spawn command  │
└──────────────────┘                                     └──────────────────────┘
```

## Phase Details

### Phase 1: Discovery & Brainstorm

**Goal**: Understand the problem space from multiple angles.

1. **Claude researches** the codebase:
   - Read related files via Grep/Glob
   - Understand existing patterns, dependencies, constraints
   - Form an initial position on approach

2. **Codex independently researches** via `mcp__codex__codex`:

```
mcp__codex__codex({
  prompt: `You are a senior engineer evaluating a feature proposal.

## Feature
<task description from user>

## Your Assignment
1. Research the project structure and existing code
2. Identify constraints, dependencies, and risks
3. Propose an approach with trade-offs
4. List what must be true for this to succeed

## Independent Research (REQUIRED)
- git status && git log --oneline -10
- ls -la src/ (or project root)
- grep -r "relevant_keyword" --include="*.ts" -l (adjust extension)
- cat <key files> | head -100

Form your own position. Do NOT wait for instructions.`,
  sandbox: 'read-only',
  'approval-policy': 'on-failure',
})
```

3. **Adversarial debate** (2-3 rounds):
   - Compare Claude's position vs Codex's position
   - Challenge each other's assumptions via `mcp__codex__codex-reply`
   - Converge on consensus or document disagreements

**Output**: `brainstorm_result` -- consensus position + unresolved tensions

### Phase 2: Parallel Analysis (Agent Team)

**Goal**: Deep-dive feasibility, architecture, and risk in parallel.

Spawn 3 agents using the Agent tool:

| Agent | Type | Task |
|-------|------|------|
| feasibility | `Explore` | Analyze feasibility: existing code impact, dependency changes, effort estimate |
| architecture | `Explore` | Design architecture: component boundaries, data flow, API contracts, patterns to follow |
| risk | `Explore` | Assess risks: breaking changes, performance impact, security concerns, test gaps |

Each agent prompt must include:
- The brainstorm consensus from Phase 1
- The original task description
- Instruction to research the codebase independently (Read/Grep/Glob)
- Specific questions to answer for their domain

**Output**: Three analysis reports (feasibility, architecture, risk)

### Phase 3: Tech Spec Synthesis

**Goal**: Merge all analysis into a single implementation-ready tech spec.

Synthesize Phase 1 + Phase 2 outputs into a structured document:

```markdown
# Tech Spec: <feature name>

## 1. Overview
<Problem statement and solution summary from brainstorm consensus>

## 2. Feasibility Assessment
<From feasibility agent: effort, dependencies, constraints>

## 3. Architecture
<From architecture agent: components, data flow, API design>
### 3.1 Component Diagram
### 3.2 Data Flow
### 3.3 API Contracts

## 4. Implementation Plan
### 4.1 Tasks (ordered by dependency)
| # | Task | Dependencies | Estimated Complexity | Agent Type |
|---|------|-------------|---------------------|------------|
| 1 | ... | none | S/M/L | general-purpose |
| 2 | ... | 1 | S/M/L | general-purpose |

### 4.2 File Changes
| File | Action | Description |
|------|--------|-------------|
| src/... | Create | New service |
| src/... | Modify | Add method |

## 5. Risk Mitigation
<From risk agent: identified risks + mitigation strategies>

## 6. Test Plan
| Test Type | Scope | Files |
|-----------|-------|-------|
| Unit | ... | test/... |
| Integration | ... | test/... |

## 7. /team Spawn Command
\`\`\`
/team N:general-purpose "execute tech spec at <path>" --loop
\`\`\`
```

Save to: `docs/features/<feature>/2-tech-spec.md` (or project-appropriate path).
If `docs/` does not exist, save to `.claude/plans/<kebab-name>-spec.md`.

### Phase 4: Codex Spec Review

**Goal**: Independent validation of the tech spec.

```
mcp__codex__codex({
  prompt: `You are a principal engineer reviewing a tech spec.

## Tech Spec
<full spec content>

## Independent Research (REQUIRED)
- Read the actual source files referenced in the spec
- Verify the API contracts match existing patterns
- Check if the task decomposition covers all changes
- Look for missing edge cases or risks

## Review Checklist
- [ ] All referenced files exist and match described state
- [ ] Architecture is consistent with existing patterns
- [ ] Task decomposition is complete (no gaps)
- [ ] Dependencies between tasks are correct
- [ ] Test plan covers happy path + error + edge cases
- [ ] Risk mitigations are actionable
- [ ] Effort estimates are realistic

Report: findings with severity (P0/P1/P2) and suggested fixes.`,
  sandbox: 'read-only',
  'approval-policy': 'never',
})
```

If P0/P1 findings: fix the spec and re-review via `mcp__codex__codex-reply`.
If only P2 or clean: proceed to Phase 5.

### Phase 5: Final Output

**Goal**: Produce implementation-ready artifacts.

1. **Final tech spec** (saved to file)
2. **Task breakdown summary** (printed to user):

```
## Implementation Ready

Spec: <path to saved spec>
Tasks: N tasks across M files
Estimated agents: <count>

To execute:
  /team <N>:general-purpose "execute tech spec at <path>" --loop

To execute with persistent loop:
  /loop --max <iterations> execute tech spec at <path>
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--skip-brainstorm` | false | Skip Phase 1, start from Phase 2 |
| `--skip-review` | false | Skip Phase 4 Codex review |
| `--save-to <path>` | auto | Override output path |
| `--brief` | false | Also generate executive brief (Phase 6) |

## Optional Phase 6: Executive Brief

When `--brief` is passed, generate a PM/CTO-readable summary:

- 1-page overview: what, why, how, when
- Key risks and mitigations
- Resource requirements
- Success criteria

Save alongside tech spec as `<N>-project-brief.md`.

## Integration with Other Skills

| After oneshot-plan | Use |
|-------------------|-----|
| Execute the plan | `/team N:general-purpose "execute spec" --loop` |
| Persistent execution | `/loop --max 20 execute spec at <path>` |
| Review implementation | `/codex-review-fast` |
| Verify completion | `/verify-completion` |

## Examples

```bash
# Full planning pipeline for a new feature
/oneshot-plan "Add user authentication with JWT, OAuth2, and session management"

# Skip brainstorm if you already explored the topic
/oneshot-plan "Refactor service layer to use repository pattern" --skip-brainstorm

# Include executive brief for stakeholders
/oneshot-plan "Migrate database from MongoDB to PostgreSQL" --brief

# Custom output path
/oneshot-plan "Add rate limiting to all API endpoints" --save-to docs/features/rate-limiting/2-tech-spec.md
```
