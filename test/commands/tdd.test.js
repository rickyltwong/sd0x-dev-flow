const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');

const projectRoot = resolve(__dirname, '../..');
const commandPath = join(projectRoot, 'commands', 'tdd.md');
const skillPath = join(projectRoot, 'skills', 'tdd', 'SKILL.md');

function splitFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { frontmatter: '', body: content };
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

test('tdd command exists with valid frontmatter', () => {
  assert.ok(existsSync(commandPath), 'commands/tdd.md should exist');

  const content = readFileSync(commandPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'tdd.md missing frontmatter block');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'tdd.md missing description in frontmatter'
  );

  assert.ok(
    /^allowed-tools:/m.test(frontmatter),
    'tdd.md missing allowed-tools in frontmatter'
  );
});

test('tdd command references skill file that exists', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(
    content.includes('@skills/tdd/SKILL.md'),
    'tdd.md should reference @skills/tdd/SKILL.md'
  );
  assert.ok(existsSync(skillPath), 'skills/tdd/SKILL.md should exist');
});

test('tdd skill has valid frontmatter', () => {
  const content = readFileSync(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'SKILL.md missing frontmatter block');

  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  assert.ok(nameMatch && nameMatch[1].trim() === 'tdd', 'SKILL.md name should be "tdd"');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'SKILL.md missing description in frontmatter'
  );
});

test('tdd skill contains iron law', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST'),
    'SKILL.md should contain the TDD iron law'
  );
});

test('tdd skill contains rationalizations table', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('| Excuse | Reality |'),
    'SKILL.md should contain rationalizations table'
  );
  assert.ok(
    content.includes('Too simple to test'),
    'SKILL.md should contain common rationalizations'
  );
});

test('tdd skill contains red-green-refactor cycle', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('RED'), 'SKILL.md should mention RED phase');
  assert.ok(content.includes('GREEN'), 'SKILL.md should mention GREEN phase');
  assert.ok(content.includes('REFACTOR'), 'SKILL.md should mention REFACTOR phase');
});
