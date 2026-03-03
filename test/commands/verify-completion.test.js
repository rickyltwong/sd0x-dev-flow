const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');

const projectRoot = resolve(__dirname, '../..');
const commandPath = join(projectRoot, 'commands', 'verify-completion.md');
const skillPath = join(projectRoot, 'skills', 'verify-completion', 'SKILL.md');

function splitFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { frontmatter: '', body: content };
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

test('verify-completion command exists with valid frontmatter', () => {
  assert.ok(existsSync(commandPath), 'commands/verify-completion.md should exist');

  const content = readFileSync(commandPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'verify-completion.md missing frontmatter block');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'verify-completion.md missing description in frontmatter'
  );

  assert.ok(
    /^allowed-tools:/m.test(frontmatter),
    'verify-completion.md missing allowed-tools in frontmatter'
  );
});

test('verify-completion command references skill file that exists', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(
    content.includes('@skills/verify-completion/SKILL.md'),
    'verify-completion.md should reference @skills/verify-completion/SKILL.md'
  );
  assert.ok(existsSync(skillPath), 'skills/verify-completion/SKILL.md should exist');
});

test('verify-completion skill has valid frontmatter', () => {
  const content = readFileSync(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'SKILL.md missing frontmatter block');

  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  assert.ok(
    nameMatch && nameMatch[1].trim() === 'verify-completion',
    'SKILL.md name should be "verify-completion"'
  );

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'SKILL.md missing description in frontmatter'
  );
});

test('verify-completion skill contains iron law', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE'),
    'SKILL.md should contain the verification iron law'
  );
});

test('verify-completion skill contains gate function', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('IDENTIFY'),
    'SKILL.md should contain IDENTIFY step'
  );
  assert.ok(
    content.includes('RUN'),
    'SKILL.md should contain RUN step'
  );
  assert.ok(
    content.includes('VERIFY'),
    'SKILL.md should contain VERIFY step'
  );
});

test('verify-completion skill contains rationalization prevention', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(
    content.includes('| Excuse | Reality |'),
    'SKILL.md should contain rationalization prevention table'
  );
  assert.ok(
    content.includes('Should work now'),
    'SKILL.md should contain common rationalizations'
  );
});
