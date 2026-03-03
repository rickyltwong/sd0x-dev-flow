const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  rmSync,
} = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');

const hookPath = resolve(__dirname, '../../hooks/persistent-loop.sh');
const tempDirs = [];

function makeTempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function writeExecutable(filePath, content) {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

function setupStubBin() {
  const binDir = makeTempDir('sd0x-loop-bin-');
  const stubJq = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
let query;
let file;
const vars = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-r') continue;
  if (arg === '--argjson') {
    const key = args[i + 1];
    const val = args[i + 2];
    try { vars[key] = JSON.parse(val); } catch { vars[key] = val; }
    i += 2;
    continue;
  }
  if (arg === '--arg') {
    vars[args[i + 1]] = args[i + 2];
    i += 2;
    continue;
  }
  if (!query) { query = arg; continue; }
  if (!file) { file = arg; continue; }
}
let input = '';
try {
  input = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
} catch {}
let data = {};
try { data = input ? JSON.parse(input) : {}; } catch {}

// Handle jq assignment expressions (.iteration = $iter | .last_checked_at = $now)
if (query && query.includes('.iteration = $iter')) {
  data.iteration = vars.iter;
  data.last_checked_at = vars.now;
  process.stdout.write(JSON.stringify(data));
  process.exit(0);
}

if (query && query.includes('.stop_hook_type')) {
  process.stdout.write(data.stop_hook_type || '');
  process.exit(0);
}
if (query && query.includes('.active')) {
  const val = data.active;
  process.stdout.write(val === true ? 'true' : val === 'true' ? 'true' : 'false');
  process.exit(0);
}
if (query && query.includes('.iteration')) {
  process.stdout.write(String(data.iteration ?? 0));
  process.exit(0);
}
if (query && query.includes('.max_iterations')) {
  process.stdout.write(String(data.max_iterations ?? 10));
  process.exit(0);
}
if (query && query.includes('.last_checked_at')) {
  process.stdout.write(data.last_checked_at || '');
  process.exit(0);
}
if (query && query.includes('.task')) {
  process.stdout.write(data.task || 'task in progress');
  process.exit(0);
}

process.stdout.write('');
`;
  writeExecutable(join(binDir, 'jq'), stubJq);
  // Stub date command that returns a known epoch
  writeExecutable(join(binDir, 'date'), `#!/bin/sh
if echo "$*" | grep -q '+%s'; then
  echo "1709467200"
  exit 0
fi
if echo "$*" | grep -q '+%Y'; then
  echo "2026-03-03T12:00:00Z"
  exit 0
fi
echo "2026-03-03T12:00:00Z"
`);
  return binDir;
}

function runHook({ cwd, binDir, input, env }) {
  return spawnSync('bash', [hookPath], {
    cwd,
    input: JSON.stringify(input || {}),
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      ...env,
    },
  });
}

after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// =============================================================================
// Basic behavior
// =============================================================================

test('missing state file allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-missing-');
  const binDir = setupStubBin();
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 0);
});

test('inactive state allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-inactive-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: false,
      iteration: 3,
      max_iterations: 10,
      task: 'some task',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 0);
});

test('active state blocks stop', () => {
  const workDir = makeTempDir('sd0x-loop-active-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 2,
      max_iterations: 10,
      last_checked_at: '2026-03-03T12:00:00Z',
      task: 'implement feature X',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 2, 'active loop should block stop');
  assert.ok(result.stdout.includes('"decision":"block"'), 'should output block decision');
  assert.ok(result.stdout.includes('LOOP iteration'), 'should include LOOP iteration in reason');
});

test('active state increments iteration in state file', () => {
  const workDir = makeTempDir('sd0x-loop-increment-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 2,
      max_iterations: 10,
      last_checked_at: '2026-03-03T12:00:00Z',
      task: 'implement feature X',
    })
  );
  runHook({ cwd: workDir, binDir, input: {} });
  const updated = JSON.parse(readFileSync(join(workDir, '.sd0x_loop_state.json'), 'utf8'));
  assert.equal(updated.iteration, 3, 'iteration should be incremented from 2 to 3');
});

// =============================================================================
// Max iterations
// =============================================================================

test('max iterations reached allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-max-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 10,
      max_iterations: 10,
      last_checked_at: '2026-03-03T12:00:00Z',
      task: 'done task',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 0, 'should allow stop when at max iterations');
});

test('iteration exceeding max allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-exceed-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 15,
      max_iterations: 10,
      last_checked_at: '2026-03-03T12:00:00Z',
      task: 'runaway task',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 0, 'should allow stop when iteration exceeds max');
});

// =============================================================================
// Safety mechanisms
// =============================================================================

test('HOOK_BYPASS=1 allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-bypass-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 0,
      max_iterations: 10,
      task: 'blocked task',
    })
  );
  const result = runHook({
    cwd: workDir,
    binDir,
    input: {},
    env: { HOOK_BYPASS: '1' },
  });
  assert.equal(result.status, 0, 'HOOK_BYPASS should allow stop');
});

test('context_limit stop type always allows stop', () => {
  const workDir = makeTempDir('sd0x-loop-context-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 0,
      max_iterations: 10,
      task: 'running task',
    })
  );
  const result = runHook({
    cwd: workDir,
    binDir,
    input: { stop_hook_type: 'context_limit' },
  });
  assert.equal(result.status, 0, 'context_limit should always allow stop');
});

test('staleness allows stop (last_checked_at > 2 hours ago)', () => {
  const workDir = makeTempDir('sd0x-loop-stale-');
  const binDir = makeTempDir('sd0x-loop-stale-bin-');

  // Stub jq (same as setupStubBin)
  const mainBinDir = setupStubBin();
  const jqContent = readFileSync(join(mainBinDir, 'jq'), 'utf8');
  writeExecutable(join(binDir, 'jq'), jqContent);

  // Stub date: first call parses the old timestamp to epoch (3 hours ago),
  // second call returns current epoch
  let dateCallCount = 0;
  writeExecutable(join(binDir, 'date'), `#!/bin/sh
if echo "$*" | grep -q -- '-d '; then
  # Parsing last_checked_at: return epoch 3 hours ago
  echo "1709456400"
  exit 0
fi
if echo "$*" | grep -q '+%s'; then
  # Current time: return epoch now (3 hours later)
  echo "1709467200"
  exit 0
fi
echo "2026-03-03T12:00:00Z"
`);

  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 2,
      max_iterations: 10,
      last_checked_at: '2026-03-03T09:00:00Z',
      task: 'stale task',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 0, 'stale state (>2h) should allow stop');
});

test('missing jq allows stop (fail-open)', () => {
  const workDir = makeTempDir('sd0x-loop-nojq-');
  const binDir = makeTempDir('sd0x-loop-nojq-bin-');
  // Build a minimal PATH with essential commands but no jq.
  const { symlinkSync } = require('node:fs');
  for (const cmd of ['bash', 'cat', 'date', 'grep']) {
    try {
      const p = spawnSync('which', [cmd], { encoding: 'utf8' }).stdout.trim();
      if (p) symlinkSync(p, join(binDir, cmd));
    } catch {}
  }
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 0,
      max_iterations: 10,
      task: 'no jq task',
    })
  );
  const result = spawnSync('bash', [hookPath], {
    cwd: workDir,
    input: JSON.stringify({}),
    encoding: 'utf8',
    env: { PATH: binDir, HOME: process.env.HOME },
  });
  assert.equal(result.status, 0, 'missing jq should fail-open');
});

// =============================================================================
// Output format
// =============================================================================

test('block output includes task description', () => {
  const workDir = makeTempDir('sd0x-loop-output-');
  const binDir = setupStubBin();
  writeFileSync(
    join(workDir, '.sd0x_loop_state.json'),
    JSON.stringify({
      active: true,
      iteration: 0,
      max_iterations: 5,
      last_checked_at: '2026-03-03T12:00:00Z',
      task: 'build the auth module',
    })
  );
  const result = runHook({ cwd: workDir, binDir, input: {} });
  assert.equal(result.status, 2);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, 'block');
  assert.ok(output.reason.includes('build the auth module'), 'reason should include task');
  assert.ok(output.reason.includes('1/5'), 'reason should include iteration count');
});
