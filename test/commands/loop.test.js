const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');

const projectRoot = resolve(__dirname, '../..');
const commandPath = join(projectRoot, 'commands', 'loop.md');
const skillPath = join(projectRoot, 'skills', 'loop', 'SKILL.md');

function splitFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { frontmatter: '', body: content };
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

test('loop command exists with valid frontmatter', () => {
  assert.ok(existsSync(commandPath), 'commands/loop.md should exist');

  const content = readFileSync(commandPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'loop.md missing frontmatter block');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'loop.md missing description in frontmatter'
  );

  assert.ok(
    /^allowed-tools:/m.test(frontmatter),
    'loop.md missing allowed-tools in frontmatter'
  );
});

test('loop command references skill file that exists', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(
    content.includes('@skills/loop/SKILL.md'),
    'loop.md should reference @skills/loop/SKILL.md'
  );
  assert.ok(existsSync(skillPath), 'skills/loop/SKILL.md should exist');
});

test('loop skill has valid frontmatter', () => {
  const content = readFileSync(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(content);

  assert.ok(frontmatter, 'SKILL.md missing frontmatter block');

  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  assert.ok(nameMatch && nameMatch[1].trim() === 'loop', 'SKILL.md name should be "loop"');

  const descMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  assert.ok(
    descMatch && descMatch[1].trim(),
    'SKILL.md missing description in frontmatter'
  );
});

test('loop skill describes state file format', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('.sd0x_loop_state.json'), 'SKILL.md should reference state file');
  assert.ok(content.includes('max_iterations'), 'SKILL.md should describe max_iterations');
  assert.ok(content.includes('active'), 'SKILL.md should describe active field');
});

test('loop skill describes safety mechanisms', () => {
  const content = readFileSync(skillPath, 'utf8');
  assert.ok(content.includes('Staleness'), 'SKILL.md should describe staleness safety');
  assert.ok(content.includes('HOOK_BYPASS'), 'SKILL.md should describe bypass mechanism');
  assert.ok(content.includes('context_limit'), 'SKILL.md should describe context limit safety');
});

test('loop command supports --stop and --max flags', () => {
  const content = readFileSync(commandPath, 'utf8');
  assert.ok(content.includes('--stop'), 'loop.md should document --stop flag');
  assert.ok(content.includes('--max'), 'loop.md should document --max flag');
});
