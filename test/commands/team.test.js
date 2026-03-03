const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');

const projectRoot = resolve(__dirname, '../..');
const commandPath = join(projectRoot, 'commands', 'team.md');
const skillPath = join(projectRoot, 'skills', 'team', 'SKILL.md');

function splitFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { frontmatter: '', body: content };
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

test('team command exists with valid frontmatter', () => {
  assert.ok(existsSync(commandPath), 'commands/team.md should exist');

  const content = readFileSync(commandPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'team.md missing frontmatter block');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'team.md missing description in frontmatter'
  );

  assert.ok(
    /^allowed-tools:/m.test(frontmatter),
    'team.md missing allowed-tools in frontmatter'
  );
});

test('team command references skill file that exists', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(
    content.includes('@skills/team/SKILL.md'),
    'team.md should reference @skills/team/SKILL.md'
  );
  assert.ok(existsSync(skillPath), 'skills/team/SKILL.md should exist');
});

test('team skill has valid frontmatter', () => {
  const content = readFileSync(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'SKILL.md missing frontmatter block');

  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  assert.ok(nameMatch && nameMatch[1].trim() === 'team', 'SKILL.md name should be "team"');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'SKILL.md missing description in frontmatter'
  );
});

test('team skill describes 4-phase workflow', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('Phase 1'), 'SKILL.md should describe Phase 1');
  assert.ok(content.includes('Phase 2'), 'SKILL.md should describe Phase 2');
  assert.ok(content.includes('Phase 3'), 'SKILL.md should describe Phase 3');
  assert.ok(content.includes('Phase 4'), 'SKILL.md should describe Phase 4');
});

test('team skill describes worker protocol', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('TaskList'), 'SKILL.md should mention TaskList');
  assert.ok(content.includes('TaskGet'), 'SKILL.md should mention TaskGet');
  assert.ok(content.includes('TaskUpdate'), 'SKILL.md should mention TaskUpdate');
  assert.ok(content.includes('SendMessage'), 'SKILL.md should mention SendMessage');
  assert.ok(content.includes('TeamCreate'), 'SKILL.md should mention TeamCreate');
  assert.ok(content.includes('TeamDelete'), 'SKILL.md should mention TeamDelete');
});

test('team skill describes loop integration', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('.sd0x_loop_state.json'), 'SKILL.md should reference loop state file');
  assert.ok(content.includes('--loop'), 'SKILL.md should describe --loop flag');
});

test('team command supports --loop flag', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(content.includes('--loop'), 'team.md should document --loop flag');
});
