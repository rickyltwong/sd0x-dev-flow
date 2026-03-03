const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');

const projectRoot = resolve(__dirname, '../..');
const commandPath = join(projectRoot, 'commands', 'oneshot-plan.md');
const skillPath = join(projectRoot, 'skills', 'oneshot-plan', 'SKILL.md');

function splitFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { frontmatter: '', body: content };
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

test('oneshot-plan command exists with valid frontmatter', () => {
  assert.ok(existsSync(commandPath), 'commands/oneshot-plan.md should exist');

  const content = readFileSync(commandPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'oneshot-plan.md missing frontmatter block');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'oneshot-plan.md missing description in frontmatter'
  );

  assert.ok(
    /^allowed-tools:/m.test(frontmatter),
    'oneshot-plan.md missing allowed-tools in frontmatter'
  );
});

test('oneshot-plan command references skill file that exists', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(
    content.includes('@skills/oneshot-plan/SKILL.md'),
    'oneshot-plan.md should reference @skills/oneshot-plan/SKILL.md'
  );
  assert.ok(existsSync(skillPath), 'skills/oneshot-plan/SKILL.md should exist');
});

test('oneshot-plan skill has valid frontmatter', () => {
  const content = readFileSync(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'SKILL.md missing frontmatter block');

  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  assert.ok(
    nameMatch && nameMatch[1].trim() === 'oneshot-plan',
    'SKILL.md name should be "oneshot-plan"'
  );

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'SKILL.md missing description in frontmatter'
  );
});

test('oneshot-plan skill describes 5-phase workflow', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('Phase 1'), 'SKILL.md should describe Phase 1');
  assert.ok(content.includes('Phase 2'), 'SKILL.md should describe Phase 2');
  assert.ok(content.includes('Phase 3'), 'SKILL.md should describe Phase 3');
  assert.ok(content.includes('Phase 4'), 'SKILL.md should describe Phase 4');
  assert.ok(content.includes('Phase 5'), 'SKILL.md should describe Phase 5');
});

test('oneshot-plan skill includes Codex integration', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('mcp__codex__codex'),
    'SKILL.md should reference Codex MCP for independent research'
  );
  assert.ok(
    content.includes('mcp__codex__codex-reply'),
    'SKILL.md should reference Codex reply for iterative review'
  );
});

test('oneshot-plan skill includes parallel agent analysis', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('Explore'),
    'SKILL.md should use Explore agents for parallel analysis'
  );
  assert.ok(
    content.includes('feasibility'),
    'SKILL.md should include feasibility analysis'
  );
  assert.ok(
    content.includes('architecture'),
    'SKILL.md should include architecture analysis'
  );
  assert.ok(
    content.includes('risk'),
    'SKILL.md should include risk assessment'
  );
});

test('oneshot-plan skill outputs team-ready task breakdown', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('/team'),
    'SKILL.md should reference /team for execution'
  );
  assert.ok(
    content.includes('Task') && content.includes('Dependencies'),
    'SKILL.md should include task breakdown with dependencies'
  );
});

test('oneshot-plan command supports configuration flags', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(content.includes('--skip-brainstorm'), 'should support --skip-brainstorm');
  assert.ok(content.includes('--skip-review'), 'should support --skip-review');
  assert.ok(content.includes('--brief'), 'should support --brief');
  assert.ok(content.includes('--save-to'), 'should support --save-to');
});

test('oneshot-plan skill includes tech spec template', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('## 1. Overview'), 'spec template should include Overview');
  assert.ok(content.includes('Implementation Plan'), 'spec template should include Implementation Plan');
  assert.ok(content.includes('Test Plan'), 'spec template should include Test Plan');
  assert.ok(content.includes('Risk Mitigation'), 'spec template should include Risk Mitigation');
});
