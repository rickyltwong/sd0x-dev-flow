const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { statSync } = require('node:fs');
const { execFileSync } = require('node:child_process');

const scriptPath = resolve(__dirname, '../../scripts/session-primer.sh');

test('session-primer.sh exists and is executable', () => {
  const stat = statSync(scriptPath);
  assert.ok(stat.isFile(), 'script should be a file');
  assert.ok((stat.mode & 0o100) !== 0, 'script should be executable');
});

test('session-primer.sh output contains namespace hint', () => {
  const output = execFileSync('bash', [scriptPath], { encoding: 'utf8' });
  assert.ok(
    output.includes('sd0x-dev-flow'),
    'output should contain plugin name'
  );
  assert.ok(
    output.includes('/sd0x-dev-flow:') || output.includes('sd0x-dev-flow:command'),
    'output should contain namespace example'
  );
});

test('session-primer.sh output contains valid JSON with additionalContext', () => {
  const output = execFileSync('bash', [scriptPath], { encoding: 'utf8' });

  // The output has plain text lines first, then JSON
  // Find the JSON block (starts with {)
  const lines = output.split('\n');
  let jsonStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('{')) {
      jsonStart = i;
      break;
    }
  }
  assert.ok(jsonStart >= 0, 'output should contain a JSON block');

  const jsonStr = lines.slice(jsonStart).join('\n');
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    assert.fail(`JSON parse failed: ${e.message}\nJSON was: ${jsonStr.slice(0, 200)}`);
  }

  assert.ok(parsed.hookSpecificOutput, 'JSON should have hookSpecificOutput');
  assert.equal(
    parsed.hookSpecificOutput.hookEventName,
    'SessionStart',
    'hookEventName should be SessionStart'
  );
  assert.ok(
    parsed.hookSpecificOutput.additionalContext,
    'should have additionalContext'
  );
});

test('session-primer.sh additionalContext contains skill table', () => {
  const output = execFileSync('bash', [scriptPath], { encoding: 'utf8' });
  const lines = output.split('\n');
  let jsonStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('{')) {
      jsonStart = i;
      break;
    }
  }
  const jsonStr = lines.slice(jsonStart).join('\n');
  const parsed = JSON.parse(jsonStr);
  const ctx = parsed.hookSpecificOutput.additionalContext;

  assert.ok(ctx.includes('/bug-fix'), 'additionalContext should mention /bug-fix');
  assert.ok(ctx.includes('/tdd'), 'additionalContext should mention /tdd');
  assert.ok(ctx.includes('/verify-completion'), 'additionalContext should mention /verify-completion');
  assert.ok(ctx.includes('/feature-dev'), 'additionalContext should mention /feature-dev');
  assert.ok(ctx.includes('/codex-review-fast'), 'additionalContext should mention /codex-review-fast');
});

test('session-primer.sh additionalContext contains red flags', () => {
  const output = execFileSync('bash', [scriptPath], { encoding: 'utf8' });
  const lines = output.split('\n');
  let jsonStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('{')) {
      jsonStart = i;
      break;
    }
  }
  const jsonStr = lines.slice(jsonStart).join('\n');
  const parsed = JSON.parse(jsonStr);
  const ctx = parsed.hookSpecificOutput.additionalContext;

  assert.ok(
    ctx.includes('rationalizing'),
    'additionalContext should warn about rationalizing'
  );
});

test('session-primer.sh exits with code 0', () => {
  // execFileSync throws on non-zero exit
  const output = execFileSync('bash', [scriptPath], { encoding: 'utf8' });
  assert.ok(output.length > 0, 'output should not be empty');
});
